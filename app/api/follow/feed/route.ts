import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

// Takip edilen kişilerin aktivite akışı
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

  // Takip edilen kullanıcı ID'leri
  const { data: followRows } = await supabaseAdmin
    .from("follows")
    .select("following_id")
    .eq("follower_id", self.id);

  const followingIds = (followRows ?? []).map((r) => r.following_id);
  if (followingIds.length === 0) return NextResponse.json({ activities: [] });

  const { data: activities } = await supabaseAdmin
    .from("follow_activities")
    .select("id, user_id, type, payload, created_at")
    .in("user_id", followingIds)
    .order("created_at", { ascending: false })
    .limit(30);

  if (!activities || activities.length === 0) return NextResponse.json({ activities: [] });

  // Kullanıcı bilgilerini çek
  const userIds = [...new Set(activities.map((a) => a.user_id))];
  const { data: users } = await supabaseAdmin
    .from("users")
    .select("id, username, name, avatar_url")
    .in("id", userIds);

  const userMap = new Map((users ?? []).map((u) => [u.id, u]));

  const feed = activities.map((a) => ({
    id: a.id,
    type: a.type,
    payload: a.payload,
    created_at: a.created_at,
    user: userMap.get(a.user_id) ?? null,
  }));

  return NextResponse.json({ activities: feed });
}
