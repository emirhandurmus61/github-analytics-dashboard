"use client";

import { useState, useMemo, useEffect } from "react";
import { useThemeColors } from "@/components/theme-provider";
import {
  type Badge,
  type BadgeId,
  type BadgeSeries,
  RARITY_COLORS,
  SERIES_INFO,
} from "@/lib/badges";
import {
  Rocket, Flame, Zap, Moon, Sunrise, Swords, Eraser, Globe, Globe2, Lock, Trophy,
  Gem, Languages, Hash, Award, Footprints, Package, Building2, GitMerge, Bug, Star, Crown,
  Check, Target, Sparkles, ChevronRight, ChevronLeft, CheckCircle2, X, Info,
  Lightbulb, Code, Hammer, Calendar, CalendarDays, FolderGit2, GitPullRequest, GitFork,
  Trash2, Shield, ShieldCheck, Users, Activity, Medal, Sun, Mountain, Compass, Search,
  Wrench, Layers, Milestone, CheckCircle, Landmark,
} from "lucide-react";

type Props = { badges: Badge[] };

type StatusFilter = "all" | "closest" | "earned" | "locked";
type CategoryFilter = "all" | BadgeSeries | "habits";

const RARITY_LABEL: Record<Badge["rarity"], string> = {
  common: "Yaygın",
  rare: "Nadir",
  epic: "Epik",
};

const BADGE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  first_sync: Rocket,
  // Commits
  commit_1: Lightbulb,
  commit_25: Hammer,
  century: Hash,
  commit_500: Code,
  millennium: Award,
  commit_2500: Award,
  commit_5000: Crown,
  // Streak
  streak_3: Zap,
  streak_7: Flame,
  streak_14: Target,
  streak_30: Sparkles,
  streak_60: Activity,
  streak_100: Gem,
  dedicated: Crown,
  // Active Days
  active_7: Calendar,
  active_30: CalendarDays,
  marathoner: Footprints,
  active_200: Compass,
  active_300: Medal,
  // Repos
  repo_3: FolderGit2,
  collector: Package,
  repo_25: Building2,
  repo_50: Landmark,
  // Languages
  lang_2: Globe,
  polyglot: Globe,
  hexaglot: Languages,
  lang_12: Sparkles,
  // Code Volume
  lines_1k: Layers,
  lines_10k: Wrench,
  lines_50k: Milestone,
  architect: Building2,
  lines_500k: Mountain,
  // Pull Requests
  pr_3: GitPullRequest,
  pr_10: Users,
  merge_master: GitMerge,
  pr_50: Trophy,
  // Issues
  issue_5: Search,
  issue_15: CheckCircle,
  bug_hunter: Bug,
  issue_75: ShieldCheck,
  // Stars
  stars_5: Sparkles,
  stars_20: Star,
  stargazer: Star,
  stars_100: Sun,
  // Habits
  night_owl: Moon,
  night_owl_2: Moon,
  early_bird: Sunrise,
  early_bird_2: Sun,
  weekend_warrior: Swords,
  weekend_warrior_2: Shield,
  open_source_1: GitFork,
  open_source: Globe2,
  cleanup_1: Eraser,
  big_cleanup: Trash2,
};

const CATEGORIES: { id: CategoryFilter; label: string; icon: string }[] = [
  { id: "all", label: "Tüm Kategoriler", icon: "✨" },
  { id: "commits", label: "Commitler", icon: "💻" },
  { id: "streak", label: "Streak", icon: "🔥" },
  { id: "active_days", label: "Aktiflik", icon: "🏃" },
  { id: "repos", label: "Repolar", icon: "📦" },
  { id: "languages", label: "Diller", icon: "🌐" },
  { id: "code_volume", label: "Kod Hacmi", icon: "🏗️" },
  { id: "pull_requests", label: "PR & İş Birliği", icon: "🔀" },
  { id: "issues", label: "Issue", icon: "🐛" },
  { id: "stars", label: "Yıldızlar", icon: "⭐" },
  { id: "habits", label: "Alışkanlıklar", icon: "⏰" },
];

const HABIT_SERIES: BadgeSeries[] = ["night_owl", "early_bird", "weekend", "open_source", "cleanup"];

/* ─── Rozet Detay Modalı / Widget (Sade, Ferah ve Kullanıcı Odaklı) ──────── */

