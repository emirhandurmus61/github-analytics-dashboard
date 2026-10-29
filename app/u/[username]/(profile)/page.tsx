import { supabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { ThemeProvider } from "@/components/theme-provider";
import { isValidTheme, DEFAULT_THEME } from "@/lib/themes";
import { WIDGET_KEYS, type WidgetKey } from "@/lib/widgets";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import type { Language } from "@/lib/i18n";
import ProfileClient from "../profile-client";
import { buildProfileStats } from "./profile-stats";
import { recordProfileView } from "../actions";
import { auth } from "@/lib/auth";
import { daysAgoISO } from "@/lib/ui/format";
import { getRequestTz, getStoredTz } from "@/lib/tz-server";

type Props = { params: Promise<{ username: string }> };

type Widgets = {
  heatmap: boolean;
  languages: boolean;
  repos: boolean;
  streak: boolean;
};

const DEFAULT_WIDGETS: Widgets = { heatmap: true, languages: true, repos: true, streak: true };
const DEFAULT_ORDER: WidgetKey[] = ["streak", "heatmap", "languages", "repos"];


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const cookieStore = await cookies();
  const lang = (cookieStore.get("devboard_lang")?.value as Language) || "tr";
  return {
    title: `${username} — Devboard`,
    description: lang === "en"
      ? `GitHub developer analytics and activity for ${username}.`
      : `${username} kullanıcısının GitHub aktivite istatistikleri.`,
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
  const oneYearAgo = daysAgoISO(365);
  // The owner's own clock decides "today" for their streak; fall back to the viewer's when unset.
  const ownerTz = await getStoredTz(user.id);
  const tz = ownerTz !== "UTC" ? ownerTz : await getRequestTz();

  // Independent of each other, so fetch together instead of one after another.
  const extraP = supabaseAdmin
    .from("users")
    .select("pinned_repos, profile_readme, github_readme, readme_source, social_twitter, social_linkedin, social_website, social_discord")
    .eq("id", user.id)
    .single();
  const repoP = supabaseAdmin
    .from("repositories")
    .select("id, name, full_name, description, language, stars, forks, is_fork")
    .eq("user_id", user.id);
  const heatmapP = supabaseAdmin
    .from("daily_stats")
    .select("date, commit_count")
    .eq("user_id", user.id)
    .gte("date", oneYearAgo.slice(0, 10))
    .order("date", { ascending: true });

  let pinnedReposDb: string[] = [];
  let profileReadmeDb: string | null = null;
  let githubReadmeDb: string | null = null;
  let readmeSourceDb: string = "github";
  let socialLinks: { twitter: string | null; linkedin: string | null; website: string | null; discord: string | null } = {
    twitter: null, linkedin: null, website: null, discord: null,
  };
  try {
    const { data: extra } = await extraP;
    if (extra) {
      pinnedReposDb = Array.isArray(extra.pinned_repos) ? extra.pinned_repos : [];
      profileReadmeDb = extra.profile_readme ?? null;
      githubReadmeDb = extra.github_readme ?? null;
      readmeSourceDb = extra.readme_source ?? "github";
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

  // README kaynağına göre gösterilecek içerik:
  // "custom" -> Kullanıcının dashboard ayarlarında belirlediği özel README
  // "github" -> GitHub profil reposundan (username/username) çekilen README
  const displayReadme =
    readmeSourceDb === "custom"
      ? (profileReadmeDb ?? null)
      : (githubReadmeDb ?? null);

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
  const techTags: string[] = Array.isArray(user.tech_tags) ? user.tech_tags : [];

  // Repos
  const [{ data: repoRows }, heatmapRes] = await Promise.all([repoP, heatmapP]);

  const ids = (repoRows ?? []).map((r) => r.id);
  const ownIds = (repoRows ?? []).filter((r) => !r.is_fork).map((r) => r.id);

  const [commitsRes, langsRes, yearCommitsRes, mergedPRsRes, closedIssuesRes] = await Promise.all([
    supabaseAdmin.from("commits").select("count", { count: "exact", head: true }).in("repo_id", ids),
    supabaseAdmin.from("repo_languages").select("language, bytes").in("repo_id", ids),
    // One pass over the year's commits feeds both the badges and the Developer DNA.
    supabaseAdmin
      .from("commits")
      .select("committed_at, repo_id, additions, deletions, message")
      .in("repo_id", ownIds)
      .gte("committed_at", oneYearAgo),
    supabaseAdmin
      .from("pull_requests")
      .select("count", { count: "exact", head: true })
      .in("repo_id", ownIds)
      .eq("merged", true),
    supabaseAdmin
      .from("issues")
      .select("count", { count: "exact", head: true })
      .in("repo_id", ownIds)
      .eq("state", "closed"),
  ]);

  const heatmapData = heatmapRes.data ?? [];
  const { topLanguages, stats, currentStreak, longestStreak, earnedBadges, developerDna, pinnedReposData, topRepos } = buildProfileStats({
    repoRows: repoRows ?? [],
    langRows: langsRes.data ?? [],
    heatmapData,
    commitCount: commitsRes.count ?? 0,
    yearCommits: yearCommitsRes.data ?? [],
    mergedPRs: mergedPRsRes.count ?? 0,
    closedIssues: closedIssuesRes.count ?? 0,
    pinnedReposDb,
    pinnedRepoName: user.pinned_repo_name,
    tz,
  });

  return (
    <ThemeProvider accent={accent}>
      <ProfileClient
        username={username}
        userId={user.id}
        isOwner={isOwner}
        isLoggedIn={!!session}
        name={user.name ?? username}
        avatarUrl={user.avatar_url}
        bio={user.bio}
        profileReadme={displayReadme}
        readmeSource={readmeSourceDb === "custom" ? "custom" : "github"}
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
        developerDna={developerDna}
        recordView={recordProfileView}
      />
    </ThemeProvider>
  );
}
