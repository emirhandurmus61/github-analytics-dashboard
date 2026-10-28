"use client";

import { Flame, Trophy, Award, HeartCrack, ExternalLink, X } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/lib/i18n";
import type { Badge } from "@/lib/badges";
import { cn } from "@/lib/ui/format";

export type StreakStatus = "safe" | "at_risk" | "broken_today" | "record_broken" | "no_streak";

type Props = {
  status: StreakStatus;
  currentStreak: number;
  brokenStreak?: number;
  previousRecord?: number;
  todayBadges?: Badge[];
};

type Notice = {
  key: string;
  tone: "good" | "warn" | "bad" | "info";
  icon: typeof Flame;
  title: string;
  body: string;
  action?: { href: string; label: string };
};

const TONE: Record<Notice["tone"], string> = {
  good: "var(--hue-green)",
  warn: "var(--hue-yellow)",
  bad: "var(--hue-red)",
  info: "var(--hue-purple)",
};

/**
 * Notices above the grid, styled like editor notifications: a colored rule on
 * the left, one line of title, one line of detail, an optional action.
 */
export default function StreakGuard({ status, currentStreak, brokenStreak, previousRecord, todayBadges = [] }: Props) {
  const { lang } = useLanguage();
  const [dismissed, setDismissed] = useState<string[]>([]);
  const en = lang === "en";
  const list: Notice[] = [];

  if (status === "record_broken") {
    list.push({
      key: "record",
      tone: "good",
      icon: Trophy,
      title: en ? `New personal record: ${currentStreak} days in a row` : `Yeni kişisel rekor: ${currentStreak} gün üst üste`,
      body: en
        ? `Your previous best was ${previousRecord ?? currentStreak - 1} days. Every commit from here extends the record.`
        : `Önceki en iyin ${previousRecord ?? currentStreak - 1} gündü. Bundan sonraki her commit rekoru uzatır.`,
    });
  }
  if (todayBadges.length) {
    list.push({
      key: "badges",
      tone: "info",
      icon: Award,
      title: en ? `Unlocked today: ${todayBadges.map((b) => b.name).join(", ")}` : `Bugün açıldı: ${todayBadges.map((b) => b.name).join(", ")}`,
      body: en ? "See the full series in the Badges card." : "Serinin tamamını Rozetler kartında görebilirsin.",
    });
  }
  if (status === "at_risk") {
    list.push({
      key: "risk",
      tone: "warn",
      icon: Flame,
      title: en ? `Your ${currentStreak}-day streak ends at midnight` : `${currentStreak} günlük serin gece yarısı bitiyor`,
      body: en ? "No commit yet today. One push keeps it going." : "Bugün henüz commit yok. Tek bir push seriyi sürdürür.",
      action: { href: "https://github.com", label: en ? "Open GitHub" : "GitHub'ı aç" },
    });
  }
  if (status === "broken_today") {
    const n = brokenStreak && brokenStreak > 0 ? brokenStreak : currentStreak;
    list.push({
      key: "broken",
      tone: "bad",
      icon: HeartCrack,
      title: en ? `Your ${n}-day streak ended yesterday` : `${n} günlük serin dün sona erdi`,
      body: en ? "A commit today starts a new one." : "Bugün atacağın bir commit yenisini başlatır.",
    });
  }

  const visible = list.filter((n) => !dismissed.includes(n.key));
  if (!visible.length) return null;

  return (
    <div className="mb-4 flex flex-col gap-2" role="status">
      {visible.map((n) => {
        const Icon = n.icon;
        return (
          <div
            key={n.key}
            className={cn("relative flex items-start gap-3 rounded-panel border border-line bg-surface pl-4 pr-2 py-2.5 overflow-hidden")}
          >
            <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: TONE[n.tone] }} />
            <Icon size={16} className="mt-0.5 shrink-0" style={{ color: TONE[n.tone] }} />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-ink">{n.title}</p>
              <p className="text-[12.5px] text-ink-3">{n.body}</p>
            </div>
            {n.action && (
              <a href={n.action.href} target="_blank" rel="noopener noreferrer" className="btn btn-sm shrink-0 self-center">
                {n.action.label}
                <ExternalLink />
              </a>
            )}
            <button
              type="button"
              className="btn btn-ghost btn-sm btn-icon shrink-0"
              onClick={() => setDismissed((d) => [...d, n.key])}
              aria-label={en ? "Dismiss" : "Kapat"}
            >
              <X />
            </button>
          </div>
        );
      })}
    </div>
  );
}
