"use client";

import { useLanguage } from "@/lib/i18n";
import { AlertTriangle, HeartCrack, ExternalLink, Trophy, Flame, Award } from "lucide-react";
import type { Badge } from "@/lib/badges";

export type StreakStatus = "safe" | "at_risk" | "broken_today" | "record_broken" | "no_streak";

type Props = {
  status: StreakStatus;
  currentStreak: number;
  brokenStreak?: number;
  previousRecord?: number;
  todayBadges?: Badge[];
};

export default function StreakGuard({
  status,
  currentStreak,
  brokenStreak,
  previousRecord,
  todayBadges = [],
}: Props) {
  const { lang } = useLanguage();

  const isAtRisk = status === "at_risk";
  const isBroken = status === "broken_today";
  const isRecordBroken = status === "record_broken";
  const hasBadges = todayBadges && todayBadges.length > 0;

  // Hiçbir bildirim yoksa null dön
  if (!isAtRisk && !isBroken && !isRecordBroken && !hasBadges) {
    return null;
  }

  const effectiveBrokenCount = brokenStreak && brokenStreak > 0 ? brokenStreak : currentStreak;

  return (
    <div className="space-y-3">
      {/* 1. Yeni Streak Rekoru Kutlaması */}
      {isRecordBroken && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 shadow-lg shadow-emerald-950/20">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
            <Trophy className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-300 flex items-center gap-1.5">
              <span>{lang === "en" ? "🎉 New Streak Record!" : "🎉 Yeni Streak Rekoru!"}</span>
              <Flame className="w-4 h-4 text-orange-400 inline" />
            </p>
            <p className="text-xs text-zinc-300 mt-0.5">
              {lang === "en"
                ? `You broke your previous record (${previousRecord ?? (currentStreak - 1)} days) with an unbroken ${currentStreak}-day streak! Keep up the momentum!`
                : `${currentStreak} günlük kesintisiz seri ile kişisel rekorunu (${previousRecord ?? (currentStreak - 1)} gün) kırdın! Muhteşem disiplin!`
              }
            </p>
          </div>
        </div>
      )}

      {/* 2. Bugün Kazanılan Başarılar / Rozetler */}
      {hasBadges && (
        <div className="flex items-center gap-3 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-3 shadow-lg shadow-purple-950/20">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/20 text-purple-300">
            <Award className="w-5 h-5 text-purple-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-purple-200">
              {lang === "en" ? "🏆 New Achievement Unlocked Today!" : "🏆 Bugün Yeni Başarı Kazanıldı!"}
            </p>
            <p className="text-xs text-zinc-300 mt-0.5">
              {lang === "en"
                ? `Congratulations! You unlocked: ${todayBadges.map((b) => b.name).join(", ")}`
                : `Tebrikler! Bugün yeni rozet kazandın: ${todayBadges.map((b) => b.name).join(", ")}`}
            </p>
          </div>
        </div>
      )}

      {/* 3. Streak Tehlikede Uyarısı */}
      {isAtRisk && (
        <div
          className="flex items-center gap-3 rounded-xl border px-4 py-3"
          style={{
            borderColor: "rgba(251,191,36,0.25)",
            backgroundColor: "rgba(251,191,36,0.04)",
          }}
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: "rgba(251,191,36,0.1)" }}
          >
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-yellow-400">
              {lang === "en" ? `${currentStreak}-day streak is at risk!` : `${currentStreak} günlük streak tehlikede!`}
            </p>
            <p className="text-xs text-zinc-500">
              {lang === "en"
                ? "You haven't committed yet today. Push at least 1 commit to protect your streak."
                : "Bugün henüz commit atmadın. Streakini korumak için bugün en az 1 commit at."}
            </p>
          </div>

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
        </div>
      )}

      {/* 4. Streak Kırıldı Uyarısı (Gerçek kırılan gün sayısı baz alınır, rekor değil) */}
      {isBroken && (
        <div
          className="flex items-center gap-3 rounded-xl border px-4 py-3"
          style={{
            borderColor: "rgba(248,113,113,0.25)",
            backgroundColor: "rgba(248,113,113,0.04)",
          }}
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: "rgba(248,113,113,0.1)" }}
          >
            <HeartCrack className="w-4 h-4 text-red-400" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-400">
              {lang === "en"
                ? `${effectiveBrokenCount}-day streak was broken`
                : `${effectiveBrokenCount} günlük streak kırıldı`}
            </p>
            <p className="text-xs text-zinc-500">
              {lang === "en"
                ? "Dün commit atılmadığı için seri sonlandı. Bugün yeni bir seri başlatabilirsin!"
                : "Dün commit atılmadığı için seri sonlandı. Bugün yeni bir seri başlatabilirsin!"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
