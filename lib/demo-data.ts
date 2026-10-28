// Deterministic sample data: the landing demo and the dev-only preview routes.
import { calcBadges } from "@/lib/badges";
import { calculateStreaks } from "@/lib/streak";
import { generateInsights } from "@/lib/insights";
import { calcDeveloperDNA } from "@/lib/developer-dna";
import type { Language } from "@/lib/i18n";
import type { DashboardData } from "@/app/dashboard/types";
import { MONTHS_LONG, MONTHS_SHORT } from "@/lib/ui/format";

function rng(seed = 7) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const DAY = 86400000;
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

export function mockDashboard(lang: Language = "tr"): DashboardData {
  const r = rng(42);
  const heatmapData = Array.from({ length: 365 }, (_, i) => {
    const t = Date.now() - (364 - i) * DAY;
    const d = new Date(t);
    const wd = d.getDay();
    const season = 0.55 + 0.45 * Math.sin((i / 365) * Math.PI * 2.2);
    const base = wd === 0 || wd === 6 ? 0.35 : 0.85;
    const active = r() < base * season + (i > 340 ? 0.5 : 0);
    const v = active ? Math.max(1, Math.round(r() * 9 * season + (r() < 0.06 ? 14 : 0))) : 0;
    return { date: iso(t), commit_count: i >= 352 ? Math.max(v, 1 + Math.round(r() * 5)) : v };
  });
  const map = new Map(heatmapData.map((d) => [d.date, d.commit_count]));
  const recentActivity = Array.from({ length: 30 }, (_, i) => {
    const date = iso(Date.now() - (29 - i) * DAY);
    return { date, commit_count: map.get(date) ?? 0 };
  });
  const hourData: { hour: number; day: number; count: number }[] = [];
  for (let day = 0; day < 7; day++)
    for (let hour = 0; hour < 24; hour++) {
      const evening = hour >= 20 || hour <= 1 ? 2.4 : hour >= 9 && hour <= 17 ? 1.2 : hour >= 2 && hour <= 7 ? 0.08 : 0.6;
      const c = Math.round(r() * 10 * evening * (day >= 5 ? 0.6 : 1));
      if (c > 0) hourData.push({ day, hour, count: c });
    }
  const timestamps: string[] = [];
  for (let i = 0; i < 400; i++) {
    const t = Date.now() - Math.floor(r() * 365) * DAY;
    const d = new Date(t);
    d.setHours(Math.floor(r() * 24), Math.floor(r() * 60));
    timestamps.push(d.toISOString());
  }
  const topLanguages = [
    { language: "TypeScript", bytes: 4_820_000 },
    { language: "Rust", bytes: 1_310_000 },
    { language: "Go", bytes: 880_000 },
    { language: "Python", bytes: 540_000 },
    { language: "CSS", bytes: 310_000 },
    { language: "Shell", bytes: 92_000 },
    { language: "Zig", bytes: 41_000 },
  ];
  const repoNames = [
    ["devboard", "TypeScript", 128, 14],
    ["tiny-kv", "Rust", 342, 41],
    ["gh-pulse", "Go", 57, 6],
    ["dotfiles", "Shell", 23, 3],
    ["ray-tracer", "Rust", 89, 9],
    ["notes-cli", "Python", 12, 1],
    ["design-tokens", "CSS", 31, 4],
    ["zig-playground", "Zig", 5, 0],
    ["old-portfolio", "JavaScript", 2, 0],
  ] as const;
  const repoList = repoNames.map(([name, language, stars, forks], i) => ({
    name,
    full_name: `devboard-demo/${name}`,
    language,
    stars,
    forks,
    commit_count: Math.max(0, Math.round(180 / (i + 1) - i * 3 + r() * 10)),
  }));
  const repoHealth = repoNames.map(([name, language, stars, forks], i) => ({
    name,
    full_name: `devboard-demo/${name}`,
    language,
    stars,
    forks,
    lastCommitDate: new Date(Date.now() - (i * i * 6 + 1) * DAY).toISOString(),
    commitCount90d: Math.max(0, 60 - i * 9),
    openIssues: i % 3,
    totalIssues: 4 + i,
    isArchived: name === "old-portfolio",
  }));
  const streak = calculateStreaks(heatmapData.filter((d) => d.commit_count > 0).map((d) => d.date));
  const now = new Date();
  const mon = new Date(now);
  mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const cur = Array.from({ length: 7 }, (_, i) => map.get(iso(mon.getTime() + i * DAY)) ?? 0);
  const prev = Array.from({ length: 7 }, (_, i) => map.get(iso(mon.getTime() + (i - 7) * DAY)) ?? 0);
  const commitCount = heatmapData.reduce((s, d) => s + d.commit_count, 0);
  const codeStats = { linesAdded: 184_320, linesDeleted: 61_904, totalCommits: commitCount, mergedPRs: 37, openIssues: 4, closedIssues: 22 };
  const months: string[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  const keys = ["TypeScript", "Rust", "Go", "Python"];
  const langEvo = months.map((ym, i) => {
    const d = new Date(ym + "-01");
    const p: DashboardData["langEvolution"]["data"][number] = { month: ym, label: `${MONTHS_SHORT[lang][d.getMonth()]} ${String(d.getFullYear()).slice(2)}` };
    p.TypeScript = Math.round(30 + i * 3 + r() * 10);
    p.Rust = Math.round(i > 4 ? 10 + (i - 4) * 4 + r() * 6 : r() * 4);
    p.Go = Math.round(14 - i + r() * 6);
    p.Python = Math.round(6 + r() * 6);
    return p;
  });
  const commitQuality = {
    avgMsgLength: 46,
    multiLinePct: 23,
    conventionalPct: 71,
    typeDist: [
      { type: "feat", count: 142 },
      { type: "fix", count: 88 },
      { type: "refactor", count: 41 },
      { type: "chore", count: 33 },
      { type: "docs", count: 17 },
      { type: "test", count: 12 },
    ],
    biggestCommits: [
      { message: "feat(ui): rebuild the overview grid with per-size layouts", additions: 4812, deletions: 1930, date: iso(Date.now() - 1 * DAY) },
      { message: "refactor(sync): stream progress over SSE", additions: 1204, deletions: 988, date: iso(Date.now() - 9 * DAY) },
      { message: "feat: add color schemes and command palette", additions: 2210, deletions: 140, date: iso(Date.now() - 14 * DAY) },
      { message: "fix(heatmap): quartile levels for sparse years", additions: 88, deletions: 61, date: iso(Date.now() - 22 * DAY) },
      { message: "chore: bump deps", additions: 540, deletions: 512, date: iso(Date.now() - 30 * DAY) },
      { message: "initial import", additions: 9800, deletions: 0, date: iso(Date.now() - 200 * DAY) },
    ],
    totalAnalyzed: 333,
  };
  const repoForkMap = new Map<string, boolean>(repoNames.map(([n]) => [n, false]));
  const badges = calcBadges({
    hasSynced: true,
    longestStreak: streak.longestStreak,
    commitTimestamps: timestamps,
    repoForkMap,
    commitRepoIds: timestamps.map((_, i) => repoNames[i % repoNames.length][0]),
    commitDeletions: timestamps.map(() => Math.round(r() * 80)),
    languageCount: topLanguages.length,
    totalCommits: commitCount,
    repoCount: repoNames.length,
    mergedPRs: 37,
    closedIssues: 22,
    linesAdded: codeStats.linesAdded,
    totalActiveDays: streak.totalActiveDays,
    totalStars: 689,
  });
  const insights = generateInsights(heatmapData, hourData, "devboard", 180, streak.currentStreak, streak.longestStreak, codeStats.linesAdded, codeStats.linesDeleted, "TypeScript", lang, streak.brokenStreak);
  const dna = calcDeveloperDNA({
    hourData,
    commitTimestamps: timestamps,
    avgAdditions: 120,
    avgDeletions: 40,
    languageCount: 7,
    topLangBytes: 4_820_000,
    totalLangBytes: 8_000_000,
    topLang: "TypeScript",
    conventionalPct: 71,
    avgMsgLength: 46,
    repoCount: 9,
    totalCommits: 600,
    topRepoCommits: 220,
  });
  const thisMonthDays = heatmapData.filter((d) => d.date >= iso(new Date(now.getFullYear(), now.getMonth(), 1).getTime()));
  const goalHistory = Array.from({ length: 11 }, (_, i) => ({
    week_start: iso(mon.getTime() - (i + 1) * 7 * DAY),
    goal: 20,
    actual: Math.round(10 + r() * 22),
  }));

  return {
    username: "devboard-demo",
    firstName: "Demo",
    hasSynced: true,
    lastSyncedAt: new Date(Date.now() - 4 * 60000).toISOString(),
    dateRange: "365",
    hideForks: false,
    stats: {
      repoCount: repoNames.length + 3,
      commitCount,
      prevCommitCount: null,
      languageCount: topLanguages.length,
      totalStars: 689,
      totalForks: 78,
      ownRepos: repoNames.length,
      forkRepos: 3,
      archivedRepos: 1,
      topStarred: [...repoNames].sort((a, b) => b[2] - a[2]).slice(0, 3).map(([name, language, stars]) => ({ name, language, stars })),
    },
    topLanguages,
    recentActivity,
    heatmapData,
    hourData,
    commitTimestamps: timestamps,
    repoList,
    repoHealth,
    thisWeek: cur.reduce((s, v) => s + v, 0),
    lastWeek: prev.reduce((s, v) => s + v, 0),
    weekDays: { current: cur, previous: prev },
    streak,
    streakStatus: "safe",
    todayCommits: map.get(iso(Date.now())) ?? 0,
    codeStats,
    insights,
    thisMonth: { label: MONTHS_LONG[lang][now.getMonth()], commits: thisMonthDays.reduce((s, d) => s + d.commit_count, 0), activeDays: thisMonthDays.filter((d) => d.commit_count > 0).length, linesAdded: 12_400 },
    lastMonth: { label: MONTHS_LONG[lang][(now.getMonth() + 11) % 12], commits: 118, activeDays: 21, linesAdded: 19_800 },
    langEvolution: { data: langEvo, keys },
    commitQuality,
    badges,
    todayBadges: [],
    weeklyGoal: 20,
    goalHistory,
    profileViews: { thisWeek: 37, total: 1204 },
    developerDna: dna,
    percentile: {
      commitPercentile: 91,
      commitCount,
      platformMedianCommits: 410,
      streakPercentile: 84,
      streakDays: streak.currentStreak,
      platformMedianStreak: 3,
      topLang: "TypeScript",
      langPercentile: 78,
      activeDayPercentile: 88,
      activeDays: streak.totalActiveDays,
      platformMedianActiveDays: 96,
      totalUsers: 2481,
    },
    userGoals: [
      { id: "g1", type: "daily_commit", target: 3, chainOrder: 0, completedAt: null, isActive: true },
      { id: "g2", type: "weekly_pr", target: 2, chainOrder: 1, completedAt: null, isActive: true },
      { id: "g3", type: "monthly_active_days", target: 20, chainOrder: 2, completedAt: null, isActive: true },
    ],
    goalAchievements: Array.from({ length: 14 }, (_, i) => iso(Date.now() - i * 2 * DAY)),
    goalMetrics: { todayCommits: 4, weeklyPRs: 1, monthlyActiveDays: 17, quarterlyNewRepos: 1 },
  };
}

export function mockCommits() {
  const r = rng(9);
  const repos = [
    ["devboard", "TypeScript"],
    ["tiny-kv", "Rust"],
    ["gh-pulse", "Go"],
    ["dotfiles", "Shell"],
    ["notes-cli", "Python"],
  ] as const;
  const msgs = [
    "feat(grid): per-size layouts for every card",
    "fix(heatmap): align weeks to Monday",
    "refactor(sync): stream progress over SSE",
    "chore: bump dependencies",
    "docs: explain the scheme tokens",
    "test(streak): cover midnight edge cases",
    "perf: memoize weekly aggregation",
    "feat(palette): live preview for color schemes\n\nArrow keys now preview a scheme before you commit to it.\nEsc restores the previous one.",
    "style: tighten panel header spacing",
    "wip: terminal status line",
    "Merge pull request #42 from devboard/feature",
    "fix: handle repos without a primary language",
  ];
  const out: { sha: string; message: string; committed_at: string; additions: number; deletions: number; repo_name: string | null; repo_language: string | null }[] = [];
  for (let i = 0; i < 420; i++) {
    const t = Date.now() - Math.floor(Math.pow(r(), 1.6) * 365) * 86400000 - Math.floor(r() * 86400000);
    const [name, lang] = repos[Math.floor(r() * repos.length)];
    out.push({
      sha: Array.from({ length: 40 }, () => "0123456789abcdef"[Math.floor(r() * 16)]).join(""),
      message: msgs[Math.floor(r() * msgs.length)],
      committed_at: new Date(t).toISOString(),
      additions: Math.floor(r() * 400),
      deletions: Math.floor(r() * 160),
      repo_name: name,
      repo_language: lang,
    });
  }
  return out.sort((a, b) => b.committed_at.localeCompare(a.committed_at));
}
