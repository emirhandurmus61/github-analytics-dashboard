"use client";

import { useThemeColors } from "@/components/theme-provider";
import { type Badge, RARITY_COLORS } from "@/lib/badges";

type Props = { badges: Badge[] };

const RARITY_LABEL: Record<Badge["rarity"], string> = {
  common: "Yaygın",
  rare: "Nadir",
  epic: "Epik",
};

function BadgeCard({ badge }: { badge: Badge }) {
  const theme = useThemeColors();
  const rarity = RARITY_COLORS[badge.rarity];

  return (
    <div
      className="relative flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all"
      style={
        badge.earned
          ? { borderColor: rarity.border, backgroundColor: rarity.bg }
          : { borderColor: "#27272a", backgroundColor: "#18181b", opacity: 0.45 }
      }
      title={badge.earned ? badge.description : `Kilitli: ${badge.description}`}
    >
      {/* Rozet emoji */}
      <span
        className="text-3xl leading-none"
        style={{ filter: badge.earned ? "none" : "grayscale(1) opacity(0.4)" }}
      >
        {badge.emoji}
      </span>

      {/* İsim */}
      <p
        className="text-xs font-semibold leading-tight"
        style={{ color: badge.earned ? rarity.text : "#52525b" }}
      >
        {badge.name}
      </p>

      {/* Rarity pill */}
      {badge.earned && (
        <span
          className="rounded-full px-1.5 py-0.5 text-xs"
          style={{ backgroundColor: rarity.bg, color: rarity.text, border: `1px solid ${rarity.border}` }}
        >
          {RARITY_LABEL[badge.rarity]}
        </span>
      )}

      {/* Kilit ikonu */}
      {!badge.earned && (
        <svg
          className="absolute top-2 right-2 h-3 w-3 text-zinc-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      )}
    </div>
  );
}

export default function BadgeCollection({ badges }: Props) {
  const theme = useThemeColors();
  const earned = badges.filter((b) => b.earned);
  const total = badges.length;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-5">
      {/* Başlık */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-medium text-zinc-400">Rozetler</h2>
          <p className="mt-0.5 text-xs text-zinc-600">
            {earned.length}/{total} rozet kazanıldı
          </p>
        </div>
        {/* İlerleme halkası metin */}
        <div
          className="flex items-center gap-2 rounded-xl border px-3 py-2"
          style={{ borderColor: theme.accentBorder, backgroundColor: theme.accentBg }}
        >
          <span className="text-xs font-semibold" style={{ color: theme.accent }}>
            {earned.length}/{total}
          </span>
          <span className="text-xs text-zinc-500">tamamlandı</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${(earned.length / total) * 100}%`,
            backgroundColor: theme.accent,
          }}
        />
      </div>

      {/* Rozet grid */}
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
        {badges.map((badge) => (
          <BadgeCard key={badge.id} badge={badge} />
        ))}
      </div>

      {/* Kazanılmamış rozetlerin ipuçları */}
      {badges.some((b) => !b.earned) && (
        <div className="space-y-1.5 border-t border-zinc-800 pt-4">
          <p className="text-xs text-zinc-600 mb-2">Sıradaki hedefler</p>
          {badges
            .filter((b) => !b.earned)
            .slice(0, 3)
            .map((b) => (
              <div key={b.id} className="flex items-center gap-2 text-xs text-zinc-600">
                <span className="text-sm">{b.emoji}</span>
                <span>
                  <span className="text-zinc-400">{b.name}:</span> {b.description}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
