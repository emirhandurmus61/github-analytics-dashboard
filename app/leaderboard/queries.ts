import { supabaseAdmin } from "@/lib/supabase";
import { getStoredTzs } from "@/lib/tz-server";
import { calculateStreaks } from "@/lib/streak";
import { calcBadges } from "@/lib/badges";

export async function getWeeklyCommits(userIds: string[]): Promise<Map<string, number>> {
  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayOfWeek);
  monday.setHours(0, 0, 0, 0);
  const weekStart = monday.toISOString().slice(0, 10);

  const { data } = await supabaseAdmin
    .from("daily_stats")
    .select("user_id, commit_count")
    .in("user_id", userIds)
    .gte("date", weekStart);

  const map = new Map<string, number>();
  for (const row of data ?? []) {
    map.set(row.user_id, (map.get(row.user_id) ?? 0) + row.commit_count);
  }
  return map;
}

export async function getCurrentStreaks(userIds: string[]): Promise<Map<string, number>> {
  const { data } = await supabaseAdmin
    .from("daily_stats")
    .select("user_id, date, commit_count")
    .in("user_id", userIds)
    .gte("date", new Date(Date.now() - 400 * 86400000).toISOString().slice(0, 10));

  const grouped = new Map<string, string[]>();
  for (const row of data ?? []) {
    if (row.commit_count > 0) {
      if (!grouped.has(row.user_id)) grouped.set(row.user_id, []);
      grouped.get(row.user_id)!.push(row.date);
    }
  }

  const tzs = await getStoredTzs([...grouped.keys()]);
  const map = new Map<string, number>();
  for (const [uid, dates] of grouped) {
    const { currentStreak } = calculateStreaks(dates, tzs.get(uid) ?? "UTC");
    map.set(uid, currentStreak);
  }
  return map;
}

