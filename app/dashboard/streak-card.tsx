"use client";

import { Flame, Check, Clock3 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Panel, Track } from "@/components/ui/primitives";
import { Glance } from "@/components/ui/glance";
import { useWidgetSize } from "@/components/ui/widget-size";
import { fmtDay, cn, type Lang } from "@/lib/ui/format";
import type { DashboardData, DayCount } from "./types";
import type { StreakStatus } from "./streak-guard";
import { HeatGrid, buildWeeks, type Cell as HeatCell } from "./contribution-heatmap";
import { useMemo } from "react";
import { dayKey } from "@/lib/tz";
import { useTz } from "@/lib/tz-context";

const DAY = 86400000;

type Cell = { date: string; v: number; inStreak: boolean; today: boolean };

/** Last n days, flagged with whether each day belongs to the running streak. */
function chain(heatmap: DayCount[], n: number, current: number, tz: string): Cell[] {
  const m = new Map(heatmap.map((d) => [d.date, d.commit_count]));
  const todayStr = dayKey(Date.now(), tz);
  const hasToday = (m.get(todayStr) ?? 0) > 0;
  // The streak ends today if there is a commit today, otherwise yesterday.
  const end = hasToday ? 0 : 1;
  return Array.from({ length: n }, (_, i) => {
    const back = n - 1 - i;
    const date = dayKey(Date.now() - back * DAY, tz);
    return { date, v: m.get(date) ?? 0, inStreak: current > 0 && back >= end && back < end + current, today: back === 0 };
  });
}

/** Dates that belong to the running streak. */
function streakDates(heatmap: DayCount[], current: number, tz: string) {
  return new Set(chain(heatmap, Math.max(current + 2, 2), current, tz).filter((c) => c.inStreak).map((c) => c.date));
}

function cellColor(c: Cell) {
  if (c.inStreak) return "var(--accent)";
  if (c.v > 0) return "var(--heat-2)";
  return "var(--heat-0)";
}

