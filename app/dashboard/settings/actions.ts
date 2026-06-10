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

  // Pinned repos (max 3)
  const pinnedReposRaw = formData.get("pinned_repos") as string | null;
  let pinnedRepos: string[] = [];
  if (pinnedReposRaw) {
    try {
      const parsed = JSON.parse(pinnedReposRaw);
      if (Array.isArray(parsed)) {
        pinnedRepos = parsed.filter((s): s is string => typeof s === "string" && s.length > 0).slice(0, 3);
      }
    } catch { /* invalid JSON */ }
  }

  // Profile README
  const profileReadme = (formData.get("profile_readme") as string | null)?.slice(0, 2000) ?? "";

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

  // Ana alanlar
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

  if (error) return { error: "Kayit basarisiz: " + error.message };

  // Yeni kolonlar — migration yapilmamissa sessizce gec
  try {
    await supabaseAdmin
      .from("users")
      .update({
        pinned_repos: pinnedRepos,
        profile_readme: profileReadme || null,
      })
      .eq("username", session.user.username);
  } catch {
    // Kolonlar henuz yok — sorun degil
  }

  revalidatePath(`/u/${session.user.username}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export async function saveWeeklyGoal(goal: number) {
  const session = await auth();
  if (!session?.user?.username) return { error: "Oturum bulunamadı" };

  const clampedGoal = Math.max(1, Math.min(500, Math.round(goal)));

  // Kullanıcı ID'sini al
  const { data: dbUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("username", session.user.username)
    .single();

  if (!dbUser) return { error: "Kullanıcı bulunamadı" };

  // weekly_commit_goal güncelle
  await supabaseAdmin
    .from("users")
    .update({ weekly_commit_goal: clampedGoal })
    .eq("id", dbUser.id);

  // Bu haftanın Pazartesi'sini hesapla
  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7; // Pzt=0
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayOfWeek);
  monday.setHours(0, 0, 0, 0);
  const weekStart = monday.toISOString().slice(0, 10);

  // Bu haftanın kaydını güncelle (yoksa oluştur)
  await supabaseAdmin
    .from("weekly_goal_history")
    .upsert(
      { user_id: dbUser.id, week_start: weekStart, goal: clampedGoal },
      { onConflict: "user_id,week_start", ignoreDuplicates: false }
    );

  revalidatePath("/dashboard");
  return { success: true };
}

export async function syncWeeklyGoalHistory(userId: string, weekStart: string, actual: number, goal: number) {
  await supabaseAdmin
    .from("weekly_goal_history")
    .upsert(
      { user_id: userId, week_start: weekStart, goal, actual },
      { onConflict: "user_id,week_start", ignoreDuplicates: false }
    );
}
