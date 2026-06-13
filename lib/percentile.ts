import { supabaseAdmin } from "./supabase";

export type PercentileData = {
  // Commit sayısı yüzdelik dilim (son 365 gün)
  commitPercentile: number;
  commitCount: number;
  platformMedianCommits: number;

  // Streak yüzdelik dilim
  streakPercentile: number;
  streakDays: number;
  platformMedianStreak: number;

  // Dil bazlı commit yüzdelik dilim (top lang)
  topLang: string | null;
  langPercentile: number | null; // null = yeterli veri yok

  // Aktif gün yüzdelik dilim
  activeDayPercentile: number;
  activeDays: number;
  platformMedianActiveDays: number;

  // Toplam kullanıcı sayısı (context için)
  totalUsers: number;
};

function calcPercentile(values: number[], userValue: number): number {
  if (values.length === 0) return 50;
  const below = values.filter((v) => v < userValue).length;
  return Math.round((below / values.length) * 100);
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

export async function calcPercentileRank(
  userId: string,
  userCommitCount: number,
  userStreakDays: number,
  userActiveDays: number,
  userTopLang: string | null,
): Promise<PercentileData> {
  const yearAgo = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);

  // Tüm kullanıcıların yıllık commit + aktif gün aggregatları
  const { data: allStats } = await supabaseAdmin
    .from("daily_stats")
    .select("user_id, commit_count, date")
    .gte("date", yearAgo);

  // user_id → { commits, activeDays }
  const userAggMap = new Map<string, { commits: number; activeDays: number }>();
  for (const row of allStats ?? []) {
    if (!userAggMap.has(row.user_id)) {
      userAggMap.set(row.user_id, { commits: 0, activeDays: 0 });
    }
    const agg = userAggMap.get(row.user_id)!;
    agg.commits += row.commit_count;
    if (row.commit_count > 0) agg.activeDays++;
  }

  const allCommitCounts = Array.from(userAggMap.values()).map((a) => a.commits);
  const allActiveDays = Array.from(userAggMap.values()).map((a) => a.activeDays);
  const totalUsers = userAggMap.size;

  // Streak hesapla: son 400 günlük daily_stats'tan streak çek
  const { data: streakStats } = await supabaseAdmin
    .from("daily_stats")
    .select("user_id, date, commit_count")
    .gte("date", new Date(Date.now() - 400 * 86400000).toISOString().slice(0, 10));

  const streakGrouped = new Map<string, string[]>();
  for (const row of streakStats ?? []) {
    if (row.commit_count > 0) {
      if (!streakGrouped.has(row.user_id)) streakGrouped.set(row.user_id, []);
      streakGrouped.get(row.user_id)!.push(row.date);
    }
  }

  // Basit streak hesaplama (calculateStreaks'i burada inline edelim — import döngüsü yaratmamak için)
  function calcCurrentStreak(dates: string[]): number {
    if (dates.length === 0) return 0;
    const sorted = [...dates].sort().reverse();
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (sorted[0] !== today && sorted[0] !== yesterday) return 0;
    let streak = 0;
    let prev = sorted[0];
    for (const d of sorted) {
      const diff = (new Date(prev).getTime() - new Date(d).getTime()) / 86400000;
      if (diff > 1) break;
      streak++;
      prev = d;
    }
    return streak;
  }

  const allStreaks: number[] = [];
  for (const [uid, dates] of streakGrouped) {
    if (uid !== userId) allStreaks.push(calcCurrentStreak(dates));
  }

  // Dil bazlı commit: kullanıcının topLang'ındaki commit sayıları
  let langPercentile: number | null = null;
  if (userTopLang) {
    const { data: langRepos } = await supabaseAdmin
      .from("repositories")
      .select("id, user_id")
      .eq("language", userTopLang)
      .eq("is_fork", false);

    if (langRepos && langRepos.length > 0) {
      const repoIds = langRepos.map((r) => r.id);
      const repoUserMap = new Map<string, string>();
      for (const r of langRepos) repoUserMap.set(r.id, r.user_id);

      const { data: langCommits } = await supabaseAdmin
        .from("commits")
        .select("repo_id")
        .in("repo_id", repoIds)
        .gte("committed_at", yearAgo);

      const langUserCommits = new Map<string, number>();
      for (const c of langCommits ?? []) {
        const uid = repoUserMap.get(c.repo_id);
        if (!uid) continue;
        langUserCommits.set(uid, (langUserCommits.get(uid) ?? 0) + 1);
      }

      const otherLangCounts = Array.from(langUserCommits.entries())
        .filter(([uid]) => uid !== userId)
        .map(([, count]) => count);

      if (otherLangCounts.length >= 3) {
        const userLangCommits = langUserCommits.get(userId) ?? 0;
        langPercentile = calcPercentile(otherLangCounts, userLangCommits);
      }
    }
  }

  return {
    commitPercentile: calcPercentile(allCommitCounts.filter((_, i) => Array.from(userAggMap.keys())[i] !== userId), userCommitCount),
    commitCount: userCommitCount,
    platformMedianCommits: median(allCommitCounts),

    streakPercentile: calcPercentile(allStreaks, userStreakDays),
    streakDays: userStreakDays,
    platformMedianStreak: median(allStreaks),

    topLang: userTopLang,
    langPercentile,

    activeDayPercentile: calcPercentile(allActiveDays.filter((_, i) => Array.from(userAggMap.keys())[i] !== userId), userActiveDays),
    activeDays: userActiveDays,
    platformMedianActiveDays: median(allActiveDays),

    totalUsers: Math.max(totalUsers, 1),
  };
}