export default function StreakCard({
  streak,
  heatmap,
  status,
  todayCommits,
}: {
  streak: DashboardData["streak"];
  heatmap: DayCount[];
  status: StreakStatus;
  todayCommits: number;
}) {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const tz = useTz();
  const { shape, w, h } = useWidgetSize();
  const { currentStreak: cur, longestStreak: rec, totalActiveDays: active } = streak;
  const onFire = cur > 0;
  const atRisk = status === "at_risk";
  const hoursLeft = 24 - new Date().getHours();
  const weeks = useMemo(() => buildWeeks(heatmap, tz), [heatmap, tz]);
  const inStreak = useMemo(() => streakDates(heatmap, cur, tz), [heatmap, cur, tz]);
  const colorOf = (c: HeatCell) => (inStreak.has(c.date) ? "var(--accent)" : c.v > 0 ? "var(--heat-2)" : "var(--heat-0)");

  const todayLine = todayCommits > 0 ? (
    <span className="inline-flex items-center gap-1 text-good"><Check size={12} strokeWidth={2.5} />{l === "en" ? `${todayCommits} today` : `bugün ${todayCommits}`}</span>
  ) : atRisk ? (
    <span className="inline-flex items-center gap-1 text-warn"><Clock3 size={12} />{l === "en" ? `${hoursLeft}h left today` : `bugün ${hoursLeft} sa kaldı`}</span>
  ) : (
    <span>{l === "en" ? "no commit today" : "bugün commit yok"}</span>
  );

  const toRecord = rec > 0 ? (
    <div>
      <Track value={cur} max={Math.max(rec, 1)} height={4} />
      <div className="mt-1 flex justify-between font-mono text-[10.5px] text-ink-4">
        <span>{cur >= rec && cur > 0 ? (l === "en" ? "record" : "rekor") : `${rec - cur} ${l === "en" ? "to record" : "rekora"}`}</span>
        <span>{rec}</span>
      </div>
    </div>
  ) : null;

  return (
    <Panel
      title={l === "en" ? "Streak" : "Seri"}
      icon={Flame}
      meta={onFire && cur >= rec ? (l === "en" ? "record run" : "rekor serisi") : `${l === "en" ? "best" : "en iyi"} ${rec}`}
      tone={atRisk ? "accent" : undefined}
    >
      {shape === "glance" && (
        <Glance
          figure={cur}
          figureColor={onFire ? "var(--accent)" : undefined}
          unit={l === "en" ? (cur === 1 ? "day" : "days") : "gün"}
          sub={todayLine}
          viz={toRecord}
        />
      )}

      {shape === "strip" && (
        <div className="flex h-full flex-col justify-between gap-2">
          <div className="flex items-end gap-6">
            <Fig v={cur} label={l === "en" ? "current" : "güncel"} accent={onFire} />
            <Fig v={rec} label={l === "en" ? "best" : "rekor"} />
            {w >= 2 && <Fig v={active} label={l === "en" ? "active days" : "aktif gün"} />}
            <div className="ml-auto text-[12px] text-ink-3 self-center">{todayLine}</div>
          </div>
          <Row cells={chain(heatmap, w >= 4 ? 42 : w >= 3 ? 35 : 21, cur, tz)} l={l} />
        </div>
      )}

      {shape === "column" && (
        <div className="flex h-full flex-col gap-3">
          <Glance figure={cur} figureColor={onFire ? "var(--accent)" : undefined} unit={l === "en" ? "days" : "gün"} sub={todayLine} className="!h-auto" />
          {toRecord}
          <div className="flex-1 min-h-0">
            <HeatGrid weeks={weeks} l={l} vertical dayLabels maxCell={30} minCell={10} gap={3} colorOf={colorOf} />
          </div>
        </div>
      )}

      {shape === "block" && (
        <div className="flex h-full flex-col gap-3">
          <div className="flex flex-wrap items-end gap-x-7 gap-y-2">
            <Fig v={cur} label={l === "en" ? "day streak" : "günlük seri"} accent={onFire} big />
            <Fig v={rec} label={l === "en" ? "longest" : "en uzun"} />
            <Fig v={active} label={l === "en" ? "active days / yr" : "aktif gün / yıl"} />
            <div className="ml-auto text-[12px] text-ink-3">{todayLine}</div>
          </div>
          <div className="flex-1 min-h-0">
            <HeatGrid weeks={weeks} l={l} monthLabels dayLabels maxCell={h >= 3 ? 30 : 22} minCell={9} gap={3} colorOf={colorOf} />
          </div>
          <div className="flex items-center gap-3 text-[11px] text-ink-3">
            <span className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-[2px] bg-accent" />{l === "en" ? "current streak" : "güncel seri"}</span>
            <span className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-[2px]" style={{ background: "var(--heat-2)" }} />{l === "en" ? "active" : "aktif"}</span>
            <span className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-[2px] bg-inset" />{l === "en" ? "no commits" : "commit yok"}</span>
          </div>
        </div>
      )}
    </Panel>
  );
}

function Fig({ v, label, accent, big }: { v: number; label: string; accent?: boolean; big?: boolean }) {
  return (
    <div>
      <div className={cn("figure", big ? "text-[40px]" : "text-[26px]")} style={accent ? { color: "var(--accent)" } : undefined}>
        {v}
      </div>
      <div className="label mt-1.5 whitespace-nowrap">{label}</div>
    </div>
  );
}

function Row({ cells, l }: { cells: Cell[]; l: Lang }) {
  return (
    <div className="flex gap-[3px]">
      {cells.map((c) => (
        <span
          key={c.date}
          title={`${fmtDay(c.date, l)} · ${c.v}`}
          className={cn("h-4 flex-1 rounded-[3px]", c.today && "ring-1 ring-ink-3 ring-offset-1 ring-offset-[var(--bg-1)]")}
          style={{ background: cellColor(c) }}
        />
      ))}
    </div>
  );
}

