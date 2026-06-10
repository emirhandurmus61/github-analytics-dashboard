"use client";

import { useThemeColors } from "@/components/theme-provider";
import { Sunrise, Sun, Sunset, Moon, Timer, Calendar } from "lucide-react";

type HourEntry = { hour: number; day: number; count: number };
type Props = { hourData: HourEntry[]; commitTimestamps: string[] };

type PeriodKey = "morning" | "afternoon" | "evening" | "night";
type Period = { key: PeriodKey; label: string; icon: React.ComponentType<{ className?: string }>; hours: number[] };

const PERIODS: Period[] = [
  { key: "morning",   label: "Sabah",   icon: Sunrise, hours: [6,7,8,9,10,11] },
  { key: "afternoon", label: "Ogle",    icon: Sun,     hours: [12,13,14,15,16,17] },
  { key: "evening",   label: "Aksam",   icon: Sunset,  hours: [18,19,20,21] },
  { key: "night",     label: "Gece",    icon: Moon,    hours: [22,23,0,1,2,3,4,5] },
];

function buildStats(hourData: HourEntry[], commitTimestamps: string[]) {
  const grid: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
  for (const { hour, day, count } of hourData) {
    if (day >= 0 && day < 7 && hour >= 0 && hour < 24) grid[day][hour] = count;
  }
  const total = grid.flat().reduce((s, c) => s + c, 0);
  const hourTotals = Array.from({ length: 24 }, (_, h) => grid.reduce((s, row) => s + row[h], 0));
  const periodCounts: Record<PeriodKey, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  for (const p of PERIODS) periodCounts[p.key] = p.hours.reduce((s, h) => s + hourTotals[h], 0);

  const weekdayTotal = grid.slice(0, 5).flat().reduce((s, c) => s + c, 0);
  const peakHour = hourTotals.indexOf(Math.max(...hourTotals));
  const dayTotals = grid.map((row) => row.reduce((s, c) => s + c, 0));
  const DAY_NAMES = ["Pzt","Sal","Car","Per","Cum","Cmt","Paz"];
  const peakDay = DAY_NAMES[dayTotals.indexOf(Math.max(...dayTotals))];

  const maxPeriod = Math.max(...Object.values(periodCounts));
  let identityKey: PeriodKey = "afternoon";
  for (const p of PERIODS) if (periodCounts[p.key] === maxPeriod) { identityKey = p.key; break; }
  const identityPeriod = PERIODS.find((p) => p.key === identityKey)!;

  let longestSession = 0;
  if (commitTimestamps.length > 0) {
    const sorted = [...commitTimestamps].sort();
    let sStart = new Date(sorted[0]).getTime();
    let sEnd = sStart;
    let best = 0;
    for (let i = 1; i < sorted.length; i++) {
      const curr = new Date(sorted[i]).getTime();
      const sameDay = new Date(sorted[i]).toDateString() === new Date(sorted[i - 1]).toDateString();
      if (sameDay && (curr - sEnd) / 3600000 <= 3) { sEnd = curr; }
      else { best = Math.max(best, Math.round((sEnd - sStart) / 3600000)); sStart = curr; sEnd = curr; }
    }
    longestSession = Math.max(best, Math.round((sEnd - sStart) / 3600000));
  }

  const weekdayPct = total > 0 ? Math.round((weekdayTotal / total) * 100) : 0;
  return { total, periodCounts, weekdayPct, weekendPct: 100 - weekdayPct, peakHour, peakDay, identityPeriod, longestSession, hourTotals };
}

export default function RhythmAnalysis({ hourData, commitTimestamps }: Props) {
  const theme = useThemeColors();
  if (hourData.length === 0) return null;

  const s = buildStats(hourData, commitTimestamps);
  const hourMax = Math.max(...s.hourTotals, 1);
  const IdentityIcon = s.identityPeriod.icon;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-3 shrink-0">
        <div>
          <h2 className="text-sm font-medium text-zinc-400">Calisma Ritmi</h2>
          <p className="text-xs text-zinc-600 mt-0.5">Commit aliskanliklarinin analizi</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1" style={{ borderColor: theme.accentBorder, backgroundColor: theme.accentBg }}>
          <IdentityIcon className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span className="text-xs font-medium" style={{ color: theme.accent }}>{s.identityPeriod.label} Kodcusu</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Left: Period bars */}
        <div className="space-y-2">
          {PERIODS.map((period) => {
            const count = s.periodCounts[period.key];
            const pct = s.total > 0 ? Math.round((count / s.total) * 100) : 0;
            const isTop = count === Math.max(...Object.values(s.periodCounts));
            const Icon = period.icon;
            return (
              <div key={period.key}>
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-3.5 h-3.5 ${isTop ? "text-[var(--accent)]" : "text-zinc-600"}`} />
                    <span className={`text-xs ${isTop ? "text-zinc-200 font-medium" : "text-zinc-500"}`}>{period.label}</span>
                  </div>
                  <span className="text-[10px] text-zinc-600 tabular-nums">{pct}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: isTop ? theme.accent : theme.shades[1] }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Stats */}
        <div className="space-y-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-3">
            <p className="text-[10px] text-zinc-600 mb-1">Hafta Ici / Sonu</p>
            <div className="flex h-2 rounded-full overflow-hidden bg-zinc-700">
              <div className="h-full" style={{ width: `${s.weekdayPct}%`, backgroundColor: theme.accent }} />
            </div>
            <div className="flex justify-between text-[10px] mt-1">
              <span style={{ color: theme.accent }}>%{s.weekdayPct} ici</span>
              <span className="text-zinc-600">%{s.weekendPct} sonu</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-3">
              <p className="text-[10px] text-zinc-600 mb-1">Pik Saat</p>
              <p className="text-lg font-bold tabular-nums" style={{ color: theme.accent }}>
                {String(s.peakHour).padStart(2, "0")}:00
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-3">
              <div className="flex items-center gap-1 mb-1">
                <Calendar className="w-2.5 h-2.5 text-zinc-600" />
                <p className="text-[10px] text-zinc-600">En Aktif</p>
              </div>
              <p className="text-sm font-semibold text-zinc-200">{s.peakDay}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 24h bar chart */}
      <div className="mt-3 shrink-0">
        <div className="flex items-end gap-px h-8">
          {s.hourTotals.map((count, h) => {
            const hPct = hourMax > 0 ? (count / hourMax) * 100 : 0;
            return (
              <div
                key={h} className="flex-1 rounded-t-sm hover:opacity-80 transition-opacity"
                title={`${String(h).padStart(2, "0")}:00 -- ${count} commit`}
                style={{ height: `${Math.max(hPct, count > 0 ? 8 : 2)}%`, backgroundColor: h === s.peakHour ? theme.accent : count > 0 ? theme.shades[1] : "#1a1a1e" }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
