"use client";

import { useThemeColors } from "@/components/theme-provider";

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
    { key: "activeDays", label: "Aktif Gün", format: (v) => `${v} gün` },
    { key: "linesAdded", label: "Eklenen Satır", format: (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v) },
  ];

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="mb-5 text-sm font-medium text-zinc-400">
        Bu Ay vs Geçen Ay Karşılaştırması
      </h2>
      <div className="space-y-4">
        {metrics.map(({ key, label, format }) => {
          const a = thisMonth[key] as number;
          const b = lastMonth[key] as number;
          const max = Math.max(a, b, 1);
          const diff = a - b;
          const pctDiff = b > 0 ? Math.round(((a - b) / b) * 100) : a > 0 ? 100 : 0;
          const isUp = diff >= 0;

          return (
            <div key={key}>
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-zinc-500">{label}</span>
                <span
                  className="font-medium"
                  style={{ color: isUp ? theme.accent : "#f87171" }}
                >
                  {isUp ? "▲" : "▼"} %{Math.abs(pctDiff)}
                </span>
              </div>
              <div className="space-y-1.5">
                {/* Bu ay */}
                <div className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-right text-xs text-zinc-400">{thisMonth.label}</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-zinc-800 h-2">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(a / max) * 100}%`,
                        backgroundColor: theme.accent,
                      }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-xs text-zinc-300">{format(a)}</span>
                </div>
                {/* Geçen ay */}
                <div className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-right text-xs text-zinc-600">{lastMonth.label}</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-zinc-800 h-2">
                    <div
                      className="h-full rounded-full bg-zinc-600 transition-all"
                      style={{ width: `${(b / max) * 100}%` }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-xs text-zinc-500">{format(b)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
