import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { THEMES, isValidTheme, DEFAULT_THEME } from "@/lib/themes";

export const revalidate = 3600;

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
  Rust: "#dea584", Go: "#00ADD8", CSS: "#563d7c", HTML: "#e34c26",
  Java: "#b07219", "C++": "#f34b7d", "C#": "#178600", C: "#555555",
  Ruby: "#701516", Swift: "#F05138", Kotlin: "#A97BFF",
};

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

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

  const { data: repoIds } = await supabaseAdmin
    .from("repositories")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_fork", false);

  const ids = (repoIds ?? []).map((r) => r.id);

  const langMap = new Map<string, number>();
  if (ids.length > 0) {
    const { data: langs } = await supabaseAdmin
      .from("repo_languages")
      .select("language, bytes")
      .in("repo_id", ids);
    for (const row of langs ?? [])
      langMap.set(row.language, (langMap.get(row.language) ?? 0) + row.bytes);
  }

  const top5 = Array.from(langMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const total = top5.reduce((s, [, b]) => s + b, 0);

  const W = 320;
  const ROW_H = 28;
  const H = 52 + top5.length * ROW_H;
  const bg = "#18181b";
  const border = "#27272a";

  const rows = top5.map(([lang, bytes], i) => {
    const pct = total > 0 ? (bytes / total) * 100 : 0;
    const color = LANG_COLORS[lang] ?? "#6b7280";
    const y = 44 + i * ROW_H;
    const barMaxW = W - 32 - 60; // 60 = label area
    const barW = Math.round((pct / 100) * barMaxW);
    return `
    <!-- Row ${i} -->
    <circle cx="24" cy="${y + 7}" r="4" fill="${color}"/>
    <text x="34" y="${y + 11}" font-family="system-ui,sans-serif" font-size="11" fill="#d4d4d8">${esc(lang)}</text>
    <text x="${W - 12}" y="${y + 11}" font-family="system-ui,sans-serif" font-size="10" fill="#52525b" text-anchor="end">${pct.toFixed(1)}%</text>
    <rect x="16" y="${y + 16}" width="${barMaxW + 44}" height="3" rx="2" fill="#27272a"/>
    <rect x="16" y="${y + 16}" width="${barW + 44 > barMaxW + 44 ? barMaxW + 44 : barW}" height="3" rx="2" fill="${color}" opacity="0.85"/>`;
  }).join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" role="img" aria-label="${username} languages">
  <title>${username} — Top Languages</title>
  <defs><clipPath id="card"><rect width="${W}" height="${H}" rx="10" ry="10"/></clipPath></defs>
  <g clip-path="url(#card)">
    <rect width="${W}" height="${H}" fill="${bg}"/>
    <rect width="${W}" height="${H}" rx="10" ry="10" fill="none" stroke="${border}" stroke-width="1"/>
    <rect width="${W}" height="2" fill="${ac}" opacity="0.8"/>
    <text x="18" y="22" font-family="system-ui,sans-serif" font-size="11" font-weight="700" fill="#a1a1aa" letter-spacing="1">TOP LANGUAGES</text>
    <text x="${W - 12}" y="22" font-family="system-ui,sans-serif" font-size="9" fill="#3f3f46" text-anchor="end">${langMap.size} dil toplam</text>
    ${rows}
  </g>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
