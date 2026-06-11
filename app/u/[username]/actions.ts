"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { headers } from "next/headers";
import crypto from "crypto";

export async function recordProfileView(userId: string) {
  const hdrs = await headers();
  const rawIp =
    hdrs.get("x-forwarded-for")?.split(",")[0].trim() ??
    hdrs.get("x-real-ip") ??
    "unknown";

  // IP'yi hash'le — ham IP saklamıyoruz
  const visitorHash = crypto
    .createHash("sha256")
    .update(rawIp + new Date().toISOString().slice(0, 10)) // günlük unique
    .digest("hex")
    .slice(0, 16);

  // Aynı ziyaretçiden aynı gün birden fazla kayıt olmasın
  const today = new Date().toISOString().slice(0, 10);
  const { data: existing } = await supabaseAdmin
    .from("profile_views")
    .select("id")
    .eq("user_id", userId)
    .eq("visitor_ip", visitorHash)
    .gte("viewed_at", today)
    .maybeSingle();

  if (existing) return; // bugün zaten sayıldı

  await supabaseAdmin.from("profile_views").insert({
    user_id: userId,
    visitor_ip: visitorHash,
  });
}
