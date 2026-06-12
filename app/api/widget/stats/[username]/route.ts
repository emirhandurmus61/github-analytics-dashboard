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

  const { data: reposRow } = await supabaseAdmin
    .from("repositories")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_fork", false);
  const ownIds = (reposRow ?? []).map((r) => r.id);

  const [reposRes, statsRes, starsRes] = await Promise.all([
    supabaseAdmin.from("repositories").select("count", { count: "exact", head: true }).eq("user_id", user.id),
    supabaseAdmin.from("daily_stats").select("date, commit_count").eq("user_id", user.id)
      .gte("date", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)),
    supabaseAdmin.from("repositories").select("stars").in("id", ownIds),
  ]);

  const heatmap = statsRes.data ?? [];
  const activeDates = heatmap.filter((d) => d.commit_count > 0).map((d) => d.date);
  const { currentStreak, totalActiveDays } = calculateStreaks(activeDates);
  const yearlyCommits = heatmap.reduce((s, d) => s + d.commit_count, 0);
  const totalStars = (starsRes.data ?? []).reduce((s, r) => s + (r.stars ?? 0), 0);
  const repoCount = reposRes.count ?? 0;

  const W = 320; const H = 100;
  const bg = "#18181b";
  const border = "#27272a";

  const items = [
    { label: "Commit", value: yearlyCommits.toLocaleString("tr-TR"), icon: "M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" },
    { label: "Streak", value: `${currentStreak}g`, icon: "M13 10V3L4 14h7v7l9-11h-7z" },
    { label: "Repos", value: String(repoCount), icon: "M3 7l9-4 9 4v10l-9 4-9-4V7z" },
    { label: "Yıldız", value: totalStars.toLocaleString("tr-TR"), icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
  ];

  const colW = W / 4;

  const cols = items.map(({ label, value, icon }, i) => {
    const cx = i * colW + colW / 2;
    return `
    <!-- Col ${i} -->
    <svg x="${i * colW}" y="0" width="${colW}" height="${H}" overflow="visible">
      ${i > 0 ? `<line x1="0" y1="20" x2="0" y2="${H - 20}" stroke="${border}" stroke-width="1"/>` : ""}
      <svg x="${colW / 2 - 8}" y="18" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${ac}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="${icon}"/>
      </svg>
      <text x="${colW / 2}" y="52" font-family="system-ui,sans-serif" font-size="${value.length > 4 ? 14 : 18}" font-weight="800" fill="${ac}" text-anchor="middle" letter-spacing="-0.5">${value}</text>
      <text x="${colW / 2}" y="66" font-family="system-ui,sans-serif" font-size="8.5" fill="#52525b" text-anchor="middle" letter-spacing="0.5">${label.toUpperCase()}</text>
    </svg>`;
  }).join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" role="img" aria-label="${username} stats">
  <title>${username} — Stats</title>
  <defs><clipPath id="card"><rect width="${W}" height="${H}" rx="10" ry="10"/></clipPath></defs>
  <g clip-path="url(#card)">
    <rect width="${W}" height="${H}" fill="${bg}"/>
    <rect width="${W}" height="${H}" rx="10" ry="10" fill="none" stroke="${border}" stroke-width="1"/>
    <rect width="${W}" height="2" fill="${ac}" opacity="0.8"/>
    ${cols}
    <!-- bottom label -->
    <text x="${W / 2}" y="${H - 7}" font-family="system-ui,sans-serif" font-size="8" fill="#3f3f46" text-anchor="middle">${totalActiveDays} aktif gün · son 1 yıl</text>
  </g>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
