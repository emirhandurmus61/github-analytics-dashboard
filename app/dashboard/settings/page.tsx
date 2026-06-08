import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { redirect } from "next/navigation";
import SettingsForm from "./settings-form";
import { isValidTheme, DEFAULT_THEME, type ThemeAccent } from "@/lib/themes";
import { WIDGET_KEYS, type WidgetKey } from "@/lib/widgets";

type Widgets = {
  heatmap: boolean;
  languages: boolean;
  repos: boolean;
  streak: boolean;
};

const DEFAULT_WIDGETS: Widgets = {
  heatmap: true,
  languages: true,
  repos: true,
  streak: true,
};

const DEFAULT_ORDER: WidgetKey[] = ["streak", "heatmap", "languages", "repos"];

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.username) redirect("/");

  const username = session.user.username;

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, bio, pinned_repo_name, public_widgets, widget_order, theme_accent, currently_working_on, yearly_goal, tech_tags")
    .eq("username", username)
    .single();

  if (!user) redirect("/dashboard");

  const { data: repoRows } = await supabaseAdmin
    .from("repositories")
    .select("name")
    .eq("user_id", user.id)
    .eq("is_fork", false)
    .order("stars", { ascending: false });

  const repos = repoRows ?? [];

  const widgets: Widgets =
    user.public_widgets && typeof user.public_widgets === "object"
      ? { ...DEFAULT_WIDGETS, ...(user.public_widgets as Partial<Widgets>) }
      : DEFAULT_WIDGETS;

  const rawOrder = user.widget_order;
  const widgetOrder: WidgetKey[] =
    Array.isArray(rawOrder) && rawOrder.every((k: unknown) => WIDGET_KEYS.includes(k as WidgetKey))
      ? (rawOrder as WidgetKey[])
      : DEFAULT_ORDER;

  const currentTheme: ThemeAccent = isValidTheme(user.theme_accent) ? user.theme_accent : DEFAULT_THEME;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const badgeUrl = `${baseUrl}/api/badge/${username}`;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Profil Ayarları</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Temanı, profilini ve badge'ini özelleştir.
        </p>
      </div>

      <SettingsForm
        bio={user.bio}
        pinnedRepo={user.pinned_repo_name}
        widgets={widgets}
        widgetOrder={widgetOrder}
        repos={repos}
        username={username}
        badgeUrl={badgeUrl}
        currentTheme={currentTheme}
        currentlyWorkingOn={user.currently_working_on ?? null}
        yearlyGoal={user.yearly_goal ?? null}
        techTags={Array.isArray(user.tech_tags) ? user.tech_tags : []}
      />
    </div>
  );
}
