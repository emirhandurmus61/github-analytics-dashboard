import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { Suspense } from "react";
import SyncButton from "./sync-button";
import ContributionHeatmap from "./contribution-heatmap";
import HourHeatmap from "./hour-heatmap";
import RepoList from "./repo-list";
import WeekCompare from "./week-compare";
import Filters, { type DateRange } from "./filters";
import StreakCard from "./streak-card";
import CodeStats from "./code-stats";
import InsightCards from "./insight-cards";
import GoalTracker from "./goal-tracker";
import CompareView from "./compare-view";
import VelocityChart from "./velocity-chart";
import RhythmAnalysis from "./rhythm-analysis";
import RepoHealthList from "./repo-health-list";
import LangEvolution, { type MonthLangPoint } from "./lang-evolution";
import CommitQuality from "./commit-quality";
import BadgeCollection from "./badge-collection";
import { calcBadges, type Badge } from "@/lib/badges";
import StreakGuard, { type StreakStatus } from "./streak-guard";
import { calculateStreaks } from "@/lib/streak";
import { generateInsights } from "@/lib/insights";
import DashboardGrid, { SortableWidget } from "./dashboard-grid";
import { DEFAULT_WIDGET_CONFIGS } from "@/lib/widget-config";
import ProfileViewsCard from "./profile-views-card";
import DeveloperCard from "./developer-card";
import DeveloperDNACard from "./developer-dna";
import AutoSync from "./auto-sync";
import { calcDeveloperDNA, type DeveloperDNA } from "@/lib/developer-dna";

