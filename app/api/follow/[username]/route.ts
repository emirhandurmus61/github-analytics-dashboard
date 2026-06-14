import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import webpush from "web-push";

function tryInitVapid() {
  const email = process.env.VAPID_EMAIL;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!email || !pub || !priv) return false;
  try { webpush.setVapidDetails(email, pub, priv); return true; } catch { return false; }
}

async function sendFollowNotification(targetId: string, followerName: string) {
  if (!tryInitVapid()) return;
  const { data: subs } = await supabaseAdmin
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", targetId);
  for (const sub of subs ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify({
          title: "Yeni takipçin var!",
          body: `${followerName} seni takip etmeye başladı.`,
          tag: "new-follower",
          url: "/dashboard",
        }),
      );
    } catch { /* expired subscription — ignore */ }
  }
}

type Params = { params: Promise<{ username: string }> };

// Takip durumunu kontrol et (GET)
export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  const { username } = await params;

  if (!session?.user?.username) {
    return NextResponse.json({ following: false, followerCount: 0, followingCount: 0 });
  }

  const { data: target } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("username", username)
    .single();

  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { data: self } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("username", session.user.username)
    .single();

  const [followCheck, followerCount, followingCount] = await Promise.all([
    self
      ? supabaseAdmin
          .from("follows")
          .select("id", { count: "exact", head: true })
          .eq("follower_id", self.id)
          .eq("following_id", target.id)
      : Promise.resolve({ count: 0 }),
    supabaseAdmin
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", target.id),
    supabaseAdmin
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("follower_id", target.id),
  ]);

  return NextResponse.json({
    following: (followCheck.count ?? 0) > 0,
    followerCount: followerCount.count ?? 0,
    followingCount: followingCount.count ?? 0,
  });
}

// Takip et / bırak (POST — toggle)
export async function POST(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { username } = await params;

  if (session.user.username === username) {
    return NextResponse.json({ error: "Kendinizi takip edemezsiniz" }, { status: 400 });
  }

  const [selfRes, targetRes] = await Promise.all([
    supabaseAdmin.from("users").select("id").eq("username", session.user.username).single(),
    supabaseAdmin.from("users").select("id").eq("username", username).single(),
  ]);

  if (!selfRes.data || !targetRes.data) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const selfId = selfRes.data.id;
  const targetId = targetRes.data.id;

  // Mevcut takip var mı?
  const { count: existingCount } = await supabaseAdmin
    .from("follows")
    .select("id", { count: "exact", head: true })
    .eq("follower_id", selfId)
    .eq("following_id", targetId);

  if ((existingCount ?? 0) > 0) {
    // Takibi bırak
    await supabaseAdmin
      .from("follows")
      .delete()
      .eq("follower_id", selfId)
      .eq("following_id", targetId);

    const { count } = await supabaseAdmin
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("following_id", targetId);

    return NextResponse.json({ following: false, followerCount: count ?? 0 });
  }

  // Günlük limit kontrolü (max 20)
  const today = new Date().toISOString().slice(0, 10);
  const { data: limitRow } = await supabaseAdmin
    .from("follow_daily_limits")
    .select("count")
    .eq("user_id", selfId)
    .eq("date", today)
    .maybeSingle();

  if ((limitRow?.count ?? 0) >= 20) {
    return NextResponse.json({ error: "Günlük takip limitine ulaştınız (20)" }, { status: 429 });
  }

  // Takip et
  await supabaseAdmin.from("follows").insert({ follower_id: selfId, following_id: targetId });

  // Günlük limiti güncelle
  await supabaseAdmin
    .from("follow_daily_limits")
    .upsert({ user_id: selfId, date: today, count: (limitRow?.count ?? 0) + 1 }, { onConflict: "user_id,date" });

  const { count } = await supabaseAdmin
    .from("follows")
    .select("id", { count: "exact", head: true })
    .eq("following_id", targetId);

  // Bildirim gönder (fire-and-forget)
  const followerDisplayName = session.user.name ?? session.user.username;
  sendFollowNotification(targetId, followerDisplayName).catch(() => {});

  return NextResponse.json({ following: true, followerCount: count ?? 0 });
}
