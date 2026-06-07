import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";

type Props = { params: Promise<{ reponame: string }> };

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
  Rust: "#dea584", Go: "#00ADD8", CSS: "#563d7c", HTML: "#e34c26",
  Java: "#b07219", "C++": "#f34b7d", "C#": "#178600", C: "#555555",
};

export default async function RepoDetailPage({ params }: Props) {
  const { reponame } = await params;
  const session = await auth();

  const { data: dbUser } = await supabaseAdmin
    .from("users").select("id").eq("username", session?.user?.username ?? "").single();

  if (!dbUser) notFound();

  const { data: repo } = await supabaseAdmin
    .from("repositories")
    .select("id, name, full_name, description, language, stars, forks, created_at")
    .eq("user_id", dbUser.id)
    .eq("name", reponame)
    .single();

  if (!repo) notFound();

  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

  const [commitsRes, langsRes, dailyRes, hourRes] = await Promise.all([
    supabaseAdmin
      .from("commits")
      .select("sha, message, committed_at, additions, deletions")
      .eq("repo_id", repo.id)
      .gte("committed_at", oneYearAgo)
      .order("committed_at", { ascending: false })
      .limit(10),

    supabaseAdmin
      .from("repo_languages")
      .select("language, bytes")
      .eq("repo_id", repo.id)
      .order("bytes", { ascending: false }),

    // Günlük commit sayısı (son 30 gün)
    supabaseAdmin
      .from("commits")
      .select("committed_at")
      .eq("repo_id", repo.id)
      .gte("committed_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),

    // Saat dağılımı
    supabaseAdmin
      .from("commits")
      .select("committed_at")
      .eq("repo_id", repo.id)
      .gte("committed_at", oneYearAgo),
  ]);

  const commits = commitsRes.data ?? [];
  const langs = langsRes.data ?? [];
  const totalBytes = langs.reduce((s, l) => s + l.bytes, 0);

  // Günlük aktivite (son 30 gün)
  const dailyMap = new Map<string, number>();
  for (const { committed_at } of dailyRes.data ?? []) {
    const date = committed_at.slice(0, 10);
    dailyMap.set(date, (dailyMap.get(date) ?? 0) + 1);
  }
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86400000);
    const date = d.toISOString().slice(0, 10);
    return { date, count: dailyMap.get(date) ?? 0 };
  });
  const maxDay = Math.max(...last30.map((d) => d.count), 1);

  // Saate göre dağılım
  const hourMap = new Map<number, number>();
  for (const { committed_at } of hourRes.data ?? []) {
    const h = new Date(committed_at).getHours();
    hourMap.set(h, (hourMap.get(h) ?? 0) + 1);
  }
  const maxHour = Math.max(...Array.from(hourMap.values()), 1);

  const totalCommits = (hourRes.data ?? []).length;
  const totalAdded = commits.reduce((s, c) => s + (c.additions ?? 0), 0);
  const totalDeleted = commits.reduce((s, c) => s + (c.deletions ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Geri */}
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Dashboard
      </Link>

      {/* Repo başlık */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            {repo.language && (
              <div className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: LANG_COLORS[repo.language] ?? "#6b7280" }} />
            )}
            <h1 className="text-2xl font-semibold text-zinc-100">{repo.name}</h1>
          </div>
          {repo.description && (
            <p className="mt-1 text-sm text-zinc-500">{repo.description}</p>
          )}
        </div>
        <a
          href={`https://github.com/${repo.full_name}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
        >
          GitHub'da Aç ↗
        </a>
      </div>

      {/* Özet kartlar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Toplam Commit (1 yıl)" value={totalCommits} />
        <StatCard label="Eklenen Satır" value={`+${totalAdded}`} color="text-emerald-400" />
        <StatCard label="Silinen Satır" value={`-${totalDeleted}`} color="text-red-400" />
        <StatCard label="⭐ Star" value={repo.stars} />
      </div>

      {/* Günlük aktivite + Saat dağılımı */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Son 30 gün */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-sm font-medium text-zinc-400">Son 30 Gün Aktivite</h2>
          <div className="flex h-20 items-end gap-1">
            {last30.map((d) => (
              <div
                key={d.date}
                title={`${d.date}: ${d.count} commit`}
                className="flex-1 rounded-sm bg-emerald-500 opacity-80 hover:opacity-100 transition-opacity"
                style={{ height: `${Math.max((d.count / maxDay) * 100, d.count > 0 ? 8 : 2)}%` }}
              />
            ))}
          </div>
        </div>

        {/* Saat dağılımı */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-sm font-medium text-zinc-400">Saate Göre Commit</h2>
          <div className="flex h-20 items-end gap-0.5">
            {Array.from({ length: 24 }, (_, h) => {
              const count = hourMap.get(h) ?? 0;
              return (
                <div
                  key={h}
                  title={`${String(h).padStart(2, "0")}:00 — ${count} commit`}
                  className="flex-1 rounded-sm bg-blue-500 opacity-80 hover:opacity-100 transition-opacity"
                  style={{ height: `${Math.max((count / maxHour) * 100, count > 0 ? 6 : 2)}%` }}
                />
              );
            })}
          </div>
          <div className="mt-1 flex justify-between text-xs text-zinc-700">
            <span>00:00</span>
            <span>12:00</span>
            <span>23:00</span>
          </div>
        </div>
      </div>

      {/* Dil dağılımı + Son commitler */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Dil dağılımı */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-sm font-medium text-zinc-400">Dil Dağılımı</h2>
          {langs.length === 0 ? (
            <p className="text-sm text-zinc-600">Veri yok</p>
          ) : (
            <div className="space-y-3">
              {langs.map(({ language, bytes }) => {
                const pct = totalBytes > 0 ? ((bytes / totalBytes) * 100).toFixed(1) : "0";
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
          )}
        </div>

        {/* Son commitler */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="mb-4 text-sm font-medium text-zinc-400">Son Commitler</h2>
          {commits.length === 0 ? (
            <p className="text-sm text-zinc-600">Commit bulunamadı</p>
          ) : (
            <div className="space-y-2.5">
              {commits.map((c) => (
                <a
                  key={c.sha}
                  href={`https://github.com/${repo.full_name}/commit/${c.sha}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg px-3 py-2.5 transition-colors hover:bg-zinc-800"
                >
                  <p className="truncate text-sm text-zinc-300">{c.message}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-zinc-600">
                    <span>{new Date(c.committed_at).toLocaleDateString("tr-TR")}</span>
                    {(c.additions > 0 || c.deletions > 0) && (
                      <>
                        <span className="text-emerald-600">+{c.additions}</span>
                        <span className="text-red-600">-{c.deletions}</span>
                      </>
                    )}
                    <span className="font-mono">{c.sha.slice(0, 7)}</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = "text-zinc-100" }: {
  label: string; value: number | string; color?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${color}`}>
        {typeof value === "number" ? value.toLocaleString("tr-TR") : value}
      </p>
    </div>
  );
}