type Props = {
  searchParams: Promise<{ range?: string; hideForks?: string }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const session = await auth();
  const { range, hideForks: hideForkParam } = await searchParams;

  const dateRange: DateRange =
    range === "30" || range === "90" || range === "365" ? range : "365";
  const hideForks = hideForkParam === "1";

  const { data: dbUser } = await supabaseAdmin
    .from("users")
    .select("id, last_synced_at, weekly_commit_goal, theme_accent")
    .eq("username", session?.user?.username ?? "")
    .single();

  const hasSynced = !!dbUser?.last_synced_at;

  let stats = { repoCount: 0, commitCount: 0, languageCount: 0 };
  let topLanguages: { language: string; bytes: number }[] = [];
  let recentActivity: { date: string; commit_count: number }[] = [];
  let heatmapData: { date: string; commit_count: number }[] = [];
  let hourData: { hour: number; day: number; count: number }[] = [];
  let repoListData: {
    name: string; full_name: string; language: string | null;
    stars: number; forks: number; commit_count: number;
  }[] = [];
  let repoHealthData: {
    name: string; full_name: string; language: string | null;
    stars: number; forks: number;
    lastCommitDate: string | null;
    commitCount90d: number;
    openIssues: number;
    totalIssues: number;
    isArchived: boolean;
  }[] = [];
  let thisWeek = 0;
  let lastWeek = 0;
  let streakData = { currentStreak: 0, longestStreak: 0, totalActiveDays: 0 };
  let codeStats = { linesAdded: 0, linesDeleted: 0, totalCommits: 0, mergedPRs: 0, openIssues: 0, closedIssues: 0 };
  let insights: import("@/lib/insights").Insight[] = [];
  let topRepo: string | null = null;
  let topRepoCommits = 0;
  let thisMonthData = { label: "", commits: 0, activeDays: 0, linesAdded: 0 };
  let lastMonthData = { label: "", commits: 0, activeDays: 0, linesAdded: 0 };
  let commitTimestamps: string[] = [];
  let langEvolutionData: MonthLangPoint[] = [];
  let langEvolutionKeys: string[] = [];
  let commitQuality: {
    avgMsgLength: number;
    multiLinePct: number;
    conventionalPct: number;
    typeDist: { type: string; count: number }[];
    biggestCommits: { message: string; additions: number; deletions: number; date: string }[];
    totalAnalyzed: number;
  } | null = null;
  let badges: Badge[] = [];
  let streakStatus: StreakStatus = "no_streak";
  let weeklyGoal = dbUser?.weekly_commit_goal ?? 20;
  let goalHistory: { week_start: string; goal: number; actual: number }[] = [];
  let profileViewsThisWeek = 0;
  let profileViewsTotal = 0;
  let developerDna: DeveloperDNA | null = null;

  if (hasSynced && dbUser) {
    const sinceDate = new Date(
      Date.now() - Number(dateRange) * 24 * 60 * 60 * 1000
    ).toISOString().slice(0, 10);

    const { data: repoRows } = await supabaseAdmin
      .from("repositories")
      .select("id, name, full_name, language, stars, forks, is_fork, is_archived")
      .eq("user_id", dbUser.id)
      .then((res) => ({
        ...res,
        data: hideForks ? res.data?.filter((r) => !r.is_fork) : res.data,
      }));

    const ids = repoRows?.map((r) => r.id) ?? [];
    const ownIds = repoRows?.filter((r) => !r.is_fork).map((r) => r.id) ?? [];

    const [commitsRes, langsRes, activityRes, heatmapRes, allCommitsRes] =
      await Promise.all([
        supabaseAdmin
          .from("commits")
          .select("count", { count: "exact", head: true })
          .in("repo_id", ids)
          .gte("committed_at", sinceDate),

        supabaseAdmin
          .from("repo_languages")
          .select("language, bytes")
          .in("repo_id", ids),

        supabaseAdmin
          .from("daily_stats")
          .select("date, commit_count")
          .eq("user_id", dbUser.id)
          .gte("date", sinceDate)
          .order("date", { ascending: false })
          .limit(30),

        supabaseAdmin
          .from("daily_stats")
          .select("date, commit_count")
          .eq("user_id", dbUser.id)
          .gte("date", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
          .order("date", { ascending: true }),

        supabaseAdmin
          .from("commits")
          .select("committed_at, repo_id, message, additions, deletions")
          .in("repo_id", ownIds)
          .gte("committed_at", new Date(Date.now() - Number(dateRange) * 24 * 60 * 60 * 1000).toISOString()),
      ]);

    // Dil toplamları
    const langMap = new Map<string, number>();
    for (const row of langsRes.data ?? []) {
      langMap.set(row.language, (langMap.get(row.language) ?? 0) + row.bytes);
    }
    topLanguages = Array.from(langMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([language, bytes]) => ({ language, bytes }));

    stats = {
      repoCount: repoRows?.length ?? 0,
      commitCount: commitsRes.count ?? 0,
      languageCount: langMap.size,
    };

    recentActivity = (activityRes.data ?? []).reverse();
    heatmapData = heatmapRes.data ?? [];

    // Commit timestamp'leri (ritim analizi için)
    commitTimestamps = (allCommitsRes.data ?? []).map((c) => c.committed_at);

    // Dil evrimi — repo_id → language eşlemesi
    const repoLangMap = new Map<string, string>();
    for (const r of repoRows ?? []) {
      if (r.language) repoLangMap.set(r.id, r.language);
    }

    // Aylık dil → commit sayısı
    const MONTH_LABELS = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
    const monthLangMap = new Map<string, Map<string, number>>(); // "YYYY-MM" → lang → count
    for (const { committed_at, repo_id } of allCommitsRes.data ?? []) {
      const lang = repoLangMap.get(repo_id);
      if (!lang) continue;
      const ym = committed_at.slice(0, 7); // "YYYY-MM"
      if (!monthLangMap.has(ym)) monthLangMap.set(ym, new Map());
      const m = monthLangMap.get(ym)!;
      m.set(lang, (m.get(lang) ?? 0) + 1);
    }

    // Son 12 ay sıralı
    const today = new Date();
    const months: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }

    // Toplam commit sayısına göre top dilleri belirle
    const globalLangCount = new Map<string, number>();
    for (const langCounts of monthLangMap.values()) {
      for (const [l, c] of langCounts) {
        globalLangCount.set(l, (globalLangCount.get(l) ?? 0) + c);
      }
    }
    langEvolutionKeys = Array.from(globalLangCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([l]) => l);

    langEvolutionData = months.map((ym) => {
      const d = new Date(ym + "-01");
      const label = `${MONTH_LABELS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
      const point: MonthLangPoint = { month: ym, label };
      const langCounts = monthLangMap.get(ym) ?? new Map();
      for (const l of langEvolutionKeys) {
        point[l] = langCounts.get(l) ?? 0;
      }
      return point;
    });

    // Commit kalite analizi
    const commits = allCommitsRes.data ?? [];
    if (commits.length > 0) {
      const CONVENTIONAL_RE = /^(feat|fix|docs|style|refactor|perf|test|chore|build|ci|revert)(\(.+?\))?(!)?:/i;
      const TYPE_RE = /^(feat|fix|docs|style|refactor|perf|test|chore|build|ci|revert)/i;

      let totalMsgLen = 0;
      let multiLine = 0;
      let conventional = 0;
      const typeCounts = new Map<string, number>();

      for (const c of commits) {
        const msg = c.message ?? "";
        totalMsgLen += msg.length;
        if (msg.includes("\n")) multiLine++;
        if (CONVENTIONAL_RE.test(msg)) {
          conventional++;
          const match = msg.match(TYPE_RE);
          if (match) {
            const t = match[1].toLowerCase();
            typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1);
          }
        }
      }

      const typeDist = Array.from(typeCounts.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

      const biggestCommits = [...commits]
        .filter((c) => (c.additions ?? 0) + (c.deletions ?? 0) > 0)
        .sort((a, b) => ((b.additions ?? 0) + (b.deletions ?? 0)) - ((a.additions ?? 0) + (a.deletions ?? 0)))
        .slice(0, 5)
        .map((c) => ({
          message: (c.message ?? "").split("\n")[0].slice(0, 72),
          additions: c.additions ?? 0,
          deletions: c.deletions ?? 0,
          date: c.committed_at.slice(0, 10),
        }));

      commitQuality = {
        avgMsgLength: Math.round(totalMsgLen / commits.length),
        multiLinePct: Math.round((multiLine / commits.length) * 100),
        conventionalPct: Math.round((conventional / commits.length) * 100),
        typeDist,
        biggestCommits,
        totalAnalyzed: commits.length,
      };
    }

    // Saat heatmap
    const hourMap = new Map<string, number>();
    for (const { committed_at } of allCommitsRes.data ?? []) {
      const d = new Date(committed_at);
      const key = `${(d.getDay() + 6) % 7}-${d.getHours()}`;
      hourMap.set(key, (hourMap.get(key) ?? 0) + 1);
    }
    hourData = Array.from(hourMap.entries()).map(([key, count]) => {
      const [day, hour] = key.split("-").map(Number);
      return { day, hour, count };
    });

    // Repo commit sayıları
    const repoCommitCounts = await Promise.all(
      (repoRows ?? []).filter((r) => !r.is_fork).map(async (repo) => {
        const { count } = await supabaseAdmin
          .from("commits")
          .select("count", { count: "exact", head: true })
          .eq("repo_id", repo.id)
          .gte("committed_at", sinceDate);
        return { ...repo, commit_count: count ?? 0 };
      })
    );

    repoListData = repoCommitCounts
      .sort((a, b) => b.commit_count - a.commit_count)
      .slice(0, 8)
      .map((r) => ({
        name: r.name, full_name: r.full_name, language: r.language,
        stars: r.stars, forks: r.forks, commit_count: r.commit_count,
      }));

    // Repo sağlık skoru için ek veriler — bulk sorgularla
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const ownRepos = (repoRows ?? []).filter((r) => !r.is_fork);
    const ownIds2 = ownRepos.map((r) => r.id);

    const [allCommitsForHealth, allIssuesForHealth] = await Promise.all([
      // Tüm own repo'ların commit'leri (son tarih + 90 gün sayısı için)
      supabaseAdmin
        .from("commits")
        .select("repo_id, committed_at")
        .in("repo_id", ownIds2)
        .order("committed_at", { ascending: false }),
      // Tüm issue'lar
      supabaseAdmin
        .from("issues")
        .select("repo_id, state")
        .in("repo_id", ownIds2),
    ]);

    // repo_id → son commit tarihi + 90 gün sayısı
    const lastCommitMap = new Map<string, string>();
    const count90dMap = new Map<string, number>();
    for (const c of allCommitsForHealth.data ?? []) {
      if (!lastCommitMap.has(c.repo_id)) lastCommitMap.set(c.repo_id, c.committed_at);
      if (c.committed_at >= ninetyDaysAgo) {
        count90dMap.set(c.repo_id, (count90dMap.get(c.repo_id) ?? 0) + 1);
      }
    }

    // repo_id → { open, total }
    const issueMap = new Map<string, { open: number; total: number }>();
    for (const i of allIssuesForHealth.data ?? []) {
      const cur = issueMap.get(i.repo_id) ?? { open: 0, total: 0 };
      cur.total++;
      if (i.state === "open") cur.open++;
      issueMap.set(i.repo_id, cur);
    }

    repoHealthData = ownRepos.map((repo) => {
      const issues = issueMap.get(repo.id) ?? { open: 0, total: 0 };
      return {
        name: repo.name,
        full_name: repo.full_name,
        language: repo.language,
        stars: repo.stars,
        forks: repo.forks,
        lastCommitDate: lastCommitMap.get(repo.id) ?? null,
        commitCount90d: count90dMap.get(repo.id) ?? 0,
        openIssues: issues.open,
        totalIssues: issues.total,
        isArchived: (repo as { is_archived?: boolean }).is_archived ?? false,
      };
    });

    // Bu hafta vs geçen hafta
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfWeek.getDate() - 7);

    thisWeek = heatmapData
      .filter((d) => d.date >= startOfWeek.toISOString().slice(0, 10))
      .reduce((s, d) => s + d.commit_count, 0);
    lastWeek = heatmapData
      .filter((d) =>
        d.date >= startOfLastWeek.toISOString().slice(0, 10) &&
        d.date < startOfWeek.toISOString().slice(0, 10)
      )
      .reduce((s, d) => s + d.commit_count, 0);

    // Streak hesapla
    const activeDates = heatmapData
      .filter((d) => d.commit_count > 0)
      .map((d) => d.date);
    streakData = calculateStreaks(activeDates);

    // Streak koruma durumu
    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const activeDateSet = new Set(activeDates);
    const hasToday = activeDateSet.has(todayStr);
    const hasYesterday = activeDateSet.has(yesterdayStr);

    if (streakData.currentStreak === 0 && streakData.longestStreak === 0) {
      streakStatus = "no_streak";
    } else if (hasToday) {
      streakStatus = "safe";
    } else if (hasYesterday) {
      streakStatus = "at_risk";
    } else if (streakData.longestStreak > 0) {
      streakStatus = "broken_today";
    } else {
      streakStatus = "no_streak";
    }

    // Code stats
    const [dailyStatsRes, prsRes, issuesRes] = await Promise.all([
      supabaseAdmin
        .from("daily_stats")
        .select("lines_added, lines_deleted")
        .eq("user_id", dbUser.id)
        .gte("date", sinceDate),

      supabaseAdmin
        .from("pull_requests")
        .select("merged, state")
        .in("repo_id", ownIds)
        .gte("created_at", sinceDate),

      supabaseAdmin
        .from("issues")
        .select("state")
        .in("repo_id", ownIds)
        .gte("created_at", sinceDate),
    ]);

    const linesAdded = (dailyStatsRes.data ?? []).reduce((s, d) => s + (d.lines_added ?? 0), 0);
    const linesDeleted = (dailyStatsRes.data ?? []).reduce((s, d) => s + (d.lines_deleted ?? 0), 0);
    const mergedPRs = (prsRes.data ?? []).filter((p) => p.merged).length;
    const openIssues = (issuesRes.data ?? []).filter((i) => i.state === "open").length;
    const closedIssues = (issuesRes.data ?? []).filter((i) => i.state === "closed").length;

    codeStats = {
      linesAdded,
      linesDeleted,
      totalCommits: commitsRes.count ?? 0,
      mergedPRs,
      openIssues,
      closedIssues,
    };

    // En aktif repo
    if (repoListData.length > 0) {
      topRepo = repoListData[0].name;
      topRepoCommits = repoListData[0].commit_count;
    }

    // Bu ay vs geçen ay karşılaştırması
    const MONTH_NAMES = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
    const now2 = new Date();
    const thisMonthStart = new Date(now2.getFullYear(), now2.getMonth(), 1).toISOString().slice(0, 10);
    const lastMonthStart = new Date(now2.getFullYear(), now2.getMonth() - 1, 1).toISOString().slice(0, 10);
    const lastMonthEnd = new Date(now2.getFullYear(), now2.getMonth(), 0).toISOString().slice(0, 10);

    const thisMonthStats = heatmapData.filter((d) => d.date >= thisMonthStart);
    const lastMonthStats = heatmapData.filter((d) => d.date >= lastMonthStart && d.date <= lastMonthEnd);

    const { data: thisMonthLines } = await supabaseAdmin
      .from("daily_stats").select("lines_added")
      .eq("user_id", dbUser.id).gte("date", thisMonthStart);
    const { data: lastMonthLines } = await supabaseAdmin
      .from("daily_stats").select("lines_added")
      .eq("user_id", dbUser.id).gte("date", lastMonthStart).lte("date", lastMonthEnd);

    thisMonthData = {
      label: MONTH_NAMES[now2.getMonth()],
      commits: thisMonthStats.reduce((s, d) => s + d.commit_count, 0),
      activeDays: thisMonthStats.filter((d) => d.commit_count > 0).length,
      linesAdded: (thisMonthLines ?? []).reduce((s, d) => s + (d.lines_added ?? 0), 0),
    };
    lastMonthData = {
      label: MONTH_NAMES[(now2.getMonth() - 1 + 12) % 12],
      commits: lastMonthStats.reduce((s, d) => s + d.commit_count, 0),
      activeDays: lastMonthStats.filter((d) => d.commit_count > 0).length,
      linesAdded: (lastMonthLines ?? []).reduce((s, d) => s + (d.lines_added ?? 0), 0),
    };

    // İçgörüler
    const topLang = topLanguages[0]?.language ?? null;
    insights = generateInsights(
      heatmapData,
      hourData,
      topRepo,
      topRepoCommits,
      streakData.currentStreak,
      streakData.longestStreak,
      linesAdded,
      linesDeleted,
      topLang,
    );

    // Rozetler
    const repoForkMap = new Map<string, boolean>(
      (repoRows ?? []).map((r) => [r.id, r.is_fork])
    );
    badges = calcBadges({
      hasSynced: true,
      longestStreak: streakData.longestStreak,
      commitTimestamps: (allCommitsRes.data ?? []).map((c) => c.committed_at),
      repoForkMap,
      commitRepoIds: (allCommitsRes.data ?? []).map((c) => c.repo_id),
      commitDeletions: (allCommitsRes.data ?? []).map((c) => c.deletions ?? 0),
      languageCount: langMap.size,
    });

    // Developer DNA
    {
      const commits = allCommitsRes.data ?? [];
      const avgAdditions = commits.length > 0
        ? commits.reduce((s, c) => s + (c.additions ?? 0), 0) / commits.length
        : 0;
      const avgDeletions = commits.length > 0
        ? commits.reduce((s, c) => s + (c.deletions ?? 0), 0) / commits.length
        : 0;
      const totalLangBytes = topLanguages.reduce((s, l) => s + l.bytes, 0);
      const topLangBytes = topLanguages[0]?.bytes ?? 0;
      const topLang = topLanguages[0]?.language ?? null;
      const totalRepoCommits = repoListData.reduce((s, r) => s + r.commit_count, 0);
      const topRepoCommits = repoListData[0]?.commit_count ?? 0;

      developerDna = calcDeveloperDNA({
        hourData,
        commitTimestamps,
        avgAdditions,
        avgDeletions,
        languageCount: stats.languageCount,
        topLangBytes,
        totalLangBytes,
        topLang,
        conventionalPct: commitQuality?.conventionalPct ?? 0,
        avgMsgLength: commitQuality?.avgMsgLength ?? 0,
        repoCount: stats.repoCount,
        totalCommits: totalRepoCommits,
        topRepoCommits,
      });
    }

    // Haftalık hedef
    weeklyGoal = dbUser.weekly_commit_goal ?? 20;

    // Bu haftanın Pazartesi'si
    const todayNow = new Date();
    const thisDow = (todayNow.getDay() + 6) % 7;
    const thisMonday = new Date(todayNow);
    thisMonday.setDate(todayNow.getDate() - thisDow);
    thisMonday.setHours(0, 0, 0, 0);
    const thisWeekStart = thisMonday.toISOString().slice(0, 10);

    // Bu haftanın hedef/gerçek kaydını upsert et (sayfa yüklenince güncelle)
    await supabaseAdmin
      .from("weekly_goal_history")
      .upsert(
        { user_id: dbUser.id, week_start: thisWeekStart, goal: weeklyGoal, actual: thisWeek },
        { onConflict: "user_id,week_start", ignoreDuplicates: false }
      );

    // Son 12 haftalık geçmişi çek
    const { data: historyRows } = await supabaseAdmin
      .from("weekly_goal_history")
      .select("week_start, goal, actual")
      .eq("user_id", dbUser.id)
      .order("week_start", { ascending: false })
      .limit(12);

    goalHistory = historyRows ?? [];

    // Profil görüntülenme sayıları
    try {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [weekRes, totalRes] = await Promise.all([
        supabaseAdmin
          .from("profile_views")
          .select("id", { count: "exact", head: true })
          .eq("user_id", dbUser.id)
          .gte("viewed_at", oneWeekAgo),
        supabaseAdmin
          .from("profile_views")
          .select("id", { count: "exact", head: true })
          .eq("user_id", dbUser.id),
      ]);
      profileViewsThisWeek = weekRes.count ?? 0;
      profileViewsTotal = totalRes.count ?? 0;
    } catch {
      // Tablo henüz yoksa sessizce geç
    }
  }

  const lastSynced = dbUser?.last_synced_at
    ? new Date(dbUser.last_synced_at).toLocaleString("tr-TR")
    : null;

  const { THEMES, isValidTheme, DEFAULT_THEME } = await import("@/lib/themes");
  const themeKey = isValidTheme(dbUser?.theme_accent) ? dbUser!.theme_accent : DEFAULT_THEME;
  const theme = THEMES[themeKey];
  const accentColor = theme.accent;
  const accentBg = theme.accentBg;
  const accentBorder = theme.accentBorder;

  return (
    <div>
      {/* Arka planda otomatik sync — 1 saatten eski verideyse sessizce tetiklenir */}
      <AutoSync lastSyncedAt={dbUser?.last_synced_at ?? null} />

      {/* Başlık */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-zinc-100 sm:text-2xl">
              Merhaba, {session?.user?.name?.split(" ")[0]}
            </h1>
            <p className="mt-0.5 text-xs text-zinc-500 sm:text-sm">
              {lastSynced ? `Son sync: ${lastSynced}` : "Senkronizasyonu başlat."}
            </p>
          </div>
          {hasSynced && (
            <div className="flex items-center gap-2 shrink-0">
              <SyncButton label="Yenile" />
            </div>
          )}
        </div>
        {hasSynced && (
          <div className="mt-3">
            <Suspense>
              <Filters hideForks={hideForks} dateRange={dateRange} />
            </Suspense>
          </div>
        )}
      </div>

      {!hasSynced ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-800">
              <svg className="h-7 w-7 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </div>
          </div>
          <h2 className="mb-2 text-lg font-medium text-zinc-100">Veriler henüz yüklenmedi</h2>
          <p className="mb-6 text-sm text-zinc-500">
            GitHub repolarını ve commit geçmişini çekmek için senkronizasyonu başlat.
          </p>
          <SyncButton />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Streak uyarı banner — grid dışında, her zaman üstte */}
          <StreakGuard status={streakStatus} currentStreak={streakData.currentStreak || streakData.longestStreak} />

          {/* Özelleştirilebilir Grid */}
          <DashboardGrid widgetIds={DEFAULT_WIDGET_CONFIGS.map((c) => c.id)}>

            {/* Stat kartlar */}
            <SortableWidget key="stat-repos" id="stat-repos" data-widget-id="stat-repos">
              <StatCard label="Toplam Repo" value={stats.repoCount} />
            </SortableWidget>

            <SortableWidget key="stat-commits" id="stat-commits" data-widget-id="stat-commits">
              <StatCard label={`Commit (${dateRange === "365" ? "1 yıl" : dateRange + " gün"})`} value={stats.commitCount} />
            </SortableWidget>

            <SortableWidget key="stat-langs" id="stat-langs" data-widget-id="stat-langs">
              <StatCard label="Kullanılan Dil" value={stats.languageCount} />
            </SortableWidget>

            {/* İçgörüler */}
            <SortableWidget key="insights" id="insights" data-widget-id="insights">
              <InsightCards insights={insights} />
            </SortableWidget>

            {/* Streak */}
            <SortableWidget key="streak" id="streak" data-widget-id="streak">
              <StreakCard {...streakData} />
            </SortableWidget>

            {/* Haftalık Hedef */}
            <SortableWidget key="goal" id="goal" data-widget-id="goal">
              <GoalTracker thisWeek={thisWeek} initialGoal={weeklyGoal} history={goalHistory} />
            </SortableWidget>

            {/* Rozetler */}
            <SortableWidget key="badges" id="badges" data-widget-id="badges">
              <BadgeCollection badges={badges} />
            </SortableWidget>

            {/* Profil görüntülenme */}
            <SortableWidget key="profile-views" id="profile-views" data-widget-id="profile-views">
              <ProfileViewsCard
                thisWeek={profileViewsThisWeek}
                total={profileViewsTotal}
                username={session?.user?.username ?? ""}
              />
            </SortableWidget>

            {/* Kod istatistikleri */}
            <SortableWidget key="code-stats" id="code-stats" data-widget-id="code-stats">
              <CodeStats {...codeStats} />
            </SortableWidget>

            {/* Bu hafta vs geçen */}
            <SortableWidget key="week-compare" id="week-compare" data-widget-id="week-compare">
              <WeekCompare thisWeek={thisWeek} lastWeek={lastWeek} />
            </SortableWidget>

            {/* Bu ay vs geçen */}
            <SortableWidget key="month-compare" id="month-compare" data-widget-id="month-compare">
              <CompareView thisMonth={thisMonthData} lastMonth={lastMonthData} />
            </SortableWidget>

            {/* Velocity */}
            <SortableWidget key="velocity" id="velocity" data-widget-id="velocity">
              <VelocityChart data={heatmapData} />
            </SortableWidget>

            {/* Dil evrimi */}
            <SortableWidget key="lang-evolution" id="lang-evolution" data-widget-id="lang-evolution">
              <LangEvolution data={langEvolutionData} languages={langEvolutionKeys} />
            </SortableWidget>

            {/* Katkı heatmap */}
            <SortableWidget key="heatmap" id="heatmap" data-widget-id="heatmap">
              <ContributionHeatmap data={heatmapData} />
            </SortableWidget>

            {/* Commit aktivitesi */}
            <SortableWidget key="activity-bar" id="activity-bar" data-widget-id="activity-bar">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 h-full flex flex-col">
                <h2 className="mb-3 text-xs font-medium text-zinc-500 uppercase tracking-wider shrink-0">
                  Son {dateRange === "365" ? "30" : dateRange} Gun Aktivite
                </h2>
                <ActivityBar data={recentActivity} />
              </div>
            </SortableWidget>

            {/* Dil dagilimi */}
            <SortableWidget key="lang-dist" id="lang-dist" data-widget-id="lang-dist">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 h-full flex flex-col">
                <h2 className="mb-3 text-xs font-medium text-zinc-500 uppercase tracking-wider shrink-0">Dil Dagilimi</h2>
                <LanguageList languages={topLanguages} />
              </div>
            </SortableWidget>

            {/* Çalışma ritmi */}
            <SortableWidget key="rhythm" id="rhythm" data-widget-id="rhythm">
              <RhythmAnalysis hourData={hourData} commitTimestamps={commitTimestamps} />
            </SortableWidget>

            {/* Commit kalitesi */}
            {commitQuality && (
              <SortableWidget key="commit-quality" id="commit-quality" data-widget-id="commit-quality">
                <CommitQuality {...commitQuality} />
              </SortableWidget>
            )}

            {/* Saat heatmap */}
            <SortableWidget key="hour-heatmap" id="hour-heatmap" data-widget-id="hour-heatmap">
              <HourHeatmap data={hourData} />
            </SortableWidget>

            {/* Repo listesi */}
            <SortableWidget key="repo-list" id="repo-list" data-widget-id="repo-list">
              <RepoList repos={repoListData} />
            </SortableWidget>

            {/* Repo sağlık */}
            <SortableWidget key="repo-health" id="repo-health" data-widget-id="repo-health">
              <RepoHealthList repos={repoHealthData} />
            </SortableWidget>

            {/* Developer Card */}
            <SortableWidget key="developer-card" id="developer-card" data-widget-id="developer-card">
              <DeveloperCard username={session?.user?.username ?? ""} />
            </SortableWidget>

            {/* Developer DNA */}
            {developerDna && (
              <SortableWidget key="developer-dna" id="developer-dna" data-widget-id="developer-dna">
                <DeveloperDNACard
                  dna={developerDna}
                  username={session?.user?.username ?? ""}
                />
              </SortableWidget>
            )}

          </DashboardGrid>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 h-full flex flex-col items-center justify-center p-5 gap-2">
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">{label}</p>
      <p className="text-4xl font-bold text-zinc-100 tabular-nums">{value.toLocaleString("tr-TR")}</p>
    </div>
  );
}

function ActivityBar({ data }: { data: { date: string; commit_count: number }[] }) {
  if (data.length === 0) return <p className="text-[11px] text-zinc-600">Veri yok</p>;
  const max = Math.max(...data.map((d) => d.commit_count));
  return (
    <div className="flex items-end gap-0.5 flex-1">
      {data.map((d) => {
        const height = max > 0 ? Math.max((d.commit_count / max) * 100, 4) : 4;
        return (
          <div key={d.date} title={`${d.date}: ${d.commit_count} commit`}
            className="flex-1 rounded-sm opacity-80 transition-opacity hover:opacity-100"
            style={{ height: `${height}%`, backgroundColor: "var(--accent, #34d399)" }}
          />
        );
      })}
    </div>
  );
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
  Rust: "#dea584", Go: "#00ADD8", CSS: "#563d7c", HTML: "#e34c26",
  Java: "#b07219", "C++": "#f34b7d", "C#": "#178600", C: "#555555",
};

function LanguageList({ languages }: { languages: { language: string; bytes: number }[] }) {
  if (languages.length === 0) return <p className="text-[11px] text-zinc-600">Veri yok</p>;
  const total = languages.reduce((sum, l) => sum + l.bytes, 0);
  return (
    <div className="space-y-3 flex-1">
      {languages.map(({ language, bytes }) => {
        const pct = total > 0 ? ((bytes / total) * 100).toFixed(1) : "0";
        const color = LANG_COLORS[language] ?? "#6b7280";
        return (
          <div key={language}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-zinc-300">{language}</span>
              <span className="text-zinc-600 tabular-nums">{pct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
