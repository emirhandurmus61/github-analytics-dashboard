"use server";

import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { isValidTheme } from "@/lib/themes";

export async function saveProfileSettings(
  _prevState: { error?: string; success?: boolean },
  formData: FormData
) {
  const session = await auth();
  if (!session?.user?.username) return { error: "Oturum bulunamadı" };

  const bio = (formData.get("bio") as string | null)?.trim().slice(0, 200) ?? "";
  const pinnedRepo = (formData.get("pinned_repo") as string | null)?.trim() ?? "";
  const themeRaw = formData.get("theme_accent") as string | null;
  const theme = isValidTheme(themeRaw) ? themeRaw : "emerald";

  const widgets = {
    heatmap: formData.get("widget_heatmap") === "on",
    languages: formData.get("widget_languages") === "on",
    repos: formData.get("widget_repos") === "on",
    streak: formData.get("widget_streak") === "on",
  };

  const { error } = await supabaseAdmin
    .from("users")
    .update({
      bio: bio || null,
      pinned_repo_name: pinnedRepo || null,
      public_widgets: widgets,
      theme_accent: theme,
    })
    .eq("username", session.user.username);

  if (error) return { error: "Kayıt başarısız: " + error.message };

  revalidatePath(`/u/${session.user.username}`);
  revalidatePath("/dashboard");
  return { success: true };
}
