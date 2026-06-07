"use client";

import type { Insight } from "@/lib/insights";

const CONFIG = {
  positive: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    dot: "bg-emerald-400",
    text: "text-emerald-300",
  },
  negative: {
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    dot: "bg-red-400",
    text: "text-red-300",
  },
  warning: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    dot: "bg-yellow-400",
    text: "text-yellow-300",
  },
  neutral: {
    bg: "bg-zinc-800/60",
    border: "border-zinc-700/50",
    dot: "bg-blue-400",
    text: "text-zinc-300",
  },
};

export default function InsightCards({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="mb-4 text-sm font-medium text-zinc-400">
        Aktivite İçgörüleri ✨
      </h2>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {insights.map((insight, i) => {
          const c = CONFIG[insight.type];
          return (
            <div
              key={i}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${c.bg} ${c.border}`}
            >
              <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${c.dot}`} />
              <p className={`text-sm leading-snug ${c.text}`}>{insight.message}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
