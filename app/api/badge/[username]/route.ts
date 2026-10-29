import { supabaseAdmin } from "@/lib/supabase";
import { calculateStreaks } from "@/lib/streak";
import { getStoredTz } from "@/lib/tz-server";
import { NextRequest, NextResponse } from "next/server";
import { imagePalette, svgResponse, esc, SVG_MONO, type ImagePalette } from "@/lib/og/palette";
import { langOf } from "@/lib/og/widget-data";
import { daysAgoISO } from "@/lib/ui/format";

// Cache 1 saat — badge sık güncellenmez
export const revalidate = 3600;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, last_synced_at, theme_accent")
    .eq("username", username)
    .single();

  if (!user || !user.last_synced_at) {
    return new NextResponse("Not found", { status: 404 });
  }
  const themeAccent = user.theme_accent;

  // Bu haftaki commit sayısı
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  startOfWeek.setHours(0, 0, 0, 0);

  const { data: weeklyData } = await supabaseAdmin
    .from("daily_stats")
    .select("date, commit_count")
    .eq("user_id", user.id)
    .gte("date", startOfWeek.toISOString().slice(0, 10));

  const weeklyCommits = (weeklyData ?? []).reduce(
    (s, d) => s + d.commit_count,
    0
  );

  // Streak hesapla
  const { data: heatmapData } = await supabaseAdmin
    .from("daily_stats")
    .select("date, commit_count")
    .eq("user_id", user.id)
    .gte(
      "date",
      daysAgoISO(365).slice(0, 10)
    );

  const activeDates = (heatmapData ?? [])
    .filter((d) => d.commit_count > 0)
    .map((d) => d.date);

  const { currentStreak } = calculateStreaks(activeDates, await getStoredTz(user.id));

  // En aktif dil
  const { data: repoIds } = await supabaseAdmin
    .from("repositories")
    .select("id")
    .eq("user_id", user.id);

  const ids = (repoIds ?? []).map((r) => r.id);

  let topLang = "N/A";
  if (ids.length > 0) {
    const { data: langs } = await supabaseAdmin
      .from("repo_languages")
      .select("language, bytes")
      .in("repo_id", ids);

    const langMap = new Map<string, number>();
    for (const row of langs ?? []) {
      langMap.set(row.language, (langMap.get(row.language) ?? 0) + row.bytes);
    }
    const sorted = Array.from(langMap.entries()).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0) topLang = sorted[0][0];
  }

  const p = imagePalette(themeAccent, new URL(_req.url).searchParams);
  const en = langOf(_req) === "en";
  const svg = buildBadgeSvg({ username, streak: currentStreak, weeklyCommits, topLang, p, en });
  return svgResponse(svg);
}

/** shields.io-style: [mark devboard | 18d streak · 12 this week · TypeScript] */
function buildBadgeSvg({ username, streak, weeklyCommits, topLang, p, en }: { username: string; streak: number; weeklyCommits: number; topLang: string; p: ImagePalette; en: boolean }) {
  const right = `${streak}${en ? "d streak" : "g seri"} · ${weeklyCommits} ${en ? "this wk" : "bu hafta"} · ${topLang}`;
  const leftW = 82;
  const rightW = Math.round(right.length * 6.6 + 18);
  const W = leftW + rightW;
  const H = 22;
  const mark = [[1, 2, 4], [2, 4, 2], [4, 2, 0]]
    .flatMap((row, r) => row.map((lv, c) => `<rect x="${9 + c * 3.6}" y="${5 + r * 3.6}" width="3" height="3" rx="0.6" fill="${p.heat[lv]}"/>`))
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" role="img" aria-label="devboard: ${esc(right)}">
  <title>${esc(username)} · devboard: ${esc(right)}</title>
  <clipPath id="r"><rect width="${W}" height="${H}" rx="4"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${leftW}" height="${H}" fill="${p.bg2}"/>
    <rect x="${leftW}" width="${rightW}" height="${H}" fill="${p.ac}"/>
  </g>
  ${mark}
  <text x="25" y="15" font-family="${SVG_MONO}" font-size="11" font-weight="600" fill="${p.ink1}">devboard</text>
  <text x="${leftW + 9}" y="15" font-family="${SVG_MONO}" font-size="11" font-weight="600" fill="${p.onAc}">${esc(right)}</text>
</svg>`;
}
