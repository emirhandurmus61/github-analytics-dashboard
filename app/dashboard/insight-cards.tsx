"use client";

import { useThemeColors } from "@/components/theme-provider";
import { TrendingUp, TrendingDown, AlertCircle, Info } from "lucide-react";
import type { Insight } from "@/lib/insights";

const ICONS = {
  positive: TrendingUp,
  negative: TrendingDown,
  warning: AlertCircle,
  neutral: Info,
};

export default function InsightCards({ insights }: { insights: Insight[] }) {
  const theme = useThemeColors();

  if (insights.length === 0) return null;

  function getStyle(type: Insight["type"]) {
    switch (type) {
      case "positive":
        return { bg: theme.accentBg, border: theme.accentBorder, icon: theme.accent, text: theme.accent };
      case "negative":
        return { bg: "rgba(239,68,68,0.06)", border: "rgba(239,68,68,0.15)", icon: "#f87171", text: "#fca5a5" };
      case "warning":
        return { bg: "rgba(234,179,8,0.06)", border: "rgba(234,179,8,0.15)", icon: "#facc15", text: "#fde047" };
      default:
        return { bg: "rgba(39,39,42,0.5)", border: "rgba(63,63,70,0.4)", icon: "#60a5fa", text: "#d4d4d8" };
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 h-full flex flex-col">
      <h2 className="mb-3 text-[10px] font-medium text-zinc-500 uppercase tracking-wider shrink-0">
        Icgoruler
      </h2>
      <div className="flex flex-wrap gap-2 flex-1 min-h-0 content-start overflow-auto custom-scroll">
        {insights.map((insight, i) => {
          const s = getStyle(insight.type);
          const Icon = ICONS[insight.type];
          return (
            <div
              key={i}
              className="flex items-center gap-2 rounded-xl border px-3 py-2"
              style={{ backgroundColor: s.bg, borderColor: s.border }}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: s.icon }} />
              <p className="text-xs leading-snug" style={{ color: s.text }}>
                {insight.message}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
