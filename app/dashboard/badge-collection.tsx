"use client";

import { useState, useMemo } from "react";
import { useThemeColors } from "@/components/theme-provider";
import { type Badge, RARITY_COLORS } from "@/lib/badges";
import {
  Rocket, Flame, Zap, Moon, Sunrise, Swords, Eraser, Globe, Globe2, Lock, Trophy,
  Gem, Languages, Hash, Award, Footprints, Package, Building2, GitMerge, Bug, Star, Crown,
  Check, Target, Sparkles, ChevronRight, CheckCircle2,
} from "lucide-react";

type Props = { badges: Badge[] };

type FilterTab = "all" | "closest" | "earned" | "locked";

const RARITY_LABEL: Record<Badge["rarity"], string> = {
  common: "Yaygın",
  rare: "Nadir",
  epic: "Epik",
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
  const theme = useThemeColors();
  const rarity = RARITY_COLORS[badge.rarity];
  const Icon = BADGE_ICON[badge.id] ?? Rocket;

  const current = badge.current ?? 0;
  const target = badge.target ?? 1;
  const progressPct = Math.min(100, Math.max(0, Math.round((current / target) * 100)));

  if (!badge.earned) {
    return (
      <div
        title={`${badge.name} — ${badge.description} (${current.toLocaleString("tr-TR")}/${target.toLocaleString("tr-TR")} ${badge.unit ?? ""})`}
        className="group relative flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 text-center transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900 select-none min-h-[148px]"
      >
        {/* Top: Emoji & Lock status */}
        <div className="flex items-center justify-between w-full mb-1">
          <span className="text-sm opacity-50 grayscale">{badge.emoji}</span>
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-zinc-800/90 text-zinc-300 border border-zinc-700/60">
            <Lock className="w-2.5 h-2.5 text-zinc-400" />
            <span className="text-[9px]">Kilitli</span>
          </span>
        </div>

        {/* Center: Icon, Name, Description */}
        <div className="flex flex-col items-center my-1 min-w-0">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-800/90 border border-zinc-700/60 text-zinc-200 mb-2 group-hover:border-zinc-600 group-hover:text-zinc-100 transition-colors">
            <Icon className="w-5 h-5 text-zinc-300" />
          </div>
          <p className="text-xs font-semibold text-zinc-100 leading-tight line-clamp-1 group-hover:text-white transition-colors w-full px-0.5">
            {badge.name}
          </p>
          <p className="text-[10px] text-zinc-400 leading-snug line-clamp-2 mt-1 w-full px-0.5">
            {badge.description}
          </p>
        </div>

        {/* Bottom: Progress bar */}
        <div className="mt-2 pt-2 border-t border-zinc-800/80 w-full">
          <div className="flex items-center justify-between text-[10px] font-mono mb-1 text-zinc-300">
            <span className="truncate">
              {current.toLocaleString("tr-TR")}/{target.toLocaleString("tr-TR")} {badge.unit ?? ""}
            </span>
            <span className="font-semibold text-zinc-200 tabular-nums ml-1">
              %{progressPct}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progressPct}%`,
                backgroundColor: progressPct > 0 ? theme.accent : "#52525b",
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Earned card
  return (
    <div
      title={`${badge.name} — ${badge.description} (Kazanıldı)`}
      className="group relative flex flex-col justify-between rounded-xl border p-3 text-center transition-all duration-200 hover:-translate-y-0.5 select-none overflow-hidden min-h-[148px]"
      style={{
        borderColor: rarity.border,
        background: `linear-gradient(180deg, ${rarity.bg} 0%, rgba(24, 24, 27, 0.95) 100%)`,
        boxShadow: `0 0 16px ${rarity.glow}`,
      }}
    >
      {/* Top: Emoji & Rarity pill */}
      <div className="flex items-center justify-between w-full mb-1">
        <span className="text-sm">{badge.emoji}</span>
        <span
          className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
          style={{
            backgroundColor: rarity.badgeBg,
            color: rarity.text,
            border: `1px solid ${rarity.badgeBorder}`,
          }}
        >
          {RARITY_LABEL[badge.rarity]}
        </span>
      </div>

      {/* Center: Icon, Name, Description */}
      <div className="flex flex-col items-center my-1 min-w-0">
        <div
          className="relative flex items-center justify-center w-10 h-10 rounded-xl mb-2 transition-transform group-hover:scale-105"
          style={{
            backgroundColor: rarity.badgeBg,
            boxShadow: `0 0 14px ${rarity.glow}`,
            color: rarity.text,
            border: `1px solid ${rarity.badgeBorder}`,
          }}
        >
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-xs font-bold leading-tight line-clamp-1 w-full px-0.5" style={{ color: rarity.text }}>
          {badge.name}
        </p>
        <p className="text-[10px] text-zinc-300 leading-snug line-clamp-2 mt-1 w-full px-0.5">
          {badge.description}
        </p>
      </div>

      {/* Bottom: Earned indicator */}
      <div className="mt-2 pt-2 border-t border-zinc-800/80 w-full flex items-center justify-center gap-1 text-[10px] font-semibold text-emerald-400">
        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
        <span>Kazanıldı</span>
      </div>
    </div>
  );
}

function NextGoalsCard({ badge }: { badge: Badge }) {
  const theme = useThemeColors();
  const rarity = RARITY_COLORS[badge.rarity];
  const Icon = BADGE_ICON[badge.id] ?? Rocket;

  const current = badge.current ?? 0;
  const target = badge.target ?? 1;
  const progressPct = Math.min(100, Math.max(0, Math.round((current / target) * 100)));
  const remaining = Math.max(0, target - current);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-zinc-800/90 bg-zinc-950/70 p-3 hover:border-zinc-700/80 transition-all">
      {/* Left side: Icon & Badge Details */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
          style={{
            backgroundColor: rarity.badgeBg,
            color: rarity.text,
            border: `1px solid ${rarity.badgeBorder}`,
            boxShadow: `0 0 10px ${rarity.glow}`,
          }}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-zinc-100 truncate">{badge.name}</span>
            <span
              className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded"
              style={{
                color: rarity.text,
                backgroundColor: rarity.badgeBg,
                border: `1px solid ${rarity.badgeBorder}`,
              }}
            >
              {RARITY_LABEL[badge.rarity]}
            </span>
            <span className="text-xs">{badge.emoji}</span>
          </div>
          <p className="text-[11px] text-zinc-400 truncate mt-0.5">{badge.description}</p>
        </div>
      </div>

      {/* Right side: Progress Bar & Remaining */}
      <div className="flex flex-col sm:items-end w-full sm:w-56 shrink-0 space-y-1.5">
        <div className="flex items-center justify-between sm:justify-end gap-2 text-xs w-full">
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded truncate"
            style={{
              color: theme.accent,
              backgroundColor: `${theme.accent}15`,
              border: `1px solid ${theme.accent}30`,
            }}
          >
            {remaining > 0 ? `Son ${remaining.toLocaleString("tr-TR")} ${badge.unit ?? ""} kaldı` : "Tamamlanmak üzere"}
          </span>
          <span className="font-bold text-zinc-200 tabular-nums">
            %{progressPct}
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 w-full">
          <span>İlerleme:</span>
          <span className="text-zinc-300">{current.toLocaleString("tr-TR")} / {target.toLocaleString("tr-TR")} {badge.unit ?? ""}</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPct}%`,
              backgroundColor: theme.accent,
              boxShadow: `0 0 8px ${theme.accent}60`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function BadgeCollection({ badges }: Props) {
  const theme = useThemeColors();
  const [filter, setFilter] = useState<FilterTab>("all");

  const earned = useMemo(() => badges.filter((b) => b.earned), [badges]);
  const total = badges.length;
  const pct = total > 0 ? Math.round((earned.length / total) * 100) : 0;

  // Unearned badges sorted by progress percentage descending
  const unearnedSorted = useMemo(() => {
    return badges
      .filter((b) => !b.earned)
      .map((b) => {
        const cur = b.current ?? 0;
        const tgt = b.target ?? 1;
        const p = Math.min(100, Math.max(0, Math.round((cur / tgt) * 100)));
        const rem = Math.max(0, tgt - cur);
        return { ...b, progressPct: p, remaining: rem };
      })
      .sort((a, b) => b.progressPct - a.progressPct || a.remaining - b.remaining);
  }, [badges]);

  // Spotlight next goals in main view (top 2 closest)
  const topNextGoals = useMemo(() => unearnedSorted.slice(0, 2), [unearnedSorted]);

  // Filtered badges for the grid
  const displayedBadges = useMemo(() => {
    if (filter === "earned") return earned;
    if (filter === "locked") return badges.filter((b) => !b.earned);
    return badges;
  }, [badges, earned, filter]);

  const rarityCounts = (["common", "rare", "epic"] as const).map((r) => ({
    rarity: r,
    earned: earned.filter((b) => b.rarity === r).length,
    total: badges.filter((b) => b.rarity === r).length,
  }));

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
            style={{
              backgroundColor: `${theme.accent}15`,
              color: theme.accent,
              border: `1px solid ${theme.accent}30`,
            }}
          >
            <Trophy className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-semibold text-zinc-100">Rozet Koleksiyonu</h2>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                <Sparkles className="w-3 h-3 text-[var(--accent)]" />
                {total} Rozet
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              {earned.length} / {total} rozet kazanıldı
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-right">
          <div>
            <span className="text-lg sm:text-xl font-bold tabular-nums" style={{ color: theme.accent }}>
              %{pct}
            </span>
            <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-semibold">Tamamlandı</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden mb-3 shrink-0">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: theme.accent,
            boxShadow: `0 0 10px ${theme.accent}50`,
          }}
        />
      </div>

      {/* Rarity & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 shrink-0">
        {/* Filter tabs */}
        <div className="flex items-center gap-1 bg-zinc-950/70 p-1 rounded-xl border border-zinc-800/80 overflow-x-auto max-w-full">
          <button
            onClick={() => setFilter("all")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
              filter === "all"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Tümü ({total})
          </button>
          <button
            onClick={() => setFilter("closest")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 flex items-center gap-1 ${
              filter === "closest"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Target className="w-3 h-3 text-[var(--accent)]" />
            <span>Hedefler ({unearnedSorted.length})</span>
          </button>
          <button
            onClick={() => setFilter("earned")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
              filter === "earned"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Kazanılan ({earned.length})
          </button>
          <button
            onClick={() => setFilter("locked")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all shrink-0 ${
              filter === "locked"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Kilitli ({total - earned.length})
          </button>
        </div>

        {/* Rarity breakdown */}
        <div className="hidden sm:flex items-center gap-3">
          {rarityCounts.map(({ rarity, earned: e, total: t }) => {
            const c = RARITY_COLORS[rarity];
            return (
              <div key={rarity} className="flex items-center gap-1.5 text-[11px]" style={{ color: c.text }}>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: c.text, boxShadow: `0 0 6px ${c.glow}` }}
                />
                <span className="font-semibold">{RARITY_LABEL[rarity]}</span>
                <span className="text-zinc-400 tabular-nums">{e}/{t}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scroll pr-1 pb-1">
        {/* If 'closest' tab is active, show the complete list of upcoming targets sorted by progress */}
        {filter === "closest" ? (
          <div className="space-y-2.5">
            {unearnedSorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-400">
                <CheckCircle2 className="w-10 h-10 mb-2 text-emerald-400" />
                <p className="text-sm font-semibold text-zinc-200">Tebrikler! Tüm hedefler tamamlandı.</p>
                <p className="text-xs text-zinc-400 mt-1">Koleksiyondaki bütün rozetleri açtınız.</p>
              </div>
            ) : (
              unearnedSorted.map((badge) => (
                <NextGoalsCard key={badge.id} badge={badge} />
              ))
            )}
          </div>
        ) : (
          <>
            {/* Spotlight: Next Goals (top 2 closest) when in 'all' view */}
            {filter === "all" && topNextGoals.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                    <Target className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>Sıradaki Hedefler</span>
                    <span className="text-[10px] text-zinc-400 font-normal hidden sm:inline">
                      (Kazanmaya en yakın rozetler)
                    </span>
                  </div>
                  {unearnedSorted.length > 2 && (
                    <button
                      onClick={() => setFilter("closest")}
                      className="text-[11px] text-[var(--accent)] hover:underline flex items-center gap-0.5 font-medium"
                    >
                      <span>Tümünü Gör ({unearnedSorted.length})</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {topNextGoals.map((b) => (
                    <NextGoalsCard key={b.id} badge={b} />
                  ))}
                </div>
              </div>
            )}

            {/* Badges Grid */}
            {displayedBadges.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-400">
                <Trophy className="w-8 h-8 mb-2 opacity-40 text-zinc-500" />
                <p className="text-xs font-medium text-zinc-300">Bu filtreye uygun rozet bulunamadı.</p>
              </div>
            ) : (
              <div
                className="grid gap-2.5 sm:gap-3"
                style={{
                  gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                }}
              >
                {displayedBadges.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
