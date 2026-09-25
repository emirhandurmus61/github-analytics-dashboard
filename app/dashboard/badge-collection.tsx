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

const RARITY_DESC: Record<Badge["rarity"], string> = {
  common: "Başlangıç ve temel seviye başarı rozeti",
  rare: "İleri düzey geliştirici alışkanlığı gerektiren başarı",
  epic: "En üst düzey özveri ve ustalık gösteren efsanevi rozet",
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

const CATEGORY_TABS: { id: CategoryFilter; label: string; icon: string }[] = [
  { id: "all", label: "Tüm Kategoriler", icon: "✨" },
  { id: "commits", label: "Commitler", icon: "💻" },
  { id: "streak", label: "Streak", icon: "🔥" },
  { id: "active_days", label: "Aktiflik", icon: "🏃" },
  { id: "repos", label: "Repolar", icon: "📦" },
  { id: "languages", label: "Diller", icon: "🌐" },
  { id: "code_volume", label: "Kod Hacmi", icon: "🏗️" },
  { id: "pull_requests", label: "PR & İş Birliği", icon: "🔀" },
  { id: "issues", label: "Issue Çözümü", icon: "🐛" },
  { id: "stars", label: "Yıldızlar", icon: "⭐" },
  { id: "habits", label: "Alışkanlıklar", icon: "⏰" },
];

const HABIT_SERIES: BadgeSeries[] = ["night_owl", "early_bird", "weekend", "open_source", "cleanup"];

/* ─── Rozet Detay Modalı / Widget ────────────────────────────────────────── */

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

  // Klavye kısayolları (Esc, Sol/Sağ oklar) ve sayfa kaydırma kilidi
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      {/* Tıklayınca kapatan arka plan */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Kart Gövdesi */}
      <div
        className="relative w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-7 shadow-2xl overflow-hidden z-10 max-h-[92vh] flex flex-col"
        style={{
          boxShadow: `0 0 50px ${rarity.glow}, 0 20px 40px rgba(0,0,0,0.8)`,
        }}
      >
        {/* Arka plan renkli aura efekti */}
        <div
          className="absolute -top-24 -left-24 w-72 h-72 rounded-full pointer-events-none blur-3xl opacity-20"
          style={{ backgroundColor: rarity.text }}
        />
        <div
          className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full pointer-events-none blur-3xl opacity-15"
          style={{ backgroundColor: theme.accent }}
        />

        {/* Modal Üst Barı */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg"
              style={{
                backgroundColor: rarity.badgeBg,
                color: rarity.text,
                border: `1px solid ${rarity.badgeBorder}`,
              }}
            >
              {RARITY_LABEL[badge.rarity]} Rozet
            </span>
            {badge.tier && badge.maxTier && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                Seviye {badge.tier}/{badge.maxTier}
              </span>
            )}
            <span className="text-xs text-zinc-400">
              {badge.earned ? "Kazanıldı" : "Kilitli Hedef"}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors"
            title="Kapat (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal İçerik (Kaydırılabilir alan) */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scroll pr-1 py-3.5 space-y-4">
          {/* Rozet Görsel Vitrini */}
          <div className="flex flex-col items-center text-center pt-1 pb-1">
            <div className="relative mb-3">
              <div
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center transition-transform hover:scale-105"
                style={{
                  backgroundColor: badge.earned ? rarity.badgeBg : "rgba(39, 39, 42, 0.8)",
                  border: `2px solid ${badge.earned ? rarity.border : "rgba(63, 63, 70, 0.6)"}`,
                  boxShadow: badge.earned ? `0 0 30px ${rarity.glow}` : "none",
                  color: badge.earned ? rarity.text : "#a1a1aa",
                }}
              >
                <Icon className="w-10 h-10 sm:w-12 sm:h-12" />
              </div>
              <span className="absolute -top-2 -right-2 text-2xl p-1 rounded-xl bg-zinc-900/90 border border-zinc-800 shadow-md">
                {badge.emoji}
              </span>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-zinc-100">
              {badge.name}
            </h3>

            <p className="text-sm text-zinc-300 max-w-sm mt-1.5 leading-relaxed">
              {badge.description}
            </p>

            <div className="mt-2.5">
              {badge.earned ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Bu seviye başarıyla tamamlandı</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Kilitli Seviye Hedefi</span>
                </div>
              )}
            </div>
          </div>

          {/* İlerleme Panosu */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-[var(--accent)]" />
                İlerleme Durumu
              </span>
              <span className="text-base font-bold tabular-nums" style={{ color: theme.accent }}>
                %{progressPct}
              </span>
            </div>

            <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPct}%`,
                  backgroundColor: theme.accent,
                  boxShadow: `0 0 12px ${theme.accent}70`,
                }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-400 font-mono pt-1">
              <span>
                Mevcut: <strong className="text-zinc-200">{current.toLocaleString("tr-TR")}</strong> / {target.toLocaleString("tr-TR")} {badge.unit ?? ""}
              </span>
              <span>
                {badge.earned ? (
                  <span className="text-emerald-400 font-semibold">Tamamlandı ✓</span>
                ) : remaining > 0 ? (
                  <span className="text-amber-400 font-semibold">Son {remaining.toLocaleString("tr-TR")} {badge.unit ?? ""} kaldı</span>
                ) : (
                  <span className="text-[var(--accent)] font-semibold">Açılmaya hazır!</span>
                )}
              </span>
            </div>
          </div>

          {/* ─── Seviye İlerleme Yol Haritası (Level Progression Roadmap) ─── */}
          {seriesBadges.length > 1 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                  <span>{seriesInfo?.icon ?? "🎯"}</span>
                  <span>{seriesInfo?.title ?? "Seri"} Yol Haritası</span>
                </span>
                <span className="text-[11px] text-zinc-400 font-mono">
                  {seriesBadges.filter((b) => b.earned).length} / {seriesBadges.length} Seviye
                </span>
              </div>

              {/* Yatay Kaydırılabilir Seviye Adımları */}
              <div className="flex items-center gap-2 overflow-x-auto custom-scroll pb-1 pt-1">
                {seriesBadges.map((sb) => {
                  const isCurrent = sb.id === badge.id;
                  const isEarned = sb.earned;
                  const sbRarity = RARITY_COLORS[sb.rarity];
                  return (
                    <button
                      key={sb.id}
                      onClick={() => onSelectBadge(sb.id)}
                      className={`flex flex-col items-center p-2 rounded-xl border shrink-0 transition-all text-center min-w-[80px] ${
                        isCurrent
                          ? "border-[var(--accent)] bg-[var(--accent)]/15 shadow-lg ring-1 ring-[var(--accent)]"
                          : isEarned
                          ? "border-emerald-500/40 bg-zinc-900/90 hover:border-emerald-400/70"
                          : "border-zinc-800 bg-zinc-950/70 hover:border-zinc-700 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <div
                        className="flex items-center justify-center w-8 h-8 rounded-lg mb-1 relative"
                        style={{
                          backgroundColor: isEarned ? sbRarity.badgeBg : "rgba(39,39,42,0.8)",
                          color: isEarned ? sbRarity.text : "#71717a",
                        }}
                      >
                        <span className="text-sm">{sb.emoji}</span>
                        {isEarned && (
                          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center shadow">
                            <Check className="w-2.5 h-2.5 text-zinc-950 stroke-[3]" />
                          </div>
                        )}
                        {!isEarned && (
                          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                            <Lock className="w-2 h-2 text-zinc-400" />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-zinc-200 truncate w-full">
                        Seviye {sb.tier}
                      </span>
                      <span className="text-[9px] text-zinc-400 truncate w-full">
                        {sb.target?.toLocaleString("tr-TR")} {sb.unit}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Nasıl Kazanılır & Geliştirici İpuçları */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: `${rarity.text}15`, color: rarity.text }}
              >
                <Info className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-zinc-200">Gereksinim</p>
                <p className="text-zinc-400 mt-0.5 leading-relaxed">
                  {badge.description}. Toplam hedefe ulaşmak için {target.toLocaleString("tr-TR")} {badge.unit ?? "işlem"} gerekiyor.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 pt-2 border-t border-zinc-800/60">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: `${theme.accent}15`, color: theme.accent }}
              >
                <Lightbulb className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-zinc-200">Geliştirici İpucu</p>
                <p className="text-zinc-400 mt-0.5 leading-relaxed">
                  {seriesInfo?.description ?? "Düzenli kod göndererek ve projelerini güncel tutarak seviye basamaklarını tırmanabilirsin."}
                </p>
              </div>
            </div>
          </div>

          {/* Nadirlik Bilgi Şeridi */}
          <div className="px-4 py-2.5 rounded-xl border border-zinc-800/60 bg-zinc-900/40 text-[11px] text-zinc-400 flex items-center justify-between">
            <span>Rozet Kategorisi</span>
            <span className="font-semibold text-zinc-300">{RARITY_DESC[badge.rarity]}</span>
          </div>
        </div>

        {/* Modal Alt Barı (Önceki / Sonraki Navigasyonu) */}
        <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between shrink-0">
          <button
            onClick={onPrev}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Önceki</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white transition-colors"
          >
            Tamam
          </button>

          <button
            onClick={onNext}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors"
          >
            <span>Sonraki</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Rozet Kartı (Büyütülmüş, Seviye Etiketli ve Tıklanabilir) ───────────── */

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

  if (!badge.earned) {
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
        className="group relative flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/85 p-4 text-center transition-all duration-200 hover:border-zinc-600 hover:bg-zinc-900 hover:shadow-xl hover:-translate-y-1 select-none cursor-pointer min-h-[180px]"
      >
        {/* Üst Bar: Emoji, Seviye Çipi ve Kilit Etiketi */}
        <div className="flex items-center justify-between w-full mb-1">
          <div className="flex items-center gap-1.5">
            <span className="text-base opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all">
              {badge.emoji}
            </span>
            {badge.tier && badge.maxTier && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-zinc-800/90 text-zinc-400 border border-zinc-700/50">
                Lv.{badge.tier}
              </span>
            )}
          </div>
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700/60">
            <Lock className="w-2.5 h-2.5 text-zinc-400" />
            <span>Kilitli</span>
          </span>
        </div>

        {/* Gövde: İkon, Başlık, Açıklama */}
        <div className="flex flex-col items-center my-1.5 min-w-0">
          <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-800/90 border border-zinc-700/60 text-zinc-300 mb-2.5 group-hover:border-zinc-500 group-hover:scale-105 group-hover:text-white transition-all shadow-sm">
            <Icon className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-zinc-100 leading-tight line-clamp-1 group-hover:text-white transition-colors w-full px-0.5">
            {badge.name}
          </p>
          <p className="text-xs text-zinc-400 leading-snug line-clamp-2 mt-1 w-full px-0.5">
            {badge.description}
          </p>
        </div>

        {/* Alt Bar: İlerleme Çubuğu ve Değerler */}
        <div className="mt-2 pt-2.5 border-t border-zinc-800 w-full">
          <div className="flex items-center justify-between text-[11px] font-mono mb-1.5 text-zinc-300">
            <span className="truncate">
              {current.toLocaleString("tr-TR")}/{target.toLocaleString("tr-TR")} {badge.unit ?? ""}
            </span>
            <span className="font-bold text-zinc-200 tabular-nums ml-1">
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

  // Kazanılan Rozet Kartı
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
      className="group relative flex flex-col justify-between rounded-2xl border p-4 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl select-none overflow-hidden cursor-pointer min-h-[180px]"
      style={{
        borderColor: rarity.border,
        background: `linear-gradient(180deg, ${rarity.bg} 0%, rgba(24, 24, 27, 0.98) 100%)`,
        boxShadow: `0 0 18px ${rarity.glow}`,
      }}
    >
      {/* Üst Bar: Canlı Emoji, Seviye ve Nadirlik Etiketi */}
      <div className="flex items-center justify-between w-full mb-1">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{badge.emoji}</span>
          {badge.tier && badge.maxTier && (
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: rarity.badgeBg,
                color: rarity.text,
                border: `1px solid ${rarity.badgeBorder}`,
              }}
            >
              Lv.{badge.tier}
            </span>
          )}
        </div>
        <span
          className="rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
          style={{
            backgroundColor: rarity.badgeBg,
            color: rarity.text,
            border: `1px solid ${rarity.badgeBorder}`,
          }}
        >
          {RARITY_LABEL[badge.rarity]}
        </span>
      </div>

      {/* Gövde: Glowing İkon, Başlık, Açıklama */}
      <div className="flex flex-col items-center my-1.5 min-w-0">
        <div
          className="relative flex items-center justify-center w-12 h-12 rounded-2xl mb-2.5 transition-transform group-hover:scale-110 shadow-md"
          style={{
            backgroundColor: rarity.badgeBg,
            boxShadow: `0 0 16px ${rarity.glow}`,
            color: rarity.text,
            border: `1px solid ${rarity.badgeBorder}`,
          }}
        >
          <Icon className="w-6 h-6" />
        </div>
        <p className="text-sm font-bold leading-tight line-clamp-1 w-full px-0.5" style={{ color: rarity.text }}>
          {badge.name}
        </p>
        <p className="text-xs text-zinc-300 leading-snug line-clamp-2 mt-1 w-full px-0.5">
          {badge.description}
        </p>
      </div>

      {/* Alt Bar: Kazanıldı Onayı */}
      <div className="mt-2 pt-2.5 border-t border-zinc-800 w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-400">
        <Check className="w-4 h-4 stroke-[2.5]" />
        <span>Kazanıldı</span>
      </div>
    </div>
  );
}

