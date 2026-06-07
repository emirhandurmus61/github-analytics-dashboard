import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import SyncButton from "./sync-button";
import ContributionHeatmap from "./contribution-heatmap";

export default async function DashboardPage() {
  const session = await auth();

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

  if (hasSynced && dbUser) {
    // Repo id'lerini bir kez çek
    const { data: repoIds } = await supabaseAdmin
      .from("repositories")
      .select("id")
      .eq("user_id", dbUser.id);

    const ids = repoIds?.map((r) => r.id) ?? [];

    const [reposRes, commitsRes, langsRes, activityRes, heatmapRes] = await Promise.all([
      supabaseAdmin
        .from("repositories")
        .select("count", { count: "exact", head: true })
        .eq("user_id", dbUser.id),

      supabaseAdmin
        .from("commits")
        .select("count", { count: "exact", head: true })
        .in("repo_id", ids),

      supabaseAdmin
        .from("repo_languages")
        .select("language, bytes")
        .in("repo_id", ids),

      supabaseAdmin
        .from("daily_stats")
        .select("date, commit_count")
        .eq("user_id", dbUser.id)
        .order("date", { ascending: false })
        .limit(30),

      // Heatmap için son 1 yıl
      supabaseAdmin
        .from("daily_stats")
        .select("date, commit_count")
        .eq("user_id", dbUser.id)
        .gte("date", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
        .order("date", { ascending: true }),
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
      repoCount: reposRes.count ?? 0,
      commitCount: commitsRes.count ?? 0,
      languageCount: langMap.size,
    };

    recentActivity = (activityRes.data ?? []).reverse();
    heatmapData = heatmapRes.data ?? [];
  }

  const lastSynced = dbUser?.last_synced_at
    ? new Date(dbUser.last_synced_at).toLocaleString("tr-TR")
    : null;

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">
            Merhaba, {session?.user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {lastSynced
              ? `Son senkronizasyon: ${lastSynced}`
              : "GitHub verilerini çekmek için senkronizasyonu başlat."}
          </p>
        </div>
        {hasSynced && (
          <div className="shrink-0">
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
        <div className="space-y-6">
          {/* Özet kartlar */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Toplam Repo" value={stats.repoCount} />
            <StatCard label="Toplam Commit (1 yıl)" value={stats.commitCount} />
            <StatCard label="Kullanılan Dil" value={stats.languageCount} />
          </div>

          {/* Contribution heatmap */}
          <ContributionHeatmap data={heatmapData} />

          {/* Aktivite ve diller */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="mb-4 text-sm font-medium text-zinc-400">Son 30 Gün Commit Aktivitesi</h2>
              <ActivityBar data={recentActivity} />
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="mb-4 text-sm font-medium text-zinc-400">Dil Dağılımı</h2>
              <LanguageList languages={topLanguages} />
            </div>
          </div>
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
          <div
            key={d.date}
            title={`${d.date}: ${d.commit_count} commit`}
            className="flex-1 rounded-sm bg-emerald-500 opacity-80 transition-opacity hover:opacity-100"
            style={{ height: `${height}%` }}
          />
        );
      })}
    </div>
  );
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  CSS: "#563d7c",
  HTML: "#e34c26",
  Java: "#b07219",
  "C++": "#f34b7d",
  "C#": "#178600",
  C: "#555555",
  Ruby: "#701516",
  Swift: "#F05138",
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
