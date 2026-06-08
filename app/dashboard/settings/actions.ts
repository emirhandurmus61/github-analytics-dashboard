"use server";

import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { isValidTheme } from "@/lib/themes";
import { WIDGET_KEYS, type WidgetKey } from "@/lib/widgets";

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

  // Widget görünürlüğü
  const widgets = {
    heatmap: formData.get("widget_heatmap") === "on",
    languages: formData.get("widget_languages") === "on",
    repos: formData.get("widget_repos") === "on",
    streak: formData.get("widget_streak") === "on",
  };

  // Widget sırası
  const orderRaw = formData.get("widget_order") as string | null;
  let widgetOrder: WidgetKey[] = [...WIDGET_KEYS];
  if (orderRaw) {
    try {
      const parsed = JSON.parse(orderRaw);
      if (Array.isArray(parsed) && parsed.every((k) => WIDGET_KEYS.includes(k))) {
        widgetOrder = parsed as WidgetKey[];
      }
    } catch { /* geçersiz JSON, default kullan */ }
  }

  // F.3 — Özel bölümler
  const currentlyWorkingOn = (formData.get("currently_working_on") as string | null)?.trim().slice(0, 150) ?? "";
  const yearlyGoal = (formData.get("yearly_goal") as string | null)?.trim().slice(0, 150) ?? "";
  const techTagsRaw = (formData.get("tech_tags") as string | null)?.trim() ?? "";
  const techTags = techTagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && t.length <= 30)
    .slice(0, 12);

  const { error } = await supabaseAdmin
    .from("users")
    .update({
      bio: bio || null,
      pinned_repo_name: pinnedRepo || null,
      public_widgets: widgets,
      widget_order: widgetOrder,
      theme_accent: theme,
      currently_working_on: currentlyWorkingOn || null,
      yearly_goal: yearlyGoal || null,
      tech_tags: techTags,
    })
    .eq("username", session.user.username);

  if (error) return { error: "Kayıt başarısız: " + error.message };

  revalidatePath(`/u/${session.user.username}`);
  revalidatePath("/dashboard");
  return { success: true };
}
