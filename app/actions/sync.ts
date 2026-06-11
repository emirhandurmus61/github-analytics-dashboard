"use server";

import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

const GITHUB_API = "https://api.github.com";

async function githubFetch(path: string, token: string) {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${path}`);
  return res.json();
}

async function fetchAllPages<T>(
  path: string,
  token: string,
  perPage = 100
): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  while (true) {
    const sep = path.includes("?") ? "&" : "?";
    const data: T[] = await githubFetch(
      `${path}${sep}per_page=${perPage}&page=${page}`,
      token
    );
    if (!Array.isArray(data) || data.length === 0) break;
    results.push(...data);
    if (data.length < perPage) break;
    page++;
  }
  return results;
}

export async function startSync(): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.accessToken || !session.user.username) {
    return { success: false, error: "Oturum bulunamadı" };
  }

  const token = session.accessToken;
  const username = session.user.username;

  const { data: dbUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("username", username)
    .single();

  if (!dbUser) return { success: false, error: "Kullanıcı bulunamadı" };
  const userId = dbUser.id;

  try {
    const since = new Date();
    since.setFullYear(since.getFullYear() - 1);
    const sinceISO = since.toISOString();

    // 1. Repoları çek
    const repos = await fetchAllPages<{
      id: number;
      name: string;
      full_name: string;
      description: string | null;
      language: string | null;
      stargazers_count: number;
      forks_count: number;
      fork: boolean;
      archived: boolean;
      created_at: string;
      updated_at: string;
    }>("/user/repos", token);

    await supabaseAdmin.from("repositories").upsert(
      repos.map((r) => ({
        user_id: userId,
        github_id: r.id,
        name: r.name,
        full_name: r.full_name,
        description: r.description,
        language: r.language,
        stars: r.stargazers_count,
        forks: r.forks_count,
        is_fork: r.fork,
        is_archived: r.archived,
        created_at: r.created_at,
        updated_at: r.updated_at,
      })),
      { onConflict: "user_id,github_id" }
    );

    const { data: dbRepos } = await supabaseAdmin
      .from("repositories")
      .select("id, github_id, name, full_name")
      .eq("user_id", userId);

    if (!dbRepos) throw new Error("Repolar alınamadı");
    const repoMap = new Map(dbRepos.map((r) => [r.github_id, r]));
    const ownRepos = repos.filter((r) => !r.fork);

    // 2. Dil istatistikleri
    for (const repo of ownRepos) {
      try {
        const langs = await githubFetch(`/repos/${repo.full_name}/languages`, token);
        const dbRepo = repoMap.get(repo.id);
        if (!dbRepo) continue;
        const langRows = Object.entries(langs).map(([language, bytes]) => ({
          repo_id: dbRepo.id,
          language,
          bytes: bytes as number,
        }));
        if (langRows.length > 0) {
          await supabaseAdmin
            .from("repo_languages")
            .upsert(langRows, { onConflict: "repo_id,language" });
        }
      } catch { /* devam et */ }
    }

    // 3. Commitler + additions/deletions
    for (const repo of ownRepos) {
      const dbRepo = repoMap.get(repo.id);
      if (!dbRepo) continue;
      try {
        const commits = await fetchAllPages<{
          sha: string;
          commit: { message: string; author: { date: string } };
        }>(
          `/repos/${repo.full_name}/commits?author=${username}&since=${sinceISO}`,
          token
        );

        if (commits.length === 0) continue;

        // Her commit için additions/deletions çek (max 20 commit — rate limit koruma)
        const commitRows = await Promise.all(
          commits.slice(0, 20).map(async (c) => {
            try {
              const detail = await githubFetch(
                `/repos/${repo.full_name}/commits/${c.sha}`,
                token
              );
              return {
                repo_id: dbRepo.id,
                sha: c.sha,
                message: c.commit.message.split("\n")[0].slice(0, 500),
                committed_at: c.commit.author.date,
                additions: detail.stats?.additions ?? 0,
                deletions: detail.stats?.deletions ?? 0,
              };
            } catch {
              return {
                repo_id: dbRepo.id,
                sha: c.sha,
                message: c.commit.message.split("\n")[0].slice(0, 500),
                committed_at: c.commit.author.date,
                additions: 0,
                deletions: 0,
              };
            }
          })
        );

        // Detay çekilmeyenler (20'den fazlası) sadece temel bilgiyle
        const restRows = commits.slice(20).map((c) => ({
          repo_id: dbRepo.id,
          sha: c.sha,
          message: c.commit.message.split("\n")[0].slice(0, 500),
          committed_at: c.commit.author.date,
          additions: 0,
          deletions: 0,
        }));

        await supabaseAdmin
          .from("commits")
          .upsert([...commitRows, ...restRows], { onConflict: "repo_id,sha" });
      } catch { /* devam et */ }
    }

    // 4. Pull Requests
    for (const repo of ownRepos) {
      const dbRepo = repoMap.get(repo.id);
      if (!dbRepo) continue;
      try {
        const prs = await fetchAllPages<{
          id: number;
          title: string;
          state: string;
          merged_at: string | null;
          closed_at: string | null;
          created_at: string;
          additions: number;
          deletions: number;
          changed_files: number;
          user: { login: string };
        }>(
          `/repos/${repo.full_name}/pulls?state=all&sort=created&direction=desc`,
          token,
          50
        );

        const myPrs = prs.filter((pr) => pr.user?.login === username);
        if (myPrs.length === 0) continue;

        await supabaseAdmin.from("pull_requests").upsert(
          myPrs.map((pr) => ({
            repo_id: dbRepo.id,
            github_id: pr.id,
            title: pr.title?.slice(0, 500),
            state: pr.state,
            merged: !!pr.merged_at,
            additions: pr.additions ?? 0,
            deletions: pr.deletions ?? 0,
            changed_files: pr.changed_files ?? 0,
            created_at: pr.created_at,
            merged_at: pr.merged_at,
            closed_at: pr.closed_at,
          })),
          { onConflict: "repo_id,github_id" }
        );
      } catch { /* devam et */ }
    }

    // 5. Issues
    for (const repo of ownRepos) {
      const dbRepo = repoMap.get(repo.id);
      if (!dbRepo) continue;
      try {
        const issues = await fetchAllPages<{
          id: number;
          title: string;
          state: string;
          created_at: string;
          closed_at: string | null;
          pull_request?: unknown;
          user: { login: string };
        }>(
          `/repos/${repo.full_name}/issues?state=all&creator=${username}`,
          token,
          50
        );

        // PR'ları filtrele (issues endpoint PR'ları da döner)
        const realIssues = issues.filter(
          (i) => !i.pull_request && i.user?.login === username
        );
        if (realIssues.length === 0) continue;

        await supabaseAdmin.from("issues").upsert(
          realIssues.map((i) => ({
            repo_id: dbRepo.id,
            github_id: i.id,
            title: i.title?.slice(0, 500),
            state: i.state,
            created_at: i.created_at,
            closed_at: i.closed_at,
          })),
          { onConflict: "repo_id,github_id" }
        );
      } catch { /* devam et */ }
    }

    // 6. GitHub profil README
    try {
      const readmeRes = await fetch(`${GITHUB_API}/repos/${username}/${username}/readme`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.raw",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });
      if (readmeRes.ok) {
        const readmeContent = (await readmeRes.text()).slice(0, 5000);
        await supabaseAdmin.from("users")
          .update({ github_readme: readmeContent })
          .eq("id", userId);
      }
    } catch { /* README bulunamadı */ }

    // 7. Günlük istatistikleri güncelle
    const { data: allCommits } = await supabaseAdmin
      .from("commits")
      .select("committed_at, repo_id, additions, deletions")
      .in("repo_id", dbRepos.map((r) => r.id));

    if (allCommits && allCommits.length > 0) {
      const dailyMap = new Map<
        string,
        { commitCount: number; repos: Set<string>; linesAdded: number; linesDeleted: number }
      >();

      for (const commit of allCommits) {
        const date = commit.committed_at.slice(0, 10);
        if (!dailyMap.has(date)) {
          dailyMap.set(date, { commitCount: 0, repos: new Set(), linesAdded: 0, linesDeleted: 0 });
        }
        const entry = dailyMap.get(date)!;
        entry.commitCount++;
        entry.repos.add(commit.repo_id);
        entry.linesAdded += commit.additions ?? 0;
        entry.linesDeleted += commit.deletions ?? 0;
      }

      await supabaseAdmin.from("daily_stats").upsert(
        Array.from(dailyMap.entries()).map(([date, data]) => ({
          user_id: userId,
          date,
          commit_count: data.commitCount,
          repos_active: data.repos.size,
          lines_added: data.linesAdded,
          lines_deleted: data.linesDeleted,
        })),
        { onConflict: "user_id,date" }
      );
    }

    await supabaseAdmin
      .from("users")
      .update({ last_synced_at: new Date().toISOString() })
      .eq("id", userId);

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    return { success: false, error: message };
  }
}
