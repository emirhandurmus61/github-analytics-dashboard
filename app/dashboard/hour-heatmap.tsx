"use client";

import { useThemeColors } from "@/components/theme-provider";
import { Clock } from "lucide-react";

type Props = { data: { hour: number; day: number; count: number }[] };

const DAYS = ["Pzt","Sal","Car","Per","Cum","Cmt","Paz"];

export default function HourHeatmap({ data }: Props) {
  const theme = useThemeColors();
  const max = Math.max(...data.map((d) => d.count), 1);

  const grid: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
  for (const { hour, day, count } of data) {
    if (day >= 0 && day < 7 && hour >= 0 && hour < 24) grid[day][hour] = count;
  }

  const hourTotals = Array.from({ length: 24 }, (_, h) => grid.reduce((s, r) => s + r[h], 0));
  const peakHour = hourTotals.indexOf(Math.max(...hourTotals));

  function getColor(count: number) {
    if (count === 0) return "#1a1a1e";
    const t = count / max;
    if (t < 0.25) return theme.shades[0];
    if (t < 0.5) return theme.shades[1];
    if (t < 0.75) return theme.shades[2];
    return theme.shades[3];
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0 mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-zinc-500" />
          <h2 className="text-sm font-medium text-zinc-400">Saat Dagilimi</h2>
        </div>
        <span className="text-xs text-zinc-600">
          Pik: <span className="font-semibold" style={{ color: theme.accent }}>{String(peakHour).padStart(2, "0")}:00</span>
        </span>
      </div>

      <div className="overflow-x-auto flex-1 min-h-0">
        <div style={{ minWidth: 520 }}>
          <div className="mb-0.5 flex pl-9">
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} className="flex-1 text-[9px] text-zinc-700">
                {i % 6 === 0 ? `${String(i).padStart(2, "0")}` : ""}
              </div>
            ))}
          </div>
          <div className="space-y-0.5">
            {DAYS.map((day, di) => (
              <div key={day} className="flex items-center gap-0.5">
                <span className="w-8 shrink-0 text-right text-[10px] text-zinc-600">{day}</span>
                <div className="flex flex-1 gap-px">
                  {grid[di].map((count, hi) => (
                    <div
                      key={hi}
                      title={`${day} ${String(hi).padStart(2, "0")}:00 -- ${count} commit`}
                      className="h-5 flex-1 rounded-[2px] hover:opacity-80 transition-opacity"
                      style={{ backgroundColor: getColor(count) }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-end gap-1">
            <span className="text-[9px] text-zinc-600">Az</span>
            {["#1a1a1e", ...theme.shades].map((c) => (
              <div key={c} className="h-3 w-3 rounded-[2px]" style={{ backgroundColor: c }} />
            ))}
            <span className="text-[9px] text-zinc-600">Cok</span>
          </div>
        </div>
      </div>
    </div>
  );
}