/* ─── Sıradaki Hedef Kartı (Tıklanabilir ve Seviye Vurgulu) ───────────────── */

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
      className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 rounded-2xl border border-zinc-800/90 bg-zinc-950/70 p-3.5 sm:p-4 hover:border-zinc-600 hover:bg-zinc-900/90 hover:shadow-lg transition-all cursor-pointer"
    >
      {/* Sol: İkon & Rozet Bilgileri */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className="flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-2xl shrink-0 group-hover:scale-105 transition-transform"
          style={{
            backgroundColor: rarity.badgeBg,
            color: rarity.text,
            border: `1px solid ${rarity.badgeBorder}`,
            boxShadow: `0 0 12px ${rarity.glow}`,
          }}
        >
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-zinc-100 truncate group-hover:text-white transition-colors">
              {badge.name}
            </span>
            {badge.tier && badge.maxTier && (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                Seviye {badge.tier}/{badge.maxTier}
              </span>
            )}
            <span
              className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-md"
              style={{
                color: rarity.text,
                backgroundColor: rarity.badgeBg,
                border: `1px solid ${rarity.badgeBorder}`,
              }}
            >
              {RARITY_LABEL[badge.rarity]}
            </span>
            <span className="text-sm">{badge.emoji}</span>
          </div>
          <p className="text-xs text-zinc-400 truncate mt-0.5">{badge.description}</p>
        </div>
      </div>

      {/* Sağ: İlerleme Çubuğu ve Detay Aksiyonu */}
      <div className="flex flex-col sm:items-end w-full sm:w-60 shrink-0 space-y-1.5">
        <div className="flex items-center justify-between sm:justify-end gap-2 text-xs w-full">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-md truncate"
            style={{
              color: theme.accent,
              backgroundColor: `${theme.accent}15`,
              border: `1px solid ${theme.accent}30`,
            }}
          >
            {remaining > 0 ? `Son ${remaining.toLocaleString("tr-TR")} ${badge.unit ?? ""} kaldı` : "Açılmak üzere"}
          </span>
          <span className="font-bold text-zinc-200 tabular-nums">
            %{progressPct}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 w-full">
          <span>İlerleme:</span>
          <span className="text-zinc-200 font-semibold">{current.toLocaleString("tr-TR")} / {target.toLocaleString("tr-TR")} {badge.unit ?? ""}</span>
        </div>
        <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden">
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
    </div>
  );
}

