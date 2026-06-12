import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { THEMES, isValidTheme, DEFAULT_THEME } from "@/lib/themes";

export const revalidate = 3600;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, theme_accent")
    .eq("username", username)
    .single();

  if (!user) return new NextResponse("Not found", { status: 404 });

  const accent = isValidTheme(user.theme_accent) ? user.theme_accent : DEFAULT_THEME;
  const theme = THEMES[accent];
  const ac = theme.accent;

  const { data: stats } = await supabaseAdmin
    .from("daily_stats")
    .select("date, commit_count")
    .eq("user_id", user.id)
    .gte("date", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
    .order("date", { ascending: true });

  const dateMap = new Map((stats ?? []).map((d) => [d.date, d.commit_count]));
  const maxC = Math.max(...(stats ?? []).map((d) => d.commit_count), 1);
  const yearlyTotal = (stats ?? []).reduce((s, d) => s + d.commit_count, 0);

  // Build 52 week grid
  const WEEKS = 52; const CELL = 10; const GAP = 2;
  const today = new Date();
  const dow = (today.getDay() + 6) % 7;
  const start = new Date(today);
  start.setDate(today.getDate() - dow - (WEEKS - 1) * 7);

  type Cell = { col: number; row: number; intensity: number };
  const cells: Cell[] = [];
  for (let w = 0; w < WEEKS; w++) {
    for (let d = 0; d < 7; d++) {
      const cur = new Date(start);
      cur.setDate(start.getDate() + w * 7 + d);
      if (cur > today) continue;
      const count = dateMap.get(cur.toISOString().slice(0, 10)) ?? 0;
      cells.push({ col: w, row: d, intensity: count / maxC });
    }
  }

  function cellFill(intensity: number) {
    if (intensity === 0) return "#1f1f23";
    if (intensity < 0.25) return `${ac}33`;
    if (intensity < 0.5)  return `${ac}66`;
    if (intensity < 0.75) return `${ac}aa`;
    return ac;
  }

  const LABEL_W = 0;
  const gridW = WEEKS * (CELL + GAP) - GAP;
  const gridH = 7 * (CELL + GAP) - GAP;
  const W = gridW + LABEL_W + 32;
  const H = gridH + 44;

  const cellsSvg = cells.map(({ col, row, intensity }) =>
    `<rect x="${LABEL_W + 16 + col * (CELL + GAP)}" y="${24 + row * (CELL + GAP)}" width="${CELL}" height="${CELL}" rx="2" fill="${cellFill(intensity)}"/>`
  ).join("\n  ");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" role="img" aria-label="${username} contributions">
  <title>${username} — Contributions</title>
  <defs><clipPath id="card"><rect width="${W}" height="${H}" rx="10" ry="10"/></clipPath></defs>
  <g clip-path="url(#card)">
    <rect width="${W}" height="${H}" fill="#18181b"/>
    <rect width="${W}" height="${H}" rx="10" ry="10" fill="none" stroke="#27272a" stroke-width="1"/>
    <rect width="${W}" height="2" fill="${ac}" opacity="0.8"/>

    <!-- Header -->
    <text x="16" y="16" font-family="system-ui,sans-serif" font-size="9" font-weight="700" fill="#71717a" letter-spacing="1">CONTRIBUTIONS</text>
    <text x="${W - 16}" y="16" font-family="system-ui,sans-serif" font-size="9" fill="${ac}" text-anchor="end" font-weight="700">${yearlyTotal.toLocaleString("tr-TR")} commit</text>

    <!-- Cells -->
    ${cellsSvg}

    <!-- Legend -->
    <text x="16" y="${H - 6}" font-family="system-ui,sans-serif" font-size="8" fill="#3f3f46">Az</text>
    <rect x="30" y="${H - 14}" width="8" height="8" rx="2" fill="#1f1f23"/>
    <rect x="41" y="${H - 14}" width="8" height="8" rx="2" fill="${ac}33"/>
    <rect x="52" y="${H - 14}" width="8" height="8" rx="2" fill="${ac}66"/>
    <rect x="63" y="${H - 14}" width="8" height="8" rx="2" fill="${ac}aa"/>
    <rect x="74" y="${H - 14}" width="8" height="8" rx="2" fill="${ac}"/>
    <text x="86" y="${H - 6}" font-family="system-ui,sans-serif" font-size="8" fill="#3f3f46">Çok</text>
  </g>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
