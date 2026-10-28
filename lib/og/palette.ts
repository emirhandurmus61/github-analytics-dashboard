/**
 * Colors and frames for server-rendered images (SVG widgets, PNG cards).
 * Images have no CSS cascade, so tokens are resolved to hex here from the
 * same scheme definitions the app uses. `?scheme=<id>` picks any scheme;
 * `?theme=light|dark` picks the Devboard pair.
 */
import { SCHEMES, isSchemeId, type Scheme } from "@/lib/ui/schemes";
import { ACCENT_HUE, isValidTheme, DEFAULT_THEME, type ThemeAccent } from "@/lib/themes";
import { LANG_COLORS } from "@/lib/ui/lang-colors";

function hexToRgb(h: string) {
  const n = h.replace("#", "");
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
}

/** Linear sRGB mix: t=1 → a, t=0 → b. */
export function mix(a: string, b: string, t: number) {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return (
    "#" +
    A.map((v, i) => Math.round(v * t + B[i] * (1 - t)))
      .map((v) => v.toString(16).padStart(2, "0"))
      .join("")
  );
}

export type ImagePalette = {
  scheme: Scheme;
  bg0: string;
  bg1: string;
  bg2: string;
  bg3: string;
  line: string;
  line2: string;
  ink1: string;
  ink2: string;
  ink3: string;
  ink4: string;
  ac: string;
  onAc: string;
  heat: [string, string, string, string, string];
  good: string;
  bad: string;
  warn: string;
  hue: Scheme["hue"];
};

export function imagePalette(accentRaw: unknown, params?: URLSearchParams | null): ImagePalette {
  const accent: ThemeAccent = isValidTheme(accentRaw) ? accentRaw : DEFAULT_THEME;
  const schemeParam = params?.get("scheme");
  const themeParam = params?.get("theme");
  const s = SCHEMES[isSchemeId(schemeParam) ? schemeParam : themeParam === "light" ? "devboard-day" : "devboard-night"];
  const ac = s.hue[ACCENT_HUE[accent]];
  return {
    scheme: s,
    bg0: s.bg[0],
    bg1: s.bg[1],
    bg2: s.bg[2],
    bg3: s.bg[3],
    line: s.line,
    line2: s.line2,
    ink1: s.ink[0],
    ink2: s.ink[1],
    ink3: s.ink[2],
    ink4: s.ink[3],
    ac,
    onAc: s.onAccent,
    heat: [s.bg[3], mix(ac, s.bg[3], 0.3), mix(ac, s.bg[3], 0.52), mix(ac, s.bg[3], 0.76), ac],
    good: s.hue.green,
    bad: s.hue.red,
    warn: s.hue.yellow,
    hue: s.hue,
  };
}

/** Hex color for a language; unknown ones fall back to a scheme hue. */
export function langHex(lang: string | null | undefined, p: ImagePalette) {
  if (!lang) return p.ink4;
  if (LANG_COLORS[lang]) return LANG_COLORS[lang];
  const list = [p.hue.purple, p.hue.cyan, p.hue.orange, p.hue.pink, p.hue.blue, p.hue.yellow];
  let h = 0;
  for (let i = 0; i < lang.length; i++) h = (h * 31 + lang.charCodeAt(i)) >>> 0;
  return list[h % list.length];
}

/** Heat level 0–4 by quartiles of the non-zero values. */
export function quartileLevel(values: number[]) {
  const nz = values.filter((v) => v > 0).sort((a, b) => a - b);
  const q = (t: number) => nz[Math.min(nz.length - 1, Math.floor(t * nz.length))] ?? 1;
  const [q1, q2, q3] = [q(0.25), q(0.5), q(0.75)];
  return (v: number) => (v <= 0 ? 0 : v <= q1 ? 1 : v <= q2 ? 2 : v <= q3 ? 3 : 4);
}

export const SVG_MONO = "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace";
export const SVG_SANS = "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * A panel in the editor style: tab strip header with the title as the open
 * tab (accent top line), meta on the right, body below.
 */
export function svgPanel({ w, h, title, meta, body, p, label }: { w: number; h: number; title: string; meta?: string; body: string; p: ImagePalette; label: string }) {
  const head = 26;
  const tabW = Math.round(title.length * 7.2 + 34);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">
  <title>${esc(label)}</title>
  <defs><clipPath id="c"><rect width="${w}" height="${h}" rx="8"/></clipPath></defs>
  <g clip-path="url(#c)">
    <rect width="${w}" height="${h}" fill="${p.bg1}"/>
    <rect width="${w}" height="${head}" fill="${mix(p.bg0, p.bg1, 0.5)}"/>
    <rect x="0" y="0" width="${tabW}" height="${head + 1}" fill="${p.bg1}"/>
    <rect x="0" y="0" width="${tabW}" height="1.5" fill="${p.ac}"/>
    <line x1="${tabW}" y1="${head - 0.5}" x2="${w}" y2="${head - 0.5}" stroke="${p.line}"/>
    <line x1="${tabW + 0.5}" y1="0" x2="${tabW + 0.5}" y2="${head}" stroke="${p.line}"/>
    <g transform="translate(12 ${head / 2})">
      <rect x="0" y="-4" width="3" height="3" rx="0.6" fill="${p.heat[1]}"/><rect x="4" y="-4" width="3" height="3" rx="0.6" fill="${p.heat[4]}"/>
      <rect x="0" y="0" width="3" height="3" rx="0.6" fill="${p.heat[4]}"/><rect x="4" y="0" width="3" height="3" rx="0.6" fill="${p.heat[2]}"/>
    </g>
    <text x="25" y="${head / 2 + 4}" font-family="${SVG_SANS}" font-size="12" font-weight="600" fill="${p.ink1}">${esc(title)}</text>
    ${meta ? `<text x="${w - 12}" y="${head / 2 + 4}" font-family="${SVG_MONO}" font-size="10.5" fill="${p.ink3}" text-anchor="end">${esc(meta)}</text>` : ""}
    <g transform="translate(0 ${head})">${body}</g>
  </g>
  <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="7.5" fill="none" stroke="${p.line}"/>
</svg>`;
}

export function svgResponse(svg: string) {
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
