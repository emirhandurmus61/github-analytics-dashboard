"use client";

import { useThemeColors } from "@/components/theme-provider";
import { useLanguage } from "@/lib/i18n";
import { TrendingUp, TrendingDown } from "lucide-react";

type Props = {
  thisWeek: number;
  lastWeek: number;
};

export default function WeekCompare({ thisWeek, lastWeek }: Props) {
  const theme = useThemeColors();
  const { lang } = useLanguage();
  const diff = thisWeek - lastWeek;
  const pct = lastWeek > 0 ? Math.round((diff / lastWeek) * 100) : thisWeek > 0 ? 100 : 0;
  const isUp = diff >= 0;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 h-full flex flex-col items-center justify-center p-5 gap-3">
      <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium shrink-0">
        {lang === "en" ? "This Week vs Last Week" : "Bu Hafta vs Geçen"}
      </p>

      <div className="flex items-center gap-5 flex-1 justify-center">
        <div className="text-center">
          <p className="text-3xl font-bold text-zinc-100 tabular-nums">{thisWeek}</p>
          <p className="text-[10px] text-zinc-600 mt-1">{lang === "en" ? "This week" : "Bu hafta"}</p>
        </div>
        <div className="h-10 w-px bg-zinc-800" />
        <div className="text-center">
          <p className="text-3xl font-bold text-zinc-600 tabular-nums">{lastWeek}</p>
          <p className="text-[10px] text-zinc-600 mt-1">{lang === "en" ? "Last week" : "Geçen"}</p>
        </div>
      </div>

      <div
        className="flex items-center gap-1.5 text-sm font-semibold shrink-0"
        style={{ color: isUp ? theme.accent : "#f87171" }}
      >
        {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        <span>{lang === "en" ? `${Math.abs(pct)}%` : `%${Math.abs(pct)}`}</span>
      </div>
    </div>
  );
}
