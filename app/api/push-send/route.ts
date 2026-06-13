import { NextResponse } from "next/server";
import webpush from "web-push";
import { supabaseAdmin } from "@/lib/supabase";
import { calculateStreaks } from "@/lib/streak";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

// Cron'dan veya internal trigger'dan çağrılır
export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { type: "streak" | "goal" | "badge" | "summary"; userId?: string };
  const { type, userId } = body;

  // Hedef kullanıcıları bul
  const query = supabaseAdmin
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth");

  const { data: subs } = userId
    ? await query.eq("user_id", userId)
    : await query;

  if (!subs || subs.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const userIds = [...new Set(subs.map((s) => s.user_id))];

  // Streak kontrolü
  const { data: dailyStats } = await supabaseAdmin
    .from("daily_stats")
    .select("user_id, date, commit_count")
    .in("user_id", userIds)
    .gte("date", new Date(Date.now() - 400 * 86400000).toISOString().slice(0, 10));

  const userDates = new Map<string, string[]>();
  for (const row of dailyStats ?? []) {
    if (row.commit_count > 0) {
      if (!userDates.has(row.user_id)) userDates.set(row.user_id, []);
      userDates.get(row.user_id)!.push(row.date);
    }
  }

  // Bugün commit var mı kontrol et
  const todayStr = new Date().toISOString().slice(0, 10);

  let sent = 0;
  const failed: string[] = [];

  for (const sub of subs) {
    const dates = userDates.get(sub.user_id) ?? [];
    const { currentStreak } = calculateStreaks(dates);
    const hasToday = dates.includes(todayStr);

    let notification: { title: string; body: string; tag: string; url: string } | null = null;

    if (type === "streak") {
      if (currentStreak > 0 && !hasToday) {
        notification = {
          title: "🔥 Streak tehlikede!",
          body: `${currentStreak} günlük serinizi korumak için bugün commit atın.`,
          tag: "streak-warning",
          url: "/dashboard",
        };
      }
    } else if (type === "summary") {
      const weekStart = (() => {
        const d = new Date();
        d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
        return d.toISOString().slice(0, 10);
      })();
      const weekCommits = dates.filter((d) => d >= weekStart).length;
      notification = {
        title: "📊 Haftalık özetin hazır",
        body: `Bu hafta ${weekCommits} aktif gün. Dashboardına göz at!`,
        tag: "weekly-summary",
        url: "/dashboard",
      };
    }

    if (!notification) continue;

    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(notification),
      );
      sent++;
    } catch (err: unknown) {
      // 410 Gone = subscription expired
      if ((err as { statusCode?: number }).statusCode === 410) {
        failed.push(sub.endpoint);
      }
    }
  }

  // Expired subscription'ları temizle
  if (failed.length > 0) {
    await supabaseAdmin
      .from("push_subscriptions")
      .delete()
      .in("endpoint", failed);
  }

  return NextResponse.json({ sent, expired: failed.length });
}
