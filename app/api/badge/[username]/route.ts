import { supabaseAdmin } from "@/lib/supabase";
import { calculateStreaks } from "@/lib/streak";
import { NextRequest, NextResponse } from "next/server";

// Cache 1 saat — badge sık güncellenmez
export const revalidate = 3600;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, last_synced_at")
    .eq("username", username)
    .single();

  if (!user || !user.last_synced_at) {
    return new NextResponse("Not found", { status: 404 });
  }

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
      new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    );

  const activeDates = (heatmapData ?? [])
    .filter((d) => d.commit_count > 0)
    .map((d) => d.date);

  const { currentStreak } = calculateStreaks(activeDates);

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

  const svg = buildBadgeSvg({
    username,
    streak: currentStreak,
    weeklyCommits,
    topLang,
  });

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

function buildBadgeSvg({
  username,
  streak,
  weeklyCommits,
  topLang,
}: {
  username: string;
  streak: number;
  weeklyCommits: number;
  topLang: string;
}) {
  const LANG_COLORS: Record<string, string> = {
    TypeScript: "#3178c6",
    JavaScript: "#f1e05a",
    Python: "#3572A5",
    Rust: "#dea584",
    Go: "#00ADD8",
    CSS: "#563d7c",
    HTML: "#e34c26",
    Java: "#b07219",
    "C++": "#f34b7d",
    "C#": "#178600",
    C: "#555555",
  };

  const langColor = LANG_COLORS[topLang] ?? "#6b7280";

  // Badge genişlikleri: sol (label) + sağ (değer) kutucukları
  // Sabit genişlik: 380px total, 3 bölüm
  const W = 380;
  const H = 28;
  const labelBg = "#1f1f23";
  const valueBg = "#27272a";

  // Bölüm genişlikleri
  const col1 = 115; // streak
  const col2 = 115; // weekly commits
  const col3 = W - col1 - col2; // top lang

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" role="img" aria-label="Dev Analytics: ${username}">
  <title>${username} — Dev Analytics</title>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${labelBg}" stop-opacity="1"/>
      <stop offset="1" stop-color="${labelBg}" stop-opacity="0.95"/>
    </linearGradient>
    <clipPath id="r">
      <rect width="${W}" height="${H}" rx="6" ry="6"/>
    </clipPath>
  </defs>
  <g clip-path="url(#r)">
    <!-- Background -->
    <rect width="${W}" height="${H}" fill="${labelBg}"/>
    <!-- Divider lines -->
    <line x1="${col1}" y1="0" x2="${col1}" y2="${H}" stroke="#3f3f46" stroke-width="1"/>
    <line x1="${col1 + col2}" y1="0" x2="${col1 + col2}" y2="${H}" stroke="#3f3f46" stroke-width="1"/>

    <!-- Streak section -->
    <text x="8" y="11" font-family="DejaVu Sans,sans-serif" font-size="8" fill="#71717a">🔥 STREAK</text>
    <text x="8" y="22" font-family="DejaVu Sans,sans-serif" font-size="10" font-weight="bold" fill="#f4f4f5">${streak} gün</text>

    <!-- Weekly commits section -->
    <text x="${col1 + 8}" y="11" font-family="DejaVu Sans,sans-serif" font-size="8" fill="#71717a">⚡ BU HAFTA</text>
    <text x="${col1 + 8}" y="22" font-family="DejaVu Sans,sans-serif" font-size="10" font-weight="bold" fill="#f4f4f5">${weeklyCommits} commit</text>

    <!-- Top lang section -->
    <circle cx="${col1 + col2 + 11}" cy="${H / 2}" r="4" fill="${langColor}"/>
    <text x="${col1 + col2 + 20}" y="11" font-family="DejaVu Sans,sans-serif" font-size="8" fill="#71717a">TOP DİL</text>
    <text x="${col1 + col2 + 20}" y="22" font-family="DejaVu Sans,sans-serif" font-size="10" font-weight="bold" fill="#f4f4f5">${escXml(topLang)}</text>
  </g>
</svg>`;
}

function escXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
