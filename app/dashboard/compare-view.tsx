"use client";

import { useThemeColors } from "@/components/theme-provider";
import { useLanguage } from "@/lib/i18n";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type MonthData = {
  label: string;
  commits: number;
  activeDays: number;
  linesAdded: number;
};

const MONTH_MAP_TR_TO_EN: Record<string, string> = {
  Ocak: "January", Şubat: "February", Mart: "March", Nisan: "April",
  Mayıs: "May", Haziran: "June", Temmuz: "July", Ağustos: "August",
  Eylül: "September", Ekim: "October", Kasım: "November", Aralık: "December",
};

function localizeMonth(label: string, lang: string): string {
  if (lang !== "en") return label;
  return MONTH_MAP_TR_TO_EN[label] ?? label;
}

export default function CompareView({
  thisMonth,
  lastMonth,
}: {
  thisMonth: MonthData;
  lastMonth: MonthData;
}) {
  const theme = useThemeColors();
  const { lang } = useLanguage();

  const thisMonthLabel = localizeMonth(thisMonth.label, lang);
  const lastMonthLabel = localizeMonth(lastMonth.label, lang);

  const metrics: { key: keyof MonthData; label: string; format: (v: number) => string }[] = [
    { key: "commits", label: "Commit", format: (v) => v.toLocaleString(lang === "en" ? "en-US" : "tr-TR") },
    { key: "activeDays", label: lang === "en" ? "Active Days" : "Aktif Gün", format: (v) => lang === "en" ? `${v} days` : `${v} gün` },
    { key: "linesAdded", label: lang === "en" ? "Lines Added" : "Eklenen Satır", format: (v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v) },
  ];

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 h-full flex flex-col">
      <h2 className="mb-4 text-sm font-medium text-zinc-400 shrink-0">
        {thisMonthLabel} vs {lastMonthLabel}
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
                  {lang === "en" ? `${Math.abs(pctDiff)}%` : `%${Math.abs(pctDiff)}`}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-right text-xs text-zinc-400">{thisMonthLabel}</span>
                  <div className="flex-1 h-2 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(a / max) * 100}%`, backgroundColor: theme.accent }} />
                  </div>
                  <span className="w-12 shrink-0 text-xs text-zinc-300 tabular-nums font-medium">{format(a)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-right text-xs text-zinc-600">{lastMonthLabel}</span>
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
