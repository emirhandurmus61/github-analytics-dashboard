"use client";

import { useState, useMemo, useEffect } from "react";
import { useThemeColors } from "@/components/theme-provider";
import { type Badge, type BadgeId, RARITY_COLORS } from "@/lib/badges";
import {
  Rocket, Flame, Zap, Moon, Sunrise, Swords, Eraser, Globe, Globe2, Lock, Trophy,
  Gem, Languages, Hash, Award, Footprints, Package, Building2, GitMerge, Bug, Star, Crown,
  Check, Target, Sparkles, ChevronRight, ChevronLeft, CheckCircle2, X, Info,
  Lightbulb, ExternalLink,
} from "lucide-react";

type Props = { badges: Badge[] };

type FilterTab = "all" | "closest" | "earned" | "locked";

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

const BADGE_GUIDE: Record<
  BadgeId,
  {
    requirement: string;
    tip: string;
  }
> = {
  first_sync: {
    requirement: "GitHub hesabını bağlayarak ilk senkronizasyonu başarıyla tamamla.",
    tip: "Hesabın bağlandığında dashboard verilerini otomatik olarak çeker ve bu rozet anında açılır.",
  },
  streak_7: {
    requirement: "Aralıksız 7 gün boyunca her gün en az 1 commit gönder.",
    tip: "Günde tek bir commit bile seriyi korur. Streak Guard özelliğini kullanarak serini güvende tutabilirsin.",
  },
  streak_30: {
    requirement: "Aralıksız 30 gün boyunca her gün commit serisini devam ettir.",
    tip: "Hergün küçük iyileştirmeler, testler veya dokümantasyon güncellemeleri seriyi taze tutmana yardımcı olur.",
  },
  streak_100: {
    requirement: "Tam 100 gün boyunca kesintisiz commit serisi gerçekleştir.",
    tip: "Yüksek disiplin ve düzenli çalışma alışkanlığı gerektiren epik bir başarı göstergesidir.",
  },
  dedicated: {
    requirement: "Tam 365 gün (1 yıl) boyunca aralıksız her gün commit serisi yakala.",
    tip: "Platformdaki en saygın rozetlerden biridir. Yıl boyu kod yazan elit geliştiricilere aittir.",
  },
  night_owl: {
    requirement: "Gece 22:00 ile sabah 06:00 saatleri arasında en az 10 commit tamamla.",
    tip: "Gece saatlerinde üzerinde çalıştığın hobi projeleri veya kodlama maratonları bu sayıyı artırır.",
  },
  early_bird: {
    requirement: "Sabah 05:00 ile 09:00 saatleri arasında en az 10 commit gönder.",
    tip: "Güne erken başlayıp ilk commit'ini sabah kahvesi eşliğinde göndererek bu rozeti açabilirsin.",
  },
  weekend_warrior: {
    requirement: "Cumartesi ve Pazar günlerinde toplamda en az 10 commit tamamla.",
    tip: "Hafta sonu yan projelerinle veya açık kaynak kodlarıyla ilgilenerek hedefi yakalayabilirsin.",
  },
  big_cleanup: {
    requirement: "Tek bir commit içerisinde 1.000'den fazla satır kod sil.",
    tip: "Kullanılmayan eski modülleri, gereksiz bağımlılıkları veya ölü kodları temizleyerek tek seferde aç.",
  },
  polyglot: {
    requirement: "Repolarında toplamda en az 5 farklı programlama veya biçimlendirme dili kullan.",
    tip: "JavaScript, TypeScript, Python, Go, Rust, HTML, CSS gibi çeşitli dillerde repolar oluştur.",
  },
  hexaglot: {
    requirement: "Repolarında toplamda en az 8 farklı programlama dili kullan.",
    tip: "Farklı alanlardaki teknolojileri ve dilleri deneyimleyerek kod repertuarını zenginleştir.",
  },
  open_source: {
    requirement: "Fork ettiğin açık kaynak projelere en az 5 commit ile katkıda bulun.",
    tip: "Beğendiğin topluluk projelerini fork edip hata düzeltmeleri veya özellik ekleyerek katkı yap.",
  },
  century: {
    requirement: "Tüm repolarında toplamda 100 veya daha fazla commit yap.",
    tip: "Düzenli ve anlaşılır commit alışkanlığı edinerek hızla 100 barajını aşabilirsin.",
  },
  millennium: {
    requirement: "Tüm repolarında toplamda 1.000 veya daha fazla commit yap.",
    tip: "Büyük çaplı projeler ve uzun soluklu geliştirme serüvenine sahip yazılımcılara özel bir başarıdır.",
  },
  marathoner: {
    requirement: "Farklı tarihlerde toplam en az 100 aktif gün kaydet.",
    tip: "Günlerin ardışık olması şart değildir; toplamda 100 farklı günde kod göndermen yeterlidir.",
  },
  collector: {
    requirement: "Profilinde en az 10 farklı repository bulundur.",
    tip: "Kendi projelerin ve ilgi duyduğun açık kaynak fork repoları bu sayıya dahil edilir.",
  },
  architect: {
    requirement: "Projelerine toplamda 100.000 satırdan fazla kod ekle.",
    tip: "Büyük mimariler, modüler sistemler ve kapsamlı projeler geliştirdikçe bu baraj aşılır.",
  },
  merge_master: {
    requirement: "En az 20 Pull Request'i başarıyla birleştir (merge et).",
    tip: "Takım çalışmalarında veya kendi projelerinde branch ve PR iş akışını kullanarak bu sayıyı tamamla.",
  },
  bug_hunter: {
    requirement: "Projelerinde toplamda en az 30 issue kapat.",
    tip: "Görev ve hata takiplerini GitHub Issues üzerinden organize edip çözüme kavuştur.",
  },
  stargazer: {
    requirement: "Repolarının toplamda en az 50 yıldız almasını sağla.",
    tip: "Projelerin için açıklayıcı README'ler hazırla, açık kaynak topluluklarında paylaş ve yıldız topla.",
  },
};

