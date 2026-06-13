import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import { calcRepoHealth, HEALTH_COLORS } from "@/lib/repo-health";
import RepoDetailClient from "./repo-detail-client";

type Props = { params: Promise<{ reponame: string }> };

export default async function RepoDetailPage({ params }: Props) {
  const { reponame } = await params;
  const session = await auth();

  const { data: dbUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("username", session?.user?.username ?? "")
    .single();

  if (!dbUser) notFound();

  const { data: repo } = await supabaseAdmin
    .from("repositories")
    .select("id, name, full_name, description, language, stars, forks, created_at, is_archived")
    .eq("user_id", dbUser.id)
    .eq("name", reponame)
    .single();

  if (!repo) notFound();

  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const [allCommitsRes, langsRes, prsRes, issuesRes] = await Promise.all([
    // Tüm commitler — heatmap, scatter, timeline için
    supabaseAdmin
      .from("commits")
      .select("sha, message, committed_at, additions, deletions")
      .eq("repo_id", repo.id)
      .gte("committed_at", oneYearAgo)
      .order("committed_at", { ascending: false }),

    supabaseAdmin
      .from("repo_languages")
      .select("language, bytes")
      .eq("repo_id", repo.id)
      .order("bytes", { ascending: false }),

    supabaseAdmin
      .from("pull_requests")
      .select("github_id, title, state, merged, created_at, merged_at, closed_at, additions, deletions, changed_files")
      .eq("repo_id", repo.id)
      .order("created_at", { ascending: false }),

    supabaseAdmin
      .from("issues")
      .select("github_id, title, state, created_at, closed_at")
      .eq("repo_id", repo.id)
      .order("created_at", { ascending: false }),
  ]);

  const commits = allCommitsRes.data ?? [];
  const langs = langsRes.data ?? [];
  const prs = prsRes.data ?? [];
  const issues = issuesRes.data ?? [];

  // ── 52 haftalık heatmap ──
  const commitDateMap = new Map<string, number>();
  for (const c of commits) {
    const d = c.committed_at.slice(0, 10);
    commitDateMap.set(d, (commitDateMap.get(d) ?? 0) + 1);
  }
  const today = new Date();
  const dow = (today.getDay() + 6) % 7; // 0=Mon
  const heatmapStart = new Date(today);
  heatmapStart.setDate(today.getDate() - dow - 52 * 7 + 1);
  const heatmapDays: { date: string; count: number }[] = [];
  for (let i = 0; i < 52 * 7 + dow + 1; i++) {
    const d = new Date(heatmapStart);
    d.setDate(heatmapStart.getDate() + i);
    const date = d.toISOString().slice(0, 10);
    heatmapDays.push({ date, count: commitDateMap.get(date) ?? 0 });
  }
  const heatmapMax = Math.max(...heatmapDays.map((d) => d.count), 1);

  // ── Scatter: tarih × additions (top 200) ──
  const scatterData = commits
    .filter((c) => (c.additions ?? 0) + (c.deletions ?? 0) > 0)
    .slice(0, 200)
    .map((c) => ({
      date: c.committed_at.slice(0, 10),
      additions: c.additions ?? 0,
      deletions: c.deletions ?? 0,
      message: c.message.slice(0, 60),
      sha: c.sha.slice(0, 7),
    }));

  // ── Saat dağılımı ──
  const hourMap = new Map<number, number>();
  for (const c of commits) {
    const h = new Date(c.committed_at).getHours();
    hourMap.set(h, (hourMap.get(h) ?? 0) + 1);
  }

  // ── PR metrikleri ──
  const mergedPrs = prs.filter((p) => p.merged && p.merged_at);
  const avgMergeHours = mergedPrs.length > 0
    ? Math.round(
        mergedPrs.reduce((s, p) => {
          const open = new Date(p.created_at).getTime();
          const close = new Date(p.merged_at!).getTime();
          return s + (close - open) / 3600000;
        }, 0) / mergedPrs.length
      )
    : null;

  // ── Issue trend (son 12 ay, açık/kapalı) ──
  const MONTH_LABELS = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
  const issueTrend = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - 11 + i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = `${MONTH_LABELS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
    const opened = issues.filter((is) => is.created_at.startsWith(ym)).length;
    const closed = issues.filter((is) => is.closed_at?.startsWith(ym)).length;
    return { label, opened, closed };
  });

  // ── Büyük commit timeline (top 10) ──
  const bigCommits = [...commits]
    .filter((c) => (c.additions ?? 0) + (c.deletions ?? 0) > 0)
    .sort((a, b) => ((b.additions ?? 0) + (b.deletions ?? 0)) - ((a.additions ?? 0) + (a.deletions ?? 0)))
    .slice(0, 10)
    .map((c) => ({
      sha: c.sha.slice(0, 7),
      message: c.message.split("\n")[0].slice(0, 80),
      date: c.committed_at.slice(0, 10),
      additions: c.additions ?? 0,
      deletions: c.deletions ?? 0,
    }));

  // ── Repo sağlık skoru ──
  const lastCommitDate = commits[0]?.committed_at ?? null;
  const commitCount90d = commits.filter((c) => c.committed_at >= ninetyDaysAgo).length;
  const openIssues = issues.filter((i) => i.state === "open").length;
  const health = calcRepoHealth({
    lastCommitDate,
    commitCount90d,
    stars: repo.stars,
    forks: repo.forks,
    openIssues,
    totalIssues: issues.length,
    isArchived: (repo as { is_archived?: boolean }).is_archived ?? false,
  });

  // ── Özet sayılar ──
  const totalAdded = commits.reduce((s, c) => s + (c.additions ?? 0), 0);
  const totalDeleted = commits.reduce((s, c) => s + (c.deletions ?? 0), 0);
  const totalBytes = langs.reduce((s, l) => s + l.bytes, 0);

  return (
    <RepoDetailClient
      repo={{
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        language: repo.language,
        stars: repo.stars,
        forks: repo.forks,
        created_at: repo.created_at,
      }}
      commits={{ total: commits.length, totalAdded, totalDeleted }}
      langs={langs.map((l) => ({ language: l.language, bytes: l.bytes, pct: totalBytes > 0 ? (l.bytes / totalBytes) * 100 : 0 }))}
      heatmapDays={heatmapDays}
      heatmapMax={heatmapMax}
      scatterData={scatterData}
      hourMap={Array.from({ length: 24 }, (_, h) => hourMap.get(h) ?? 0)}
      prs={{
        total: prs.length,
        merged: mergedPrs.length,
        open: prs.filter((p) => p.state === "open").length,
        avgMergeHours,
      }}
      issueTrend={issueTrend}
      bigCommits={bigCommits}
      health={health}
      healthColor={HEALTH_COLORS[health.status]}
      username={session?.user?.username ?? ""}
    />
  );
}
