"use client";

import { useThemeColors } from "@/components/theme-provider";
import { type Badge, RARITY_COLORS } from "@/lib/badges";
import {
  Rocket, Flame, Zap, Moon, Sunrise, Swords, Eraser, Globe, Globe2, Lock, Trophy,
  Gem, Languages, Hash, Award, Footprints, Package, Building2, GitMerge, Bug, Star, Crown,
} from "lucide-react";

type Props = { badges: Badge[] };

const RARITY_LABEL: Record<Badge["rarity"], string> = {
  common: "Yaygin",
  rare: "Nadir",
  epic: "Epik",
};

const RARITY_GLOW: Record<Badge["rarity"], string> = {
  common: "rgba(161,161,170,0.12)",
  rare: "rgba(96,165,250,0.18)",
  epic: "rgba(192,132,252,0.22)",
};

const BADGE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  first_sync: Rocket,
  streak_7: Flame,
  streak_30: Zap,
  streak_100: Gem,
  night_owl: Moon,
  early_bird: Sunrise,
  weekend_warrior: Swords,
  big_cleanup: Eraser,
  polyglot: Globe,
  hexaglot: Languages,
  open_source: Globe2,
  century: Hash,
  millennium: Award,
  marathoner: Footprints,
  collector: Package,
  architect: Building2,
  merge_master: GitMerge,
  bug_hunter: Bug,
  stargazer: Star,
  dedicated: Crown,
};

function BadgeCard({ badge }: { badge: Badge }) {
  const rarity = RARITY_COLORS[badge.rarity];
  const glow = RARITY_GLOW[badge.rarity];
  const Icon = BADGE_ICON[badge.id] ?? Rocket;

  if (!badge.earned) {
    return (
      <div
        title={`${badge.name} — ${badge.description}`}
        className="group relative flex flex-col items-center justify-center gap-2 rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-3 text-center h-full transition-colors hover:border-zinc-700"
      >
        <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-zinc-800/50">
          <Icon className="w-5 h-5 text-zinc-700" />
        </div>
        <p className="text-[10px] font-medium text-zinc-700 leading-tight">{badge.name}</p>
        <p className="text-[9px] text-zinc-700/80 leading-tight line-clamp-2">{badge.description}</p>
        <Lock className="absolute top-2 right-2 w-2.5 h-2.5 text-zinc-700" />
      </div>
    );
  }

  return (
    <div
      title={`${badge.name} — ${badge.description}`}
      className="relative flex flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center overflow-hidden h-full transition-transform hover:-translate-y-0.5"
      style={{
        borderColor: rarity.border,
        backgroundColor: rarity.bg,
        boxShadow: `0 0 20px ${glow}, inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{ background: `linear-gradient(135deg, transparent 40%, ${rarity.text}15 50%, transparent 60%)` }}
      />
      <span className="absolute top-1.5 left-2 text-sm leading-none opacity-80">{badge.emoji}</span>
      <div
        className="relative flex items-center justify-center w-11 h-11 rounded-xl"
        style={{ backgroundColor: `${rarity.text}18`, boxShadow: `0 0 12px ${rarity.text}20`, color: rarity.text }}
      >
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-[10px] font-semibold leading-tight" style={{ color: rarity.text }}>
        {badge.name}
      </p>
      <p className="text-[9px] text-zinc-400 leading-tight line-clamp-2">{badge.description}</p>
      <span
        className="rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider"
        style={{ backgroundColor: `${rarity.text}12`, color: rarity.text, border: `1px solid ${rarity.border}` }}
      >
        {RARITY_LABEL[badge.rarity]}
      </span>
    </div>
  );
}

export default function BadgeCollection({ badges }: Props) {
  const theme = useThemeColors();
  const earned = badges.filter((b) => b.earned);
  const total = badges.length;
  const pct = total > 0 ? Math.round((earned.length / total) * 100) : 0;

  const rarityCounts = (["common", "rare", "epic"] as const).map((r) => ({
    rarity: r,
    earned: earned.filter((b) => b.rarity === r).length,
    total: badges.filter((b) => b.rarity === r).length,
  }));

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl"
            style={{ backgroundColor: `${theme.accent}15` }}
          >
            <Trophy className="w-4.5 h-4.5 text-[var(--accent)]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-zinc-300">Rozet Koleksiyonu</h2>
            <p className="text-xs text-zinc-600">{earned.length} / {total} rozet kazanıldı</p>
          </div>
        </div>
        <span className="text-xl font-bold tabular-nums" style={{ color: theme.accent }}>
          %{pct}
        </span>
      </div>

      {/* Progress */}
      <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden mb-3 shrink-0">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: theme.accent, boxShadow: `0 0 8px ${theme.accent}40` }}
        />
      </div>

      {/* Rarity breakdown */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        {rarityCounts.map(({ rarity, earned: e, total: t }) => {
          const c = RARITY_COLORS[rarity];
          return (
            <div key={rarity} className="flex items-center gap-1.5 text-[10px]" style={{ color: c.text }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.text }} />
              <span className="font-semibold">{RARITY_LABEL[rarity]}</span>
              <span className="text-zinc-600 tabular-nums">{e}/{t}</span>
            </div>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5 lg:grid-cols-6 flex-1 min-h-0 overflow-auto custom-scroll pr-1">
        {badges.map((badge) => (
          <BadgeCard key={badge.id} badge={badge} />
        ))}
      </div>

      {/* Next goals */}
      {badges.some((b) => !b.earned) && (
        <div className="mt-3 pt-3 border-t border-zinc-800/60 shrink-0">
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Sıradaki Hedefler</p>
          <div className="space-y-1.5">
            {badges
              .filter((b) => !b.earned)
              .slice(0, 3)
              .map((b) => {
                const Icon = BADGE_ICON[b.id] ?? Rocket;
                const r = RARITY_COLORS[b.rarity];
                return (
                  <div key={b.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 bg-zinc-800/30">
                    <div className="flex items-center justify-center w-5 h-5 rounded-md" style={{ backgroundColor: `${r.text}10`, color: r.text }}>
                      <Icon className="w-3 h-3 opacity-50" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-zinc-400 block truncate">{b.name}</span>
                      <span className="text-[9px] text-zinc-600 block truncate">{b.description}</span>
                    </div>
                    <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0" style={{ color: r.text, backgroundColor: `${r.text}10` }}>
                      {RARITY_LABEL[b.rarity]}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
