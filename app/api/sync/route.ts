import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { NextRequest } from "next/server";

const GITHUB_API = "https://api.github.com";

function send(controller: ReadableStreamDefaultController, event: string, data: object) {
  const text = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(new TextEncoder().encode(text));
}

async function githubFetch(path: string, token: string) {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${path}`);
  return res.json();
}

async function fetchAllPages<T>(path: string, token: string, perPage = 100): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  while (true) {
    const sep = path.includes("?") ? "&" : "?";
    const data: T[] = await githubFetch(`${path}${sep}per_page=${perPage}&page=${page}`, token);
    if (!Array.isArray(data) || data.length === 0) break;
    results.push(...data);
    if (data.length < perPage) break;
    page++;
  }
  return results;
}

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken || !session.user.username) {
    return new Response("Unauthorized", { status: 401 });
  }

  const token = session.accessToken;
  const username = session.user.username;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        send(controller, "progress", { step: "start", message: "Başlatılıyor..." });

        const { data: dbUser } = await supabaseAdmin
          .from("users").select("id").eq("username", username).single();

        if (!dbUser) throw new Error("Kullanıcı bulunamadı");
        const userId = dbUser.id;
        const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

        // 1. Repolar
        send(controller, "progress", { step: "repos", message: "Repolar çekiliyor..." });
        const repos = await fetchAllPages<{
          id: number; name: string; full_name: string; description: string | null;
          language: string | null; stargazers_count: number; forks_count: number;
          fork: boolean; archived: boolean; created_at: string; updated_at: string;
        }>("/user/repos", token);

        await supabaseAdmin.from("repositories").upsert(
          repos.map((r) => ({
            user_id: userId, github_id: r.id, name: r.name, full_name: r.full_name,
            description: r.description, language: r.language, stars: r.stargazers_count,
            forks: r.forks_count, is_fork: r.fork, is_archived: r.archived,
            created_at: r.created_at, updated_at: r.updated_at,
          })),
          { onConflict: "user_id,github_id" }
        );

        send(controller, "progress", { step: "repos", message: `${repos.length} repo bulundu`, count: repos.length });

        const { data: dbRepos } = await supabaseAdmin
          .from("repositories").select("id, github_id, full_name").eq("user_id", userId);
        if (!dbRepos) throw new Error("Repolar alınamadı");
        const repoMap = new Map(dbRepos.map((r) => [r.github_id, r]));
        const ownRepos = repos.filter((r) => !r.fork);

        // 2. Diller
        send(controller, "progress", { step: "langs", message: "Dil istatistikleri çekiliyor..." });
        for (const repo of ownRepos) {
          try {
            const langs = await githubFetch(`/repos/${repo.full_name}/languages`, token);
            const dbRepo = repoMap.get(repo.id);
            if (!dbRepo) continue;
            const rows = Object.entries(langs).map(([language, bytes]) => ({
              repo_id: dbRepo.id, language, bytes: bytes as number,
            }));
            if (rows.length > 0) {
              await supabaseAdmin.from("repo_languages").upsert(rows, { onConflict: "repo_id,language" });
            }
          } catch { /* devam */ }
        }

        // 3. Commitler
        send(controller, "progress", { step: "commits", message: "Commitler çekiliyor...", total: ownRepos.length, current: 0 });
        let processedRepos = 0;
        const allCommitRows: { repo_id: string; sha: string; message: string; committed_at: string; additions: number; deletions: number }[] = [];

        for (const repo of ownRepos) {
          const dbRepo = repoMap.get(repo.id);
          if (!dbRepo) continue;
          try {
            const commits = await fetchAllPages<{
              sha: string;
              commit: { message: string; author: { date: string } };
            }>(`/repos/${repo.full_name}/commits?author=${username}&since=${since}`, token);

            if (commits.length > 0) {
              const withDetails = await Promise.all(
                commits.slice(0, 20).map(async (c) => {
                  try {
                    const d = await githubFetch(`/repos/${repo.full_name}/commits/${c.sha}`, token);
                    return {
                      repo_id: dbRepo.id, sha: c.sha,
                      message: c.commit.message.split("\n")[0].slice(0, 500),
                      committed_at: c.commit.author.date,
                      additions: d.stats?.additions ?? 0,
                      deletions: d.stats?.deletions ?? 0,
                    };
                  } catch {
                    return {
                      repo_id: dbRepo.id, sha: c.sha,
                      message: c.commit.message.split("\n")[0].slice(0, 500),
                      committed_at: c.commit.author.date,
                      additions: 0, deletions: 0,
                    };
                  }
                })
              );

              const rest = commits.slice(20).map((c) => ({
                repo_id: dbRepo.id, sha: c.sha,
                message: c.commit.message.split("\n")[0].slice(0, 500),
                committed_at: c.commit.author.date,
                additions: 0, deletions: 0,
              }));

              allCommitRows.push(...withDetails, ...rest);
              await supabaseAdmin.from("commits").upsert([...withDetails, ...rest], { onConflict: "repo_id,sha" });
            }
          } catch { /* devam */ }

          processedRepos++;
          send(controller, "progress", {
            step: "commits",
            message: `Commitler işleniyor: ${processedRepos}/${ownRepos.length} repo`,
            total: ownRepos.length,
            current: processedRepos,
          });
        }

        // 4. PR'lar
        send(controller, "progress", { step: "prs", message: "Pull Request'ler çekiliyor..." });
        for (const repo of ownRepos) {
          const dbRepo = repoMap.get(repo.id);
          if (!dbRepo) continue;
          try {
            const prs = await fetchAllPages<{
              id: number; title: string; state: string; merged_at: string | null;
              closed_at: string | null; created_at: string;
              additions: number; deletions: number; changed_files: number;
              user: { login: string };
            }>(`/repos/${repo.full_name}/pulls?state=all&sort=created&direction=desc`, token, 50);

            const myPrs = prs.filter((pr) => pr.user?.login === username);
            if (myPrs.length === 0) continue;

            await supabaseAdmin.from("pull_requests").upsert(
              myPrs.map((pr) => ({
                repo_id: dbRepo.id, github_id: pr.id, title: pr.title?.slice(0, 500),
                state: pr.state, merged: !!pr.merged_at,
                additions: pr.additions ?? 0, deletions: pr.deletions ?? 0,
                changed_files: pr.changed_files ?? 0,
                created_at: pr.created_at, merged_at: pr.merged_at, closed_at: pr.closed_at,
              })),
              { onConflict: "repo_id,github_id" }
            );
          } catch { /* devam */ }
        }

        // 5. Issues
        send(controller, "progress", { step: "issues", message: "Issue'lar çekiliyor..." });
        for (const repo of ownRepos) {
          const dbRepo = repoMap.get(repo.id);
          if (!dbRepo) continue;
          try {
            const issues = await fetchAllPages<{
              id: number; title: string; state: string;
              created_at: string; closed_at: string | null;
              pull_request?: unknown; user: { login: string };
            }>(`/repos/${repo.full_name}/issues?state=all&creator=${username}`, token, 50);

            const real = issues.filter((i) => !i.pull_request && i.user?.login === username);
            if (real.length === 0) continue;

            await supabaseAdmin.from("issues").upsert(
              real.map((i) => ({
                repo_id: dbRepo.id, github_id: i.id, title: i.title?.slice(0, 500),
                state: i.state, created_at: i.created_at, closed_at: i.closed_at,
              })),
              { onConflict: "repo_id,github_id" }
            );
          } catch { /* devam */ }
        }

        // 6. Günlük istatistikler
        send(controller, "progress", { step: "stats", message: "İstatistikler hesaplanıyor..." });
        const { data: allCommits } = await supabaseAdmin
          .from("commits").select("committed_at, repo_id, additions, deletions")
          .in("repo_id", dbRepos.map((r) => r.id));

        if (allCommits && allCommits.length > 0) {
          const dailyMap = new Map<string, { commitCount: number; repos: Set<string>; linesAdded: number; linesDeleted: number }>();
          for (const c of allCommits) {
            const date = c.committed_at.slice(0, 10);
            if (!dailyMap.has(date)) dailyMap.set(date, { commitCount: 0, repos: new Set(), linesAdded: 0, linesDeleted: 0 });
            const e = dailyMap.get(date)!;
            e.commitCount++; e.repos.add(c.repo_id);
            e.linesAdded += c.additions ?? 0; e.linesDeleted += c.deletions ?? 0;
          }
          await supabaseAdmin.from("daily_stats").upsert(
            Array.from(dailyMap.entries()).map(([date, d]) => ({
              user_id: userId, date, commit_count: d.commitCount,
              repos_active: d.repos.size, lines_added: d.linesAdded, lines_deleted: d.linesDeleted,
            })),
            { onConflict: "user_id,date" }
          );
        }

        await supabaseAdmin.from("users")
          .update({ last_synced_at: new Date().toISOString() }).eq("id", userId);

        revalidatePath("/dashboard");
        send(controller, "done", { message: "Senkronizasyon tamamlandı!" });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Bilinmeyen hata";
        send(controller, "error", { message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
