"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { Gauge, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Panel, Spark } from "@/components/ui/primitives";
import { KV } from "@/components/ui/glance";
import { ChartMount, ChartTip, axisTick, gridStroke } from "@/components/ui/chart";
import { useWidgetSize } from "@/components/ui/widget-size";
import { MONTHS_SHORT, fmtPct, type Lang } from "@/lib/ui/format";
import type { DayCount } from "./types";

type WeekPoint = { label: string; commits: number; avg: number | null; projection: number | null; current: boolean };

function buildWeeks(data: DayCount[], l: Lang): WeekPoint[] {
  const map = new Map(data.map((d) => [d.date, d.commit_count]));
  const today = new Date();
  const mon = new Date(today);
  mon.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  mon.setHours(12, 0, 0, 0);
  const weeks = Array.from({ length: 12 }, (_, i) => {
    const start = new Date(mon);
    start.setDate(mon.getDate() - (11 - i) * 7);
    let c = 0;
    for (let d = 0; d < 7; d++) {
      const cur = new Date(start);
      cur.setDate(start.getDate() + d);
      c += map.get(cur.toISOString().slice(0, 10)) ?? 0;
    }
    return { start, c };
  });
  const last4 = weeks.slice(-5, -1);
  const proj = last4.length ? Math.round(last4.reduce((s, x) => s + x.c, 0) / last4.length) : 0;
  return weeks.map((wk, i) => {
    const win = weeks.slice(Math.max(0, i - 2), i + 1);
    const current = i === weeks.length - 1;
    return {
      label: current ? (l === "en" ? "now" : "şimdi") : `${wk.start.getDate()} ${MONTHS_SHORT[l][wk.start.getMonth()]}`,
      commits: wk.c,
      avg: i >= 2 ? Math.round((win.reduce((s, x) => s + x.c, 0) / win.length) * 10) / 10 : null,
      projection: current ? proj : null,
      current,
    };
  });
}

function trendOf(weeks: WeekPoint[], l: Lang) {
  const recent = weeks.slice(-4);
  const older = weeks.slice(-8, -4);
  const r = recent.reduce((s, x) => s + x.commits, 0) / recent.length;
  const o = older.reduce((s, x) => s + x.commits, 0) / Math.max(1, older.length);
  if (o === 0) return { label: l === "en" ? "Not enough history" : "Geçmiş yetersiz", pct: 0, color: "var(--ink-3)", Icon: Minus };
  const pct = Math.round(((r - o) / o) * 100);
  if (pct >= 10) return { label: l === "en" ? "Speeding up" : "Hızlanıyor", pct, color: "var(--hue-green)", Icon: TrendingUp };
  if (pct > -10) return { label: l === "en" ? "Steady" : "Sabit", pct, color: "var(--ink-2)", Icon: Minus };
  return { label: l === "en" ? "Slowing down" : "Yavaşlıyor", pct, color: "var(--hue-red)", Icon: TrendingDown };
}

