import { findUser, yearDays, langOf } from "@/lib/og/widget-data";
import { imagePalette, svgPanel, svgResponse, quartileLevel, SVG_MONO, SVG_SANS } from "@/lib/og/palette";
import { MONTHS_SHORT } from "@/lib/ui/format";

export const revalidate = 3600;

export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const user = await findUser(username);
  if (!user) return new Response("Not found", { status: 404 });
  const p = imagePalette(user.theme_accent, new URL(req.url).searchParams);
  const l = langOf(req);
  const en = l === "en";
  const { days, streak, total } = await yearDays(user.id);
  const map = new Map(days.map((d) => [d.date, d.commit_count]));
  const level = quartileLevel(days.map((d) => d.commit_count));

  const WEEKS = 53;
  const C = 11;
  const G = 3;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const dow = (today.getDay() + 6) % 7;
  const start = new Date(today);
  start.setDate(today.getDate() - dow - (WEEKS - 1) * 7);

  const ox = 40;
  const oy = 30;
  let cells = "";
  let months = "";
  let lastMonth = -1;
  for (let w = 0; w < WEEKS; w++) {
    const first = new Date(start);
    first.setDate(start.getDate() + w * 7);
    if (first.getMonth() !== lastMonth) {
      if (w > 0 || first.getDate() <= 7) months += `<text x="${ox + w * (C + G)}" y="${oy - 8}" font-family="${SVG_MONO}" font-size="9.5" fill="${p.ink4}">${MONTHS_SHORT[l][first.getMonth()]}</text>`;
      lastMonth = first.getMonth();
    }
    for (let d = 0; d < 7; d++) {
      const cur = new Date(start);
      cur.setDate(start.getDate() + w * 7 + d);
      if (cur > today) continue;
      const v = map.get(cur.toISOString().slice(0, 10)) ?? 0;
      cells += `<rect x="${ox + w * (C + G)}" y="${oy + d * (C + G)}" width="${C}" height="${C}" rx="2.5" fill="${p.heat[level(v)]}"/>`;
    }
  }
  const dayNames = en ? ["Mon", "", "Wed", "", "Fri", "", "Sun"] : ["Pzt", "", "Çar", "", "Cum", "", "Paz"];
  const dayLabels = dayNames.map((n, i) => (n ? `<text x="12" y="${oy + i * (C + G) + 9}" font-family="${SVG_MONO}" font-size="9" fill="${p.ink4}">${n}</text>` : "")).join("");
  const gridH = 7 * (C + G) - G;
  const W = ox + WEEKS * (C + G) - G + 16;
  const fy = oy + gridH + 22;
  const H = 26 + fy + 14;
  const legendX = W - 16 - 5 * 13 - 50;
  const legend =
    `<text x="${legendX}" y="${fy}" font-family="${SVG_MONO}" font-size="9.5" fill="${p.ink4}">${en ? "less" : "az"}</text>` +
    p.heat.map((c, i) => `<rect x="${legendX + 24 + i * 13}" y="${fy - 9}" width="10" height="10" rx="2" fill="${c}"/>`).join("") +
    `<text x="${legendX + 24 + 5 * 13 + 4}" y="${fy}" font-family="${SVG_MONO}" font-size="9.5" fill="${p.ink4}">${en ? "more" : "çok"}</text>`;
  const facts = `<text x="${ox}" y="${fy}" font-family="${SVG_SANS}" font-size="11" fill="${p.ink3}">${en ? "active days" : "aktif gün"} <tspan font-family="${SVG_MONO}" fill="${p.ink1}" font-weight="700">${streak.totalActiveDays}</tspan>   ${en ? "longest streak" : "en uzun seri"} <tspan font-family="${SVG_MONO}" fill="${p.ink1}" font-weight="700">${streak.longestStreak}</tspan>   ${en ? "current" : "güncel"} <tspan font-family="${SVG_MONO}" fill="${streak.currentStreak ? p.ac : p.ink1}" font-weight="700">${streak.currentStreak}</tspan></text>`;

  const body = months + dayLabels + cells + facts + legend;
  return svgResponse(
    svgPanel({ w: W, h: H, title: en ? "Contributions" : "Katkılar", meta: `${total.toLocaleString(en ? "en-US" : "tr-TR")} commit · @${username}`, body, p, label: `${username} contributions: ${total}` }),
  );
}
