"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Grid3x3 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { dayKey } from "@/lib/tz";
import { useTz } from "@/lib/tz-context";
import { Panel } from "@/components/ui/primitives";
import { useWidgetSize } from "@/components/ui/widget-size";
import { MONTHS_SHORT, WEEKDAYS_SHORT, fmtDay, fmtInt, cn, type Lang } from "@/lib/ui/format";
import type { DashboardData, DayCount } from "./types";

const DAY = 86400000;

export type Cell = { date: string; v: number; lvl: 0 | 1 | 2 | 3 | 4; future: boolean };

/** Weeks (Mon→Sun) covering the last year, newest last. Levels use quartiles of active days. */
export function buildWeeks(data: DayCount[], tz: string): Cell[][] {
  const m = new Map(data.map((d) => [d.date, d.commit_count]));
  const nonzero = data.map((d) => d.commit_count).filter((v) => v > 0).sort((a, b) => a - b);
  const q = (p: number) => nonzero[Math.min(nonzero.length - 1, Math.floor(p * nonzero.length))] ?? 1;
  const [q1, q2, q3] = [q(0.25), q(0.5), q(0.75)];
  const level = (v: number): Cell["lvl"] => (v <= 0 ? 0 : v <= q1 ? 1 : v <= q2 ? 2 : v <= q3 ? 3 : 4);

  // Noon UTC of the viewer's "today" so whole-day steps never cross a date line.
  const todayKey = dayKey(Date.now(), tz);
  const today = new Date(`${todayKey}T12:00:00Z`);
  const dow = (today.getUTCDay() + 6) % 7;
  const end = today.getTime() + (6 - dow) * DAY;
  const start = end - (53 * 7 - 1) * DAY;
  const weeks: Cell[][] = [];
  for (let t = start; t <= end; t += 7 * DAY) {
    const wk: Cell[] = [];
    for (let i = 0; i < 7; i++) {
      const ts = t + i * DAY;
      const date = dayKey(ts, "UTC");
      const v = m.get(date) ?? 0;
      wk.push({ date, v, lvl: level(v), future: ts > today.getTime() });
    }
    weeks.push(wk);
  }
  return weeks;
}

const LVL = ["var(--heat-0)", "var(--heat-1)", "var(--heat-2)", "var(--heat-3)", "var(--heat-4)"];

function useBox<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, box] as const;
}

/**
 * Fits as many recent weeks as the box allows, keeping cells square.
 * Horizontal: weeks are columns. Vertical: weeks are rows (narrow, tall slots).
 */
