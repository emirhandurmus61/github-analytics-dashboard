"use client";

import { Sunrise, Sun, Sunset, Moon, Clock3 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Panel, Track } from "@/components/ui/primitives";
import { KV } from "@/components/ui/glance";
import { useWidgetSize } from "@/components/ui/widget-size";
import { WEEKDAYS_SHORT, fmtPct, cn, type Lang } from "@/lib/ui/format";

type HourEntry = { hour: number; day: number; count: number };
type PeriodKey = "morning" | "afternoon" | "evening" | "night";

const PERIODS: { key: PeriodKey; tr: string; en: string; coderTr: string; coderEn: string; icon: typeof Sun; hours: number[] }[] = [
  { key: "morning", tr: "Sabah", en: "Morning", coderTr: "Sabahçı", coderEn: "Early bird", icon: Sunrise, hours: [6, 7, 8, 9, 10, 11] },
  { key: "afternoon", tr: "Öğleden sonra", en: "Afternoon", coderTr: "Gündüzcü", coderEn: "Day coder", icon: Sun, hours: [12, 13, 14, 15, 16, 17] },
  { key: "evening", tr: "Akşam", en: "Evening", coderTr: "Akşamcı", coderEn: "Evening coder", icon: Sunset, hours: [18, 19, 20, 21] },
  { key: "night", tr: "Gece", en: "Night", coderTr: "Gece kuşu", coderEn: "Night owl", icon: Moon, hours: [22, 23, 0, 1, 2, 3, 4, 5] },
];

function analyze(hourData: HourEntry[], timestamps: string[]) {
  const grid = Array.from({ length: 7 }, () => new Array(24).fill(0) as number[]);
  for (const { hour, day, count } of hourData) if (day >= 0 && day < 7 && hour >= 0 && hour < 24) grid[day][hour] = count;
  const hours = Array.from({ length: 24 }, (_, h) => grid.reduce((s, r) => s + r[h], 0));
  const days = grid.map((r) => r.reduce((s, c) => s + c, 0));
  const total = hours.reduce((s, v) => s + v, 0);
  const period = Object.fromEntries(PERIODS.map((p) => [p.key, p.hours.reduce((s, h) => s + hours[h], 0)])) as Record<PeriodKey, number>;
  const top = PERIODS.reduce((a, b) => (period[b.key] > period[a.key] ? b : a));
  const peakHour = hours.indexOf(Math.max(...hours));
  const peakDay = days.indexOf(Math.max(...days));
  const weekday = days.slice(0, 5).reduce((s, v) => s + v, 0);

  let session = 0;
  if (timestamps.length) {
    const sorted = [...timestamps].sort();
    let a = new Date(sorted[0]).getTime();
    let b = a;
    for (let i = 1; i < sorted.length; i++) {
      const t = new Date(sorted[i]).getTime();
      const same = new Date(sorted[i]).toDateString() === new Date(sorted[i - 1]).toDateString();
      if (same && (t - b) / 3600000 <= 3) b = t;
      else {
        session = Math.max(session, (b - a) / 3600000);
        a = b = t;
      }
    }
    session = Math.round(Math.max(session, (b - a) / 3600000));
  }
  return { hours, days, total, period, top, peakHour, peakDay, weekdayPct: total ? Math.round((weekday / total) * 100) : 0, session };
}

const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

