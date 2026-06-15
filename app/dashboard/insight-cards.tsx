"use client";

import { useThemeColors } from "@/components/theme-provider";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  Sparkles,
} from "lucide-react";
import type { Insight } from "@/lib/insights";

const TYPE_META = {
  positive: {
    Icon: TrendingUp,
    label: "İyi gidişat",
    badgeBg: "rgba(52,211,153,0.12)",
    badgeBorder: "rgba(52,211,153,0.25)",
    badgeText: "#34d399",
  },
  negative: {
    Icon: TrendingDown,
    label: "Dikkat",
    badgeBg: "rgba(239,68,68,0.10)",
    badgeBorder: "rgba(239,68,68,0.22)",
    badgeText: "#f87171",
  },
  warning: {
    Icon: AlertTriangle,
    label: "Uyarı",
    badgeBg: "rgba(234,179,8,0.10)",
    badgeBorder: "rgba(234,179,8,0.22)",
    badgeText: "#facc15",
  },
  neutral: {
    Icon: Info,
    label: "Bilgi",
    badgeBg: "rgba(96,165,250,0.10)",
    badgeBorder: "rgba(96,165,250,0.20)",
    badgeText: "#60a5fa",
  },
} as const;

export default function InsightCards({ insights }: { insights: Insight[] }) {
  const theme = useThemeColors();

  if (insights.length === 0) return null;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5 h-full flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2 shrink-0">
        <Sparkles
          className="w-3.5 h-3.5 shrink-0"
          style={{ color: theme.accent }}
        />
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
          İçgörüler
        </h2>
        <span
          className="ml-auto text-[10px] font-medium rounded-full px-2 py-0.5"
          style={{
            background: theme.accentBg,
            color: theme.accent,
            border: `1px solid ${theme.accentBorder}`,
          }}
        >
          {insights.length}
        </span>
      </div>

      {/* Divider */}
      <div className="h-px bg-zinc-800/60 shrink-0" />

      {/* Cards */}
      <ul className="flex flex-col gap-2 flex-1 min-h-0 overflow-auto custom-scroll pr-0.5">
        {insights.map((insight, i) => {
          const meta = TYPE_META[insight.type];
          const { Icon } = meta;

          /* positive tipi için tema rengini kullan */
          const isPositive = insight.type === "positive";
          const iconColor = isPositive ? theme.accent : meta.badgeText;
          const bg = isPositive ? theme.accentBg : meta.badgeBg;
          const border = isPositive ? theme.accentBorder : meta.badgeBorder;
          const badgeText = isPositive ? theme.accent : meta.badgeText;
          const badgeBg = isPositive
            ? `${theme.accentBg}`
            : meta.badgeBg;
          const badgeBorder = isPositive ? theme.accentBorder : meta.badgeBorder;

          return (
            <li
              key={i}
              className="flex items-start gap-3 rounded-xl px-3 py-2.5 transition-colors"
              style={{
                background: bg,
                border: `1px solid ${border}`,
              }}
            >
              {/* Icon bubble */}
              <div
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                style={{
                  background: badgeBg,
                  border: `1px solid ${badgeBorder}`,
                }}
              >
                <Icon className="w-3 h-3" style={{ color: iconColor }} />
              </div>

              {/* Text */}
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span
                  className="text-[9px] font-semibold uppercase tracking-widest leading-none"
                  style={{ color: badgeText, opacity: 0.75 }}
                >
                  {meta.label}
                </span>
                <p className="text-xs leading-snug text-zinc-300">
                  {insight.message}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