function BadgeDetailModal({
  badge,
  badges,
  onClose,
  onSelectBadge,
  onNext,
  onPrev,
}: {
  badge: Badge;
  badges: Badge[];
  onClose: () => void;
  onSelectBadge: (id: BadgeId) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const theme = useThemeColors();
  const rarity = RARITY_COLORS[badge.rarity];
  const Icon = BADGE_ICON[badge.id] ?? Trophy;
  const seriesInfo = badge.series ? SERIES_INFO[badge.series] : null;

  const current = badge.current ?? 0;
  const target = badge.target ?? 1;
  const progressPct = Math.min(100, Math.max(0, Math.round((current / target) * 100)));
  const remaining = Math.max(0, target - current);

  // Bu seriye ait tüm seviye rozetleri
  const seriesBadges = useMemo(() => {
    if (!badge.series) return [];
    return badges
      .filter((b) => b.series === badge.series)
      .sort((a, b) => (a.tier ?? 0) - (b.tier ?? 0));
  }, [badge.series, badges]);

  // Klavye kısayolları (Esc, Sol/Sağ oklar)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNext();
      if (e.key === "ArrowLeft") onPrev();
    }
    window.addEventListener("keydown", handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose, onNext, onPrev]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Tıklayınca kapatan arka plan */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Kart Gövdesi */}
      <div
        className="relative w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl overflow-hidden z-10 max-h-[90vh] flex flex-col"
        style={{
          boxShadow: `0 0 50px ${rarity.glow}, 0 20px 40px rgba(0,0,0,0.8)`,
        }}
      >
        {/* Yumuşak ortam aurası */}
        <div
          className="absolute -top-24 -left-24 w-60 h-60 rounded-full pointer-events-none blur-3xl opacity-20"
          style={{ backgroundColor: rarity.text }}
        />

        {/* Üst Bar: Kategori Başlığı & Kapat Butonu */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-300">
              {seriesInfo?.title ?? "Özel Başarı"}
            </span>
            {badge.tier && badge.maxTier && (
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400">
                Seviye {badge.tier}/{badge.maxTier}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors"
            title="Kapat (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Modal Gövdesi */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scroll pr-1 py-4 space-y-4">
          {/* Rozet Odak Alanı */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-3">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center transition-transform"
                style={{
                  backgroundColor: badge.earned ? rarity.badgeBg : "rgba(39, 39, 42, 0.7)",
                  border: `2px solid ${badge.earned ? rarity.border : "rgba(63, 63, 70, 0.5)"}`,
                  boxShadow: badge.earned ? `0 0 25px ${rarity.glow}` : "none",
                  color: badge.earned ? rarity.text : "#a1a1aa",
                }}
              >
                <Icon className="w-10 h-10" />
              </div>
              <span className="absolute -top-2 -right-2 text-xl p-1 rounded-lg bg-zinc-900 border border-zinc-800 shadow">
                {badge.emoji}
              </span>
            </div>

            <h3 className="text-xl font-bold text-zinc-100">{badge.name}</h3>
            <p className="text-xs text-zinc-400 max-w-xs mt-1 leading-relaxed">
              {badge.description}
            </p>

            {/* Durum Etiketi */}
            <div className="mt-2.5">
              {badge.earned ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Kazanıldı</span>
                </div>
              ) : remaining > 0 ? (
                <div
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    color: theme.accent,
                    backgroundColor: `${theme.accent}15`,
                    border: `1px solid ${theme.accent}30`,
                  }}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Son {remaining.toLocaleString("tr-TR")} {badge.unit ?? ""} kaldı</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs font-medium">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Açılmaya hazır</span>
                </div>
              )}
            </div>
          </div>

          {/* İlerleme Çubuğu */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 font-mono">
                {current.toLocaleString("tr-TR")} / {target.toLocaleString("tr-TR")} {badge.unit ?? ""}
              </span>
              <span className="font-bold tabular-nums" style={{ color: theme.accent }}>
                %{progressPct}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  backgroundColor: theme.accent,
                  boxShadow: `0 0 10px ${theme.accent}60`,
                }}
              />
            </div>
          </div>

          {/* Seviye Yol Haritası (Serideki Seviyeler) */}
          {seriesBadges.length > 1 && (
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-zinc-300">Seri Seviyeleri</span>
                <span className="text-zinc-500 text-[11px]">
                  {seriesBadges.filter((b) => b.earned).length} / {seriesBadges.length} Tamamlandı
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto custom-scroll pb-1">
                {seriesBadges.map((sb) => {
                  const isCurrent = sb.id === badge.id;
                  const isEarned = sb.earned;
                  return (
                    <button
                      key={sb.id}
                      onClick={() => onSelectBadge(sb.id)}
                      className={`flex-1 min-w-[54px] py-1.5 px-1.5 rounded-xl text-center transition-all ${
                        isCurrent
                          ? "bg-[var(--accent)] text-zinc-950 font-bold shadow-md"
                          : isEarned
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                          : "bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 border border-zinc-700/40"
                      }`}
                    >
                      <div className="text-[10px] font-semibold">Lv. {sb.tier}</div>
                      <div className="text-[9px] opacity-80 truncate">{sb.target?.toLocaleString("tr-TR")}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Hedef Şartı Bilgisi */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-3.5 text-xs text-zinc-400 flex items-start gap-2.5">
            <Target className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold text-zinc-200">Gereksinim: </span>
              {badge.description}. Toplam hedefe ulaşmak için {target.toLocaleString("tr-TR")} {badge.unit ?? "işlem"} gerekiyor.
            </div>
          </div>
        </div>

        {/* Modal Alt Barı: Navigasyon */}
        <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between shrink-0 text-xs">
          <button
            onClick={onPrev}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Önceki</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white transition-colors"
          >
            Tamam
          </button>

          <button
            onClick={onNext}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
          >
            <span>Sonraki</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Rozet Kartı (Sade, Ferah, Okunaklı ve Tıklanabilir) ─────────────────── */

function BadgeCard({
  badge,
  onClick,
}: {
  badge: Badge;
  onClick: () => void;
}) {
  const theme = useThemeColors();
  const rarity = RARITY_COLORS[badge.rarity];
  const Icon = BADGE_ICON[badge.id] ?? Trophy;

  const current = badge.current ?? 0;
  const target = badge.target ?? 1;
  const progressPct = Math.min(100, Math.max(0, Math.round((current / target) * 100)));

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`group relative flex flex-col justify-between rounded-2xl border p-4 text-center transition-all duration-200 select-none cursor-pointer min-h-[175px] ${
        badge.earned
          ? "border-zinc-800 bg-zinc-900/90 hover:border-zinc-600 hover:shadow-xl hover:-translate-y-1"
          : "border-zinc-800/70 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900/80 hover:-translate-y-0.5"
      }`}
      style={
        badge.earned
          ? {
              boxShadow: `0 0 20px ${rarity.glow}`,
              borderColor: rarity.border,
            }
          : undefined
      }
    >
      {/* Üst Bar: Seviye & Durum / Nadirlik */}
      <div className="flex items-center justify-between w-full mb-1">
        {badge.tier && badge.maxTier ? (
          <span className="text-[10px] font-semibold text-zinc-400">
            Lv. {badge.tier}/{badge.maxTier}
          </span>
        ) : (
          <span className="text-[10px] font-semibold text-zinc-500">Özel</span>
        )}

        {badge.earned ? (
          <span
            className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: rarity.badgeBg,
              color: rarity.text,
              border: `1px solid ${rarity.badgeBorder}`,
            }}
          >
            {RARITY_LABEL[badge.rarity]}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[10px] font-medium text-zinc-500">
            <Lock className="w-3 h-3 text-zinc-500" />
            <span>Kilitli</span>
          </span>
        )}
      </div>

      {/* Gövde: İkon, Başlık, Açıklama */}
      <div className="flex flex-col items-center my-1.5 min-w-0">
        <div
          className={`relative flex items-center justify-center w-12 h-12 rounded-2xl mb-2 transition-transform group-hover:scale-105 shadow-sm ${
            badge.earned
              ? ""
              : "bg-zinc-800/80 border border-zinc-700/60 text-zinc-400 group-hover:text-zinc-200"
          }`}
          style={
            badge.earned
              ? {
                  backgroundColor: rarity.badgeBg,
                  color: rarity.text,
                  border: `1px solid ${rarity.badgeBorder}`,
                  boxShadow: `0 0 14px ${rarity.glow}`,
                }
              : undefined
          }
        >
          <Icon className="w-6 h-6" />
          <span className="absolute -bottom-1 -right-1 text-xs">{badge.emoji}</span>
        </div>
        <p className="text-sm font-semibold text-zinc-100 leading-tight truncate w-full px-1">
          {badge.name}
        </p>
        <p className="text-xs text-zinc-400 leading-snug line-clamp-1 mt-0.5 w-full px-1">
          {badge.description}
        </p>
      </div>

      {/* Alt Bar: Kazanıldı veya İlerleme Göstergesi */}
      <div className="mt-2 pt-2 border-t border-zinc-800/60 w-full">
        {badge.earned ? (
          <div className="flex items-center justify-center gap-1 text-xs font-medium text-emerald-400">
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Kazanıldı</span>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span className="truncate">
                {current.toLocaleString("tr-TR")} / {target.toLocaleString("tr-TR")} {badge.unit ?? ""}
              </span>
              <span className="font-semibold text-zinc-300">%{progressPct}</span>
            </div>
            <div className="h-1 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${progressPct}%`,
                  backgroundColor: progressPct > 0 ? theme.accent : "#52525b",
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Sıradaki Hedef Kartı (Yatay, Sade ve Odaklanmış) ────────────────────── */

function NextGoalsCard({
  badge,
  onClick,
}: {
  badge: Badge;
  onClick: () => void;
}) {
  const theme = useThemeColors();
  const rarity = RARITY_COLORS[badge.rarity];
  const Icon = BADGE_ICON[badge.id] ?? Trophy;

  const current = badge.current ?? 0;
  const target = badge.target ?? 1;
  const progressPct = Math.min(100, Math.max(0, Math.round((current / target) * 100)));
  const remaining = Math.max(0, target - current);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 hover:border-zinc-700 hover:bg-zinc-900/90 transition-all cursor-pointer"
    >
      {/* Sol: İkon & Bilgiler */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className="flex items-center justify-center w-11 h-11 rounded-2xl shrink-0 group-hover:scale-105 transition-transform"
          style={{
            backgroundColor: rarity.badgeBg,
            color: rarity.text,
            border: `1px solid ${rarity.badgeBorder}`,
          }}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-zinc-100 truncate group-hover:text-white transition-colors">
              {badge.name}
            </span>
            {badge.tier && badge.maxTier && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                Lv. {badge.tier}/{badge.maxTier}
              </span>
            )}
            <span className="text-xs">{badge.emoji}</span>
          </div>
          <p className="text-xs text-zinc-400 truncate mt-0.5">{badge.description}</p>
        </div>
      </div>

      {/* Sağ: İlerleme & Kalan Miktar */}
      <div className="flex flex-col sm:items-end w-full sm:w-56 shrink-0 space-y-1.5">
        <div className="flex items-center justify-between sm:justify-end gap-2 text-xs w-full">
          <span
            className="text-[11px] font-medium px-2 py-0.5 rounded truncate"
            style={{
              color: theme.accent,
              backgroundColor: `${theme.accent}15`,
            }}
          >
            {remaining > 0 ? `Son ${remaining.toLocaleString("tr-TR")} ${badge.unit ?? ""} kaldı` : "Açılmak üzere"}
          </span>
          <span className="font-bold text-zinc-200 tabular-nums">%{progressPct}</span>
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 w-full">
          <span>{current.toLocaleString("tr-TR")} / {target.toLocaleString("tr-TR")} {badge.unit ?? ""}</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPct}%`,
              backgroundColor: theme.accent,
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Ana Rozet Koleksiyonu Bileşeni (Kullanıcı Odaklı & Düzenli) ─────────── */

export default function BadgeCollection({ badges }: Props) {
  const theme = useThemeColors();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [selectedBadgeId, setSelectedBadgeId] = useState<BadgeId | null>(null);

  const earned = useMemo(() => badges.filter((b) => b.earned), [badges]);
  const total = badges.length;
  const pct = total > 0 ? Math.round((earned.length / total) * 100) : 0;

  // Akıllı Sıradaki Hedefler: Her serinin sıradaki ilk kilitli seviyesi
  const activeNextMilestones = useMemo(() => {
    const unearned = badges.filter((b) => !b.earned);
    const seriesSeen = new Set<string>();
    const immediateTargets: (Badge & { progressPct: number; remaining: number })[] = [];

    for (const b of unearned) {
      const sKey = b.series ?? b.id;
      if (!seriesSeen.has(sKey)) {
        seriesSeen.add(sKey);
        const cur = b.current ?? 0;
        const tgt = b.target ?? 1;
        const p = Math.min(100, Math.max(0, Math.round((cur / tgt) * 100)));
        const rem = Math.max(0, tgt - cur);
        immediateTargets.push({ ...b, progressPct: p, remaining: rem });
      }
    }

    return immediateTargets.sort((a, b) => b.progressPct - a.progressPct || a.remaining - b.remaining);
  }, [badges]);

  // Filtrelenmiş rozetler
  const displayedBadges = useMemo(() => {
    let result = badges;

    // Kategori filtresi
    if (category !== "all") {
      if (category === "habits") {
        result = result.filter((b) => b.series && HABIT_SERIES.includes(b.series));
      } else {
        result = result.filter((b) => b.series === category);
      }
    }

    // Durum filtresi
    if (filter === "earned") return result.filter((b) => b.earned);
    if (filter === "locked") return result.filter((b) => !b.earned);
    return result;
  }, [badges, filter, category]);

  // Modalda açılacak rozet
  const selectedBadge = useMemo(() => {
    if (!selectedBadgeId) return null;
    return badges.find((b) => b.id === selectedBadgeId) ?? null;
  }, [badges, selectedBadgeId]);

  // Modalda sonraki rozete geç
  const handleNextBadge = () => {
    if (!selectedBadgeId) return;
    const idx = badges.findIndex((b) => b.id === selectedBadgeId);
    if (idx !== -1) {
      const nextIdx = (idx + 1) % badges.length;
      setSelectedBadgeId(badges[nextIdx].id);
    }
  };

  // Modalda önceki rozete geç
  const handlePrevBadge = () => {
    if (!selectedBadgeId) return;
    const idx = badges.findIndex((b) => b.id === selectedBadgeId);
    if (idx !== -1) {
      const prevIdx = (idx - 1 + badges.length) % badges.length;
      setSelectedBadgeId(badges[prevIdx].id);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5 h-full flex flex-col overflow-hidden">
      {/* ─── Başlık ve Özet Barı ────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-xl shrink-0"
            style={{
              backgroundColor: `${theme.accent}15`,
              color: theme.accent,
            }}
          >
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-zinc-100">Rozet Koleksiyonu</h2>
            <p className="text-xs text-zinc-400">
              {earned.length} / {total} rozet kazanıldı
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-base sm:text-lg font-bold tabular-nums" style={{ color: theme.accent }}>
            %{pct}
          </span>
        </div>
      </div>

      {/* ─── Genel İlerleme Çubuğu ───────────────────────────────────── */}
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

      {/* ─── Sadeleştirilmiş Tek Satır Filtre Kontrolü ────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 shrink-0">
        {/* Durum Segmented Butonları */}
        <div className="flex items-center gap-1 bg-zinc-950/70 p-1 rounded-xl border border-zinc-800/80">
          <button
            onClick={() => setFilter("all")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              filter === "all"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Tümü
          </button>
          <button
            onClick={() => setFilter("closest")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
              filter === "closest"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Target className="w-3 h-3 text-[var(--accent)]" />
            <span>Sıradaki Hedefler</span>
          </button>
          <button
            onClick={() => setFilter("earned")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              filter === "earned"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Kazanılanlar
          </button>
          <button
            onClick={() => setFilter("locked")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              filter === "locked"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Kilitli
          </button>
        </div>

        {/* Kategori Seçim Dropdown'u (Görsel kalabalığı önleyen kompakt yapı) */}
        {filter !== "closest" && (
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryFilter)}
              aria-label="Rozet kategorisi seçin"
              className="bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-zinc-700 cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-zinc-900 text-zinc-200">
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ─── Ana İçerik Kaydırma Alanı ───────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scroll pr-1 pb-1">
        {filter === "closest" ? (
          /* Sıradaki Hedefler Görünümü */
          <div className="space-y-2.5">
            {activeNextMilestones.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-400">
                <CheckCircle2 className="w-10 h-10 mb-2 text-emerald-400" />
                <p className="text-sm font-semibold text-zinc-200">Tebrikler! Bütün hedefler tamamlandı.</p>
                <p className="text-xs text-zinc-400 mt-0.5">Koleksiyondaki tüm seviye rozetlerini kazandınız.</p>
              </div>
            ) : (
              activeNextMilestones.map((badge) => (
                <NextGoalsCard
                  key={badge.id}
                  badge={badge}
                  onClick={() => setSelectedBadgeId(badge.id)}
                />
              ))
            )}
          </div>
        ) : (
          /* Kartlar Grid Görünümü */
          displayedBadges.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-400">
              <Trophy className="w-8 h-8 mb-2 opacity-30 text-zinc-500" />
              <p className="text-xs text-zinc-400">Bu filtreye uygun rozet bulunamadı.</p>
            </div>
          ) : (
            <div
              className="grid gap-3"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              }}
            >
              {displayedBadges.map((badge) => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  onClick={() => setSelectedBadgeId(badge.id)}
                />
              ))}
            </div>
          )
        )}
      </div>

      {/* ─── Rozet Detay Modalı ───────────────────────────────────────── */}
      {selectedBadge && (
        <BadgeDetailModal
          badge={selectedBadge}
          badges={badges}
          onClose={() => setSelectedBadgeId(null)}
          onSelectBadge={(id) => setSelectedBadgeId(id)}
          onNext={handleNextBadge}
          onPrev={handlePrevBadge}
        />
      )}
    </div>
  );
}
