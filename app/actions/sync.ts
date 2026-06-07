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
    const separator = path.includes("?") ? "&" : "?";
    const data: T[] = await githubFetch(
      `${path}${separator}per_page=${perPage}&page=${page}`,
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

  // Kullanıcıyı DB'den al
  const { data: dbUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("username", username)
    .single();

  if (!dbUser) return { success: false, error: "Kullanıcı bulunamadı" };
  const userId = dbUser.id;

  try {
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

    // Repoları DB'ye kaydet
    const repoRows = repos.map((r) => ({
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
    }));

    await supabaseAdmin
      .from("repositories")
      .upsert(repoRows, { onConflict: "user_id,github_id" });

    // DB'deki repo id'lerini al
    const { data: dbRepos } = await supabaseAdmin
      .from("repositories")
      .select("id, github_id, name")
      .eq("user_id", userId);

    if (!dbRepos) throw new Error("Repolar alınamadı");

    const repoMap = new Map(dbRepos.map((r) => [r.github_id, r]));

    // 2. Her repo için dil istatistiklerini çek (fork olmayanlar)
    const ownRepos = repos.filter((r) => !r.fork);
    for (const repo of ownRepos) {
      try {
        const langs = await githubFetch(
          `/repos/${repo.full_name}/languages`,
          token
        );
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
      } catch {
        // Dil çekme hatası kritik değil, devam et
      }
    }

    // 3. Son 1 yılın commitlerini çek (fork olmayanlar)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const since = oneYearAgo.toISOString();

    for (const repo of ownRepos) {
      const dbRepo = repoMap.get(repo.id);
      if (!dbRepo) continue;

      try {
        const commits = await fetchAllPages<{
          sha: string;
          commit: {
            message: string;
            author: { date: string };
          };
        }>(
          `/repos/${repo.full_name}/commits?author=${username}&since=${since}`,
          token
        );

        if (commits.length === 0) continue;

        const commitRows = commits.map((c) => ({
          repo_id: dbRepo.id,
          sha: c.sha,
          message: c.commit.message.split("\n")[0].slice(0, 500),
          committed_at: c.commit.author.date,
        }));

        await supabaseAdmin
          .from("commits")
          .upsert(commitRows, { onConflict: "repo_id,sha" });
      } catch {
        // Tek repo hata verse bile devam et
      }
    }

    // 4. Günlük istatistikleri hesapla ve kaydet
    const { data: allCommits } = await supabaseAdmin
      .from("commits")
      .select("committed_at, repo_id")
      .in(
        "repo_id",
        dbRepos.map((r) => r.id)
      );

    if (allCommits && allCommits.length > 0) {
      const dailyMap = new Map<string, { commitCount: number; repos: Set<string> }>();

      for (const commit of allCommits) {
        const date = commit.committed_at.slice(0, 10);
        if (!dailyMap.has(date)) {
          dailyMap.set(date, { commitCount: 0, repos: new Set() });
        }
        const entry = dailyMap.get(date)!;
        entry.commitCount++;
        entry.repos.add(commit.repo_id);
      }

      const dailyRows = Array.from(dailyMap.entries()).map(([date, data]) => ({
        user_id: userId,
        date,
        commit_count: data.commitCount,
        repos_active: data.repos.size,
      }));

      await supabaseAdmin
        .from("daily_stats")
        .upsert(dailyRows, { onConflict: "user_id,date" });
    }

    // last_synced_at güncelle
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
