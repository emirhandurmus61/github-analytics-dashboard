import { supabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { calculateStreaks } from "@/lib/streak";
import { ThemeProvider } from "@/components/theme-provider";
import { THEMES, isValidTheme, DEFAULT_THEME } from "@/lib/themes";
import { WIDGET_KEYS, type WidgetKey } from "@/lib/widgets";
import { calcBadges } from "@/lib/badges";
import type { Metadata } from "next";
import ProfileClient from "./profile-client";
import { recordProfileView } from "./actions";
import { auth } from "@/lib/auth";

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
    description: `${username} kullanicisinin GitHub aktivite istatistikleri.`,
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;

  const session = await auth();
  const isOwner = session?.user?.username === username;

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, username, name, avatar_url, last_synced_at, bio, pinned_repo_name, public_widgets, widget_order, theme_accent, currently_working_on, yearly_goal, tech_tags")
    .eq("username", username)
    .single();

  if (!user || !user.last_synced_at) notFound();

  // Yeni kolonlar (pinned_repos, profile_readme, social_*) henuz migration yapilmamis olabilir — ayri sorgula
  let pinnedReposDb: string[] = [];
  let profileReadmeDb: string | null = null;
  let socialLinks: { twitter: string | null; linkedin: string | null; website: string | null; discord: string | null } = {
    twitter: null, linkedin: null, website: null, discord: null,
  };
  try {
    const { data: extra } = await supabaseAdmin
      .from("users")
      .select("pinned_repos, profile_readme, social_twitter, social_linkedin, social_website, social_discord")
      .eq("id", user.id)
      .single();
    if (extra) {
      pinnedReposDb = Array.isArray(extra.pinned_repos) ? extra.pinned_repos : [];
      profileReadmeDb = extra.profile_readme ?? null;
      socialLinks = {
        twitter: extra.social_twitter ?? null,
        linkedin: extra.social_linkedin ?? null,
        website: extra.social_website ?? null,
        discord: extra.social_discord ?? null,
      };
    }
  } catch {
    // Kolonlar henuz yok — sessizce devam et
  }

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

  // Repos
  const { data: repoRows } = await supabaseAdmin
    .from("repositories")
    .select("id, name, full_name, description, language, stars, forks, is_fork")
    .eq("user_id", user.id);

  const ids = (repoRows ?? []).map((r) => r.id);
  const ownIds = (repoRows ?? []).filter((r) => !r.is_fork).map((r) => r.id);

  const [reposRes, commitsRes, langsRes, heatmapRes, badgeCommitsRes] = await Promise.all([
    supabaseAdmin.from("repositories").select("count", { count: "exact", head: true }).eq("user_id", user.id),
    supabaseAdmin.from("commits").select("count", { count: "exact", head: true }).in("repo_id", ids),
    supabaseAdmin.from("repo_languages").select("language, bytes").in("repo_id", ids),
    supabaseAdmin
      .from("daily_stats")
      .select("date, commit_count")
      .eq("user_id", user.id)
      .gte("date", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
      .order("date", { ascending: true }),
    supabaseAdmin
      .from("commits")
      .select("committed_at, repo_id, deletions")
      .in("repo_id", ownIds)
      .gte("committed_at", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  // Languages
  const langMap = new Map<string, number>();
  for (const row of langsRes.data ?? []) {
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
  const heatmapData = heatmapRes.data ?? [];
  const activeDates = heatmapData.filter((d) => d.commit_count > 0).map((d) => d.date);
  const { currentStreak, longestStreak, totalActiveDays } = calculateStreaks(activeDates);

  const stats = {
    repoCount: reposRes.count ?? 0,
    commitCount: commitsRes.count ?? 0,
    languageCount: langMap.size,
    activeDays: totalActiveDays,
  };

  // Badges
  const repoForkMap = new Map<string, boolean>(
    (repoRows ?? []).map((r) => [r.id, r.is_fork])
  );
  const badgeCommits = badgeCommitsRes.data ?? [];
  const earnedBadges = calcBadges({
    hasSynced: true,
    longestStreak,
    commitTimestamps: badgeCommits.map((c) => c.committed_at),
    repoForkMap,
    commitRepoIds: badgeCommits.map((c) => c.repo_id),
    commitDeletions: badgeCommits.map((c) => c.deletions ?? 0),
    languageCount: langMap.size,
  }).filter((b) => b.earned);

  // Pinned repos (new array field, fallback to single pinned_repo_name)
  const pinnedNames: string[] = pinnedReposDb.length > 0
    ? pinnedReposDb.slice(0, 3)
    : (user.pinned_repo_name ? [user.pinned_repo_name] : []);

  const pinnedReposData = pinnedNames
    .map((n) => (repoRows ?? []).find((r) => r.name === n))
    .filter((r): r is NonNullable<typeof r> => r != null)
    .map((r) => ({ name: r.name, full_name: r.full_name, language: r.language, stars: r.stars, forks: r.forks, description: r.description }));

  // Top repos
  const pinnedSet = new Set(pinnedNames);
  const topRepos = (repoRows ?? [])
    .filter((r) => !r.is_fork && !pinnedSet.has(r.name))
    .sort((a, b) => b.stars - a.stars)
    .slice(0, 6)
    .map((r) => ({ name: r.name, full_name: r.full_name, language: r.language, stars: r.stars, forks: r.forks, description: r.description }));

  return (
    <ThemeProvider accent={accent}>
      <ProfileClient
        username={username}
        userId={user.id}
        isOwner={isOwner}
        name={user.name ?? username}
        avatarUrl={user.avatar_url}
        bio={user.bio}
        profileReadme={profileReadmeDb}
        currentlyWorkingOn={user.currently_working_on}
        yearlyGoal={user.yearly_goal}
        techTags={techTags}
        stats={stats}
        currentStreak={currentStreak}
        longestStreak={longestStreak}
        earnedBadges={earnedBadges}
        pinnedRepos={pinnedReposData}
        topRepos={topRepos}
        topLanguages={topLanguages}
        heatmapData={heatmapData}
        widgetOrder={widgetOrder}
        widgets={widgets}
        socialLinks={socialLinks}
        recordView={recordProfileView}
      />
    </ThemeProvider>
  );
}