export function HeatGrid({
  weeks,
  vertical,
  monthLabels,
  dayLabels,
  maxCell = 18,
  minCell = 8,
  gap = 3,
  l,
  colorOf,
  unit = "commit",
}: {
  weeks: Cell[][];
  vertical?: boolean;
  monthLabels?: boolean;
  dayLabels?: boolean;
  maxCell?: number;
  minCell?: number;
  gap?: number;
  l: Lang;
  colorOf?: (c: Cell) => string;
  unit?: string;
}) {
  const [ref, box] = useBox<HTMLDivElement>();
  const [tip, setTip] = useState<{ x: number; y: number; c: Cell } | null>(null);
  const labelW = dayLabels ? 26 : 0;
  const labelH = monthLabels ? 16 : 0;

  const layout = useMemo(() => {
    if (!box.w || !box.h) return null;
    if (!vertical) {
      const byH = Math.floor((box.h - labelH - gap * 6) / 7);
      let cell = Math.max(minCell, Math.min(maxCell, byH));
      let n = Math.floor((box.w - labelW + gap) / (cell + gap));
      let cw = cell;
      if (n >= weeks.length) {
        n = weeks.length;
        // Whole year fits: widen cells to fill the row (up to 2× their height).
        const fit = Math.floor((box.w - labelW - gap * (n - 1)) / n);
        cell = Math.max(minCell, Math.min(byH, maxCell, fit));
        cw = Math.max(cell, Math.min(cell * 2, fit));
      }
      return { cell, cw, n: Math.max(1, n) };
    }
    const headH = dayLabels ? 14 : 0;
    const byW = Math.floor((box.w - labelW - gap * 6) / 7);
    const cell = Math.max(minCell, Math.min(maxCell, byW));
    const n = Math.max(1, Math.min(weeks.length, Math.floor((box.h - headH + gap) / (cell + gap))));
    return { cell, cw: cell, n };
  }, [box, vertical, weeks.length, labelW, labelH, gap, maxCell, minCell, dayLabels]);

  const shown = useMemo(() => (layout ? weeks.slice(-layout.n) : []), [layout, weeks]);
  const cell = layout?.cell ?? 10;
  const cw = layout?.cw ?? cell;

  const months = useMemo(() => {
    const out: { i: number; label: string }[] = [];
    let last = -1;
    shown.forEach((wk, i) => {
      const mo = new Date(wk[0].date + "T12:00:00").getMonth();
      if (mo !== last) {
        if (i > 0 || new Date(wk[0].date + "T12:00:00").getDate() <= 7) out.push({ i, label: MONTHS_SHORT[l][mo] });
        last = mo;
      }
    });
    return out;
  }, [shown, l]);

  const onEnter = (e: React.MouseEvent, c: Cell) => {
    const host = ref.current?.getBoundingClientRect();
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (host) setTip({ x: r.left - host.left + r.width / 2, y: r.top - host.top, c });
  };

  const cellEl = (c: Cell) => (
    <span
      key={c.date}
      onMouseEnter={(e) => onEnter(e, c)}
      className={cn("block rounded-[3px] transition-[outline-color]", c.future ? "opacity-0" : "hover:outline hover:outline-1 hover:outline-ink-2")}
      style={{ width: cw, height: cell, background: colorOf ? colorOf(c) : LVL[c.lvl], borderRadius: Math.max(2, Math.round(cell / 5)) }}
    />
  );

  return (
    <div ref={ref} className="relative h-full w-full min-h-0" onMouseLeave={() => setTip(null)}>
      {layout && !vertical && (
        <div className="absolute inset-0 flex flex-col items-end justify-center">
        <div className="relative" style={{ paddingLeft: labelW }}>
          {monthLabels && (
            <div className="relative mb-1" style={{ height: labelH - 4 }}>
              {months.map((m) => (
                <span key={m.i} className="absolute top-0 font-mono text-[10px] leading-none text-ink-4" style={{ left: m.i * (cw + gap) }}>
                  {m.label}
                </span>
              ))}
            </div>
          )}
          <div className="flex" style={{ gap }}>
            {dayLabels && (
              <div className="flex flex-col absolute left-0" style={{ gap, bottom: 0, width: labelW - 4 }}>
                {WEEKDAYS_SHORT[l].map((d, i) => (
                  <span key={i} className="font-mono text-[9.5px] leading-none text-ink-4 flex items-center" style={{ height: cell }}>
                    {i % 2 === 0 ? d : ""}
                  </span>
                ))}
              </div>
            )}
            {shown.map((wk, i) => (
              <div key={i} className="flex flex-col" style={{ gap }}>
                {wk.map(cellEl)}
              </div>
            ))}
          </div>
        </div>
        </div>
      )}
      {layout && vertical && (
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center" style={{ gap }}>
          {dayLabels && (
            <div className="flex" style={{ gap, paddingLeft: labelW }}>
              {WEEKDAYS_SHORT[l].map((d, i) => (
                <span key={i} className="font-mono text-[9px] leading-none text-ink-4 text-center" style={{ width: cell }}>
                  {d.slice(0, 1)}
                </span>
              ))}
            </div>
          )}
          {shown.map((wk, i) => {
            const first = new Date(wk[0].date + "T12:00:00");
            const newMonth = first.getDate() <= 7;
            return (
              <div key={i} className="flex items-center" style={{ gap }}>
                {dayLabels && (
                  <span className="font-mono text-[9px] leading-none text-ink-4" style={{ width: labelW - gap }}>
                    {newMonth ? MONTHS_SHORT[l][first.getMonth()] : ""}
                  </span>
                )}
                {wk.map(cellEl)}
              </div>
            );
          })}
        </div>
      )}
      {tip && (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap surface-pop px-2 py-1 text-[11.5px] text-ink"
          style={{ left: tip.x, top: tip.y - 6 }}
        >
          <span className="font-mono font-semibold">{tip.c.v}</span>{" "}
          <span className="text-ink-3">
            {unit} · {fmtDay(tip.c.date, l, { weekday: "short", day: "numeric", month: "short" })}
          </span>
        </div>
      )}
    </div>
  );
}

function Legend({ l }: { l: Lang }) {
  return (
    <div className="flex items-center gap-1 font-mono text-[10.5px] text-ink-4">
      {l === "en" ? "less" : "az"}
      {LVL.map((c) => (
        <span key={c} className="size-[10px] rounded-[2px]" style={{ background: c }} />
      ))}
      {l === "en" ? "more" : "çok"}
    </div>
  );
}

