import { findUser, yearDays, langOf } from "@/lib/og/widget-data";
import { dayKey, shiftDay } from "@/lib/tz";
import { imagePalette, svgPanel, svgResponse, SVG_MONO, SVG_SANS } from "@/lib/og/palette";

export const revalidate = 3600;

export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const user = await findUser(username);
  if (!user) return new Response("Not found", { status: 404 });
  const p = imagePalette(user.theme_accent, new URL(req.url).searchParams);
  const en = langOf(req) === "en";
  const { days, streak, tz } = await yearDays(user.id);
  const map = new Map(days.map((d) => [d.date, d.commit_count]));
  const today = dayKey(Date.now(), tz);
  const hasToday = (map.get(today) ?? 0) > 0;
  const cur = streak.currentStreak;

  // Last 21 days; the running streak is painted in the accent.
  const N = 21;
  const end = hasToday ? 0 : 1;
  const cells = Array.from({ length: N }, (_, i) => {
    const back = N - 1 - i;
    const date = shiftDay(today, -back);
    const v = map.get(date) ?? 0;
    const inStreak = cur > 0 && back >= end && back < end + cur;
    return { v, inStreak, today: back === 0 };
  });

  const W = 380;
  const H = 132;
  const gap = 3;
  const cell = (W - 28 - gap * (N - 1)) / N;
  const status = hasToday
    ? { c: p.good, t: en ? "committed today" : "bugün commit var" }
    : cur > 0
      ? { c: p.warn, t: en ? "no commit yet today" : "bugün henüz commit yok" }
      : { c: p.ink4, t: en ? "no active streak" : "aktif seri yok" };
  const numW = String(cur).length * 25;

  const body = `
    <text x="14" y="48" font-family="${SVG_MONO}" font-size="40" font-weight="800" fill="${cur > 0 ? p.ac : p.ink2}" letter-spacing="-1.5">${cur}</text>
    <text x="${14 + numW + 6}" y="48" font-family="${SVG_SANS}" font-size="12" fill="${p.ink3}">${en ? (cur === 1 ? "day streak" : "day streak") : "günlük seri"}</text>
    <circle cx="${W - 14 - status.t.length * 6.3 - 9}" cy="27" r="3" fill="${status.c}"/>
    <text x="${W - 14}" y="31" font-family="${SVG_SANS}" font-size="11.5" fill="${p.ink2}" text-anchor="end">${status.t}</text>
    <text x="${W - 14}" y="48" font-family="${SVG_MONO}" font-size="10.5" fill="${p.ink3}" text-anchor="end">${en ? "best" : "en iyi"} <tspan fill="${p.ink1}">${streak.longestStreak}</tspan> · ${en ? "active" : "aktif"} <tspan fill="${p.ink1}">${streak.totalActiveDays}</tspan></text>
    <text x="14" y="72" font-family="${SVG_MONO}" font-size="9.5" fill="${p.ink4}">${en ? "last 21 days" : "son 21 gün"}</text>
    ${cells
      .map((c, i) => {
        const x = 14 + i * (cell + gap);
        const fill = c.inStreak ? p.ac : c.v > 0 ? p.heat[2] : p.bg3;
        return `<rect x="${x.toFixed(1)}" y="80" width="${cell.toFixed(1)}" height="${cell.toFixed(1)}" rx="2.5" fill="${fill}"${c.today ? ` stroke="${p.ink2}" stroke-width="1"` : ""}/>`;
      })
      .join("")}`;

  return svgResponse(svgPanel({ w: W, h: H, title: en ? "Streak" : "Seri", meta: `@${username}`, body, p, label: `${username} streak: ${cur}` }));
}
