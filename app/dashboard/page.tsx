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
import { calculateStreaks } from "@/lib/streak";

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
    .select("id, last_synced_at")
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
  let thisWeek = 0;
  let lastWeek = 0;
  let streakData = { currentStreak: 0, longestStreak: 0, totalActiveDays: 0 };
  let codeStats = { linesAdded: 0, linesDeleted: 0, totalCommits: 0, mergedPRs: 0, openIssues: 0, closedIssues: 0 };

  if (hasSynced && dbUser) {
    const sinceDate = new Date(
      Date.now() - Number(dateRange) * 24 * 60 * 60 * 1000
    ).toISOString().slice(0, 10);

    const { data: repoRows } = await supabaseAdmin
      .from("repositories")
      .select("id, name, full_name, language, stars, forks, is_fork")
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
          .select("committed_at")
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
  }

  const lastSynced = dbUser?.last_synced_at
    ? new Date(dbUser.last_synced_at).toLocaleString("tr-TR")
    : null;

  return (
    <div>
      {/* Başlık */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 sm:text-2xl">
            Merhaba, {session?.user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {lastSynced ? `Son senkronizasyon: ${lastSynced}` : "Senkronizasyonu başlat."}
          </p>
        </div>
        {hasSynced && (
          <div className="flex items-center gap-3">
            <Suspense>
              <Filters hideForks={hideForks} dateRange={dateRange} />
            </Suspense>
            <SyncButton label="Yenile" />
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
          {/* Özet kartlar — mobilde 1 kolon, tablette 3 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Toplam Repo" value={stats.repoCount} />
            <StatCard label={`Commit (${dateRange === "365" ? "1 yıl" : dateRange + " gün"})`} value={stats.commitCount} />
            <StatCard label="Kullanılan Dil" value={stats.languageCount} />
          </div>

          {/* Streak kartı */}
          <StreakCard {...streakData} />

          {/* Kod & Katkı istatistikleri */}
          <CodeStats {...codeStats} />

          {/* Bu hafta vs geçen hafta */}
          <WeekCompare thisWeek={thisWeek} lastWeek={lastWeek} />

          {/* Heatmap — yatay scroll mobilde */}
          <ContributionHeatmap data={heatmapData} />

          {/* Aktivite + Dil — mobilde alt alta */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="mb-4 text-sm font-medium text-zinc-400">
                Son {dateRange === "365" ? "30" : dateRange} Gün Commit Aktivitesi
              </h2>
              <ActivityBar data={recentActivity} />
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="mb-4 text-sm font-medium text-zinc-400">Dil Dağılımı</h2>
              <LanguageList languages={topLanguages} />
            </div>
          </div>

          {/* Saat heatmap */}
          <HourHeatmap data={hourData} />

          {/* Repo listesi */}
          <RepoList repos={repoListData} />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-zinc-100">{value.toLocaleString("tr-TR")}</p>
    </div>
  );
}

function ActivityBar({ data }: { data: { date: string; commit_count: number }[] }) {
  if (data.length === 0) return <p className="text-sm text-zinc-600">Veri yok</p>;
  const max = Math.max(...data.map((d) => d.commit_count));
  return (
    <div className="flex h-24 items-end gap-1">
      {data.map((d) => {
        const height = max > 0 ? Math.max((d.commit_count / max) * 100, 4) : 4;
        return (
          <div key={d.date} title={`${d.date}: ${d.commit_count} commit`}
            className="flex-1 rounded-sm bg-emerald-500 opacity-80 transition-opacity hover:opacity-100"
            style={{ height: `${height}%` }}
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
  if (languages.length === 0) return <p className="text-sm text-zinc-600">Veri yok</p>;
  const total = languages.reduce((sum, l) => sum + l.bytes, 0);
  return (
    <div className="space-y-3">
      {languages.map(({ language, bytes }) => {
        const pct = total > 0 ? ((bytes / total) * 100).toFixed(1) : "0";
        const color = LANG_COLORS[language] ?? "#6b7280";
        return (
          <div key={language}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-zinc-300">{language}</span>
              <span className="text-zinc-500">{pct}%</span>
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
