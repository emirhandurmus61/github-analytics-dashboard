"use client";

import { useThemeColors } from "@/components/theme-provider";
import { AlertTriangle, HeartCrack, ExternalLink } from "lucide-react";

export type StreakStatus = "safe" | "at_risk" | "broken_today" | "no_streak";

type Props = {
  status: StreakStatus;
  currentStreak: number;
};

export default function StreakGuard({ status, currentStreak }: Props) {
  if (status === "safe" || status === "no_streak") return null;

  const isAtRisk = status === "at_risk";

  return (
    <div
      className="flex items-center gap-3 rounded-xl border px-4 py-3"
      style={{
        borderColor: isAtRisk ? "rgba(251,191,36,0.25)" : "rgba(248,113,113,0.25)",
        backgroundColor: isAtRisk ? "rgba(251,191,36,0.04)" : "rgba(248,113,113,0.04)",
      }}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{
          backgroundColor: isAtRisk ? "rgba(251,191,36,0.1)" : "rgba(248,113,113,0.1)",
        }}
      >
        {isAtRisk
          ? <AlertTriangle className="w-4 h-4 text-yellow-400" />
          : <HeartCrack className="w-4 h-4 text-red-400" />
        }
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium"
          style={{ color: isAtRisk ? "#fbbf24" : "#f87171" }}
        >
          {isAtRisk
            ? `${currentStreak} gunluk streak tehlikede!`
            : `${currentStreak} gunluk streak kirildi`}
        </p>
        <p className="text-xs text-zinc-500">
          {isAtRisk
            ? "Bugun henuz commit atmadin. Streakini korumak icin bugun en az 1 commit at."
            : "Yeni bir seri baslat."}
        </p>
      </div>

      {isAtRisk && (
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
          style={{ backgroundColor: "#fbbf24", color: "#09090b" }}
        >
          GitHub
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}
