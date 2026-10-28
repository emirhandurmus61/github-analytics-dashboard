import type { ReactNode } from "react";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { calculateStreaks } from "@/lib/streak";
import ShellClient from "./shell-client";
import type { ShellStatus, ShellUser } from "./chrome";

/**
 * Application frame used by every signed-in surface (and public pages, where
 * it falls back to a sign-in bar). Loads the small amount of data the chrome
 * shows: sync time, current streak, this week's commits.
 */
export default async function AppShell({ children, bleed }: { children: ReactNode; bleed?: boolean }) {
  const session = await auth();
  const year = new Date().getFullYear();

  if (!session?.user?.username) {
    return (
      <ShellClient user={null} status={null} lastSyncedAt={null} year={year} bleed={bleed}>
        {children}
      </ShellClient>
    );
  }

  const username = session.user.username;
  const user: ShellUser = {
    username,
    name: session.user.name ?? username,
    avatarUrl: session.user.image ?? null,
  };

  let lastSyncedAt: string | null = null;
  let accent: string | null = null;
  let status: ShellStatus | null = null;

  try {
    const { data: row } = await supabaseAdmin
      .from("users")
      .select("id, last_synced_at, theme_accent")
      .eq("username", username)
      .single();
    lastSyncedAt = row?.last_synced_at ?? null;
    accent = row?.theme_accent ?? null;

    if (row?.id && lastSyncedAt) {
      const since = new Date(Date.now() - 400 * 86400000).toISOString().slice(0, 10);
      const { data: days } = await supabaseAdmin
        .from("daily_stats")
        .select("date, commit_count")
        .eq("user_id", row.id)
        .gte("date", since);
      const list = days ?? [];
      const active = list.filter((d) => d.commit_count > 0).map((d) => d.date);
      const today = new Date();
      const monday = new Date(today);
      monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
      const weekStart = monday.toISOString().slice(0, 10);
      const todayStr = today.toISOString().slice(0, 10);
      status = {
        streak: calculateStreaks(active).currentStreak,
        weekCommits: list.filter((d) => d.date >= weekStart).reduce((s, d) => s + d.commit_count, 0),
        todayCommits: list.find((d) => d.date === todayStr)?.commit_count ?? 0,
      };
    }
  } catch {
    // The chrome still renders without status data.
  }

  return (
    <ShellClient user={user} status={status} lastSyncedAt={lastSyncedAt} year={year} bleed={bleed} dbAccent={accent}>
      {children}
    </ShellClient>
  );
}
