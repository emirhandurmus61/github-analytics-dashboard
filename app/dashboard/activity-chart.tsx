"use client";

import { useState } from "react";
import { useThemeColors } from "@/components/theme-provider";
import { type Language } from "@/lib/i18n";
import { Calendar, Activity, Zap } from "lucide-react";

interface ActivityChartProps {
  data: { date: string; commit_count: number }[];
  emptyText?: string;
  lang?: Language;
}

export default function ActivityChart({
  data,
  emptyText = "Veri yok",
  lang = "tr",
}: ActivityChartProps) {
  const theme = useThemeColors();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[160px] text-xs text-zinc-600 gap-2">
        <Calendar className="w-5 h-5 text-zinc-700" />
        <span>{emptyText}</span>
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.commit_count), 1);
  const totalCommits = data.reduce((s, d) => s + d.commit_count, 0);
  const activeDays = data.filter((d) => d.commit_count > 0).length;

  const activePoint = selectedIndex !== null ? data[selectedIndex] : null;

  return (
    <div className="flex flex-col flex-1 justify-between gap-3 w-full min-h-[160px]">
      {/* Top info row: selected day or overview stats */}
      <div className="flex items-center justify-between min-h-[24px] text-xs shrink-0">
        {activePoint ? (
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-medium">
              {new Date(activePoint.date + "T00:00:00").toLocaleDateString(
                lang === "en" ? "en-US" : "tr-TR",
                { month: "short", day: "numeric", weekday: "short" }
              )}
            </span>
            <span
              className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
              style={{
                backgroundColor: activePoint.commit_count > 0 ? theme.accentBg : "rgba(63, 63, 70, 0.4)",
                color: activePoint.commit_count > 0 ? theme.accent : "#a1a1aa",
              }}
            >
              {activePoint.commit_count} {lang === "en" ? (activePoint.commit_count === 1 ? "commit" : "commits") : "commit"}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-zinc-400">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-zinc-500" />
              <span className="font-semibold text-zinc-200 tabular-nums">{totalCommits}</span>
              <span className="text-[11px] text-zinc-500">commit</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-zinc-500" />
              <span className="font-semibold text-zinc-200 tabular-nums">{activeDays}</span>
              <span className="text-[11px] text-zinc-500">
                / {data.length} {lang === "en" ? "active days" : "aktif gün"}
              </span>
            </div>
          </div>
        )}

        <div className="text-[11px] text-zinc-500">
          {totalCommits > 0 ? (
            <span>
              {lang === "en" ? "Peak" : "Zirve"}:{" "}
              <strong className="text-zinc-300 font-semibold">{max}</strong>/gün
            </span>
          ) : (
            <span className="text-zinc-600">
              {lang === "en" ? "No commits in period" : "Dönemde commit yok"}
            </span>
          )}
        </div>
      </div>

      {/* 30-Day Bar Histogram with explicit pixel heights */}
      <div
        className="w-full h-[110px] flex items-end gap-1 px-0.5 relative pt-2"
        onMouseLeave={() => setSelectedIndex(null)}
      >
        {data.map((d, index) => {
          const hasCommits = d.commit_count > 0;
          // Calculate height directly in pixels (8px base to 100px max) so flex percentage collapse never occurs on mobile
          const heightPx = hasCommits
            ? Math.max(Math.round((d.commit_count / max) * 95), 16)
            : 8;

          const isSelected = selectedIndex === index;

          return (
            <div
              key={d.date}
              className="flex-1 flex flex-col justify-end items-center h-full cursor-pointer py-1"
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={() => setSelectedIndex(isSelected ? null : index)}
              onTouchStart={() => setSelectedIndex(index)}
            >
              <div
                className="w-full rounded-t-sm transition-all duration-150"
                style={{
                  height: `${heightPx}px`,
                  minHeight: "8px",
                  backgroundColor: hasCommits
                    ? isSelected
                      ? "#ffffff"
                      : theme.accent
                    : isSelected
                    ? "rgba(161, 161, 170, 0.6)"
                    : "rgba(63, 63, 70, 0.45)",
                  boxShadow: isSelected && hasCommits ? `0 0 8px ${theme.accent}` : "none",
                  transform: isSelected ? "scaleY(1.05)" : "scaleY(1)",
                  transformOrigin: "bottom",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Date timeline footer */}
      <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-2 border-t border-zinc-800/60 shrink-0">
        <span>
          {data[0]?.date
            ? new Date(data[0].date + "T00:00:00").toLocaleDateString(
                lang === "en" ? "en-US" : "tr-TR",
                { month: "short", day: "numeric" }
              )
            : ""}
        </span>
        <span className="text-zinc-600">
          {data[Math.floor(data.length / 2)]?.date
            ? new Date(data[Math.floor(data.length / 2)].date + "T00:00:00").toLocaleDateString(
                lang === "en" ? "en-US" : "tr-TR",
                { month: "short", day: "numeric" }
              )
            : ""}
        </span>
        <span>
          {lang === "en" ? "Today" : "Bugün"}
        </span>
      </div>
    </div>
  );
}
