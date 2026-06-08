"use client";

import { useThemeColors } from "@/components/theme-provider";

type Props = {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
};

export default function StreakCard({ currentStreak, longestStreak, totalActiveDays }: Props) {
  const theme = useThemeColors();

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="mb-5 text-sm font-medium text-zinc-400">Streak & Aktivite</h2>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="mb-1 text-4xl font-bold" style={{ color: theme.accent }}>
            {currentStreak}
          </div>
          <div className="text-xs text-zinc-500">Günlük Streak 🔥</div>
          <div className="mt-1 text-xs text-zinc-700">
            {currentStreak === 0 ? "Bugün commit at!" : `${currentStreak} gün üst üste`}
          </div>
        </div>
        <div className="text-center">
          <div className="mb-1 text-4xl font-bold text-yellow-400">
            {longestStreak}
          </div>
          <div className="text-xs text-zinc-500">En Uzun Streak ⚡</div>
          <div className="mt-1 text-xs text-zinc-700">
            {longestStreak > 0 ? `Rekor: ${longestStreak} gün` : "Henüz yok"}
          </div>
        </div>
        <div className="text-center">
          <div className="mb-1 text-4xl font-bold" style={{ color: theme.accentMid }}>
            {totalActiveDays}
          </div>
          <div className="text-xs text-zinc-500">Aktif Gün (1 yıl)</div>
          <div className="mt-1 text-xs text-zinc-700">
            {totalActiveDays > 0
              ? `%${Math.round((totalActiveDays / 365) * 100)} doluluk`
              : "Veri yok"}
          </div>
        </div>
      </div>
    </div>
  );
}
