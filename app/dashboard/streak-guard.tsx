"use client";

import { useThemeColors } from "@/components/theme-provider";

export type StreakStatus =
  | "safe"          // bugün commit var
  | "at_risk"       // dün var bugün yok, streak tehlikede
  | "broken_today"  // bugün ve dün yok, streak az önce kırıldı (streak > 0 idi)
  | "no_streak";    // zaten streak yok

type Props = {
  status: StreakStatus;
  currentStreak: number;
};

export default function StreakGuard({ status, currentStreak }: Props) {
  const theme = useThemeColors();

  if (status === "safe" || status === "no_streak") return null;

  const isAtRisk = status === "at_risk";

  return (
    <div
      className="flex items-start gap-3 rounded-2xl border p-4"
      style={{
        borderColor: isAtRisk ? "rgba(251,191,36,0.3)" : "rgba(248,113,113,0.3)",
        backgroundColor: isAtRisk ? "rgba(251,191,36,0.06)" : "rgba(248,113,113,0.06)",
      }}
    >
      {/* İkon */}
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg"
        style={{
          backgroundColor: isAtRisk ? "rgba(251,191,36,0.12)" : "rgba(248,113,113,0.12)",
        }}
      >
        {isAtRisk ? "⚠️" : "💔"}
      </div>

      {/* Metin */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold"
          style={{ color: isAtRisk ? "#fbbf24" : "#f87171" }}
        >
          {isAtRisk
            ? `${currentStreak} günlük streak tehlikede!`
            : `${currentStreak} günlük streak kırıldı`}
        </p>
        <p className="mt-0.5 text-xs text-zinc-500">
          {isAtRisk
            ? "Bugün henüz commit atmadın. Streakini korumak için bugün en az 1 commit at."
            : "Dün de bugün de commit atılmadı. Yeni bir seri başlatabilirsin."}
        </p>
      </div>

      {/* CTA */}
      {isAtRisk && (
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80"
          style={{ backgroundColor: "#fbbf24", color: "#09090b" }}
        >
          GitHub'a git →
        </a>
      )}
    </div>
  );
}
