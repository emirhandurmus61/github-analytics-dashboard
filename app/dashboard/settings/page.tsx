import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { redirect } from "next/navigation";
import SettingsForm from "./settings-form";

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

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.username) redirect("/");

  const username = session.user.username;

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, bio, pinned_repo_name, public_widgets")
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

  // Badge URL — kendi origin'e göre (server-side absolute URL için env kullan)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const badgeUrl = `${baseUrl}/api/badge/${username}`;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-100">Profil Ayarları</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Genel profilini özelleştir ve badge'ini al.
        </p>
      </div>

      <SettingsForm
        bio={user.bio}
        pinnedRepo={user.pinned_repo_name}
        widgets={widgets}
        repos={repos}
        username={username}
        badgeUrl={badgeUrl}
      />
    </div>
  );
}
