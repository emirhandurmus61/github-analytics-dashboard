import { supabaseAdmin } from "@/lib/supabase";
import { calculateStreaks } from "@/lib/streak";
import { daysAgoISO } from "@/lib/ui/format";

export type WidgetUser = { id: string; theme_accent: string | null };

export async function findUser(username: string): Promise<WidgetUser | null> {
  const { data } = await supabaseAdmin.from("users").select("id, theme_accent").eq("username", username).single();
  return data ?? null;
}

export async function yearDays(userId: string) {
  const { data } = await supabaseAdmin
    .from("daily_stats")
    .select("date, commit_count")
    .eq("user_id", userId)
    .gte("date", daysAgoISO(365).slice(0, 10))
    .order("date", { ascending: true });
  const days = data ?? [];
  const streak = calculateStreaks(days.filter((d) => d.commit_count > 0).map((d) => d.date));
  return { days, streak, total: days.reduce((s, d) => s + d.commit_count, 0) };
}

export async function ownLanguages(userId: string) {
  const { data: repos } = await supabaseAdmin.from("repositories").select("id").eq("user_id", userId).eq("is_fork", false);
  const ids = (repos ?? []).map((r) => r.id);
  const map = new Map<string, number>();
  if (ids.length) {
    const { data } = await supabaseAdmin.from("repo_languages").select("language, bytes").in("repo_id", ids);
    for (const r of data ?? []) map.set(r.language, (map.get(r.language) ?? 0) + r.bytes);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

/** Language for labels: ?lang=en, else the viewer's cookie, else Turkish. */
export function langOf(req: Request): "tr" | "en" {
  const url = new URL(req.url);
  const q = url.searchParams.get("lang");
  if (q === "en" || q === "tr") return q;
  return /(?:^|;\s*)devboard_lang=en/.test(req.headers.get("cookie") ?? "") ? "en" : "tr";
}
