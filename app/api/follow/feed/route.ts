import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { calculateStreaks } from "@/lib/streak";

export async function GET() {
  const session = await auth();
  if (!session?.user?.username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: self } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("username", session.user.username)
    .single();

  if (!self) return NextResponse.json({ activities: [] });

  // Takip edilen kullanıcılar
  const { data: followRows } = await supabaseAdmin
    .from("follows")
    .select("following_id")
    .eq("follower_id", self.id);

  const followingIds = (followRows ?? []).map((r) => r.following_id);
  if (followingIds.length === 0) return NextResponse.json({ activities: [] });

  // Takip edilen kullanıcıların profil bilgileri
  const { data: users } = await supabaseAdmin
    .from("users")
    .select("id, username, name, avatar_url, last_synced_at")
    .in("id", followingIds);

  if (!users || users.length === 0) return NextResponse.json({ activities: [] });

  // Son 30 günlük streak verisi
  const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const { data: dailyStats } = await supabaseAdmin
    .from("daily_stats")
    .select("user_id, date, commit_count")
    .in("user_id", followingIds)
    .gte("date", since)
    .order("date", { ascending: true });

  const userDates = new Map<string, string[]>();
  for (const row of dailyStats ?? []) {
    if (row.commit_count > 0) {
      if (!userDates.has(row.user_id)) userDates.set(row.user_id, []);
      userDates.get(row.user_id)!.push(row.date);
    }
  }

  // Her kullanıcı için aktivite üret
  type Activity = {
    id: string;
    type: "streak_milestone" | "badge_earned" | "new_record" | "active_today" | "recent_sync";
    payload: Record<string, unknown>;
    created_at: string;
    user: { id: string; username: string; name: string; avatar_url: string | null };
  };

  const activities: Activity[] = [];
  const todayStr = new Date().toISOString().slice(0, 10);

  for (const user of users) {
    const dates = userDates.get(user.id) ?? [];

    // Tüm zamanlar için streak hesapla
    const { data: allStats } = await supabaseAdmin
      .from("daily_stats")
      .select("date, commit_count")
      .eq("user_id", user.id)
      .gte("date", new Date(Date.now() - 400 * 86400000).toISOString().slice(0, 10))
      .order("date", { ascending: true });

    const allDates = (allStats ?? []).filter((d) => d.commit_count > 0).map((d) => d.date);
    const { currentStreak } = calculateStreaks(allDates);

    const userData = {
      id: user.id,
      username: user.username,
      name: user.name ?? user.username,
      avatar_url: user.avatar_url,
    };

    // Bugün aktif mi?
    if (dates.includes(todayStr)) {
      activities.push({
        id: `${user.id}-active-${todayStr}`,
        type: "active_today",
        payload: { date: todayStr },
        created_at: new Date().toISOString(),
        user: userData,
      });
    }

    // Streak milestone
    if (currentStreak >= 3) {
      const milestones = [100, 50, 30, 14, 7, 3];
      const milestone = milestones.find((m) => currentStreak >= m);
      if (milestone) {
        activities.push({
          id: `${user.id}-streak-${currentStreak}`,
          type: "streak_milestone",
          payload: { days: currentStreak },
          created_at: user.last_synced_at ?? new Date().toISOString(),
          user: userData,
        });
      }
    }

    // Son 30 günde commit var ama bugün yoksa "son sync" göster
    if (!dates.includes(todayStr) && dates.length > 0 && user.last_synced_at) {
      activities.push({
        id: `${user.id}-sync`,
        type: "recent_sync",
        payload: { commitCount: dates.length },
        created_at: user.last_synced_at,
        user: userData,
      });
    }
  }

  // Zaman sırasına göre sırala
  activities.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return NextResponse.json({ activities: activities.slice(0, 30) });
}
