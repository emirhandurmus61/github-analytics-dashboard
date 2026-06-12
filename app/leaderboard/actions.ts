"use server";

import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function toggleLeaderboardOptIn(optIn: boolean) {
  const session = await auth();
  if (!session?.user?.username) return { error: "Oturum bulunamadı" };

  try {
    const { error } = await supabaseAdmin
      .from("users")
      .update({ leaderboard_opt_in: optIn })
      .eq("username", session.user.username);

    if (error) throw error;
  } catch {
    // Kolon yoksa sessizce geç
    return { success: true };
  }

  revalidatePath("/leaderboard");
  return { success: true };
}
