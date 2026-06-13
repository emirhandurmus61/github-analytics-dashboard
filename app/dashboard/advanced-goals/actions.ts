"use server";

import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import type { GoalType } from "@/lib/goals";

async function getUserId() {
  const session = await auth();
  if (!session?.user?.username) return null;
  const { data } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("username", session.user.username)
    .single();
  return data?.id ?? null;
}

export async function upsertGoal(type: GoalType, target: number, chainOrder = 0) {
  const userId = await getUserId();
  if (!userId) return { error: "Oturum bulunamadı" };

  // Var olan aktif hedefi güncelle, yoksa oluştur
  const { error } = await supabaseAdmin
    .from("user_goals")
    .upsert(
      { user_id: userId, type, target, chain_order: chainOrder, is_active: true, completed_at: null },
      { onConflict: "user_id,type,is_active" }
    );

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteGoal(goalId: string) {
  const userId = await getUserId();
  if (!userId) return { error: "Oturum bulunamadı" };

  await supabaseAdmin
    .from("user_goals")
    .delete()
    .eq("id", goalId)
    .eq("user_id", userId);

  revalidatePath("/dashboard");
  return { success: true };
}

export async function markGoalAchieved(goalId: string, achievedOn: string) {
  const userId = await getUserId();
  if (!userId) return { error: "Oturum bulunamadı" };

  await supabaseAdmin
    .from("goal_achievements")
    .upsert(
      { user_id: userId, goal_id: goalId, achieved_on: achievedOn },
      { onConflict: "user_id,goal_id,achieved_on" }
    );

  // Tamamlandı işareti
  await supabaseAdmin
    .from("user_goals")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", goalId)
    .eq("user_id", userId);

  revalidatePath("/dashboard");
  return { success: true };
}