/** 24-hour radial histogram. Midnight at the top, clockwise. */
function Clock({ hours, peak, size }: { hours: number[]; peak: number; size: number }) {
  const max = Math.max(...hours, 1);
  const c = size / 2;
  const r0 = size * 0.2;
  const r1 = size * 0.4;
  const a = (h: number) => ((h / 24) * 360 - 90) * (Math.PI / 180);
  const rd = (n: number) => Math.round(n * 100) / 100;
  const pt = (h: number, r: number) => [rd(c + r * Math.cos(a(h))), rd(c + r * Math.sin(a(h)))] as const;
  const wedge = (h: number, r: number) => {
    const s = h + 0.12;
    const e = h + 0.88;
    const [x1, y1] = pt(s, r0);
    const [x2, y2] = pt(s, r);
    const [x3, y3] = pt(e, r);
    const [x4, y4] = pt(e, r0);
    return `M${x1},${y1} L${x2},${y2} A${rd(r)},${rd(r)} 0 0 1 ${x3},${y3} L${x4},${y4} A${rd(r0)},${rd(r0)} 0 0 0 ${x1},${y1} Z`;
  };
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" aria-hidden>
      <circle cx={c} cy={c} r={r1} fill="none" stroke="var(--line)" strokeDasharray="2 4" />
      <circle cx={c} cy={c} r={r0 - 3} fill="var(--bg-2)" />
      {hours.map((v, h) => (
        <path
          key={h}
          d={wedge(h, r0 + Math.max(0.04, v / max) * (r1 - r0))}
          fill={h === peak ? "var(--accent)" : v ? `color-mix(in oklab, var(--accent) ${30 + (v / max) * 45}%, var(--bg-3))` : "var(--bg-3)"}
        >
          <title>{`${hh(h)} · ${v}`}</title>
        </path>
      ))}
      {[0, 6, 12, 18].map((h) => {
        const [x, y] = pt(h, r1 + size * 0.07);
        return (
          <text key={h} x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={Math.max(9, size * 0.055)} fontFamily="var(--font-code)" fill="var(--ink-4)">
            {String(h).padStart(2, "0")}
          </text>
        );
      })}
      <text x={c} y={c - size * 0.02} textAnchor="middle" fontSize={size * 0.09} fontWeight={700} fontFamily="var(--font-code)" fill="var(--ink-1)">
        {String(peak).padStart(2, "0")}
      </text>
      <text x={c} y={c + size * 0.075} textAnchor="middle" fontSize={size * 0.05} fontFamily="var(--font-code)" fill="var(--ink-3)">
        :00
      </text>
    </svg>
  );
}

function HourBars({ hours, peak, axis }: { hours: number[]; peak: number; axis?: boolean }) {
  const max = Math.max(...hours, 1);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-1 min-h-0 items-end gap-[2px]">
        {hours.map((v, h) => (
          <span
            key={h}
            title={`${hh(h)} · ${v}`}
            className="flex-1 rounded-[2px]"
            style={{ height: `${v ? Math.max(6, (v / max) * 100) : 3}%`, background: h === peak ? "var(--accent)" : v ? "var(--heat-2)" : "var(--bg-3)" }}
          />
        ))}
      </div>
      {axis && (
        <div className="mt-1 grid grid-cols-4 font-mono text-[9.5px] text-ink-4">
          <span>00</span>
          <span>06</span>
          <span>12</span>
          <span>18</span>
        </div>
      )}
    </div>
  );
}

