"use client";

import { GitCompareArrows } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Panel, Delta } from "@/components/ui/primitives";
import { useWidgetSize } from "@/components/ui/widget-size";
import { fmtCompact, fmtInt, type Lang } from "@/lib/ui/format";
import type { MonthSummary } from "./types";

type Key = "commits" | "activeDays" | "linesAdded";

const pct = (a: number, b: number) => (b > 0 ? Math.round(((a - b) / b) * 100) : a > 0 ? 100 : 0);

export default function CompareView({ thisMonth, lastMonth }: { thisMonth: MonthSummary; lastMonth: MonthSummary }) {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const { shape, w, h } = useWidgetSize();
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  // The current month is partial: compare its projected total to last month.
  const project = (v: number) => Math.round((v / Math.max(1, dayOfMonth)) * daysInMonth);

  const metrics: { key: Key; label: string; fmt: (v: number) => string }[] = [
    { key: "commits", label: "commit", fmt: (v) => fmtInt(v, l) },
    { key: "activeDays", label: l === "en" ? "active days" : "aktif gün", fmt: (v) => String(v) },
    { key: "linesAdded", label: l === "en" ? "lines added" : "eklenen satır", fmt: (v) => fmtCompact(v, l) },
  ];
  const title = `${thisMonth.label} / ${lastMonth.label}`;
  const progress = `${dayOfMonth}/${daysInMonth}`;
  const commitsDelta = pct(project(thisMonth.commits), lastMonth.commits);

  return (
    <Panel title={l === "en" ? "Month over month" : "Aylık karşılaştırma"} icon={GitCompareArrows} meta={shape === "glance" ? progress : title}>
      {shape === "glance" && (
        <div className="flex h-full flex-col">
          <div className="flex items-baseline gap-1.5">
            <span className="figure text-[26px] @min-[200px]:text-[30px]">{fmtInt(thisMonth.commits, l)}</span>
            <span className="text-[11.5px] text-ink-3 truncate">{thisMonth.label}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-ink-3">
            <Delta value={commitsDelta} lang={l} />
            {l === "en" ? `pace vs ${lastMonth.commits}` : `tempo, ${lastMonth.commits}'e karşı`}
          </div>
          <div className="mt-auto">
            <div className="track" style={{ height: 4 }}>
              <i style={{ width: `${(dayOfMonth / daysInMonth) * 100}%` }} />
            </div>
            <div className="mt-1 font-mono text-[10.5px] text-ink-4">{l === "en" ? `day ${dayOfMonth} of ${daysInMonth}` : `${daysInMonth} günün ${dayOfMonth}.si`}</div>
          </div>
        </div>
      )}

      {shape === "strip" && (
        <div className="grid h-full items-center gap-4" style={{ gridTemplateColumns: `repeat(${w >= 2 ? 3 : 1}, minmax(0,1fr))` }}>
          {metrics.slice(0, w >= 2 ? 3 : 1).map((m) => {
            const a = thisMonth[m.key];
            const b = lastMonth[m.key];
            return (
              <div key={m.key} className="min-w-0">
                <div className="text-[11.5px] text-ink-3">{m.label}</div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="figure text-[24px]">{m.fmt(a)}</span>
                  <span className="font-mono text-[12px] text-ink-4 num">/ {m.fmt(b)}</span>
                </div>
                <div className="mt-1">
                  <Delta value={pct(project(a), b)} lang={l} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(shape === "column" || shape === "block") && (
        <div className="flex h-full flex-col justify-between gap-3">
          {metrics.map((m) => {
            const a = thisMonth[m.key];
            const b = lastMonth[m.key];
            const pa = project(a);
            const max = Math.max(pa, b, 1);
            return (
              <div key={m.key}>
                <div className="mb-1.5 flex items-baseline justify-between gap-2">
                  <span className="text-[12.5px] text-ink-2">{m.label}</span>
                  <Delta value={pct(pa, b)} lang={l} />
                </div>
                <div className="flex flex-col gap-1">
                  <BarRow label={thisMonth.label} value={a} projected={pa} max={max} fmt={m.fmt} accent short={shape === "column" || w < 2} />
                  <BarRow label={lastMonth.label} value={b} max={max} fmt={m.fmt} short={shape === "column" || w < 2} />
                </div>
              </div>
            );
          })}
          {h >= 2 && (
            <p className="text-[11.5px] text-ink-3">
              {l === "en"
                ? `Dashed: ${thisMonth.label} projected from ${dayOfMonth} of ${daysInMonth} days.`
                : `Kesikli: ${thisMonth.label}, ${daysInMonth} günün ${dayOfMonth}'ine göre tahmin.`}
            </p>
          )}
        </div>
      )}
    </Panel>
  );
}

function BarRow({ label, value, projected, max, fmt, accent, short }: { label: string; value: number; projected?: number; max: number; fmt: (v: number) => string; accent?: boolean; short?: boolean }) {
  return (
    <div className="grid items-center gap-2" style={{ gridTemplateColumns: short ? "30px 1fr 44px" : "64px 1fr 56px" }}>
      <span className="truncate font-mono text-[10.5px] text-ink-4">{short ? label.slice(0, 3) : label}</span>
      <span className="relative h-2.5 rounded-[2px] bg-inset">
        {projected !== undefined && projected > value && (
          <span className="absolute inset-y-0 left-0 rounded-[2px] border border-dashed border-accent" style={{ width: `${(projected / max) * 100}%` }} />
        )}
        <span className="absolute inset-y-0 left-0 rounded-[2px]" style={{ width: `${(value / max) * 100}%`, background: accent ? "var(--accent)" : "var(--line-2)" }} />
      </span>
      <span className="text-right font-mono text-[11.5px] text-ink num">{fmt(value)}</span>
    </div>
  );
}
