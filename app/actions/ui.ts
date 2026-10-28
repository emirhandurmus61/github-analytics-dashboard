"use server";

import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { isValidTheme } from "@/lib/themes";

/** Persists the accent so the public profile uses it too. */
export async function saveAccent(accent: string) {
  const session = await auth();
  const username = session?.user?.username;
  if (!username) return { error: "unauthorized" as const };
  if (!isValidTheme(accent)) return { error: "invalid" as const };

  const { error } = await supabaseAdmin.from("users").update({ theme_accent: accent }).eq("username", username);
  if (error) return { error: "db" as const };

  revalidatePath(`/u/${username}`);
  return { success: true as const };
}