/* ─── Rozet Detay Modalı / Widget ────────────────────────────────────────── */

function BadgeDetailModal({
  badge,
  onClose,
  onNext,
  onPrev,
}: {
  badge: Badge;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const theme = useThemeColors();
  const rarity = RARITY_COLORS[badge.rarity];
  const Icon = BADGE_ICON[badge.id] ?? Rocket;
  const guide = BADGE_GUIDE[badge.id];

  const current = badge.current ?? 0;
  const target = badge.target ?? 1;
  const progressPct = Math.min(100, Math.max(0, Math.round((current / target) * 100)));
  const remaining = Math.max(0, target - current);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
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
          className="absolute -top-20 -left-20 w-64 h-64 rounded-full pointer-events-none blur-3xl opacity-20"
          style={{ backgroundColor: rarity.text }}
        />
        <div
          className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full pointer-events-none blur-3xl opacity-15"
          style={{ backgroundColor: theme.accent }}
        />

        {/* Modal Üst Barı */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 shrink-0">
          <div className="flex items-center gap-2">
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
        <div className="flex-1 min-h-0 overflow-y-auto custom-scroll pr-1 py-4 space-y-4">
          {/* Rozet Görsel Vitrini */}
          <div className="flex flex-col items-center text-center pt-2 pb-1">
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

            <div className="mt-3">
              {badge.earned ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Bu başarı tamamlandı ve koleksiyonuna eklendi</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Kilitli Hedef • Açılmak için ilerleme bekleniyor</span>
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

          {/* Nasıl Kazanılır & Rehber */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3 text-xs">
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
                  {guide?.requirement ?? badge.description}
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
                  {guide?.tip ?? "Düzenli commit atarak ve projelerini güncel tutarak bu hedefe hızla ulaşabilirsin."}
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

/* ─── Rozet Kartı (Gelişmiş, Büyütülmüş ve Tıklanabilir) ─────────────────── */

function BadgeCard({
  badge,
  onClick,
}: {
  badge: Badge;
  onClick: () => void;
}) {
  const theme = useThemeColors();
  const rarity = RARITY_COLORS[badge.rarity];
  const Icon = BADGE_ICON[badge.id] ?? Rocket;

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
        className="group relative flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/85 p-4 text-center transition-all duration-200 hover:border-zinc-600 hover:bg-zinc-900 hover:shadow-xl hover:-translate-y-1 select-none cursor-pointer min-h-[175px]"
      >
        {/* Üst Bar: Muted emoji & Kilit etiketi */}
        <div className="flex items-center justify-between w-full mb-1">
          <span className="text-base opacity-60 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all">
            {badge.emoji}
          </span>
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

        {/* Alt Bar: İlerleme Çubuğu ve Detay İpucu */}
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
      className="group relative flex flex-col justify-between rounded-2xl border p-4 text-center transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl select-none overflow-hidden cursor-pointer min-h-[175px]"
      style={{
        borderColor: rarity.border,
        background: `linear-gradient(180deg, ${rarity.bg} 0%, rgba(24, 24, 27, 0.98) 100%)`,
        boxShadow: `0 0 18px ${rarity.glow}`,
      }}
    >
      {/* Üst Bar: Canlı Emoji & Nadirlik Etiketi */}
      <div className="flex items-center justify-between w-full mb-1">
        <span className="text-base">{badge.emoji}</span>
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

/* ─── Sıradaki Hedef Kartı (Tıklanabilir ve Vurgulu) ─────────────────────── */

function NextGoalsCard({
  badge,
  onClick,
}: {
  badge: Badge;
  onClick: () => void;
}) {
  const theme = useThemeColors();
  const rarity = RARITY_COLORS[badge.rarity];
  const Icon = BADGE_ICON[badge.id] ?? Rocket;

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
  const [filter, setFilter] = useState<FilterTab>("all");
  const [selectedBadgeId, setSelectedBadgeId] = useState<BadgeId | null>(null);

  const earned = useMemo(() => badges.filter((b) => b.earned), [badges]);
  const total = badges.length;
  const pct = total > 0 ? Math.round((earned.length / total) * 100) : 0;

  // Sıradaki hedefler: Kilitli rozetleri tamamlanma yüzdesine göre azalan sırada diz
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

  // Ana sayfada öne çıkarılan en yakın 2 hedef
  const topNextGoals = useMemo(() => unearnedSorted.slice(0, 2), [unearnedSorted]);

  // Filtrelenmiş rozetler
  const displayedBadges = useMemo(() => {
    if (filter === "earned") return earned;
    if (filter === "locked") return badges.filter((b) => !b.earned);
    return badges;
  }, [badges, earned, filter]);

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
                {total} Rozet
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              {earned.length} / {total} rozet kazanıldı • Detayları görmek için kartlara tıkla
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
      <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden mb-3.5 shrink-0">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: theme.accent,
            boxShadow: `0 0 12px ${theme.accent}60`,
          }}
        />
      </div>

      {/* ─── Filtre Sekmeleri & Nadirlik Dağılımı ─────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3.5 shrink-0">
        {/* Filtre Butonları */}
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
            <span>Hedefler ({unearnedSorted.length})</span>
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

      {/* ─── Ana İçerik Kaydırma Alanı ───────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scroll pr-1 pb-1">
        {/* Hedefler Sekmesi Aktifse: Tüm hedefleri büyük kartlarla listele */}
        {filter === "closest" ? (
          <div className="space-y-3">
            {unearnedSorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-400">
                <CheckCircle2 className="w-12 h-12 mb-2 text-emerald-400" />
                <p className="text-base font-bold text-zinc-100">Tebrikler! Bütün hedefler tamamlandı.</p>
                <p className="text-xs text-zinc-400 mt-1">Koleksiyondaki tüm rozetleri kazandınız.</p>
              </div>
            ) : (
              unearnedSorted.map((badge) => (
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
            {filter === "all" && topNextGoals.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-zinc-200">
                    <Target className="w-4 h-4 text-[var(--accent)]" />
                    <span>Sıradaki Hedefler</span>
                    <span className="text-xs text-zinc-400 font-normal hidden sm:inline">
                      (Kazanmaya en yakın rozetler • Detay için tıkla)
                    </span>
                  </div>
                  {unearnedSorted.length > 2 && (
                    <button
                      onClick={() => setFilter("closest")}
                      className="text-xs text-[var(--accent)] hover:underline flex items-center gap-0.5 font-semibold"
                    >
                      <span>Tümünü Gör ({unearnedSorted.length})</span>
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

            {/* Rozet Kartları Grid'i (Büyütülmüş ve Tıklanabilir) */}
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
          onClose={() => setSelectedBadgeId(null)}
          onNext={handleNextBadge}
          onPrev={handlePrevBadge}
        />
      )}
    </div>
  );
}
