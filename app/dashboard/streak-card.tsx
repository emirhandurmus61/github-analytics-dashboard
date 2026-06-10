"use client";

import { useThemeColors } from "@/components/theme-provider";
import { Flame, Zap, CalendarDays } from "lucide-react";

type Props = {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
};

export default function StreakCard({ currentStreak, longestStreak, totalActiveDays }: Props) {
  const theme = useThemeColors();

  const items = [
    { icon: <Flame className="w-5 h-5" />, value: currentStreak, label: "Streak", color: theme.accent },
    { icon: <Zap className="w-5 h-5" />, value: longestStreak, label: "Rekor", color: "#facc15" },
    { icon: <CalendarDays className="w-5 h-5" />, value: totalActiveDays, label: "Aktif Gun", color: theme.accentMid },
  ];

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 h-full flex flex-col">
      <div className="grid grid-cols-3 gap-3 flex-1">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col items-center justify-center text-center gap-2">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl"
              style={{ backgroundColor: `${item.color}15`, color: item.color }}
            >
              {item.icon}
            </div>
            <div className="text-2xl font-bold tabular-nums" style={{ color: item.color }}>
              {item.value}
            </div>
            <div className="text-[10px] text-zinc-500">{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