export default function ContributionHeatmap({ data, streak }: { data: DayCount[]; streak?: DashboardData["streak"] }) {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const tz = useTz();
  const { shape, h, w } = useWidgetSize();
  const weeks = useMemo(() => buildWeeks(data, tz), [data, tz]);
  const total = data.reduce((s, d) => s + d.commit_count, 0);
  const activeDays = data.filter((d) => d.commit_count > 0).length;
  const best = data.reduce((a, b) => (b.commit_count > a.commit_count ? b : a), { date: "", commit_count: 0 });
  const title = l === "en" ? "Contributions" : "Katkılar";
  const meta = `${fmtInt(total, l)} ${l === "en" ? "in a year" : "/ yıl"}`;

  // Monthly totals for the tall layout.
  const monthly = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      return { label: MONTHS_SHORT[l][d.getMonth()], v: data.filter((x) => x.date.startsWith(key)).reduce((s, x) => s + x.commit_count, 0) };
    });
  }, [data, l]);
  const mMax = Math.max(...monthly.map((m) => m.v), 1);

  return (
    <Panel title={title} icon={Grid3x3} meta={meta}>
      {shape === "glance" && (
        <div className="flex h-full flex-col gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="figure text-[22px] @min-[200px]:text-[26px]">{fmtInt(activeDays, l)}</span>
            <span className="text-[11.5px] text-ink-3">{l === "en" ? "active days" : "aktif gün"}</span>
          </div>
          <div className="flex-1 min-h-0">
            <HeatGrid weeks={weeks} l={l} maxCell={14} minCell={7} gap={2} />
          </div>
        </div>
      )}

      {shape === "strip" && (
        <div className="h-full">
          <HeatGrid weeks={weeks} l={l} monthLabels dayLabels={w >= 3} maxCell={16} minCell={8} gap={w >= 3 ? 3 : 2} />
        </div>
      )}

      {shape === "column" && (
        <div className="flex h-full flex-col gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="figure text-[26px]">{fmtInt(total, l)}</span>
            <span className="text-[11.5px] text-ink-3">commit</span>
          </div>
          <div className="flex-1 min-h-0">
            <HeatGrid weeks={weeks} l={l} vertical dayLabels maxCell={16} minCell={8} gap={3} />
          </div>
        </div>
      )}

      {shape === "block" && (
        <div className="flex h-full flex-col gap-3">
          <div className={cn("min-h-0", h >= 3 ? "h-[46%]" : "flex-1")}>
            <HeatGrid weeks={weeks} l={l} monthLabels dayLabels maxCell={w >= 4 ? 20 : 17} minCell={8} gap={3} />
          </div>
          <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            <dl className="flex flex-wrap gap-x-6 gap-y-2">
              <Stat k={l === "en" ? "commits" : "commit"} v={fmtInt(total, l)} />
              <Stat k={l === "en" ? "active days" : "aktif gün"} v={`${activeDays}`} />
              {best.commit_count > 0 && <Stat k={l === "en" ? "busiest day" : "en yoğun gün"} v={`${best.commit_count}`} sub={fmtDay(best.date, l)} />}
              {streak && <Stat k={l === "en" ? "longest streak" : "en uzun seri"} v={`${streak.longestStreak}`} sub={l === "en" ? "days" : "gün"} />}
              {streak && w >= 3 && <Stat k={l === "en" ? "current" : "güncel"} v={`${streak.currentStreak}`} sub={l === "en" ? "days" : "gün"} accent={streak.currentStreak > 0} />}
            </dl>
            <Legend l={l} />
          </div>
          {h >= 3 && (
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="mb-1.5 text-[11px] text-ink-4">{l === "en" ? "Commits per month" : "Aylık commit"}</div>
              <div className="flex flex-1 min-h-0 items-end gap-1.5">
                {monthly.map((m, i) => (
                  <div key={i} className="flex h-full flex-1 flex-col justify-end items-center gap-1" title={`${m.label}: ${m.v}`}>
                    <span className="font-mono text-[10px] text-ink-3 num">{m.v || ""}</span>
                    <span className="w-full rounded-[3px]" style={{ height: `${m.v ? Math.max(4, (m.v / mMax) * 80) : 2}%`, background: i === 11 ? "var(--accent)" : "var(--heat-2)" }} />
                    <span className="font-mono text-[10px] text-ink-4">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

function Stat({ k, v, sub, accent }: { k: string; v: string; sub?: string; accent?: boolean }) {
  return (
    <div>
      <dt className="text-[11px] text-ink-4">{k}</dt>
      <dd className="mt-0.5 flex items-baseline gap-1">
        <span className="font-mono text-[16px] font-semibold num" style={{ color: accent ? "var(--accent)" : "var(--ink-1)" }}>
          {v}
        </span>
        {sub && <span className="text-[11px] text-ink-3">{sub}</span>}
      </dd>
    </div>
  );
}
