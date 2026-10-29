import { supabaseAdmin } from "@/lib/supabase";
import { auth } from "@/lib/auth";
import { THEMES, isValidTheme, DEFAULT_THEME, type ThemeAccent } from "@/lib/themes";
import LeaderboardClient from "./leaderboard-client";
import AppShell from "@/components/shell/app-shell";
import type { Metadata } from "next";
import { getWeeklyCommits, getCurrentStreaks, getBadgeCounts, getTopLangs } from "./queries";

export const metadata: Metadata = {
  title: "Liderlik Tablosu · Devboard",
  description: "Bu haftanın en aktif geliştiricileri.",
};

export const revalidate = 300; // 5 dakika cache

export type LeaderboardEntry = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  accentColor: string;
  accent: ThemeAccent;
  weeklyCommits: number;
  currentStreak: number;
  badgeCount: number;
  topLang: string | null;
  rank: number;
};

export type LeaderboardCategory = "weekly" | "streak" | "badges";

export default async function LeaderboardPage() {
  const session = await auth();
  const currentUsername = session?.user?.username ?? null;

  // leaderboard_opt_in = false olarak açıkça kapatmayanları (NULL veya true) herkesi göster
  let optInUsers: { id: string; username: string; name: string | null; avatar_url: string | null; theme_accent: string | null }[] = [];
  {
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("id, username, name, avatar_url, theme_accent")
      .neq("leaderboard_opt_in", false)
      .not("username", "is", null);

    if (error) {
      // leaderboard_opt_in kolonu henüz yoksa filtre olmadan tüm kullanıcıları çek
      const { data: allData } = await supabaseAdmin
        .from("users")
        .select("id, username, name, avatar_url, theme_accent")
        .not("username", "is", null);
      optInUsers = allData ?? [];
    } else {
      optInUsers = data ?? [];
    }
  }

  if (optInUsers.length === 0) {
    return (
      <AppShell>
        <LeaderboardClient
          weekly={[]}
          streaks={[]}
          badges={[]}
          currentUsername={currentUsername}
          isOptedIn={false}
        />
      </AppShell>
    );
  }

  const userIds = optInUsers.map((u) => u.id);

  const [weeklyMap, streakMap, badgeMap, topLangMap] = await Promise.all([
    getWeeklyCommits(userIds),
    getCurrentStreaks(userIds),
    getBadgeCounts(userIds),
    getTopLangs(userIds),
  ]);

  function buildEntries(sortKey: keyof Pick<LeaderboardEntry, "weeklyCommits" | "currentStreak" | "badgeCount">): LeaderboardEntry[] {
    return optInUsers
      .map((u) => {
        const accent = isValidTheme(u.theme_accent) ? u.theme_accent : DEFAULT_THEME;
        return {
          username: u.username!,
          displayName: u.name ?? u.username!,
          avatarUrl: u.avatar_url,
          accentColor: THEMES[accent].accent,
          accent,
          weeklyCommits: weeklyMap.get(u.id) ?? 0,
          currentStreak: streakMap.get(u.id) ?? 0,
          badgeCount: badgeMap.get(u.id) ?? 0,
          topLang: topLangMap.get(u.id) ?? null,
          rank: 0,
        };
      })
      .sort((a, b) => (b[sortKey] as number) - (a[sortKey] as number))
      .map((e, i) => ({ ...e, rank: i + 1 }));
  }

  const weekly = buildEntries("weeklyCommits");
  const streaks = buildEntries("currentStreak");
  const badges = buildEntries("badgeCount");

  // Mevcut kullanıcının opt-out durumu — varsayılan: listede görünür (true)
  let isOptedIn = true;
  if (currentUsername) {
    const { data: me } = await supabaseAdmin
      .from("users")
      .select("leaderboard_opt_in")
      .eq("username", currentUsername)
      .single();
    // Açıkça false yapılmışsa opt-out, NULL veya true ise opt-in
    if (me) isOptedIn = me.leaderboard_opt_in !== false;
  }

  return (
    <AppShell>
      <LeaderboardClient
        weekly={weekly}
        streaks={streaks}
        badges={badges}
        currentUsername={currentUsername}
        isOptedIn={isOptedIn}
      />
    </AppShell>
  );
}
