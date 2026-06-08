"use client";

import { useThemeColors } from "@/components/theme-provider";
import type { Insight } from "@/lib/insights";

export default function InsightCards({ insights }: { insights: Insight[] }) {
  const theme = useThemeColors();

  if (insights.length === 0) return null;

  function getStyle(type: Insight["type"]) {
    switch (type) {
      case "positive":
        return {
          bg: theme.accentBg,
          border: theme.accentBorder,
          dotColor: theme.accent,
          textColor: theme.accent,
        };
      case "negative":
        return {
          bg: "rgba(239,68,68,0.08)",
          border: "rgba(239,68,68,0.2)",
          dotColor: "#f87171",
          textColor: "#fca5a5",
        };
      case "warning":
        return {
          bg: "rgba(234,179,8,0.08)",
          border: "rgba(234,179,8,0.2)",
          dotColor: "#facc15",
          textColor: "#fde047",
        };
      case "neutral":
      default:
        return {
          bg: "rgba(39,39,42,0.6)",
          border: "rgba(63,63,70,0.5)",
          dotColor: "#60a5fa",
          textColor: "#d4d4d8",
        };
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="mb-4 text-sm font-medium text-zinc-400">
        Aktivite İçgörüleri ✨
      </h2>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {insights.map((insight, i) => {
          const s = getStyle(insight.type);
          return (
            <div
              key={i}
              className="flex items-start gap-3 rounded-xl border px-4 py-3"
              style={{
                backgroundColor: s.bg,
                borderColor: s.border,
              }}
            >
              <div
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: s.dotColor }}
              />
              <p className="text-sm leading-snug" style={{ color: s.textColor }}>
                {insight.message}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
