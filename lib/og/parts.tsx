/* Building blocks for next/og (Satori) images. Flexbox only, inline styles. */
import type { ImagePalette } from "./palette";
import { langHex, quartileLevel } from "./palette";
import { OG_MONO, OG_SANS } from "./fonts";

export function Mark({ p, size = 20 }: { p: ImagePalette; size?: number }) {
  const cells = [1, 2, 4, 2, 4, 2, 4, 2, 0];
  const c = size / 3.6;
  const g = (size - c * 3) / 2;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", width: size, height: size, gap: g }}>
      {cells.map((lv, i) => (
        <div key={i} style={{ width: c, height: c, borderRadius: c / 4, background: p.heat[lv] }} />
      ))}
    </div>
  );
}

export function Brand({ p, right }: { p: ImagePalette; right?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Mark p={p} size={20} />
        <span style={{ fontFamily: OG_MONO, fontSize: 18, fontWeight: 600, color: p.ink2 }}>devboard</span>
      </div>
      {right && <span style={{ fontFamily: OG_MONO, fontSize: 16, color: p.ink3 }}>{right}</span>}
    </div>
  );
}

export function Stat({ p, value, label, accent, size = 40 }: { p: ImagePalette; value: string; label: string; accent?: boolean; size?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontFamily: OG_MONO, fontSize: size, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1, color: accent ? p.ac : p.ink1 }}>{value}</span>
      <span style={{ fontFamily: OG_SANS, fontSize: Math.max(13, size * 0.36), color: p.ink3 }}>{label}</span>
    </div>
  );
}

/** Contribution grid for the last `weeks` weeks, Monday first. */
export function Heat({ p, days, weeks, cell, gap }: { p: ImagePalette; days: { date: string; commit_count: number }[]; weeks: number; cell: number; gap: number }) {
  const map = new Map(days.map((d) => [d.date, d.commit_count]));
  const level = quartileLevel(days.map((d) => d.commit_count));
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const dow = (today.getDay() + 6) % 7;
  const start = new Date(today);
  start.setDate(today.getDate() - dow - (weeks - 1) * 7);
  const cols = Array.from({ length: weeks }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const cur = new Date(start);
      cur.setDate(start.getDate() + w * 7 + d);
      if (cur > today) return null;
      return level(map.get(cur.toISOString().slice(0, 10)) ?? 0);
    }),
  );
  return (
    <div style={{ display: "flex", gap }}>
      {cols.map((col, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", gap }}>
          {col.map((lv, j) => (
            <div key={j} style={{ width: cell, height: cell, borderRadius: Math.max(2, cell / 5), background: lv === null ? "transparent" : p.heat[lv] }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function LangBar({ p, langs, width, legend = true, size = 15 }: { p: ImagePalette; langs: [string, number][]; width: number; legend?: boolean; size?: number }) {
  const total = Math.max(1, langs.reduce((s, [, b]) => s + b, 0));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width }}>
      <div style={{ display: "flex", width, height: 10, borderRadius: 5, overflow: "hidden", background: p.bg3 }}>
        {langs.map(([l, b]) => (
          <div key={l} style={{ width: (b / total) * width, height: 10, background: langHex(l, p), marginRight: 2 }} />
        ))}
      </div>
      {legend && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 18 }}>
          {langs.map(([l, b]) => (
            <div key={l} style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 9, height: 9, borderRadius: 5, background: langHex(l, p) }} />
              <span style={{ fontFamily: OG_SANS, fontSize: size, color: p.ink2 }}>{l}</span>
              <span style={{ fontFamily: OG_MONO, fontSize: size - 2, color: p.ink4 }}>{Math.round((b / total) * 100)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Tag({ p, children }: { p: ImagePalette; children: string }) {
  return (
    <span style={{ fontFamily: OG_MONO, fontSize: 15, color: p.ink2, background: p.bg2, border: `1px solid ${p.line}`, borderRadius: 6, padding: "4px 10px" }}>{children}</span>
  );
}

export function Avatar({ p, src, size, name }: { p: ImagePalette; src: string | null; size: number; name: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} width={size} height={size} alt="" style={{ borderRadius: size * 0.18, border: `1px solid ${p.line2}` }} />
  ) : (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: size, height: size, borderRadius: size * 0.18, background: p.bg2, color: p.ink3, fontFamily: OG_SANS, fontSize: size * 0.4, fontWeight: 800 }}>
      {name[0]?.toUpperCase()}
    </div>
  );
}
