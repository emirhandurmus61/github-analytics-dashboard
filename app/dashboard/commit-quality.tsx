"use client";

import { useThemeColors } from "@/components/theme-provider";
import { MessageSquare, CheckCheck, AlertCircle } from "lucide-react";

type BigCommit = { message: string; additions: number; deletions: number; date: string };

type Props = {
  avgMsgLength: number;
  multiLinePct: number;
  conventionalPct: number;
  typeDist: { type: string; count: number }[];
  biggestCommits: BigCommit[];
  totalAnalyzed: number;
};

const TYPE_COLORS: Record<string, string> = {
  feat: "#34d399", fix: "#f87171", refactor: "#818cf8", chore: "#71717a",
  docs: "#60a5fa", test: "#fbbf24", style: "#f472b6", perf: "#fb923c",
  build: "#a3e635", ci: "#22d3ee", revert: "#e879f9",
};

const TYPE_LABELS: Record<string, string> = {
  feat: "Ozellik", fix: "Duzeltme", refactor: "Refactor", chore: "Chore",
  docs: "Dokuman", test: "Test", style: "Stil", perf: "Perf",
  build: "Build", ci: "CI", revert: "Geri Al",
};

function getMsgQ(avg: number) {
  if (avg >= 50) return { label: "Aciklayici", color: "#34d399" };
  if (avg >= 20) return { label: "Yeterli", color: "#fb923c" };
  return { label: "Kisa", color: "#f87171" };
}

function getConvQ(pct: number) {
  if (pct >= 80) return { label: "Mukemmel", color: "#34d399" };
  if (pct >= 40) return { label: "Gelisiyor", color: "#fb923c" };
  if (pct >= 10) return { label: "Az", color: "#71717a" };
  return { label: "Yok", color: "#52525b" };
}

export default function CommitQuality({
  avgMsgLength, multiLinePct, conventionalPct, typeDist, biggestCommits, totalAnalyzed,
}: Props) {
  const theme = useThemeColors();
  const msgQ = getMsgQ(avgMsgLength);
  const convQ = getConvQ(conventionalPct);
  const maxType = Math.max(...typeDist.map((t) => t.count), 1);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 h-full flex flex-col">
      {/* Header */}
      <div className="mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-zinc-500" />
          <h2 className="text-sm font-medium text-zinc-400">Commit Kalitesi</h2>
        </div>
        <p className="text-xs text-zinc-600 mt-0.5 ml-6">{totalAnalyzed.toLocaleString("tr-TR")} commit</p>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 grid grid-cols-1 gap-3 sm:grid-cols-2 overflow-auto custom-scroll">
        {/* Left column */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-3">
              <p className="text-[10px] text-zinc-600 mb-1">Ort. Mesaj</p>
              <p className="text-xl font-bold tabular-nums" style={{ color: msgQ.color }}>
                {avgMsgLength}<span className="text-xs font-normal text-zinc-600 ml-0.5">kr</span>
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: msgQ.color }}>{msgQ.label}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-3">
              <p className="text-[10px] text-zinc-600 mb-1">Detayli</p>
              <p className="text-xl font-bold tabular-nums" style={{ color: theme.accent }}>%{multiLinePct}</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">cok satirli</p>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1">
                <CheckCheck className="w-3 h-3 text-zinc-600" />
                <p className="text-[10px] text-zinc-600">Conventional</p>
              </div>
              <span className="text-[10px] font-medium" style={{ color: convQ.color }}>{convQ.label}</span>
            </div>
            <div className="flex items-end gap-2">
              <p className="text-xl font-bold tabular-nums" style={{ color: convQ.color }}>%{conventionalPct}</p>
              <div className="flex-1 mb-1.5">
                <div className="h-1.5 rounded-full bg-zinc-700 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${conventionalPct}%`, backgroundColor: convQ.color }} />
                </div>
              </div>
            </div>
          </div>

          {typeDist.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] text-zinc-600">Tip Dagilimi</p>
              {typeDist.slice(0, 5).map(({ type, count }) => {
                const color = TYPE_COLORS[type] ?? theme.accent;
                const pct = Math.round((count / maxType) * 100);
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-xs text-zinc-300">{TYPE_LABELS[type] ?? type}</span>
                      </div>
                      <span className="text-[10px] text-zinc-600 tabular-nums">{count}</span>
                    </div>
                    <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-2">
          <p className="text-[10px] text-zinc-600">En Buyuk Commitler</p>
          {biggestCommits.length === 0 ? (
            <p className="text-[10px] text-zinc-700">Satir verisi yok</p>
          ) : (
            <div className="space-y-2">
              {biggestCommits.map((c, i) => {
                const tot = c.additions + c.deletions;
                const addPct = tot > 0 ? (c.additions / tot) * 100 : 50;
                return (
                  <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-800/20 p-2.5 space-y-1.5">
                    <p className="text-xs text-zinc-300 leading-snug line-clamp-2">{c.message || "(bos)"}</p>
                    <div className="flex h-1 rounded-full overflow-hidden">
                      <div className="h-full" style={{ width: `${addPct}%`, backgroundColor: "#34d399" }} />
                      <div className="h-full" style={{ width: `${100 - addPct}%`, backgroundColor: "#f87171" }} />
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex gap-2">
                        <span className="text-emerald-400 tabular-nums">+{c.additions.toLocaleString("tr-TR")}</span>
                        <span className="text-red-400 tabular-nums">-{c.deletions.toLocaleString("tr-TR")}</span>
                      </div>
                      <span className="text-zinc-700">{c.date}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {avgMsgLength < 20 && (
            <div className="rounded-xl border p-2.5 mt-1" style={{ borderColor: "#f8717120", backgroundColor: "#f8717106" }}>
              <div className="flex items-start gap-1.5">
                <AlertCircle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-red-300">Commit mesajlarin ortalama {avgMsgLength} karakter.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
