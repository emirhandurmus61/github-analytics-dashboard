import { supabaseAdmin } from "@/lib/supabase";
import { findUser, yearDays, langOf } from "@/lib/og/widget-data";
import { imagePalette, svgPanel, svgResponse, SVG_MONO, SVG_SANS } from "@/lib/og/palette";

export const revalidate = 3600;

export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const user = await findUser(username);
  if (!user) return new Response("Not found", { status: 404 });
  const p = imagePalette(user.theme_accent, new URL(req.url).searchParams);
  const l = langOf(req);
  const en = l === "en";
  const loc = en ? "en-US" : "tr-TR";
  const [{ streak, total }, repos] = await Promise.all([
    yearDays(user.id),
    supabaseAdmin.from("repositories").select("stars, is_fork").eq("user_id", user.id),
  ]);
  const rows = repos.data ?? [];
  const stars = rows.filter((r) => !r.is_fork).reduce((s, r) => s + (r.stars ?? 0), 0);

  const items = [
    { v: total.toLocaleString(loc), k: en ? "commits / yr" : "commit / yıl", c: p.ink1 },
    { v: `${streak.currentStreak}`, k: en ? "day streak" : "gün seri", c: streak.currentStreak ? p.ac : p.ink1 },
    { v: `${streak.totalActiveDays}`, k: en ? "active days" : "aktif gün", c: p.ink1 },
    { v: `${rows.length}`, k: "repo", c: p.ink1 },
    { v: stars.toLocaleString(loc), k: en ? "stars" : "yıldız", c: p.ink1 },
  ];
  const W = 480;
  const H = 98;
  const colW = (W - 28) / items.length;
  const body = items
    .map((it, i) => {
      const x = 14 + i * colW;
      return `${i ? `<line x1="${x - 8}" y1="16" x2="${x - 8}" y2="56" stroke="${p.line}"/>` : ""}
    <text x="${x}" y="40" font-family="${SVG_MONO}" font-size="${it.v.length > 5 ? 19 : 23}" font-weight="800" fill="${it.c}" letter-spacing="-0.6">${it.v}</text>
    <text x="${x}" y="58" font-family="${SVG_SANS}" font-size="11" fill="${p.ink3}">${it.k}</text>`;
    })
    .join("");
  return svgResponse(svgPanel({ w: W, h: H, title: "devboard", meta: `@${username}`, body, p, label: `${username} stats` }));
}