export async function getBadgeCounts(userIds: string[]): Promise<Map<string, number>> {
  if (userIds.length === 0) return new Map();

  const [reposRes, dailyStatsRes] = await Promise.all([
    supabaseAdmin
      .from("repositories")
      .select("id, user_id, stars, is_fork")
      .in("user_id", userIds),
    supabaseAdmin
      .from("daily_stats")
      .select("user_id, date, commit_count, lines_added")
      .in("user_id", userIds)
      .gte("date", new Date(Date.now() - 400 * 86400000).toISOString().slice(0, 10)),
  ]);

  const repos = reposRes.data ?? [];
  const repoToUser = new Map<string, string>();
  const repoForkMap = new Map<string, boolean>();
  const userRepos = new Map<string, typeof repos>();

  for (const r of repos) {
    repoToUser.set(r.id, r.user_id);
    repoForkMap.set(r.id, r.is_fork);
    if (!userRepos.has(r.user_id)) userRepos.set(r.user_id, []);
    userRepos.get(r.user_id)!.push(r);
  }

  const allRepoIds = repos.map((r) => r.id);
  const ownRepoIds = repos.filter((r) => !r.is_fork).map((r) => r.id);

  const [langsRes, prsRes, issuesRes, commitsRes] = await Promise.all([
    allRepoIds.length > 0
      ? supabaseAdmin
          .from("repo_languages")
          .select("repo_id, language")
          .in("repo_id", allRepoIds)
      : Promise.resolve({ data: [] }),
    ownRepoIds.length > 0
      ? supabaseAdmin
          .from("pull_requests")
          .select("repo_id, merged")
          .in("repo_id", ownRepoIds)
          .eq("merged", true)
      : Promise.resolve({ data: [] }),
    ownRepoIds.length > 0
      ? supabaseAdmin
          .from("issues")
          .select("repo_id, state")
          .in("repo_id", ownRepoIds)
          .eq("state", "closed")
      : Promise.resolve({ data: [] }),
    allRepoIds.length > 0
      ? supabaseAdmin
          .from("commits")
          .select("repo_id, committed_at, additions, deletions")
          .in("repo_id", allRepoIds)
          .gte("committed_at", new Date(Date.now() - 400 * 86400000).toISOString())
      : Promise.resolve({ data: [] }),
  ]);

  // Diller
  const userLanguages = new Map<string, Set<string>>();
  for (const row of langsRes.data ?? []) {
    const uid = repoToUser.get(row.repo_id);
    if (!uid) continue;
    if (!userLanguages.has(uid)) userLanguages.set(uid, new Set());
    userLanguages.get(uid)!.add(row.language);
  }

  // PR'lar
  const userPRs = new Map<string, number>();
  for (const row of prsRes.data ?? []) {
    const uid = repoToUser.get(row.repo_id);
    if (!uid) continue;
    userPRs.set(uid, (userPRs.get(uid) ?? 0) + 1);
  }

  // Issue'lar
  const userIssues = new Map<string, number>();
  for (const row of issuesRes.data ?? []) {
    const uid = repoToUser.get(row.repo_id);
    if (!uid) continue;
    userIssues.set(uid, (userIssues.get(uid) ?? 0) + 1);
  }

  // Commit'ler
  const userCommits = new Map<string, { committed_at: string; repo_id: string; additions: number | null; deletions: number | null }[]>();
  for (const row of commitsRes.data ?? []) {
    const uid = repoToUser.get(row.repo_id);
    if (!uid) continue;
    if (!userCommits.has(uid)) userCommits.set(uid, []);
    userCommits.get(uid)!.push(row);
  }

  // Günlük istatistikler
  const userDaily = new Map<string, { date: string; commit_count: number; lines_added: number | null }[]>();
  for (const row of dailyStatsRes.data ?? []) {
    if (!userDaily.has(row.user_id)) userDaily.set(row.user_id, []);
    userDaily.get(row.user_id)!.push(row);
  }

  const map = new Map<string, number>();
  for (const uid of userIds) {
    const daily = userDaily.get(uid) ?? [];
    const activeDates = daily.filter((d) => d.commit_count > 0).map((d) => d.date);
    const { longestStreak, totalActiveDays } = calculateStreaks(activeDates);

    const uCommits = userCommits.get(uid) ?? [];
    const uRepos = userRepos.get(uid) ?? [];
    const uLangs = userLanguages.get(uid) ?? new Set();

    const linesAdded =
      daily.reduce((s, d) => s + (d.lines_added ?? 0), 0) ||
      uCommits.reduce((s, c) => s + (c.additions ?? 0), 0);
    const totalCommits =
      daily.reduce((s, d) => s + (d.commit_count ?? 0), 0) || uCommits.length;
    const totalStars = uRepos.reduce((s, r) => s + (r.stars ?? 0), 0);

    const badges = calcBadges({
      hasSynced: true,
      longestStreak,
      commitTimestamps: uCommits.map((c) => c.committed_at),
      repoForkMap,
      commitRepoIds: uCommits.map((c) => c.repo_id),
      commitDeletions: uCommits.map((c) => c.deletions ?? 0),
      languageCount: uLangs.size,
      totalCommits,
      repoCount: uRepos.length,
      mergedPRs: userPRs.get(uid) ?? 0,
      closedIssues: userIssues.get(uid) ?? 0,
      linesAdded,
      totalActiveDays,
      totalStars,
    });

    const earnedCount = badges.filter((b) => b.earned).length;
    map.set(uid, earnedCount);
  }

  return map;
}

export async function getTopLangs(userIds: string[]): Promise<Map<string, string | null>> {
  // Her kullanıcının non-fork repo ID'lerini al
  const { data: repos } = await supabaseAdmin
    .from("repositories")
    .select("id, user_id")
    .in("user_id", userIds)
    .eq("is_fork", false);

  const repoToUser = new Map<string, string>();
  for (const r of repos ?? []) repoToUser.set(r.id, r.user_id);
  const repoIds = (repos ?? []).map((r) => r.id);

  if (repoIds.length === 0) return new Map();

  const { data: langs } = await supabaseAdmin
    .from("repo_languages")
    .select("repo_id, language, bytes")
    .in("repo_id", repoIds);

  const userLangs = new Map<string, Map<string, number>>();
  for (const row of langs ?? []) {
    const uid = repoToUser.get(row.repo_id);
    if (!uid) continue;
    if (!userLangs.has(uid)) userLangs.set(uid, new Map());
    const m = userLangs.get(uid)!;
    m.set(row.language, (m.get(row.language) ?? 0) + row.bytes);
  }

  const map = new Map<string, string | null>();
  for (const [uid, langs] of userLangs) {
    const top = Array.from(langs.entries()).sort((a, b) => b[1] - a[1])[0];
    map.set(uid, top ? top[0] : null);
  }
  return map;
}
