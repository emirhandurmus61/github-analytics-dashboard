import { calculateStreaks } from "@/lib/streak";
import { calcBadges } from "@/lib/badges";
import { calcDeveloperDNA } from "@/lib/developer-dna";

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
  Rust: "#dea584", Go: "#00ADD8", CSS: "#563d7c", HTML: "#e34c26",
  Java: "#b07219", "C++": "#f34b7d", "C#": "#178600", C: "#555555",
};

type RepoRow = {
  id: string;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stars: number;
  forks: number;
  is_fork: boolean;
};
type YearCommit = { committed_at: string; repo_id: string; additions: number | null; deletions: number | null; message: string | null };

export function buildProfileStats({
  repoRows,
  langRows,
  heatmapData,
  commitCount,
  yearCommits,
  mergedPRs,
  closedIssues,
  pinnedReposDb,
  pinnedRepoName,
  tz,
}: {
  repoRows: RepoRow[];
  langRows: { language: string; bytes: number }[];
  heatmapData: { date: string; commit_count: number }[];
  commitCount: number;
  yearCommits: YearCommit[];
  mergedPRs: number;
  closedIssues: number;
  pinnedReposDb: string[];
  pinnedRepoName: string | null;
  tz: string;
}) {
  // Languages
  const langMap = new Map<string, number>();
  for (const row of langRows) {
    langMap.set(row.language, (langMap.get(row.language) ?? 0) + row.bytes);
  }
  const topLanguagesRaw = Array.from(langMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const totalBytes = topLanguagesRaw.reduce((s, [, b]) => s + b, 0);
  const topLanguages = topLanguagesRaw.map(([lang, bytes]) => ({
    lang,
    bytes,
    pct: totalBytes > 0 ? (bytes / totalBytes) * 100 : 0,
    color: LANG_COLORS[lang] ?? "#6b7280",
  }));

  // Stats
  const activeDates = heatmapData.filter((d) => d.commit_count > 0).map((d) => d.date);
  const { currentStreak, longestStreak, totalActiveDays } = calculateStreaks(activeDates, tz);

  const stats = {
    repoCount: repoRows.length,
    commitCount: commitCount,
    languageCount: langMap.size,
    activeDays: totalActiveDays,
  };

  // Badges
  const repoForkMap = new Map<string, boolean>(
    repoRows.map((r) => [r.id, r.is_fork])
  );
  const badgeCommits = yearCommits;
  const earnedBadges = calcBadges({
    hasSynced: true,
    longestStreak,
    commitTimestamps: badgeCommits.map((c) => c.committed_at),
    repoForkMap,
    commitRepoIds: badgeCommits.map((c) => c.repo_id),
    commitDeletions: badgeCommits.map((c) => c.deletions ?? 0),
    languageCount: langMap.size,
    totalCommits: stats.commitCount,
    repoCount: stats.repoCount,
    mergedPRs: mergedPRs,
    closedIssues: closedIssues,
    linesAdded: (yearCommits).reduce((s, c) => s + (c.additions ?? 0), 0),
    totalActiveDays: totalActiveDays,
    totalStars: repoRows.reduce((s, r) => s + (r.stars ?? 0), 0),
  }).filter((b) => b.earned);

  // Developer DNA
  const dnaCommits = yearCommits;
  const dnaHourMap = new Map<string, number>();
  for (const { committed_at } of dnaCommits) {
    const d = new Date(committed_at);
    const key = `${(d.getDay() + 6) % 7}-${d.getHours()}`;
    dnaHourMap.set(key, (dnaHourMap.get(key) ?? 0) + 1);
  }
  const dnaHourData = Array.from(dnaHourMap.entries()).map(([key, count]) => {
    const [day, hour] = key.split("-").map(Number);
    return { day, hour, count };
  });

  const CONVENTIONAL_RE = /^(feat|fix|docs|style|refactor|perf|test|chore|build|ci|revert)(\(.+?\))?(!)?:/i;
  const conventionalCount = dnaCommits.filter((c) => CONVENTIONAL_RE.test(c.message ?? "")).length;
  const totalMsgLen = dnaCommits.reduce((s, c) => s + (c.message?.length ?? 0), 0);

  const totalLangBytes = Array.from(langMap.values()).reduce((s, v) => s + v, 0);
  const topLangEntry = Array.from(langMap.entries()).sort((a, b) => b[1] - a[1])[0];
  const dnaTopLang = topLangEntry?.[0] ?? null;
  const dnaTopLangBytes = topLangEntry?.[1] ?? 0;

  const dnaAvgAdditions = dnaCommits.length > 0
    ? dnaCommits.reduce((s, c) => s + (c.additions ?? 0), 0) / dnaCommits.length
    : 0;
  const dnaAvgDeletions = dnaCommits.length > 0
    ? dnaCommits.reduce((s, c) => s + (c.deletions ?? 0), 0) / dnaCommits.length
    : 0;

  const developerDna = dnaCommits.length >= 5 ? calcDeveloperDNA({
    hourData: dnaHourData,
    commitTimestamps: dnaCommits.map((c) => c.committed_at),
    avgAdditions: dnaAvgAdditions,
    avgDeletions: dnaAvgDeletions,
    languageCount: langMap.size,
    topLangBytes: dnaTopLangBytes,
    totalLangBytes,
    topLang: dnaTopLang,
    conventionalPct: dnaCommits.length > 0 ? Math.round((conventionalCount / dnaCommits.length) * 100) : 0,
    avgMsgLength: dnaCommits.length > 0 ? Math.round(totalMsgLen / dnaCommits.length) : 0,
    repoCount: repoRows.length,
    totalCommits: commitCount,
    topRepoCommits: 0,
  }) : null;

  // Pinned repos (new array field, fallback to single pinned_repo_name)
  const pinnedNames: string[] = pinnedReposDb.length > 0
    ? pinnedReposDb.slice(0, 3)
    : (pinnedRepoName ? [pinnedRepoName] : []);

  const pinnedReposData = pinnedNames
    .map((n) => repoRows.find((r) => r.name === n))
    .filter((r): r is NonNullable<typeof r> => r != null)
    .map((r) => ({ name: r.name, full_name: r.full_name, language: r.language, stars: r.stars, forks: r.forks, description: r.description }));

  // Top repos
  const pinnedSet = new Set(pinnedNames);
  const topRepos = repoRows
    .filter((r) => !r.is_fork && !pinnedSet.has(r.name))
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 6)
    .map((r) => ({ name: r.name, full_name: r.full_name, language: r.language, stars: r.stars, forks: r.forks, description: r.description }));

  return { topLanguages, stats, currentStreak, longestStreak, earnedBadges, developerDna, pinnedReposData, topRepos };
}
