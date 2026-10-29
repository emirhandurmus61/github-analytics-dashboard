import { supabaseAdmin } from "@/lib/supabase";
import { calcBadges, type Badge } from "@/lib/badges";
import { calculateStreaks } from "@/lib/streak";
import { dayKey, shiftDay, weekStartKey } from "@/lib/tz";
import { generateInsights } from "@/lib/insights";
import { calcDeveloperDNA } from "@/lib/developer-dna";
import { calcPercentileRank } from "@/lib/percentile";
import type { Language } from "@/lib/i18n";
import type { MonthLangPoint } from "./lang-evolution";
import type { DashboardData, DateRange } from "./types";
import { MONTHS_LONG, MONTHS_SHORT } from "@/lib/ui/format";
import { emptyData } from "./empty-data";

const DAY = 86400000;

export async function loadDashboard(opts: {
  username: string;
  displayName: string;
  lang: Language;
  dateRange: DateRange;
  hideForks: boolean;
  tz: string;
}): Promise<DashboardData> {
  const { username, lang, dateRange, hideForks, tz } = opts;
  // Days follow the viewer's wall clock, not UTC.
  const isoDay = (t: number | Date) => dayKey(t, tz);

  const { data: dbUser } = await supabaseAdmin
    .from("users")
    .select("id, last_synced_at, weekly_commit_goal")
    .eq("username", username)
    .single();

  const d = emptyData({
    username,
    firstName: opts.displayName.split(" ")[0] || username,
    lastSyncedAt: dbUser?.last_synced_at ?? null,
    hasSynced: !!dbUser?.last_synced_at,
    dateRange,
    hideForks,
    weeklyGoal: dbUser?.weekly_commit_goal ?? 20,
  });
  if (!dbUser || !d.hasSynced) return d;

  const rangeDays = Number(dateRange);
  const sinceDate = isoDay(Date.now() - rangeDays * DAY);

  const { data: allRepoRows } = await supabaseAdmin
    .from("repositories")
    .select("id, name, full_name, language, stars, forks, is_fork, is_archived")
    .eq("user_id", dbUser.id);
  const repoRows = hideForks ? (allRepoRows ?? []).filter((r) => !r.is_fork) : (allRepoRows ?? []);

  const ids = repoRows.map((r) => r.id);
  const ownIds = repoRows.filter((r) => !r.is_fork).map((r) => r.id);

  const [commitsRes, langsRes, heatmapRes, allCommitsRes] = await Promise.all([
    supabaseAdmin.from("commits").select("count", { count: "exact", head: true }).in("repo_id", ids).gte("committed_at", sinceDate),
    supabaseAdmin.from("repo_languages").select("language, bytes").in("repo_id", ids),
    supabaseAdmin
      .from("daily_stats")
      .select("date, commit_count")
      .eq("user_id", dbUser.id)
      .gte("date", isoDay(Date.now() - 365 * DAY))
      .order("date", { ascending: true }),
    supabaseAdmin
      .from("commits")
      .select("committed_at, repo_id, message, additions, deletions")
      .in("repo_id", ownIds)
      .gte("committed_at", new Date(Date.now() - rangeDays * DAY).toISOString()),
  ]);

  /* Languages */
  const langMap = new Map<string, number>();
  for (const row of langsRes.data ?? []) langMap.set(row.language, (langMap.get(row.language) ?? 0) + row.bytes);
  d.topLanguages = [...langMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([language, bytes]) => ({ language, bytes }));

  /* Daily series */
  d.heatmapData = heatmapRes.data ?? [];
  const dayMap = new Map(d.heatmapData.map((x) => [x.date, x.commit_count]));
  d.recentActivity = Array.from({ length: 30 }, (_, i) => {
    const date = isoDay(Date.now() - (29 - i) * DAY);
    return { date, commit_count: dayMap.get(date) ?? 0 };
  });
  const todayStr = isoDay(Date.now());
  d.todayCommits = dayMap.get(todayStr) ?? 0;

  /* Previous period (only when it fits inside the 365-day series) */
  let prev: number | null = null;
  if (rangeDays < 365) {
    const from = isoDay(Date.now() - 2 * rangeDays * DAY);
    prev = d.heatmapData.filter((x) => x.date >= from && x.date < sinceDate).reduce((s, x) => s + x.commit_count, 0);
  }

  /* Repos */
  const totalStars = repoRows.reduce((s, r) => s + (r.stars ?? 0), 0);
  d.stats = {
    repoCount: repoRows.length,
    commitCount: commitsRes.count ?? 0,
    prevCommitCount: prev,
    languageCount: langMap.size,
    totalStars,
    totalForks: repoRows.reduce((s, r) => s + (r.forks ?? 0), 0),
    ownRepos: repoRows.filter((r) => !r.is_fork).length,
    forkRepos: repoRows.filter((r) => r.is_fork).length,
    archivedRepos: repoRows.filter((r) => r.is_archived).length,
    topStarred: [...repoRows]
      .filter((r) => !r.is_fork)
      .sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0))
      .slice(0, 3)
      .map((r) => ({ name: r.name, stars: r.stars ?? 0, language: r.language })),
  };

  const commits = allCommitsRes.data ?? [];
  d.commitTimestamps = commits.map((c) => c.committed_at);

  /* Language evolution (12 months) */
  const repoLang = new Map<string, string>();
  for (const r of repoRows) if (r.language) repoLang.set(r.id, r.language);
  const monthLang = new Map<string, Map<string, number>>();
  for (const { committed_at, repo_id } of commits) {
    const l = repoLang.get(repo_id);
    if (!l) continue;
    const ym = committed_at.slice(0, 7);
    if (!monthLang.has(ym)) monthLang.set(ym, new Map());
    const m = monthLang.get(ym)!;
    m.set(l, (m.get(l) ?? 0) + 1);
  }
  const today = new Date();
  const months: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const dt = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`);
  }
  const globalLang = new Map<string, number>();
  for (const counts of monthLang.values()) for (const [l, c] of counts) globalLang.set(l, (globalLang.get(l) ?? 0) + c);
  const langKeys = [...globalLang.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([l]) => l);
  d.langEvolution = {
    keys: langKeys,
    data: months.map((ym) => {
      const dt = new Date(ym + "-01");
      const point: MonthLangPoint = { month: ym, label: `${MONTHS_SHORT[lang][dt.getMonth()]} ${String(dt.getFullYear()).slice(2)}` };
      const counts = monthLang.get(ym) ?? new Map();
      for (const l of langKeys) point[l] = counts.get(l) ?? 0;
      return point;
    }),
  };

  /* Commit quality */
  if (commits.length > 0) {
    const CONVENTIONAL = /^(feat|fix|docs|style|refactor|perf|test|chore|build|ci|revert)(\(.+?\))?(!)?:/i;
    const TYPE = /^(feat|fix|docs|style|refactor|perf|test|chore|build|ci|revert)/i;
    let len = 0;
    let multi = 0;
    let conv = 0;
    const types = new Map<string, number>();
    for (const c of commits) {
      const msg = c.message ?? "";
      len += msg.length;
      if (msg.includes("\n")) multi++;
      if (CONVENTIONAL.test(msg)) {
        conv++;
        const t = msg.match(TYPE)?.[1].toLowerCase();
        if (t) types.set(t, (types.get(t) ?? 0) + 1);
      }
    }
    d.commitQuality = {
      avgMsgLength: Math.round(len / commits.length),
      multiLinePct: Math.round((multi / commits.length) * 100),
      conventionalPct: Math.round((conv / commits.length) * 100),
      typeDist: [...types.entries()].map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count),
      biggestCommits: [...commits]
        .filter((c) => (c.additions ?? 0) + (c.deletions ?? 0) > 0)
        .sort((a, b) => (b.additions ?? 0) + (b.deletions ?? 0) - ((a.additions ?? 0) + (a.deletions ?? 0)))
        .slice(0, 6)
        .map((c) => ({
          message: (c.message ?? "").split("\n")[0].slice(0, 90),
          additions: c.additions ?? 0,
          deletions: c.deletions ?? 0,
          date: c.committed_at.slice(0, 10),
        })),
      totalAnalyzed: commits.length,
    };
  }

  /* Hour × weekday */
  const hourMap = new Map<string, number>();
  for (const { committed_at } of commits) {
    const dt = new Date(committed_at);
    const key = `${(dt.getDay() + 6) % 7}-${dt.getHours()}`;
    hourMap.set(key, (hourMap.get(key) ?? 0) + 1);
  }
  d.hourData = [...hourMap.entries()].map(([key, count]) => {
    const [day, hour] = key.split("-").map(Number);
    return { day, hour, count };
  });

  /* Per-repo commit counts in range (single query, grouped in memory) */
  const ownRepos = repoRows.filter((r) => !r.is_fork);
  const ownIdsAll = ownRepos.map((r) => r.id);
  const ninetyAgo = new Date(Date.now() - 90 * DAY).toISOString();
  const [healthCommits, healthIssues] = await Promise.all([
    supabaseAdmin.from("commits").select("repo_id, committed_at").in("repo_id", ownIdsAll).order("committed_at", { ascending: false }),
    supabaseAdmin.from("issues").select("repo_id, state").in("repo_id", ownIdsAll),
  ]);
  const lastCommit = new Map<string, string>();
  const count90 = new Map<string, number>();
  for (const c of healthCommits.data ?? []) {
    if (!lastCommit.has(c.repo_id)) lastCommit.set(c.repo_id, c.committed_at);
    if (c.committed_at >= ninetyAgo) count90.set(c.repo_id, (count90.get(c.repo_id) ?? 0) + 1);
  }
  const issueMap = new Map<string, { open: number; total: number }>();
  for (const i of healthIssues.data ?? []) {
    const cur = issueMap.get(i.repo_id) ?? { open: 0, total: 0 };
    cur.total++;
    if (i.state === "open") cur.open++;
    issueMap.set(i.repo_id, cur);
  }
  // Exact per-repo counts (row-limited selects would undercount busy repos).
  const rangeCounts = await Promise.all(
    ownRepos.map(async (r) => {
      const { count } = await supabaseAdmin.from("commits").select("count", { count: "exact", head: true }).eq("repo_id", r.id).gte("committed_at", sinceDate);
      return count ?? 0;
    }),
  );
  d.repoList = ownRepos
    .map((r, i) => ({ name: r.name, full_name: r.full_name, language: r.language, stars: r.stars, forks: r.forks, commit_count: rangeCounts[i] }))
    .sort((a, b) => b.commit_count - a.commit_count)
    .slice(0, 10);
  d.repoHealth = ownRepos.map((r) => {
    const iss = issueMap.get(r.id) ?? { open: 0, total: 0 };
    return {
      name: r.name,
      full_name: r.full_name,
      language: r.language,
      stars: r.stars,
      forks: r.forks,
      lastCommitDate: lastCommit.get(r.id) ?? null,
      commitCount90d: count90.get(r.id) ?? 0,
      openIssues: iss.open,
      totalIssues: iss.total,
      isArchived: r.is_archived ?? false,
    };
  });

  /* Weeks */
  const todayKey = isoDay(Date.now());
  const weekStartStr = weekStartKey(todayKey);
  for (let i = 0; i < 7; i++) {
    d.weekDays.current[i] = dayMap.get(shiftDay(weekStartStr, i)) ?? 0;
    d.weekDays.previous[i] = dayMap.get(shiftDay(weekStartStr, i - 7)) ?? 0;
  }
  d.thisWeek = d.weekDays.current.reduce((s, v) => s + v, 0);
  d.lastWeek = d.weekDays.previous.reduce((s, v) => s + v, 0);

  /* Streak */
  const activeDates = d.heatmapData.filter((x) => x.commit_count > 0).map((x) => x.date);
  d.streak = calculateStreaks(activeDates, tz);
  const yesterdayStr = shiftDay(todayKey, -1);
  const activeSet = new Set(activeDates);
  d.streakStatus = d.streak.isRecordBrokenToday
    ? "record_broken"
    : activeSet.has(todayStr)
      ? "safe"
      : activeSet.has(yesterdayStr)
        ? "at_risk"
        : d.streak.daysSinceLastCommit === 2 && d.streak.brokenStreak > 0
          ? "broken_today"
          : "no_streak";

  /* Code stats */
  const [dailyLines, prs, issues] = await Promise.all([
    supabaseAdmin.from("daily_stats").select("date, lines_added, lines_deleted").eq("user_id", dbUser.id).gte("date", isoDay(Date.now() - Math.max(rangeDays, 62) * DAY)),
    supabaseAdmin.from("pull_requests").select("merged, state").in("repo_id", ownIds).gte("created_at", sinceDate),
    supabaseAdmin.from("issues").select("state").in("repo_id", ownIds).gte("created_at", sinceDate),
  ]);
  const linesInRange = (dailyLines.data ?? []).filter((x) => x.date >= sinceDate);
  d.codeStats = {
    linesAdded: linesInRange.reduce((s, x) => s + (x.lines_added ?? 0), 0),
    linesDeleted: linesInRange.reduce((s, x) => s + (x.lines_deleted ?? 0), 0),
    totalCommits: commitsRes.count ?? 0,
    mergedPRs: (prs.data ?? []).filter((p) => p.merged).length,
    openIssues: (issues.data ?? []).filter((i) => i.state === "open").length,
    closedIssues: (issues.data ?? []).filter((i) => i.state === "closed").length,
  };

  /* Month vs month */
  const thisMonthStart = `${todayKey.slice(0, 8)}01`;
  const lastMonthEnd = shiftDay(thisMonthStart, -1);
  const lastMonthStart = `${lastMonthEnd.slice(0, 8)}01`;
  const inMonth = (x: { date: string }, a: string, b?: string) => x.date >= a && (!b || x.date <= b);
  const linesByDate = dailyLines.data ?? [];
  const tm = d.heatmapData.filter((x) => inMonth(x, thisMonthStart));
  const lm = d.heatmapData.filter((x) => inMonth(x, lastMonthStart, lastMonthEnd));
  d.thisMonth = {
    label: MONTHS_LONG[lang][Number(todayKey.slice(5, 7)) - 1],
    commits: tm.reduce((s, x) => s + x.commit_count, 0),
    activeDays: tm.filter((x) => x.commit_count > 0).length,
    linesAdded: linesByDate.filter((x) => inMonth(x, thisMonthStart)).reduce((s, x) => s + (x.lines_added ?? 0), 0),
  };
  d.lastMonth = {
    label: MONTHS_LONG[lang][(Number(todayKey.slice(5, 7)) + 10) % 12],
    commits: lm.reduce((s, x) => s + x.commit_count, 0),
    activeDays: lm.filter((x) => x.commit_count > 0).length,
    linesAdded: linesByDate.filter((x) => inMonth(x, lastMonthStart, lastMonthEnd)).reduce((s, x) => s + (x.lines_added ?? 0), 0),
  };

  /* Insights */
  d.insights = generateInsights(
    d.heatmapData,
    d.hourData,
    d.repoList[0]?.name ?? null,
    d.repoList[0]?.commit_count ?? 0,
    d.streak.currentStreak,
    d.streak.longestStreak,
    d.codeStats.linesAdded,
    d.codeStats.linesDeleted,
    d.topLanguages[0]?.language ?? null,
    lang,
    d.streak.brokenStreak,
  );

  /* Badges (+ which ones were earned today) */
  const repoForkMap = new Map<string, boolean>(repoRows.map((r) => [r.id, r.is_fork]));
  const badgeInput = (list: typeof commits, longest: number, activeDays: number): Badge[] =>
    calcBadges({
      hasSynced: true,
      longestStreak: longest,
      commitTimestamps: list.map((c) => c.committed_at),
      repoForkMap,
      commitRepoIds: list.map((c) => c.repo_id),
      commitDeletions: list.map((c) => c.deletions ?? 0),
      languageCount: langMap.size,
      totalCommits: list === commits ? d.stats.commitCount : list.length,
      repoCount: d.stats.repoCount,
      mergedPRs: d.codeStats.mergedPRs,
      closedIssues: d.codeStats.closedIssues,
      linesAdded: d.codeStats.linesAdded,
      totalActiveDays: activeDays,
      totalStars,
    });
  d.badges = badgeInput(commits, d.streak.longestStreak, d.streak.totalActiveDays);
  if (activeSet.has(todayStr)) {
    const past = commits.filter((c) => dayKey(c.committed_at, tz) < todayStr);
    const pastStreak = calculateStreaks(activeDates.filter((x) => x < todayStr), tz);
    const pastEarned = new Set(badgeInput(past, pastStreak.longestStreak, pastStreak.totalActiveDays).filter((b) => b.earned).map((b) => b.id));
    d.todayBadges = d.badges.filter((b) => b.earned && !pastEarned.has(b.id));
  }

  /* Developer DNA */
  {
    const avgAdd = commits.length ? commits.reduce((s, c) => s + (c.additions ?? 0), 0) / commits.length : 0;
    const avgDel = commits.length ? commits.reduce((s, c) => s + (c.deletions ?? 0), 0) / commits.length : 0;
    d.developerDna = calcDeveloperDNA({
      hourData: d.hourData,
      commitTimestamps: d.commitTimestamps,
      avgAdditions: avgAdd,
      avgDeletions: avgDel,
      languageCount: d.stats.languageCount,
      topLangBytes: d.topLanguages[0]?.bytes ?? 0,
      totalLangBytes: d.topLanguages.reduce((s, l) => s + l.bytes, 0),
      topLang: d.topLanguages[0]?.language ?? null,
      conventionalPct: d.commitQuality?.conventionalPct ?? 0,
      avgMsgLength: d.commitQuality?.avgMsgLength ?? 0,
      repoCount: d.stats.repoCount,
      totalCommits: d.repoList.reduce((s, r) => s + r.commit_count, 0),
      topRepoCommits: d.repoList[0]?.commit_count ?? 0,
    });
  }

  /* Percentile (anonymous platform aggregates) */
  try {
    d.percentile = await calcPercentileRank(
      dbUser.id,
      commitsRes.count ?? 0,
      d.streak.currentStreak,
      d.heatmapData.filter((x) => x.commit_count > 0).length,
      d.topLanguages[0]?.language ?? null,
    );
  } catch {
    /* not enough platform data yet */
  }

  /* Goal chain */
  try {
    const [goalsRes, achRes] = await Promise.all([
      supabaseAdmin.from("user_goals").select("id, type, target, chain_order, completed_at, is_active").eq("user_id", dbUser.id).eq("is_active", true).order("chain_order", { ascending: true }),
      supabaseAdmin.from("goal_achievements").select("achieved_on").eq("user_id", dbUser.id),
    ]);
    d.userGoals = (goalsRes.data ?? []).map((g) => ({ id: g.id, type: g.type, target: g.target, chainOrder: g.chain_order, completedAt: g.completed_at, isActive: g.is_active }));
    d.goalAchievements = (achRes.data ?? []).map((a) => a.achieved_on);
    const monthStart = thisMonthStart;
    const qMonth = Math.floor((Number(todayKey.slice(5, 7)) - 1) / 3) * 3 + 1;
    const quarterStart = `${todayKey.slice(0, 5)}${String(qMonth).padStart(2, "0")}-01`;
    const [weekPRs, quarterRepos] = await Promise.all([
      supabaseAdmin.from("pull_requests").select("id", { count: "exact", head: true }).in("repo_id", ownIds).gte("created_at", weekStartStr),
      supabaseAdmin.from("repositories").select("id", { count: "exact", head: true }).eq("user_id", dbUser.id).gte("created_at", quarterStart),
    ]);
    d.goalMetrics = {
      todayCommits: d.todayCommits,
      weeklyPRs: weekPRs.count ?? 0,
      monthlyActiveDays: d.heatmapData.filter((x) => x.date >= monthStart && x.commit_count > 0).length,
      quarterlyNewRepos: quarterRepos.count ?? 0,
    };
  } catch {
    /* tables may not exist yet */
  }

  /* Weekly goal history (records this week's actual on view) */
  const weekStart = weekStartStr;
  await supabaseAdmin
    .from("weekly_goal_history")
    .upsert({ user_id: dbUser.id, week_start: weekStart, goal: d.weeklyGoal, actual: d.thisWeek }, { onConflict: "user_id,week_start", ignoreDuplicates: false });
  const { data: hist } = await supabaseAdmin
    .from("weekly_goal_history")
    .select("week_start, goal, actual")
    .eq("user_id", dbUser.id)
    .order("week_start", { ascending: false })
    .limit(12);
  d.goalHistory = hist ?? [];

  /* Profile visits */
  try {
    const weekAgo = new Date(Date.now() - 7 * DAY).toISOString();
    const [w, t] = await Promise.all([
      supabaseAdmin.from("profile_views").select("id", { count: "exact", head: true }).eq("user_id", dbUser.id).gte("viewed_at", weekAgo),
      supabaseAdmin.from("profile_views").select("id", { count: "exact", head: true }).eq("user_id", dbUser.id),
    ]);
    d.profileViews = { thisWeek: w.count ?? 0, total: t.count ?? 0 };
  } catch {
    /* table may not exist yet */
  }

  return d;
}
