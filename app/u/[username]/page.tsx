import { supabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Image from "next/image";
import ContributionHeatmap from "@/app/dashboard/contribution-heatmap";
import { calculateStreaks } from "@/lib/streak";
import { ThemeProvider } from "@/components/theme-provider";
import { THEMES, isValidTheme, DEFAULT_THEME } from "@/lib/themes";
import { WIDGET_KEYS, type WidgetKey } from "@/lib/widgets";
import type { Metadata } from "next";

type Props = { params: Promise<{ username: string }> };

type Widgets = {
  heatmap: boolean;
  languages: boolean;
  repos: boolean;
  streak: boolean;
};

const DEFAULT_WIDGETS: Widgets = { heatmap: true, languages: true, repos: true, streak: true };
const DEFAULT_ORDER: WidgetKey[] = ["streak", "heatmap", "languages", "repos"];

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
  Rust: "#dea584", Go: "#00ADD8", CSS: "#563d7c", HTML: "#e34c26",
  Java: "#b07219", "C++": "#f34b7d", "C#": "#178600", C: "#555555",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return {
    title: `${username} — Dev Analytics`,
    description: `${username} kullanıcısının GitHub aktivite istatistikleri.`,
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, username, name, avatar_url, last_synced_at, bio, pinned_repo_name, public_widgets, widget_order, theme_accent, currently_working_on, yearly_goal, tech_tags")
    .eq("username", username)
    .single();

  if (!user || !user.last_synced_at) notFound();

  const widgets: Widgets =
    user.public_widgets && typeof user.public_widgets === "object"
      ? { ...DEFAULT_WIDGETS, ...(user.public_widgets as Partial<Widgets>) }
      : DEFAULT_WIDGETS;

  const rawOrder = user.widget_order;
  const widgetOrder: WidgetKey[] =
    Array.isArray(rawOrder) && rawOrder.every((k: unknown) => WIDGET_KEYS.includes(k as WidgetKey))
      ? (rawOrder as WidgetKey[])
      : DEFAULT_ORDER;

  const accent = isValidTheme(user.theme_accent) ? user.theme_accent : DEFAULT_THEME;
  const theme = THEMES[accent];

  const techTags: string[] = Array.isArray(user.tech_tags) ? user.tech_tags : [];

  // Repolar
  const { data: repoRows } = await supabaseAdmin
    .from("repositories")
    .select("id, name, full_name, language, stars, forks, is_fork")
    .eq("user_id", user.id);

  const ids = (repoRows ?? []).map((r) => r.id);

  const [reposRes, commitsRes, langsRes, heatmapRes] = await Promise.all([
    supabaseAdmin.from("repositories").select("count", { count: "exact", head: true }).eq("user_id", user.id),
    supabaseAdmin.from("commits").select("count", { count: "exact", head: true }).in("repo_id", ids),
    supabaseAdmin.from("repo_languages").select("language, bytes").in("repo_id", ids),
    supabaseAdmin
      .from("daily_stats")
      .select("date, commit_count")
      .eq("user_id", user.id)
      .gte("date", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
      .order("date", { ascending: true }),
  ]);

  const langMap = new Map<string, number>();
  for (const row of langsRes.data ?? []) {
    langMap.set(row.language, (langMap.get(row.language) ?? 0) + row.bytes);
  }
  const topLanguages = Array.from(langMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const totalBytes = topLanguages.reduce((s, [, b]) => s + b, 0);

  const stats = {
    repoCount: reposRes.count ?? 0,
    commitCount: commitsRes.count ?? 0,
    languageCount: langMap.size,
  };

  const heatmapData = heatmapRes.data ?? [];
  const activeDates = heatmapData.filter((d) => d.commit_count > 0).map((d) => d.date);
  const { currentStreak, longestStreak } = calculateStreaks(activeDates);

  const pinnedRepo = user.pinned_repo_name
    ? (repoRows ?? []).find((r) => r.name === user.pinned_repo_name) ?? null
    : null;

  const topRepos = (repoRows ?? [])
    .filter((r) => !r.is_fork)
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 6);

  // Widget render map — sıralı olarak render edilecek
  function renderWidget(key: WidgetKey) {
    if (!widgets[key]) return null;

    switch (key) {
      case "streak":
        if (currentStreak === 0 && longestStreak === 0) return null;
        return (
          <div key="streak" className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="text-xs text-zinc-500">Mevcut Streak</p>
              <p className="mt-1.5 text-3xl font-semibold" style={{ color: theme.accent }}>
                {currentStreak} <span className="text-base font-normal text-zinc-500">gün</span>
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
              <p className="text-xs text-zinc-500">En Uzun Streak</p>
              <p className="mt-1.5 text-3xl font-semibold text-zinc-100">
                {longestStreak} <span className="text-base font-normal text-zinc-500">gün</span>
              </p>
            </div>
          </div>
        );

      case "heatmap":
        return (
          <ContributionHeatmap key="heatmap" data={heatmapData} accentShades={theme.shades} />
        );

      case "languages":
        if (topLanguages.length === 0) return null;
        return (
          <div key="languages" className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="mb-4 text-sm font-medium text-zinc-400">Dil Dağılımı</h2>
            <div className="space-y-3">
              {topLanguages.map(([lang, bytes]) => {
                const pct = totalBytes > 0 ? ((bytes / totalBytes) * 100).toFixed(1) : "0";
                const color = LANG_COLORS[lang] ?? "#6b7280";
                return (
                  <div key={lang}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-zinc-300">{lang}</span>
                      <span className="text-zinc-500">{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case "repos":
        if (topRepos.length === 0) return null;
        return (
          <div key="repos" className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="mb-4 text-sm font-medium text-zinc-400">En Yıldızlı Repolar</h2>
            <div className="space-y-3">
              {topRepos.map((repo) => (
                <a
                  key={repo.name}
                  href={`https://github.com/${repo.full_name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-zinc-800"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {repo.language && (
                      <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: LANG_COLORS[repo.language] ?? "#6b7280" }} />
                    )}
                    <span className="truncate text-sm text-zinc-300">{repo.name}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 text-xs text-zinc-600">
                    <span>★ {repo.stars}</span>
                    <span>⑂ {repo.forks}</span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <ThemeProvider accent={accent}>
      <div className="min-h-screen bg-zinc-950">
        {/* Header */}
        <header className="border-b border-zinc-800 bg-zinc-950 px-6 py-4">
          <div className="mx-auto flex max-w-4xl items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-800">
                <svg className="h-4 w-4 text-zinc-100" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </div>
              <span className="text-sm font-medium text-zinc-400">Dev Analytics</span>
            </div>
            <a
              href={`https://github.com/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-zinc-600 transition-colors hover:text-zinc-400"
            >
              github.com/{username} ↗
            </a>
          </div>
        </header>

        <main className="mx-auto max-w-4xl px-6 py-10 space-y-6">

          {/* Profil başlığı */}
          <div className="flex items-start gap-5">
            {user.avatar_url && (
              <Image
                src={user.avatar_url}
                alt={username}
                width={72}
                height={72}
                className="rounded-full ring-2 ring-zinc-800 shrink-0"
              />
            )}
            <div className="space-y-1 min-w-0">
              <h1 className="text-2xl font-semibold text-zinc-100">{user.name ?? username}</h1>
              <p className="text-sm text-zinc-500">@{username}</p>
              {user.bio && <p className="text-sm text-zinc-400 pt-1">{user.bio}</p>}
            </div>
          </div>

          {/* Özet kartlar */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Toplam Repo", value: stats.repoCount },
              { label: "Commit (1 yıl)", value: stats.commitCount },
              { label: "Kullanılan Dil", value: stats.languageCount },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <p className="text-xs text-zinc-500">{label}</p>
                <p className="mt-1.5 text-3xl font-semibold text-zinc-100">
                  {value.toLocaleString("tr-TR")}
                </p>
              </div>
            ))}
          </div>

          {/* F.3 — Özel bölümler */}
          {(user.currently_working_on || user.yearly_goal || techTags.length > 0) && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {user.currently_working_on && (
                <div
                  className="rounded-2xl border p-5 space-y-2"
                  style={{ borderColor: theme.accentBorder, backgroundColor: theme.accentBg }}
                >
                  <p className="text-xs text-zinc-500">Şu an üzerinde</p>
                  <p className="text-sm text-zinc-200 leading-relaxed">{user.currently_working_on}</p>
                </div>
              )}
              {user.yearly_goal && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-2">
                  <p className="text-xs text-zinc-500">Bu yıl hedefim</p>
                  <p className="text-sm text-zinc-200 leading-relaxed">{user.yearly_goal}</p>
                </div>
              )}
              {techTags.length > 0 && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 space-y-3">
                  <p className="text-xs text-zinc-500">Favori araçlar</p>
                  <div className="flex flex-wrap gap-1.5">
                    {techTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border px-2.5 py-0.5 text-xs"
                        style={{ borderColor: theme.accentBorder, color: theme.accent, backgroundColor: theme.accentBg }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Pinned repo */}
          {pinnedRepo && (
            <div>
              <h2 className="mb-3 text-xs font-medium text-zinc-500 uppercase tracking-wider">Öne Çıkan Repo</h2>
              <a
                href={`https://github.com/${pinnedRepo.full_name}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl border bg-zinc-900 p-5 transition-colors hover:border-zinc-600"
                style={{ borderColor: theme.accentBorder }}
              >
                <div className="flex items-center gap-2">
                  {pinnedRepo.language && (
                    <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: LANG_COLORS[pinnedRepo.language] ?? "#6b7280" }} />
                  )}
                  <span className="text-sm font-medium" style={{ color: theme.accent }}>{pinnedRepo.name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-zinc-600 mt-2">
                  <span>★ {pinnedRepo.stars}</span>
                  <span>⑂ {pinnedRepo.forks}</span>
                  {pinnedRepo.language && <span>{pinnedRepo.language}</span>}
                </div>
              </a>
            </div>
          )}

          {/* Widgetlar — kullanıcının belirlediği sırada */}
          {widgetOrder.map((key) => renderWidget(key))}

          {/* Footer */}
          <p className="text-center text-xs text-zinc-700 pt-4">
            Bu profil{" "}
            <a href="/" className="text-zinc-500 hover:text-zinc-400 transition-colors">
              Dev Analytics Dashboard
            </a>{" "}
            ile oluşturuldu
          </p>
        </main>
      </div>
    </ThemeProvider>
  );
}
