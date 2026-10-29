"use client";

import { useState, useEffect, useMemo, type ReactNode } from "react";
import { useMediaQuery } from "@/lib/ui/hooks";
import { MONTHS_SHORT, fmtInt, cn, type Lang } from "@/lib/ui/format";

export type LangEntry = { lang: string; bytes: number; pct: number; color: string };
export type BigCommit = { message: string; additions: number; deletions: number; date: string };
export type MonthPoint = { month: string; commits: number };

export type WrappedData = {
  username: string;
  year: number;
  displayName: string;
  avatarUrl: string | null;
  totalCommits: number;
  totalLinesAdded: number;
  totalLinesDeleted: number;
  activeDays: number;
  longestStreak: number;
  peakMonthIdx?: number;
  peakMonth: string;
  peakMonthCommits: number;
  peakDayIdx?: number;
  peakDay: string;
  peakHour: number;
  topLangs: LangEntry[];
  biggestCommit: BigCommit | null;
  reposCreated: number;
  activeRepos: number;
  topRepo: { name: string; fullName: string; commits: number; stars: number; language: string } | null;
  totalPRs: number;
  mergedPRs: number;
  totalStars: number;
  archetype: { title: string; tagline: string; badge: string; desc: string; color: string; en?: { title: string; tagline: string; badge: string; desc: string } };
  identity: { label: string; emoji: string; en?: { label: string } };
  monthlyData: MonthPoint[];
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  accentShades: [string, string, string, string];
  heatmapDates: Record<string, number>;
  maxDayCount: number;
  issuesOpened: number;
  issuesClosed: number;
};

export const TOTAL = 10;
export const CURRENT_YEAR = new Date().getFullYear();
export const YEARS = Array.from({ length: CURRENT_YEAR - 2022 + 1 }, (_, i) => CURRENT_YEAR - i);

/* Count-up that respects reduced motion and only runs on the visible slide. */
export function useCountUp(target: number, active: boolean, duration = 1000) {
  const reduce = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!active || reduce) return;
    const start = performance.now();
    let id = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setV(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [target, active, duration, reduce]);
  return reduce || !active ? target : v;
}

export function Count({ value, active, l }: { value: number; active: boolean; l: Lang }) {
  return <>{fmtInt(useCountUp(value, active), l)}</>;
}

/** Slide frame: a small kicker in mono, then the slide's one big idea. */
export function Frame({ n, kicker, children, foot }: { n: number; kicker: string; children: ReactNode; foot?: ReactNode }) {
  return (
    <div className="relative flex h-full w-full flex-col justify-between gap-6 p-6 sm:p-10 lg:p-14">
      <div className="flex items-center justify-between font-mono text-[12px] text-ink-3">
        <span>{kicker}</span>
        <span className="num">
          {String(n + 1).padStart(2, "0")}/{TOTAL}
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-center">{children}</div>
      {foot && <div className="text-[13px] text-ink-3">{foot}</div>}
    </div>
  );
}

export function Months({ data, peak, l, big }: { data: MonthPoint[]; peak: number; l: Lang; big?: boolean }) {
  const max = Math.max(...data.map((m) => m.commits), 1);
  return (
    <div className={cn("grid grid-cols-12 items-end gap-1.5 sm:gap-2.5", big ? "h-56 sm:h-72" : "h-28")}>
      {data.map((m, i) => (
        <div key={i} className="flex h-full flex-col items-center justify-end gap-1.5">
          {big && <span className={cn("font-mono text-[11px] num", i === peak ? "text-accent" : "text-ink-4")}>{m.commits || ""}</span>}
          <span
            className="w-full rounded-[3px] transition-[height] duration-700"
            style={{ height: `${m.commits ? Math.max(3, (m.commits / max) * 100) : 1.5}%`, background: i === peak ? "var(--accent)" : "var(--heat-2)" }}
          />
          <span className={cn("font-mono text-[10px] sm:text-[11px]", i === peak ? "text-accent" : "text-ink-4")}>{MONTHS_SHORT[l][i].slice(0, big ? 3 : 1)}</span>
        </div>
      ))}
    </div>
  );
}

export function YearGrid({ year, dates, max }: { year: number; dates: Record<string, number>; max: number }) {
  const weeks = useMemo(() => {
    const start = new Date(year, 0, 1, 12);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const out: { date: string; v: number; inYear: boolean }[][] = [];
    const cur = new Date(start);
    while (cur.getFullYear() <= year) {
      const wk: { date: string; v: number; inYear: boolean }[] = [];
      for (let i = 0; i < 7; i++) {
        const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
        wk.push({ date: key, v: dates[key] ?? 0, inYear: cur.getFullYear() === year });
        cur.setDate(cur.getDate() + 1);
      }
      out.push(wk);
      if (out.length > 54) break;
    }
    return out;
  }, [year, dates]);
  const lvl = (v: number) => (v <= 0 ? 0 : v / max < 0.25 ? 1 : v / max < 0.5 ? 2 : v / max < 0.75 ? 3 : 4);
  return (
    <div className="grid w-full gap-[2px] sm:gap-[3px]" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0,1fr))` }}>
      {weeks.map((wk, i) => (
        <div key={i} className="grid grid-rows-7 gap-[2px] sm:gap-[3px]">
          {wk.map((d) => (
            <span key={d.date} title={`${d.date} · ${d.v}`} className="aspect-square rounded-[2px]" style={{ background: d.inYear ? `var(--heat-${lvl(d.v)})` : "transparent" }} />
          ))}
        </div>
      ))}
    </div>
  );
}