export default function VelocityChart({ data }: { data: DayCount[] }) {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const { shape, h } = useWidgetSize();
  const weeks = buildWeeks(data, l);
  const trend = trendOf(weeks, l);
  const cur = weeks[weeks.length - 1];
  const proj = cur.projection ?? 0;
  const monthly = Math.round(proj * 4.33);
  const avg3 = weeks[weeks.length - 1].avg ?? 0;
  const TrendIcon = trend.Icon;
  const trendChip = (
    <span className="inline-flex items-center gap-1 text-[12px] font-medium" style={{ color: trend.color }}>
      <TrendIcon size={13} />
      {trend.label}
      {trend.pct !== 0 && <span className="font-mono text-[11px]">{trend.pct > 0 ? "+" : "−"}{fmtPct(Math.abs(trend.pct), l)}</span>}
    </span>
  );

  return (
    <Panel title={l === "en" ? "Velocity" : "Hız"} icon={Gauge} meta={l === "en" ? "12 weeks" : "12 hafta"}>
      {shape === "glance" && (
        <div className="flex h-full flex-col">
          <div className="flex items-baseline gap-1.5">
            <span className="figure text-[26px] @min-[200px]:text-[30px]">{cur.commits}</span>
            <span className="text-[11.5px] text-ink-3">{l === "en" ? `/ ~${proj} wk` : `/ ~${proj} hf`}</span>
          </div>
          <div className="mt-1.5">{trendChip}</div>
          <div className="mt-auto pt-2">
            <Spark values={weeks.map((w) => w.commits)} height={28} />
          </div>
        </div>
      )}

      {shape === "strip" && (
        <div className="flex h-full gap-5">
          <div className="flex shrink-0 flex-col justify-center gap-2">
            {trendChip}
            <div className="figure text-[30px]">
              ~{monthly}
              <span className="text-[13px] font-normal text-ink-3"> {l === "en" ? "/ month" : "/ ay"}</span>
            </div>
            <div className="text-[11.5px] text-ink-3">{l === "en" ? `3-week avg ${avg3}` : `3 haftalık ort. ${avg3}`}</div>
          </div>
          <div className="flex-1 min-w-0 flex items-end">
            <Spark values={weeks.map((w) => w.commits)} height={88} strokeWidth={2} className="!h-full" />
          </div>
        </div>
      )}

      {shape === "column" && (
        <div className="flex h-full flex-col gap-3">
          <div>{trendChip}</div>
          <div className="figure text-[34px]">
            ~{monthly}
            <span className="text-[13px] font-normal text-ink-3"> {l === "en" ? "/ mo" : "/ ay"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <KV k={l === "en" ? "This week" : "Bu hafta"} v={cur.commits} />
            <KV k={l === "en" ? "Projected" : "Tahmin"} v={`~${proj}`} />
            <KV k={l === "en" ? "3-week avg" : "3 hf ort."} v={avg3} />
          </div>
          <div className="mt-auto">
            <Spark values={weeks.map((w) => w.commits)} height={h >= 3 ? 120 : 64} strokeWidth={2} />
          </div>
        </div>
      )}

      {shape === "block" && (
        <div className="flex h-full flex-col gap-2">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            {trendChip}
            <span className="text-[12px] text-ink-3">
              {l === "en" ? "Projected month" : "Aylık tahmin"} <span className="font-mono text-ink">~{monthly}</span>
            </span>
            <span className="text-[12px] text-ink-3">
              {l === "en" ? "This week" : "Bu hafta"} <span className="font-mono text-ink">{cur.commits}</span>
              <span className="text-ink-4"> / ~{proj}</span>
            </span>
          </div>
          <ChartMount className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeks} margin={{ top: 8, right: 6, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="vel-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={gridStroke} strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={18} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} width={34} />
                <Tooltip
                  cursor={{ stroke: "var(--line-2)" }}
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <ChartTip
                        title={label}
                        rows={[
                          { label: "commit", value: payload.find((p) => p.dataKey === "commits")?.value as number, color: "var(--accent)" },
                          ...(payload.find((p) => p.dataKey === "avg")?.value != null
                            ? [{ label: l === "en" ? "3w avg" : "3h ort.", value: payload.find((p) => p.dataKey === "avg")?.value as number, color: "var(--ink-3)" }]
                            : []),
                          ...(payload.find((p) => p.dataKey === "projection")?.value != null
                            ? [{ label: l === "en" ? "projected" : "tahmin", value: `~${payload.find((p) => p.dataKey === "projection")?.value}`, color: "var(--ink-4)" }]
                            : []),
                        ]}
                      />
                    ) : null
                  }
                />
                <ReferenceLine x={weeks[weeks.length - 1].label} stroke="var(--line-2)" strokeDasharray="3 3" />
                <Area isAnimationActive={false} type="monotone" dataKey="commits" stroke="var(--accent)" strokeWidth={2} fill="url(#vel-fill)" dot={false} activeDot={{ r: 4, fill: "var(--accent)", stroke: "var(--bg-1)", strokeWidth: 2 }} />
                <Area isAnimationActive={false} type="monotone" dataKey="avg" stroke="var(--ink-3)" strokeWidth={1.25} strokeDasharray="4 3" fill="none" dot={false} activeDot={false} />
                <Area isAnimationActive={false} type="monotone" dataKey="projection" stroke="none" fill="none" dot={{ r: 3.5, fill: "var(--bg-1)", stroke: "var(--ink-3)", strokeWidth: 1.5 }} activeDot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartMount>
        </div>
      )}
    </Panel>
  );
}
