"use client";

import { useThemeColors } from "@/components/theme-provider";
import { Plus, Minus, GitCommit, GitPullRequest, CircleDot, ArrowUpDown } from "lucide-react";

type Props = {
  linesAdded: number;
  linesDeleted: number;
  totalCommits: number;
  mergedPRs: number;
  openIssues: number;
  closedIssues: number;
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

export default function CodeStats({
  linesAdded, linesDeleted, totalCommits, mergedPRs, openIssues, closedIssues,
}: Props) {
  const theme = useThemeColors();
  const net = linesAdded - linesDeleted;
  const addPct = linesAdded + linesDeleted > 0
    ? (linesAdded / (linesAdded + linesDeleted)) * 100
    : 0;

  const items = [
    { icon: <Plus className="w-4 h-4" />, value: `+${fmt(linesAdded)}`, label: "Eklendi", color: theme.accent },
    { icon: <Minus className="w-4 h-4" />, value: `-${fmt(linesDeleted)}`, label: "Silindi", color: "#f87171" },
    { icon: <ArrowUpDown className="w-4 h-4" />, value: net >= 0 ? `+${fmt(net)}` : fmt(net), label: "Net", color: net >= 0 ? theme.accentMid : "#fb923c" },
    { icon: <GitCommit className="w-4 h-4" />, value: totalCommits.toLocaleString("tr-TR"), label: "Commit", color: "#f4f4f5" },
    { icon: <GitPullRequest className="w-4 h-4" />, value: mergedPRs.toString(), label: "PR", color: "#c084fc" },
    { icon: <CircleDot className="w-4 h-4" />, value: `${closedIssues}/${openIssues + closedIssues}`, label: "Issue", color: "#fbbf24" },
  ];

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 h-full flex flex-col">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 flex-1">
        {items.map((item) => (
          <div key={item.label} className="rounded-xl bg-zinc-800/40 flex flex-col items-center justify-center text-center gap-1 p-2">
            <div style={{ color: item.color }}>{item.icon}</div>
            <div className="text-base font-bold tabular-nums" style={{ color: item.color }}>
              {item.value}
            </div>
            <div className="text-[9px] text-zinc-600">{item.label}</div>
          </div>
        ))}
      </div>

      {(linesAdded + linesDeleted) > 0 && (
        <div className="mt-3 shrink-0">
          <div className="flex justify-between text-[10px] text-zinc-600 mb-1">
            <span>Ekleme / Silme</span>
            <span>%{Math.round(addPct)}</span>
          </div>
          <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-red-900/30">
            <div className="h-full rounded-full" style={{ width: `${addPct}%`, backgroundColor: theme.accent }} />
          </div>
        </div>
      )}
    </div>
  );
}
