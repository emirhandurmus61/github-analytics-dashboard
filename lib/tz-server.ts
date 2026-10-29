import { cookies, headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import { isValidTz, TZ_COOKIE } from "@/lib/tz";

/** The viewer's timezone: browser-reported cookie, then edge geo header, then UTC. */
export async function getRequestTz(): Promise<string> {
  const fromCookie = (await cookies()).get(TZ_COOKIE)?.value;
  if (isValidTz(fromCookie)) return fromCookie;
  const fromGeo = (await headers()).get("x-vercel-ip-timezone");
  if (isValidTz(fromGeo)) return fromGeo;
  return "UTC";
}

/** Remember the viewer's timezone so background jobs bucket their days the same way. Column is optional (schema_v13). */
export async function saveUserTz(userId: string, tz: string) {
  if (tz === "UTC") return; // no signal; don't clobber a real value
  await supabaseAdmin.from("users").update({ timezone: tz }).eq("id", userId);
}

export async function getStoredTz(userId: string): Promise<string> {
  const { data } = await supabaseAdmin.from("users").select("timezone").eq("id", userId).single();
  const tz = (data as { timezone?: string | null } | null)?.timezone;
  return isValidTz(tz) ? tz : "UTC";
}