export default function RhythmAnalysis({ hourData, commitTimestamps }: { hourData: HourEntry[]; commitTimestamps: string[] }) {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const { shape, w, h } = useWidgetSize();
  const title = l === "en" ? "Work rhythm" : "Çalışma ritmi";
  if (!hourData.length) {
    return (
      <Panel title={title} icon={Clock3}>
        <p className="text-[12.5px] text-ink-3">{l === "en" ? "No commit times in this range." : "Bu aralıkta commit saati yok."}</p>
      </Panel>
    );
  }
  const s = analyze(hourData, commitTimestamps);
  const Icon = s.top.icon;
  const identity = l === "en" ? s.top.coderEn : s.top.coderTr;

  const periods = (
    <ul className="flex flex-col gap-2">
      {PERIODS.map((p) => {
        const v = s.period[p.key];
        const pct = s.total ? (v / s.total) * 100 : 0;
        const on = p.key === s.top.key;
        const PI = p.icon;
        return (
          <li key={p.key}>
            <div className="mb-1 flex items-center gap-1.5 text-[12px]">
              <PI size={12} className={on ? "text-accent" : "text-ink-4"} />
              <span className={on ? "text-ink font-medium" : "text-ink-3"}>{l === "en" ? p.en : p.tr}</span>
              <span className="ml-auto font-mono text-[11px] text-ink-3 num">{fmtPct(pct, l)}</span>
            </div>
            <Track value={pct} color={on ? "var(--accent)" : "var(--heat-2)"} height={4} />
          </li>
        );
      })}
    </ul>
  );

  const weekdays = (
    <div>
      <div className="flex items-end gap-1 h-12">
        {s.days.map((v, i) => (
          <span
            key={i}
            title={`${WEEKDAYS_SHORT[l][i]} · ${v}`}
            className="flex-1 rounded-[2px]"
            style={{ height: `${v ? Math.max(8, (v / Math.max(...s.days, 1)) * 100) : 4}%`, background: i === s.peakDay ? "var(--accent)" : i >= 5 ? "var(--heat-1)" : "var(--heat-2)" }}
          />
        ))}
      </div>
      <div className="mt-1 flex gap-1 font-mono text-[9.5px] text-ink-4">
        {WEEKDAYS_SHORT[l].map((d, i) => (
          <span key={d} className={cn("flex-1 text-center", i === s.peakDay && "text-accent")}>{d.slice(0, 2)}</span>
        ))}
      </div>
    </div>
  );

  const identityChip = (
    <span className="chip" data-tone="accent">
      <Icon /> {identity}
    </span>
  );

  return (
    <Panel title={title} icon={Clock3} meta={`${l === "en" ? "peak" : "zirve"} ${hh(s.peakHour)}`}>
      {shape === "glance" && (
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-2">
            <Icon size={18} className="text-accent shrink-0" />
            <span className="figure text-[20px] @min-[200px]:text-[24px] truncate">{identity}</span>
          </div>
          <div className="mt-1.5 text-[11.5px] text-ink-3">
            {l === "en" ? "busiest at" : "en yoğun"} <span className="font-mono text-ink-2">{hh(s.peakHour)}</span>
          </div>
          <div className="mt-auto h-8 pt-1">
            <HourBars hours={s.hours} peak={s.peakHour} />
          </div>
        </div>
      )}

      {shape === "strip" && (
        <div className="flex h-full gap-5">
          <div className="flex shrink-0 flex-col justify-center gap-2">
            {identityChip}
            <div className="text-[12px] text-ink-3">
              {l === "en" ? "weekdays" : "hafta içi"} <span className="font-mono text-ink">{fmtPct(s.weekdayPct, l)}</span>
            </div>
            {w >= 3 && (
              <div className="text-[12px] text-ink-3">
                {l === "en" ? "longest session" : "en uzun oturum"} <span className="font-mono text-ink">{s.session}{l === "en" ? "h" : " sa"}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <HourBars hours={s.hours} peak={s.peakHour} axis />
          </div>
        </div>
      )}

      {shape === "column" && (
        <div className="flex h-full flex-col items-center gap-3">
          {identityChip}
          <Clock hours={s.hours} peak={s.peakHour} size={h >= 3 ? 200 : 150} />
          <div className="w-full flex flex-col gap-1">
            <KV k={l === "en" ? "Busiest day" : "En yoğun gün"} v={WEEKDAYS_SHORT[l][s.peakDay]} />
            <KV k={l === "en" ? "Weekdays" : "Hafta içi"} v={fmtPct(s.weekdayPct, l)} />
            {h >= 3 && <KV k={l === "en" ? "Longest session" : "En uzun oturum"} v={`${s.session}${l === "en" ? "h" : " sa"}`} />}
          </div>
        </div>
      )}

      {shape === "block" && (
        <div className="flex h-full gap-5 @max-[420px]:flex-col @max-[420px]:items-center">
          <div className="flex flex-col items-center justify-center gap-2">
            <Clock hours={s.hours} peak={s.peakHour} size={h >= 3 || w >= 3 ? 220 : 170} />
            <div className="hidden @max-[420px]:flex w-full flex-col gap-1">
              <KV k={l === "en" ? "Busiest day" : "En yoğun gün"} v={WEEKDAYS_SHORT[l][s.peakDay]} />
              <KV k={l === "en" ? "Weekdays" : "Hafta içi"} v={fmtPct(s.weekdayPct, l)} />
            </div>
            {identityChip}
          </div>
          <div className="flex flex-1 min-w-0 flex-col justify-between gap-3 self-stretch @max-[420px]:hidden">
            {periods}
            {weekdays}
            <div className="flex flex-col gap-1">
              <KV k={l === "en" ? "Weekday share" : "Hafta içi payı"} v={fmtPct(s.weekdayPct, l)} />
              <KV k={l === "en" ? "Longest session" : "En uzun oturum"} v={`${s.session}${l === "en" ? "h" : " sa"}`} />
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
}