/* ─── Ana Rozet Koleksiyonu Bileşeni ─────────────────────────────────────── */

export default function BadgeCollection({ badges }: Props) {
  const theme = useThemeColors();
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [selectedBadgeId, setSelectedBadgeId] = useState<BadgeId | null>(null);

  const earned = useMemo(() => badges.filter((b) => b.earned), [badges]);
  const total = badges.length;
  const pct = total > 0 ? Math.round((earned.length / total) * 100) : 0;

  // Akıllı Sıradaki Hedefler:
  // Her serideki İLK KİLİTLİ seviyeyi seçiyoruz (Böylece 1. seviye bitmeden 5. seviye gösterilmez)
  const activeNextMilestones = useMemo(() => {
    const unearned = badges.filter((b) => !b.earned);
    const seriesSeen = new Set<string>();
    const immediateTargets: (Badge & { progressPct: number; remaining: number })[] = [];

    // Önce serisi olan rozetlerden ilk kilitli olanları topla
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

    // Tamamlanma yüzdesine göre en yüksekten düşüğe doğru diz
    return immediateTargets.sort((a, b) => b.progressPct - a.progressPct || a.remaining - b.remaining);
  }, [badges]);

  // Ana sayfada öne çıkarılan en yakın 2 hedef
  const topNextGoals = useMemo(() => activeNextMilestones.slice(0, 2), [activeNextMilestones]);

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

  const rarityCounts = (["common", "rare", "epic"] as const).map((r) => ({
    rarity: r,
    earned: earned.filter((b) => b.rarity === r).length,
    total: badges.filter((b) => b.rarity === r).length,
  }));

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-5 h-full flex flex-col overflow-hidden">
      {/* ─── Başlık ve Özet Barı ────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-2xl shrink-0"
            style={{
              backgroundColor: `${theme.accent}15`,
              color: theme.accent,
              border: `1px solid ${theme.accent}30`,
              boxShadow: `0 0 12px ${theme.accent}20`,
            }}
          >
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-zinc-100">Rozet Koleksiyonu</h2>
              <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                <Sparkles className="w-3 h-3 text-[var(--accent)]" />
                {total} Rozet • 14 Seri
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              {earned.length} / {total} rozet kazanıldı • Seviye ağacını görmek için kartlara tıkla
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-right">
          <div>
            <span className="text-xl sm:text-2xl font-black tabular-nums" style={{ color: theme.accent }}>
              %{pct}
            </span>
            <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Tamamlandı</p>
          </div>
        </div>
      </div>

      {/* ─── Genel İlerleme Çubuğu ───────────────────────────────────── */}
      <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden mb-3 shrink-0">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: theme.accent,
            boxShadow: `0 0 12px ${theme.accent}60`,
          }}
        />
      </div>

      {/* ─── Filtre Sekmeleri (Durum & Nadirlik Dağılımı) ─────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2.5 shrink-0">
        {/* Durum Filtre Butonları */}
        <div className="flex items-center gap-1 bg-zinc-950/80 p-1 rounded-2xl border border-zinc-800/80 overflow-x-auto max-w-full">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              filter === "all"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Tümü ({total})
          </button>
          <button
            onClick={() => setFilter("closest")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
              filter === "closest"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Target className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Sıradaki Hedefler ({activeNextMilestones.length})</span>
          </button>
          <button
            onClick={() => setFilter("earned")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              filter === "earned"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Kazanılan ({earned.length})
          </button>
          <button
            onClick={() => setFilter("locked")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
              filter === "locked"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Kilitli ({total - earned.length})
          </button>
        </div>

        {/* Nadirlik Sayaçları */}
        <div className="hidden sm:flex items-center gap-3">
          {rarityCounts.map(({ rarity, earned: e, total: t }) => {
            const c = RARITY_COLORS[rarity];
            return (
              <div key={rarity} className="flex items-center gap-1.5 text-xs" style={{ color: c.text }}>
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: c.text, boxShadow: `0 0 8px ${c.glow}` }}
                />
                <span className="font-bold">{RARITY_LABEL[rarity]}</span>
                <span className="text-zinc-400 tabular-nums">{e}/{t}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Kategori / Seri Seçim Çubuğu ────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto custom-scroll pb-2 mb-3 shrink-0">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCategory(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium shrink-0 transition-all ${
              category === tab.id
                ? "bg-zinc-800 text-[var(--accent)] border border-[var(--accent)]/40 shadow-sm"
                : "bg-zinc-950/60 text-zinc-400 hover:text-zinc-200 border border-zinc-800/80 hover:border-zinc-700"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ─── Ana İçerik Kaydırma Alanı ───────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scroll pr-1 pb-1">
        {/* Hedefler Sekmesi Aktifse: Seviye basamaklarındaki tüm sıradaki hedefleri listele */}
        {filter === "closest" ? (
          <div className="space-y-3">
            {activeNextMilestones.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-400">
                <CheckCircle2 className="w-12 h-12 mb-2 text-emerald-400" />
                <p className="text-base font-bold text-zinc-100">Tebrikler! Bütün hedefler tamamlandı.</p>
                <p className="text-xs text-zinc-400 mt-1">Koleksiyondaki tüm seviye rozetlerini kazandınız.</p>
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
          <>
            {/* Tümü Görünümünde: Sıradaki En Yakın 2 Hedef Vitrini */}
            {filter === "all" && category === "all" && topNextGoals.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-zinc-200">
                    <Target className="w-4 h-4 text-[var(--accent)]" />
                    <span>Sıradaki Hedefler</span>
                    <span className="text-xs text-zinc-400 font-normal hidden sm:inline">
                      (Serilerdeki en yakın seviye basamakları • İncelemek için tıkla)
                    </span>
                  </div>
                  {activeNextMilestones.length > 2 && (
                    <button
                      onClick={() => setFilter("closest")}
                      className="text-xs text-[var(--accent)] hover:underline flex items-center gap-0.5 font-semibold"
                    >
                      <span>Tüm Hedefleri Gör ({activeNextMilestones.length})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {topNextGoals.map((b) => (
                    <NextGoalsCard
                      key={b.id}
                      badge={b}
                      onClick={() => setSelectedBadgeId(b.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Rozet Kartları Grid'i (Büyütülmüş, Seviye Etiketli ve Tıklanabilir) */}
            {displayedBadges.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-400">
                <Trophy className="w-10 h-10 mb-2 opacity-40 text-zinc-500" />
                <p className="text-sm font-semibold text-zinc-300">Bu filtreye uygun rozet bulunamadı.</p>
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
            )}
          </>
        )}
      </div>

      {/* ─── Rozet Detay Modalı / Widget Açılır Penceresi ─────────────── */}
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
