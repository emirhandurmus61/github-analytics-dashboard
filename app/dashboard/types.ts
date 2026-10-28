import type { Badge } from "@/lib/badges";
import type { Insight } from "@/lib/insights";
import type { DeveloperDNA } from "@/lib/developer-dna";
import type { PercentileData } from "@/lib/percentile";
import type { UserGoal } from "@/lib/goals";
import type { MonthLangPoint } from "./lang-evolution";
import type { StreakStatus } from "./streak-guard";

export type DateRange = "30" | "90" | "365";

export type DayCount = { date: string; commit_count: number };

export type RepoRow = {
  name: string;
  full_name: string;
  language: string | null;
  stars: number;
  forks: number;
  commit_count: number;
};

export type RepoHealthRow = {
  name: string;
  full_name: string;
  language: string | null;
  stars: number;
  forks: number;
  lastCommitDate: string | null;
  commitCount90d: number;
  openIssues: number;
  totalIssues: number;
  isArchived: boolean;
};

export type MonthSummary = { label: string; commits: number; activeDays: number; linesAdded: number };

export type CommitQualityData = {
  avgMsgLength: number;
  multiLinePct: number;
  conventionalPct: number;
  typeDist: { type: string; count: number }[];
  biggestCommits: { message: string; additions: number; deletions: number; date: string }[];
  totalAnalyzed: number;
};

export type DashboardData = {
  username: string;
  firstName: string;
  hasSynced: boolean;
  lastSyncedAt: string | null;
  dateRange: DateRange;
  hideForks: boolean;

  stats: {
    repoCount: number;
    commitCount: number;
    prevCommitCount: number | null;
    languageCount: number;
    totalStars: number;
    totalForks: number;
    ownRepos: number;
    forkRepos: number;
    archivedRepos: number;
    topStarred: { name: string; stars: number; language: string | null }[];
  };
  topLanguages: { language: string; bytes: number }[];
  recentActivity: DayCount[];
  heatmapData: DayCount[];
  hourData: { hour: number; day: number; count: number }[];
  commitTimestamps: string[];
  repoList: RepoRow[];
  repoHealth: RepoHealthRow[];

  thisWeek: number;
  lastWeek: number;
  /** Mon..Sun commit counts */
  weekDays: { current: number[]; previous: number[] };

  streak: {
    currentStreak: number;
    longestStreak: number;
    totalActiveDays: number;
    brokenStreak: number;
    isRecordBrokenToday: boolean;
    previousRecord: number;
    daysSinceLastCommit: number;
  };
  streakStatus: StreakStatus;
  todayCommits: number;

  codeStats: {
    linesAdded: number;
    linesDeleted: number;
    totalCommits: number;
    mergedPRs: number;
    openIssues: number;
    closedIssues: number;
  };
  insights: Insight[];
  thisMonth: MonthSummary;
  lastMonth: MonthSummary;
  langEvolution: { data: MonthLangPoint[]; keys: string[] };
  commitQuality: CommitQualityData | null;
  badges: Badge[];
  todayBadges: Badge[];

  weeklyGoal: number;
  goalHistory: { week_start: string; goal: number; actual: number }[];
  profileViews: { thisWeek: number; total: number };
  developerDna: DeveloperDNA | null;
  percentile: PercentileData | null;
  userGoals: UserGoal[];
  goalAchievements: string[];
  goalMetrics: { todayCommits: number; weeklyPRs: number; monthlyActiveDays: number; quarterlyNewRepos: number };
};
