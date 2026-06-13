import { supabaseAdmin } from "@/lib/supabase";
import { auth } from "@/lib/auth";
import { THEMES, isValidTheme, DEFAULT_THEME } from "@/lib/themes";
import { calculateStreaks } from "@/lib/streak";
import LeaderboardClient from "./leaderboard-client";
import Navbar from "@/components/navbar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Liderlik Tablosu · Dev Analytics",
  description: "Bu haftanın en aktif geliştiricileri.",
};

export const revalidate = 300; // 5 dakika cache

export type LeaderboardEntry = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  accentColor: string;
  weeklyCommits: number;
  currentStreak: number;
  badgeCount: number;
  topLang: string | null;
  rank: number;
};

export type LeaderboardCategory = "weekly" | "streak" | "badges";

async function getWeeklyCommits(userIds: string[]): Promise<Map<string, number>> {
  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayOfWeek);
  monday.setHours(0, 0, 0, 0);
  const weekStart = monday.toISOString().slice(0, 10);

  const { data } = await supabaseAdmin
    .from("daily_stats")
    .select("user_id, commit_count")
    .in("user_id", userIds)
    .gte("date", weekStart);

  const map = new Map<string, number>();
  for (const row of data ?? []) {
    map.set(row.user_id, (map.get(row.user_id) ?? 0) + row.commit_count);
  }
  return map;
}

async function getCurrentStreaks(userIds: string[]): Promise<Map<string, number>> {
  const { data } = await supabaseAdmin
    .from("daily_stats")
    .select("user_id, date, commit_count")
    .in("user_id", userIds)
    .gte("date", new Date(Date.now() - 400 * 86400000).toISOString().slice(0, 10));

  const grouped = new Map<string, string[]>();
  for (const row of data ?? []) {
    if (row.commit_count > 0) {
      if (!grouped.has(row.user_id)) grouped.set(row.user_id, []);
      grouped.get(row.user_id)!.push(row.date);
    }
  }

  const map = new Map<string, number>();
  for (const [uid, dates] of grouped) {
    const { currentStreak } = calculateStreaks(dates);
    map.set(uid, currentStreak);
  }
  return map;
}

async function getBadgeCounts(userIds: string[]): Promise<Map<string, number>> {
  // Her kullanıcının son 365 gün verisinden rozet sayısını hesapla
  const { data } = await supabaseAdmin
    .from("daily_stats")
    .select("user_id, date, commit_count")
    .in("user_id", userIds)
    .gte("date", new Date(Date.now() - 400 * 86400000).toISOString().slice(0, 10));

  const grouped = new Map<string, { dates: string[]; commits: number[] }>();
  for (const row of data ?? []) {
    if (!grouped.has(row.user_id)) grouped.set(row.user_id, { dates: [], commits: [] });
    const g = grouped.get(row.user_id)!;
    g.dates.push(row.date);
    g.commits.push(row.commit_count);
  }

  const map = new Map<string, number>();
  for (const [uid, { dates, commits }] of grouped) {
    const activeDates = dates.filter((_, i) => commits[i] > 0);
    const { longestStreak } = calculateStreaks(activeDates);
    let count = 1; // synced
    if (longestStreak >= 7) count++;
    if (longestStreak >= 30) count++;
    if (activeDates.length >= 50) count++;
    map.set(uid, count);
  }
  return map;
}

async function getTopLangs(userIds: string[]): Promise<Map<string, string | null>> {
  // Her kullanıcının non-fork repo ID'lerini al
  const { data: repos } = await supabaseAdmin
    .from("repositories")
    .select("id, user_id")
    .in("user_id", userIds)
    .eq("is_fork", false);

  const repoToUser = new Map<string, string>();
  for (const r of repos ?? []) repoToUser.set(r.id, r.user_id);
  const repoIds = (repos ?? []).map((r) => r.id);

  if (repoIds.length === 0) return new Map();

  const { data: langs } = await supabaseAdmin
    .from("repo_languages")
    .select("repo_id, language, bytes")
    .in("repo_id", repoIds);

  const userLangs = new Map<string, Map<string, number>>();
  for (const row of langs ?? []) {
    const uid = repoToUser.get(row.repo_id);
    if (!uid) continue;
    if (!userLangs.has(uid)) userLangs.set(uid, new Map());
    const m = userLangs.get(uid)!;
    m.set(row.language, (m.get(row.language) ?? 0) + row.bytes);
  }

  const map = new Map<string, string | null>();
  for (const [uid, langs] of userLangs) {
    const top = Array.from(langs.entries()).sort((a, b) => b[1] - a[1])[0];
    map.set(uid, top ? top[0] : null);
  }
  return map;
}

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
      <>
        <Navbar />
        <LeaderboardClient
          weekly={[]}
          streaks={[]}
          badges={[]}
          currentUsername={currentUsername}
          isOptedIn={false}
        />
      </>
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
    <>
      <Navbar />
      <LeaderboardClient
        weekly={weekly}
        streaks={streaks}
        badges={badges}
        currentUsername={currentUsername}
        isOptedIn={isOptedIn}
      />
    </>
  );
}
