import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 dakika — Vercel Pro sınırı

const GITHUB_API = "https://api.github.com";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function githubFetch(path: string, token: string) {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${path}`);
  return { json: await res.json(), headers: res.headers };
}

async function fetchAllPages<T>(path: string, token: string, perPage = 100): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  while (true) {
    const sep = path.includes("?") ? "&" : "?";
    const { json } = await githubFetch(`${path}${sep}per_page=${perPage}&page=${page}`, token);
    if (!Array.isArray(json) || json.length === 0) break;
    results.push(...json);
    if (json.length < perPage) break;
    page++;
  }
  return results;
}

/** GitHub API rate limit kalan hakkını döndürür. */
async function getRateLimit(token: string): Promise<number> {
  try {
    const { json } = await githubFetch("/rate_limit", token);
    return json?.resources?.core?.remaining ?? 0;
  } catch {
    return 0;
  }
}

// ── Tek kullanıcı incremental sync ───────────────────────────────────────────

async function syncUser(userId: string, username: string, token: string, lastSyncedAt: string | null) {
  // J.3 — Rate limit kontrolü
  const remaining = await getRateLimit(token);
  if (remaining < 100) {
    return { skipped: true, reason: `Rate limit düşük: ${remaining} kaldı` };
  }

  // J.2 — Incremental: son sync'ten bu yana, yoksa 1 yıl
  const since = lastSyncedAt
    ? new Date(lastSyncedAt).toISOString()
    : new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

  // Repolar (her sync'te tamamı — hafif veri)
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

  const { data: dbRepos } = await supabaseAdmin
    .from("repositories").select("id, github_id, full_name").eq("user_id", userId);
  if (!dbRepos) return { skipped: false, error: "Repolar alınamadı" };

  const repoMap = new Map(dbRepos.map((r) => [r.github_id, r]));
  const ownRepos = repos.filter((r) => !r.fork);

  // Diller — son sync'ten sonra güncellenen repolar için
  const updatedRepos = lastSyncedAt
    ? ownRepos.filter((r) => new Date(r.updated_at) > new Date(lastSyncedAt))
    : ownRepos;

  for (const repo of updatedRepos) {
    try {
      const { json: langs } = await githubFetch(`/repos/${repo.full_name}/languages`, token);
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

  // Commitler — sadece `since` tarihinden sonrakiler (J.2 core)
  let newCommitCount = 0;
  for (const repo of ownRepos) {
    const dbRepo = repoMap.get(repo.id);
    if (!dbRepo) continue;

    // Rate limit tekrar kontrol — 50'nin altına düşerse dur
    const rem = await getRateLimit(token);
    if (rem < 50) break;

    try {
      const commits = await fetchAllPages<{
        sha: string;
        commit: { message: string; author: { date: string } };
      }>(`/repos/${repo.full_name}/commits?author=${username}&since=${since}`, token);

      if (commits.length === 0) continue;
      newCommitCount += commits.length;

      // İlk 10 commit için detay çek (cron'da daha az agresif)
      const withDetails = await Promise.all(
        commits.slice(0, 10).map(async (c) => {
          try {
            const { json: d } = await githubFetch(`/repos/${repo.full_name}/commits/${c.sha}`, token);
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

      const rest = commits.slice(10).map((c) => ({
        repo_id: dbRepo.id, sha: c.sha,
        message: c.commit.message.split("\n")[0].slice(0, 500),
        committed_at: c.commit.author.date,
        additions: 0, deletions: 0,
      }));

      await supabaseAdmin.from("commits").upsert([...withDetails, ...rest], { onConflict: "repo_id,sha" });
    } catch { /* devam */ }
  }

  // Günlük istatistikleri güncelle — sadece `since` sonrası günler için
  const { data: recentCommits } = await supabaseAdmin
    .from("commits")
    .select("committed_at, repo_id, additions, deletions")
    .in("repo_id", dbRepos.map((r) => r.id))
    .gte("committed_at", since);

  if (recentCommits && recentCommits.length > 0) {
    const dailyMap = new Map<string, { commitCount: number; repos: Set<string>; linesAdded: number; linesDeleted: number }>();
    for (const c of recentCommits) {
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
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", userId);

  return { skipped: false, newCommitCount };
}

// ── Cron handler ─────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  // Vercel cron güvenliği — sadece Vercel'den gelen isteklere izin ver
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  const results: { username: string; result: object }[] = [];

  // Tüm sync edilmiş kullanıcıları al
  const { data: users } = await supabaseAdmin
    .from("users")
    .select("id, username, access_token, last_synced_at")
    .not("last_synced_at", "is", null)
    .not("access_token", "is", null);

  if (!users || users.length === 0) {
    return NextResponse.json({ message: "Sync edilecek kullanıcı yok", duration: 0 });
  }

  for (const user of users) {
    try {
      const result = await syncUser(user.id, user.username, user.access_token, user.last_synced_at);
      results.push({ username: user.username, result });
    } catch (err) {
      results.push({ username: user.username, result: { error: String(err) } });
    }
  }

  const duration = Math.round((Date.now() - startedAt) / 1000);

  // Akşam 20:00 civarındaysa streak bildirimi gönder (UTC+3 → 17:00 UTC)
  const utcHour = new Date().getUTCHours();
  if (utcHour === 17) {
    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL
        ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)
        ?? process.env.NEXTAUTH_URL
        ?? "http://localhost:3000";
      await fetch(`${baseUrl}/api/push-send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cron-secret": process.env.CRON_SECRET!,
        },
        body: JSON.stringify({ type: "streak" }),
      });
    } catch {
      // Push gönderimi başarısız — sync'i etkilemez
    }
  }

  return NextResponse.json({ synced: users.length, duration, results });
}
