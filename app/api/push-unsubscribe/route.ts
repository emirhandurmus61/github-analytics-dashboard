import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.username) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { endpoint } = await req.json() as { endpoint?: string };

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("username", session.user.username)
    .single();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (endpoint) {
    await supabaseAdmin
      .from("push_subscriptions")
      .delete()
      .eq("user_id", user.id)
      .eq("endpoint", endpoint);
  } else {
    // Tüm subscriptionları sil
    await supabaseAdmin
      .from("push_subscriptions")
      .delete()
      .eq("user_id", user.id);
  }

  return NextResponse.json({ success: true });
}
