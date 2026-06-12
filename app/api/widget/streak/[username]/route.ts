import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { calculateStreaks } from "@/lib/streak";
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

  const activeDates = (stats ?? []).filter((d) => d.commit_count > 0).map((d) => d.date);
  const { currentStreak, longestStreak } = calculateStreaks(activeDates);

  const W = 320; const H = 90;
  const bg = "#18181b";
  const border = "#27272a";

  const todayStr = new Date().toISOString().slice(0, 10);
  const hasToday = activeDates.includes(todayStr);
  const statusColor = currentStreak > 0 ? (hasToday ? ac : "#f59e0b") : "#52525b";
  const statusLabel = currentStreak > 0 ? (hasToday ? "Aktif" : "Risk altında") : "Streak yok";

  // Mini sparkline — son 14 gün
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86400000).toISOString().slice(0, 10);
    return (stats ?? []).find((s) => s.date === d)?.commit_count ?? 0;
  });
  const maxC = Math.max(...last14, 1);
  const barW = 12; const barGap = 3; const totalBarsW = 14 * (barW + barGap) - barGap;
  const barsX = W - totalBarsW - 16;
  const barsY = H / 2 - 18;
  const barsH = 36;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" role="img" aria-label="${username} streak">
  <title>${username} — Streak</title>
  <defs>
    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${ac}" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="${ac}" stop-opacity="0.3"/>
    </linearGradient>
    <clipPath id="card"><rect width="${W}" height="${H}" rx="10" ry="10"/></clipPath>
  </defs>
  <g clip-path="url(#card)">
    <!-- Card bg -->
    <rect width="${W}" height="${H}" fill="${bg}"/>
    <rect width="${W}" height="${H}" rx="10" ry="10" fill="none" stroke="${border}" stroke-width="1"/>
    <!-- Accent top border -->
    <rect width="${W}" height="2" fill="${ac}" opacity="0.8"/>

    <!-- Streak number -->
    <text x="18" y="38" font-family="system-ui,sans-serif" font-size="32" font-weight="800" fill="${ac}" letter-spacing="-1">${currentStreak}</text>
    <text x="18" y="54" font-family="system-ui,sans-serif" font-size="10" fill="#71717a" letter-spacing="1">GÜNLÜK STREAK</text>

    <!-- Status badge -->
    <rect x="16" y="62" width="${statusLabel.length * 6.5 + 12}" height="16" rx="4" fill="${statusColor}20"/>
    <text x="22" y="73.5" font-family="system-ui,sans-serif" font-size="8.5" font-weight="600" fill="${statusColor}">${statusLabel}</text>

    <!-- Longest streak -->
    <text x="16" y="${H - 8}" font-family="system-ui,sans-serif" font-size="8" fill="#3f3f46">En uzun: ${longestStreak} gün</text>

    <!-- Mini bar chart (last 14 days) -->
    ${last14.map((count, i) => {
      const barH = count > 0 ? Math.max((count / maxC) * barsH, 4) : 2;
      const x = barsX + i * (barW + barGap);
      const y = barsY + barsH - barH;
      return `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="2" fill="${count > 0 ? "url(#barGrad)" : "#27272a"}"/>`;
    }).join("\n    ")}

    <!-- "14g" label -->
    <text x="${barsX}" y="${barsY + barsH + 12}" font-family="system-ui,sans-serif" font-size="8" fill="#3f3f46">son 14 gün</text>
  </g>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
