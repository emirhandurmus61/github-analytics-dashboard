import { findUser, ownLanguages, langOf } from "@/lib/og/widget-data";
import { imagePalette, svgPanel, svgResponse, langHex, esc, SVG_MONO, SVG_SANS } from "@/lib/og/palette";

export const revalidate = 3600;

export async function GET(req: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const user = await findUser(username);
  if (!user) return new Response("Not found", { status: 404 });
  const p = imagePalette(user.theme_accent, new URL(req.url).searchParams);
  const en = langOf(req) === "en";
  const all = await ownLanguages(user.id);
  const top = all.slice(0, 6);
  const total = Math.max(1, all.reduce((s, [, b]) => s + b, 0));

  const W = 380;
  const rowH = 22;
  const H = 26 + 46 + Math.max(1, top.length) * rowH + 10;
  const barW = W - 28;
  let x = 14;
  const stack = top
    .map(([lang, bytes]) => {
      const w = Math.max(2, (bytes / total) * barW);
      const r = `<rect x="${x.toFixed(1)}" y="16" width="${(w - 1.5).toFixed(1)}" height="8" fill="${langHex(lang, p)}"/>`;
      x += w;
      return r;
    })
    .join("");
  const rows = top
    .map(([lang, bytes], i) => {
      const y = 50 + i * rowH;
      const pct = (bytes / total) * 100;
      return `<circle cx="18" cy="${y - 4}" r="4" fill="${langHex(lang, p)}"/>
    <text x="30" y="${y}" font-family="${SVG_SANS}" font-size="12" fill="${p.ink1}">${esc(lang)}</text>
    <rect x="160" y="${y - 7}" width="150" height="4" rx="2" fill="${p.bg3}"/>
    <rect x="160" y="${y - 7}" width="${Math.max(2, (pct / 100) * 150).toFixed(1)}" height="4" rx="2" fill="${langHex(lang, p)}"/>
    <text x="${W - 14}" y="${y}" font-family="${SVG_MONO}" font-size="11" fill="${p.ink2}" text-anchor="end">${pct.toFixed(1)}%</text>`;
    })
    .join("");
  const body = `<clipPath id="bar"><rect x="14" y="16" width="${barW}" height="8" rx="4"/></clipPath><rect x="14" y="16" width="${barW}" height="8" rx="4" fill="${p.bg3}"/><g clip-path="url(#bar)">${stack}</g>${
    top.length ? rows : `<text x="14" y="52" font-family="${SVG_SANS}" font-size="12" fill="${p.ink3}">${en ? "No language data yet" : "Henüz dil verisi yok"}</text>`
  }`;
  return svgResponse(svgPanel({ w: W, h: H, title: en ? "Languages" : "Diller", meta: `${all.length} · @${username}`, body, p, label: `${username} languages` }));
}
