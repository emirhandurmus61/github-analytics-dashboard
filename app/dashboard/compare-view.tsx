"use client";

import { useThemeColors } from "@/components/theme-provider";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type MonthData = {
  label: string;
  commits: number;
  activeDays: number;
  linesAdded: number;
};

export default function CompareView({
  thisMonth,
  lastMonth,
}: {
  thisMonth: MonthData;
  lastMonth: MonthData;
}) {
  const theme = useThemeColors();

  const metrics: { key: keyof MonthData; label: string; format: (v: number) => string }[] = [
    { key: "commits", label: "Commit", format: (v) => v.toLocaleString("tr-TR") },
    { key: "activeDays", label: "Aktif Gun", format: (v) => `${v} gun` },
    { key: "linesAdded", label: "Eklenen Satir", format: (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v) },
  ];

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 h-full flex flex-col">
      <h2 className="mb-4 text-sm font-medium text-zinc-400 shrink-0">
        {thisMonth.label} vs {lastMonth.label}
      </h2>
      <div className="flex-1 min-h-0 flex flex-col justify-between gap-4">
        {metrics.map(({ key, label, format }) => {
          const a = thisMonth[key] as number;
          const b = lastMonth[key] as number;
          const max = Math.max(a, b, 1);
          const pctDiff = b > 0 ? Math.round(((a - b) / b) * 100) : a > 0 ? 100 : 0;
          const isUp = pctDiff >= 0;

          return (
            <div key={key} className="flex-1">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-zinc-400">{label}</span>
                <span className="flex items-center gap-1 text-sm font-semibold" style={{ color: pctDiff === 0 ? "#71717a" : isUp ? theme.accent : "#f87171" }}>
                  {pctDiff === 0
                    ? <Minus className="w-3.5 h-3.5" />
                    : isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  %{Math.abs(pctDiff)}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-right text-xs text-zinc-400">{thisMonth.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(a / max) * 100}%`, backgroundColor: theme.accent }} />
                  </div>
                  <span className="w-12 shrink-0 text-xs text-zinc-300 tabular-nums font-medium">{format(a)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-right text-xs text-zinc-600">{lastMonth.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full rounded-full bg-zinc-600" style={{ width: `${(b / max) * 100}%` }} />
                  </div>
                  <span className="w-12 shrink-0 text-xs text-zinc-500 tabular-nums">{format(b)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
