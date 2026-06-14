import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

type ActivityPayload =
  | { type: "streak_milestone"; days: number }
  | { type: "badge_earned"; badge: string }
  | { type: "new_record"; value: number };

// Internal endpoint — cron veya sync'den çağrılır
export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { userId: string } & ActivityPayload;
  const { userId, type, ...rest } = body;

  if (!userId || !type) {
    return NextResponse.json({ error: "userId and type required" }, { status: 400 });
  }

  await supabaseAdmin.from("follow_activities").insert({
    user_id: userId,
    type,
    payload: rest,
  });

  // Eski aktiviteleri temizle (kullanıcı başına son 100)
  const { data: old } = await supabaseAdmin
    .from("follow_activities")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(100, 9999);

  if (old && old.length > 0) {
    await supabaseAdmin
      .from("follow_activities")
      .delete()
      .in("id", old.map((r) => r.id));
  }

  return NextResponse.json({ ok: true });
}
