import { supabaseAdmin } from "@/lib/supabase";
import { weekdayHour } from "@/lib/tz";
import { MONTHS_SHORT } from "@/lib/ui/format";
import type { Language } from "@/lib/i18n";
import type { MonthLangPoint } from "./lang-evolution";
import type { DashboardData } from "./types";

const DAY = 86400000;

type CommitRow = { committed_at: string; repo_id: string; message: string | null; additions: number | null; deletions: number | null };
type RepoRow = {
  id: string;
  name: string;
  full_name: string;
  language: string | null;
  stars: number;
  forks: number;
  is_archived: boolean | null;
};


/** Commits per language for the last 12 months, top 6 languages. */
export function buildLangEvolution(commits: CommitRow[], repoRows: RepoRow[], lang: Language): DashboardData["langEvolution"] {
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
  return {
    keys: langKeys,
    data: months.map((ym) => {
      const dt = new Date(ym + "-01");
      const point: MonthLangPoint = { month: ym, label: `${MONTHS_SHORT[lang][dt.getMonth()]} ${String(dt.getFullYear()).slice(2)}` };
      const counts = monthLang.get(ym) ?? new Map();
      for (const l of langKeys) point[l] = counts.get(l) ?? 0;
      return point;
    }),
  };
}

export function buildCommitQuality(commits: CommitRow[]): NonNullable<DashboardData["commitQuality"]> {
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
  return {
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

/** Commit counts by weekday (Mon = 0) and hour, on the viewer's wall clock. */
export function buildHourData(commits: CommitRow[], tz: string): DashboardData["hourData"] {
  const hourMap = new Map<string, number>();
  for (const { committed_at } of commits) {
    const { day, hour } = weekdayHour(committed_at, tz);
    const key = `${day}-${hour}`;
    hourMap.set(key, (hourMap.get(key) ?? 0) + 1);
  }
  return [...hourMap.entries()].map(([key, count]) => {
    const [day, hour] = key.split("-").map(Number);
    return { day, hour, count };
  });
}

/** Top repos by commits in range plus per-repo health, in one pass over commits and issues. */
export async function loadRepoLists(ownRepos: RepoRow[], sinceDate: string): Promise<{ repoList: DashboardData["repoList"]; repoHealth: DashboardData["repoHealth"] }> {
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
  const repoList = ownRepos
    .map((r, i) => ({ name: r.name, full_name: r.full_name, language: r.language, stars: r.stars, forks: r.forks, commit_count: rangeCounts[i] }))
    .sort((a, b) => b.commit_count - a.commit_count)
    .slice(0, 10);
  const repoHealth = ownRepos.map((r) => {
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
  return { repoList, repoHealth };
}
