"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
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
  Check, Target, ChevronRight, ChevronLeft, X, Code, Hammer, Calendar, CalendarDays,
  FolderGit2, GitPullRequest, GitFork, Trash2, Shield, ShieldCheck, Users, Activity,
  Medal, Sun, Mountain, Compass, Search, Wrench, Layers, Milestone, CheckCircle,
  Landmark, Lightbulb, Sparkles,
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

const CATEGORIES: { id: CategoryFilter; label: string }[] = [
  { id: "all", label: "Tüm Kategoriler" },
  { id: "commits", label: "Commitler" },
  { id: "streak", label: "Streak" },
  { id: "active_days", label: "Aktiflik" },
  { id: "repos", label: "Repolar" },
  { id: "languages", label: "Diller" },
  { id: "code_volume", label: "Kod Hacmi" },
  { id: "pull_requests", label: "PR & İş Birliği" },
  { id: "issues", label: "Issue Çözümü" },
  { id: "stars", label: "Yıldızlar" },
  { id: "habits", label: "Alışkanlıklar" },
];

const HABIT_SERIES: BadgeSeries[] = ["night_owl", "early_bird", "weekend", "open_source", "cleanup"];

function formatMilestone(val?: number): string {
  if (val === undefined || val === null) return "";
  if (val >= 1000000) return `${val / 1000000}M`;
  if (val >= 1000) return `${val / 1000}k`;
  return `${val}`;
}

/* ─── Rozet Detay Modalı (Bağlantılı Seviye Çizgisi, Sıfır Kaydırma Çubuğu) ─── */

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

  // Bu seriye ait tüm seviye rozetleri (sıralı)
  const seriesBadges = useMemo(() => {
    if (!badge.series) return [];
    return badges
      .filter((b) => b.series === badge.series)
      .sort((a, b) => (a.tier ?? 0) - (b.tier ?? 0));
  }, [badge.series, badges]);

  // Seviye çizgisinin doluluk oranı hesabı
  const completedCount = seriesBadges.filter((b) => b.earned).length;
  const progressLinePercent = seriesBadges.length > 1
    ? Math.min(100, Math.round(((completedCount - 0.5) / (seriesBadges.length - 1)) * 100))
    : 0;

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
        className="relative w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-7 shadow-2xl overflow-hidden z-10 max-h-[92vh] flex flex-col"
        style={{
          boxShadow: `0 0 60px ${rarity.glow}, 0 20px 40px rgba(0,0,0,0.85)`,
        }}
      >
        {/* Yumuşak ortam aurası */}
        <div
          className="absolute -top-24 -left-24 w-64 h-64 rounded-full pointer-events-none blur-3xl opacity-25"
          style={{ backgroundColor: rarity.text }}
        />

        {/* Üst Bar: Kategori Başlığı & Kapat Butonu */}
        <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              {seriesInfo?.title ?? "Özel Başarı"}
            </span>
            {badge.tier && badge.maxTier && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                Seviye {badge.tier}/{badge.maxTier}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors cursor-pointer"
            title="Kapat (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Gövdesi */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scroll pr-1 py-4 space-y-4">
          {/* Rozet Odak Alanı (Estetik Madalyon & Vitrin) */}
          <div className="flex flex-col items-center text-center">
            <div
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center mb-3.5 shadow-2xl transition-transform relative"
              style={{
                backgroundColor: badge.earned ? rarity.badgeBg : "rgba(39, 39, 42, 0.7)",
                border: `2px solid ${badge.earned ? rarity.border : "rgba(63, 63, 70, 0.5)"}`,
                boxShadow: badge.earned ? `0 0 35px ${rarity.glow}` : "none",
                color: badge.earned ? rarity.text : "#a1a1aa",
              }}
            >
              <Icon className="w-10 h-10 sm:w-12 sm:h-12 stroke-[2]" />
              {badge.earned ? (
                <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center shadow-lg ring-2 ring-zinc-900">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              ) : (
                <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 flex items-center justify-center shadow-lg ring-2 ring-zinc-900">
                  <Lock className="w-3 h-3 text-zinc-400" />
                </div>
              )}
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-zinc-100 tracking-tight">
              {badge.name}
            </h3>
            <p className="text-xs text-zinc-400 max-w-xs mt-1.5 leading-relaxed">
              {badge.description}
            </p>

            {/* Durum Etiketi */}
            <div className="mt-3">
              {badge.earned ? (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold tracking-wide">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>BU BAŞARI KAZANILDI</span>
                </div>
              ) : remaining > 0 ? (
                <div
                  className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold"
                  style={{
                    color: theme.accent,
                    backgroundColor: `${theme.accent}15`,
                    border: `1px solid ${theme.accent}30`,
                  }}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Son {remaining.toLocaleString("tr-TR")} {badge.unit ?? ""} kaldı!</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs font-bold">
                  <Target className="w-3.5 h-3.5" />
                  <span>Kilidi Açılmaya Hazır!</span>
                </div>
              )}
            </div>
          </div>

          {/* İlerleme Çubuğu */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-mono font-medium">
                {current.toLocaleString("tr-TR")} / {target.toLocaleString("tr-TR")} {badge.unit ?? ""}
              </span>
              <span className="font-extrabold text-sm tabular-nums" style={{ color: theme.accent }}>
                %{progressPct}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  backgroundColor: theme.accent,
                  boxShadow: `0 0 12px ${theme.accent}70`,
                }}
              />
            </div>
          </div>

          {/* ─── Seviye İlerleme Çizgisi (Sıfır Kaydırma Çubuğu) ─────────── */}
          {seriesBadges.length > 1 && (
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-200">Seri Seviye Ağacı</span>
                <span className="text-zinc-400 text-xs font-mono">
                  {completedCount} / {seriesBadges.length} Tamamlandı
                </span>
              </div>

              {/* %100 genişliğe oturan aşama düğümleri */}
              <div className="relative flex items-center justify-between w-full px-1 py-1">
                {/* Arka plan bağlantı çizgisi */}
                <div className="absolute left-4 right-4 top-4 -translate-y-1/2 h-1 bg-zinc-800 rounded-full z-0" />
                {/* Tamamlanan bağlantı çizgisi */}
                {completedCount > 0 && (
                  <div
                    className="absolute left-4 top-4 -translate-y-1/2 h-1 bg-emerald-500 rounded-full z-0 transition-all duration-500"
                    style={{ width: `${progressLinePercent}%` }}
                  />
                )}

                {seriesBadges.map((sb) => {
                  const isCurrent = sb.id === badge.id;
                  const isEarned = sb.earned;
                  return (
                    <button
                      key={sb.id}
                      onClick={() => onSelectBadge(sb.id)}
                      className="relative z-10 flex flex-col items-center group/node focus:outline-none cursor-pointer"
                      title={`${sb.name} — Seviye ${sb.tier}`}
                    >
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-md ${
                          isCurrent
                            ? "bg-[var(--accent)] text-zinc-950 ring-4 ring-[var(--accent)]/30 scale-110"
                            : isEarned
                            ? "bg-emerald-500 text-zinc-950"
                            : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-500 hover:text-zinc-200"
                        }`}
                      >
                        {isEarned ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : sb.tier}
                      </div>
                      <span
                        className={`text-[10px] font-mono mt-1.5 transition-colors ${
                          isCurrent
                            ? "text-[var(--accent)] font-bold"
                            : isEarned
                            ? "text-emerald-400"
                            : "text-zinc-500"
                        }`}
                      >
                        {formatMilestone(sb.target)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Hedef Şartı Bilgisi */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-4 text-xs text-zinc-400 flex items-start gap-2.5">
            <Target className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold text-zinc-200">Gereksinim: </span>
              {badge.description}. Hedefe ulaşmak için {target.toLocaleString("tr-TR")} {badge.unit ?? "işlem"} gerekiyor.
            </div>
          </div>
        </div>

        {/* Modal Alt Barı: Navigasyon */}
        <div className="pt-3.5 border-t border-zinc-800/80 flex items-center justify-between shrink-0 text-xs">
          <button
            onClick={onPrev}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Önceki</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-100 hover:text-white transition-colors cursor-pointer"
          >
            Kapat
          </button>

          <button
            onClick={onNext}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer"
          >
            <span>Sonraki</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Rozet Kartı (Estetik, Hırslandıran, Parlayan & Büyütülmüş) ─────────── */

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
      className={`group flex-none w-[270px] sm:w-[290px] h-full min-h-[240px] rounded-3xl border p-5 flex flex-col justify-between transition-all duration-300 select-none cursor-pointer snap-start relative overflow-hidden ${
        badge.earned
          ? "border-zinc-800 bg-zinc-900/90 hover:border-zinc-500 hover:shadow-2xl hover:-translate-y-1.5"
          : "border-zinc-800/80 bg-zinc-900/50 hover:border-zinc-700 hover:bg-zinc-900/85 hover:-translate-y-1 hover:shadow-xl"
      }`}
      style={
        badge.earned
          ? {
              boxShadow: `0 0 28px ${rarity.glow}`,
              borderColor: rarity.border,
              background: `linear-gradient(145deg, ${rarity.bg} 0%, rgba(24, 24, 27, 0.95) 50%, rgba(24, 24, 27, 0.98) 100%)`,
            }
          : undefined
      }
    >
      {/* Kart Arkasındaki Ambiyans Işık Halkası */}
      <div
        className="absolute -top-16 -right-16 w-36 h-36 rounded-full blur-2xl pointer-events-none opacity-25 group-hover:opacity-40 transition-opacity"
        style={{ backgroundColor: rarity.text }}
      />
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      {/* Üst Bar: Seviye Rozeti & Nadirlik Rozeti */}
      <div className="flex items-center justify-between w-full mb-1 relative z-10">
        {badge.tier && badge.maxTier ? (
          <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-zinc-800/90 text-zinc-300 border border-zinc-700/60 shadow-sm">
            Seviye {badge.tier}/{badge.maxTier}
          </span>
        ) : (
          <span className="text-[11px] font-semibold text-zinc-400">Özel Başarı</span>
        )}

        {badge.earned ? (
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm"
            style={{
              backgroundColor: rarity.badgeBg,
              color: rarity.text,
              border: `1px solid ${rarity.badgeBorder}`,
            }}
          >
            {RARITY_LABEL[badge.rarity]}
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-400 bg-zinc-800/60 px-2 py-0.5 rounded-full border border-zinc-700/50">
            <Lock className="w-3 h-3 text-zinc-500" />
            <span>Kilitli</span>
          </span>
        )}
      </div>

      {/* Gövde: Büyütülmüş Vektör Madalyon, İkon, Başlık ve Açıklama */}
      <div className="flex flex-col items-center my-1.5 min-w-0 relative z-10">
        <div
          className={`relative flex items-center justify-center w-16 h-16 rounded-2xl mb-2.5 transition-all duration-300 group-hover:scale-105 shadow-lg ${
            badge.earned
              ? ""
              : "bg-gradient-to-b from-zinc-800/80 to-zinc-900/90 border border-zinc-700/60 text-zinc-400 group-hover:border-zinc-500 group-hover:text-zinc-200"
          }`}
          style={
            badge.earned
              ? {
                  backgroundColor: rarity.badgeBg,
                  color: rarity.text,
                  border: `2px solid ${rarity.badgeBorder}`,
                  boxShadow: `0 0 20px ${rarity.glow}`,
                }
              : undefined
          }
        >
          <Icon className="w-8 h-8 stroke-[2]" />
          {badge.earned ? (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center shadow-md ring-2 ring-zinc-900">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
          ) : (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 flex items-center justify-center shadow-md ring-2 ring-zinc-900">
              <Lock className="w-2.5 h-2.5 text-zinc-400" />
            </div>
          )}
        </div>

        <p className="text-base sm:text-lg font-extrabold text-zinc-100 leading-tight truncate w-full text-center px-1 group-hover:text-white transition-colors">
          {badge.name}
        </p>
        <p className="text-xs text-zinc-400 text-center line-clamp-2 mt-1 leading-relaxed w-full px-1">
          {badge.description}
        </p>
      </div>

      {/* Alt Bar: Kazanıldı Şeridi veya Hırslandıran İlerleme Panosu */}
      <div className="mt-2 pt-2.5 border-t border-zinc-800/80 w-full relative z-10">
        {badge.earned ? (
          <div className="w-full py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>KAZANILDI</span>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
              <span className="truncate font-medium">
                {current.toLocaleString("tr-TR")} / {target.toLocaleString("tr-TR")} {badge.unit ?? ""}
              </span>
              <span className="font-extrabold tabular-nums" style={{ color: theme.accent }}>
                %{progressPct}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${progressPct}%`,
                  backgroundColor: progressPct > 0 ? theme.accent : "#52525b",
                  boxShadow: progressPct > 0 ? `0 0 10px ${theme.accent}80` : "none",
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] pt-0.5">
              {progressPct >= 75 ? (
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Son {remaining.toLocaleString("tr-TR")} kaldı!</span>
                </span>
              ) : remaining > 0 ? (
                <span className="text-zinc-400 font-medium">
                  Kalan: {remaining.toLocaleString("tr-TR")} {badge.unit ?? ""}
                </span>
              ) : (
                <span className="text-[var(--accent)] font-bold">Açılmaya hazır!</span>
              )}
              <span className="text-zinc-400 group-hover:text-white font-semibold text-xs transition-colors flex items-center gap-0.5">
                İncele →
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Ana Rozet Koleksiyonu Bileşeni (Kayan Kartlar & Masaüstü Butonları) ─── */

export default function BadgeCollection({ badges }: Props) {
  const theme = useThemeColors();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [selectedBadgeId, setSelectedBadgeId] = useState<BadgeId | null>(null);

  // Yatay Slider, Ok Butonları & Tutup-Çekme Mekaniği
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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

    // Hedefler sekmesindeyse akıllı sıradaki kilometre taşlarını göster
    if (filter === "closest") {
      result = activeNextMilestones;
    } else {
      // Kategori filtresi
      if (category !== "all") {
        if (category === "habits") {
          result = result.filter((b) => b.series && HABIT_SERIES.includes(b.series));
        } else {
          result = result.filter((b) => b.series === category);
        }
      }

      // Durum filtresi
      if (filter === "earned") result = result.filter((b) => b.earned);
      if (filter === "locked") result = result.filter((b) => !b.earned);
    }

    return result;
  }, [badges, filter, category, activeNextMilestones]);

  // Modalda açılacak rozet
  const selectedBadge = useMemo(() => {
    if (!selectedBadgeId) return null;
    return badges.find((b) => b.id === selectedBadgeId) ?? null;
  }, [badges, selectedBadgeId]);

  // Ok butonlarının görünürlük ve aktiflik durumunu güncelle
  const updateScrollButtons = useCallback(() => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  }, []);

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);
    return () => {
      el.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [updateScrollButtons, displayedBadges]);

  const scrollByAmount = (amount: number) => {
    if (!sliderRef.current) return;
    sliderRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  // Mouse ile Tut ve Çek (Drag-to-Scroll)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    setIsDragging(true);
    hasDraggedRef.current = false;
    startXRef.current = e.pageX - sliderRef.current.offsetLeft;
    scrollLeftRef.current = sliderRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.4;
    if (Math.abs(walk) > 4) {
      hasDraggedRef.current = true;
    }
    sliderRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

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
              {earned.length} / {total} rozet kazanıldı • Oklarla veya kaydırarak incele
            </p>
          </div>
        </div>

        {/* Sağ: İlerleme Yüzdesi */}
        <div className="flex items-center gap-2">
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
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filter === "all"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Tümü ({total})
          </button>
          <button
            onClick={() => setFilter("closest")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
              filter === "closest"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Target className="w-3 h-3 text-[var(--accent)]" />
            <span>Sıradaki Hedefler ({activeNextMilestones.length})</span>
          </button>
          <button
            onClick={() => setFilter("earned")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filter === "earned"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Kazanılanlar ({earned.length})
          </button>
          <button
            onClick={() => setFilter("locked")}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              filter === "locked"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Kilitli ({total - earned.length})
          </button>
        </div>

        {/* Kategori Seçim Dropdown'u */}
        {filter !== "closest" && (
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryFilter)}
              aria-label="Kategori Seçin"
              className="bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-300 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-zinc-700 cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-zinc-900 text-zinc-200">
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ─── Sağa & Sola Kayan Kart Alanı (Masaüstü Butonları + Tut-Çek) ── */}
      <div className="flex-1 min-h-0 relative flex items-center group/slider">
        {/* Sol Kenar Karartması ve Masaüstü Sol Ok Butonu */}
        <div
          className={`absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-zinc-900 via-zinc-900/60 to-transparent pointer-events-none z-10 transition-opacity duration-200 ${
            canScrollLeft ? "opacity-100" : "opacity-0"
          }`}
        />
        <button
          onClick={() => scrollByAmount(-320)}
          disabled={!canScrollLeft}
          className={`absolute left-1.5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-zinc-950/90 border border-zinc-700/80 text-zinc-200 hover:text-white hover:scale-110 hover:border-zinc-500 shadow-2xl backdrop-blur-md flex items-center justify-center transition-all cursor-pointer ${
            canScrollLeft ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          title="Sola Kaydır"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Sağ Kenar Karartması ve Masaüstü Sağ Ok Butonu */}
        <div
          className={`absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-zinc-900 via-zinc-900/60 to-transparent pointer-events-none z-10 transition-opacity duration-200 ${
            canScrollRight ? "opacity-100" : "opacity-0"
          }`}
        />
        <button
          onClick={() => scrollByAmount(320)}
          disabled={!canScrollRight}
          className={`absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-zinc-950/90 border border-zinc-700/80 text-zinc-200 hover:text-white hover:scale-110 hover:border-zinc-500 shadow-2xl backdrop-blur-md flex items-center justify-center transition-all cursor-pointer ${
            canScrollRight ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          title="Sağa Kaydır"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {displayedBadges.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-400 w-full">
            <Trophy className="w-8 h-8 mb-2 opacity-30 text-zinc-500" />
            <p className="text-xs text-zinc-400">Bu filtreye uygun rozet bulunamadı.</p>
          </div>
        ) : (
          <div
            ref={sliderRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`flex items-stretch gap-4 overflow-x-auto custom-scroll w-full h-full pb-2 pt-1 scroll-smooth snap-x snap-mandatory px-1 ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
          >
            {displayedBadges.map((badge) => (
              <BadgeCard
                key={badge.id}
                badge={badge}
                onClick={() => {
                  if (!hasDraggedRef.current) {
                    setSelectedBadgeId(badge.id);
                  }
                }}
              />
            ))}
          </div>
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
