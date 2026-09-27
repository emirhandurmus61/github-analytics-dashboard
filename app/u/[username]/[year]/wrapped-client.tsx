"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Share2,
  Download,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Flame,
  Copy,
  Calendar,
  Clock,
  Layers,
  FileText,
  X,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";

type LangEntry = { lang: string; bytes: number; pct: number; color: string };
type BigCommit = { message: string; additions: number; deletions: number; date: string };
type MonthPoint = { month: string; commits: number };

type WrappedData = {
  username: string;
  year: number;
  displayName: string;
  avatarUrl: string | null;
  totalCommits: number;
  totalLinesAdded: number;
  totalLinesDeleted: number;
  activeDays: number;
  longestStreak: number;
  peakMonth: string;
  peakMonthCommits: number;
  peakDay: string;
  peakHour: number;
  topLangs: LangEntry[];
  biggestCommit: BigCommit | null;
  reposCreated: number;
  activeRepos: number;
  topRepo: { name: string; fullName: string; commits: number; stars: number; language: string } | null;
  totalPRs: number;
  mergedPRs: number;
  totalStars: number;
  archetype: {
    title: string;
    tagline: string;
    badge: string;
    desc: string;
    color: string;
  };
  identity: { label: string; emoji: string };
  monthlyData: MonthPoint[];
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  accentShades: [string, string, string, string];
  heatmapDates: Record<string, number>;
  maxDayCount: number;
  issuesOpened: number;
  issuesClosed: number;
};

// Sayı sayma animasyonu hook (React 19 uyumlu)
function useCountUp(target: number, active: boolean, duration = 1100) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return;
    const start = performance.now();
    let frameId: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * ease));
      if (t < 1) frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [target, active, duration]);

  return active ? value : 0;
}

function CountUp({
  value,
  active,
  suffix = "",
  prefix = "",
}: {
  value: number;
  active: boolean;
  suffix?: string;
  prefix?: string;
}) {
  const v = useCountUp(value, active);
  return (
    <>
      {prefix}
      {v.toLocaleString("tr-TR")}
      {suffix}
    </>
  );
}

// 12 Aylık dalga formu grafik
function MonthWaveform({
  data,
  accentColor,
}: {
  data: MonthPoint[];
  accentColor: string;
}) {
  const max = Math.max(...data.map((d) => d.commits), 1);
  const peak = data.reduce(
    (maxObj, curr, idx) =>
      curr.commits > maxObj.commits ? { commits: curr.commits, idx } : maxObj,
    { commits: -1, idx: 0 }
  ).idx;

  return (
    <div className="flex h-24 w-full items-end gap-1.5 sm:gap-2">
      {data.map((d, i) => {
        const h = Math.max((d.commits / max) * 100, d.commits > 0 ? 8 : 4);
        const isPeak = i === peak;
        return (
          <div key={d.month} className="flex flex-1 flex-col items-center gap-1.5 group">
            <div
              className={`w-full rounded-t-md transition-all duration-700 ${
                isPeak
                  ? "shadow-[0_0_16px_var(--accent)] ring-1 ring-[var(--accent)]"
                  : "opacity-40 hover:opacity-80"
              }`}
              style={{
                height: `${h}%`,
                backgroundColor: isPeak ? accentColor : "#52525b",
              }}
            />
            <span
              className="text-[10px] font-mono leading-none tracking-tight"
              style={{
                color: isPeak ? accentColor : "#71717a",
                fontWeight: isPeak ? 700 : 400,
              }}
            >
              {d.month}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Geniş katkı matrisi (Heatmap)
function FullHeatmap({
  dates,
  maxCount,
  accentColor,
  year,
}: {
  dates: Record<string, number>;
  maxCount: number;
  accentColor: string;
  year: number;
}) {
  const WEEKS = 53;
  const yearStart = new Date(`${year}-01-01`);
  const startOffset = (yearStart.getDay() + 6) % 7;

  const cells: { week: number; day: number; count: number }[] = [];
  for (let w = 0; w < WEEKS; w++) {
    for (let d = 0; d < 7; d++) {
      const dayIndex = w * 7 + d - startOffset;
      if (dayIndex < 0) continue;
      const date = new Date(yearStart);
      date.setDate(date.getDate() + dayIndex);
      if (date.getFullYear() !== year) continue;
      const dateStr = date.toISOString().slice(0, 10);
      cells.push({ week: w, day: d, count: dates[dateStr] ?? 0 });
    }
  }

  const CELL = 9;
  const GAP = 2;
  const W = WEEKS * (CELL + GAP);
  const H = 7 * (CELL + GAP);

  function alpha(hex: string, a: number) {
    const r = parseInt(hex.slice(1, 3) || "34", 16);
    const g = parseInt(hex.slice(3, 5) || "d3", 16);
    const b = parseInt(hex.slice(5, 7) || "99", 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="block overflow-visible">
      {cells.map(({ week, day, count }) => (
        <rect
          key={`${week}-${day}`}
          x={week * (CELL + GAP)}
          y={day * (CELL + GAP)}
          width={CELL}
          height={CELL}
          rx={2}
          fill={
            count === 0
              ? "#18181b"
              : count / maxCount < 0.25
              ? alpha(accentColor, 0.25)
              : count / maxCount < 0.5
              ? alpha(accentColor, 0.5)
              : count / maxCount < 0.75
              ? alpha(accentColor, 0.75)
              : accentColor
          }
        />
      ))}
    </svg>
  );
}

// Available years
const CURRENT_YEAR = new Date().getFullYear();
const AVAILABLE_YEARS = Array.from(
  { length: CURRENT_YEAR - 2022 + 1 },
  (_, i) => CURRENT_YEAR - i
);

export default function WrappedClient({
  data,
}: {
  data: WrappedData;
  isOwner?: boolean;
}) {
  const { lang, t } = useLanguage();
  const [slide, setSlide] = useState(0);
  const [mode, setMode] = useState<"story" | "poster">("story");
  const [isPlaying, setIsPlaying] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);

  const confettiFired = useRef(false);
  const autoPlayTimer = useRef<NodeJS.Timeout | null>(null);

  const ac = data.accentColor;
  const TOTAL_SLIDES = 10;

  const shareUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://devanalytics.app/u/${data.username}/${data.year}`;

  const tweetText =
    lang === "tr"
      ? `🚀 ${data.displayName} (@${data.username}) — ${data.year} Devboard Wrapped!\n\n💻 ${data.totalCommits.toLocaleString("tr-TR")} commit\n🔥 ${data.longestStreak} gün kesintisiz seri\n🏆 Rolüm: ${data.archetype.title}\n\nDetaylı yıllık geliştirici özetim:`
      : `🚀 ${data.displayName} (@${data.username}) — ${data.year} Devboard Wrapped!\n\n💻 ${data.totalCommits.toLocaleString("en-US")} commits\n🔥 ${data.longestStreak}-day unbroken streak\n🏆 Archetype: ${data.archetype.title}\n\nDetailed annual developer summary:`;

  // Confetti trigger
  const fireConfetti = useCallback(() => {
    import("canvas-confetti").then(({ default: confetti }) => {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
        colors: [ac, "#38bdf8", "#f43f5e", "#ffffff"],
      });
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 60,
          origin: { x: 0.1, y: 0.65 },
          colors: [ac, "#f59e0b", "#ffffff"],
        });
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 60,
          origin: { x: 0.9, y: 0.65 },
          colors: [ac, "#a855f7", "#ffffff"],
        });
      }, 250);
    });
  }, [ac]);

  // Son slaytta veya poster modunda konfeti
  useEffect(() => {
    if ((slide === TOTAL_SLIDES - 1 || mode === "poster") && !confettiFired.current) {
      confettiFired.current = true;
      fireConfetti();
    }
    if (slide !== TOTAL_SLIDES - 1 && mode !== "poster") {
      confettiFired.current = false;
    }
  }, [slide, mode, fireConfetti, TOTAL_SLIDES]);

  // Otomatik Oynatma
  useEffect(() => {
    if (isPlaying && mode === "story") {
      autoPlayTimer.current = setInterval(() => {
        setSlide((s) => {
          if (s >= TOTAL_SLIDES - 1) {
            setIsPlaying(false);
            return s;
          }
          return s + 1;
        });
      }, 5500);
    } else {
      if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
    }
    return () => {
      if (autoPlayTimer.current) clearInterval(autoPlayTimer.current);
    };
  }, [isPlaying, mode, TOTAL_SLIDES]);

  // Klavye gezintisi
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (shareModalOpen) return;
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setSlide((s) => Math.min(TOTAL_SLIDES - 1, s + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSlide((s) => Math.max(0, s - 1));
      } else if (e.key === "Escape") {
        setShareModalOpen(false);
        setYearOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [shareModalOpen, TOTAL_SLIDES]);

  // Dokunmatik Swipe
  const touchStartX = useRef<number | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const deltaX = touchStartX.current - e.changedTouches[0].clientX;
    if (deltaX > 40) {
      setSlide((s) => Math.min(TOTAL_SLIDES - 1, s + 1));
    } else if (deltaX < -40) {
      setSlide((s) => Math.max(0, s - 1));
    }
    touchStartX.current = null;
  }

  // Link Kopyalama
  function handleCopy() {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  // PNG İndirme
  const downloadSlidePng = useCallback(
    async (targetSlide = slide) => {
      setSharing(true);
      try {
        const url = `/api/wrapped-slide/${data.username}/${data.year}/${targetSlide}`;
        const res = await fetch(url);
        const blob = await res.blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${data.username}-${data.year}-wrapped-slide-${targetSlide + 1}.png`;
        link.click();
        URL.revokeObjectURL(link.href);
      } catch (err) {
        console.error(err);
      } finally {
        setSharing(false);
      }
    },
    [data.username, data.year, slide]
  );

  return (
    <div className="relative flex h-[calc(100dvh-64px)] max-h-[calc(100dvh-64px)] w-full select-none flex-col overflow-hidden bg-zinc-950 font-sans text-zinc-100">
      {/* ─── ATMOSFERİK ARKA PLAN IŞIKLARI (DİNAMİK SAHNE) ─── */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-all duration-1000"
        style={{
          background:
            slide === 1
              ? `radial-gradient(ellipse 900px 500px at 50% 30%, ${ac}25 0%, transparent 70%)`
              : slide === 2
              ? `radial-gradient(ellipse 900px 500px at 30% 35%, rgba(16,185,129,0.2) 0%, transparent 60%), radial-gradient(ellipse 900px 500px at 70% 35%, rgba(239,68,68,0.18) 0%, transparent 60%)`
              : slide === 4
              ? `radial-gradient(ellipse 900px 500px at 50% 30%, ${data.archetype.color}30 0%, transparent 70%)`
              : `radial-gradient(ellipse 900px 500px at 50% 25%, ${data.accentBg.replace(
                  "0.08",
                  "0.22"
                )} 0%, transparent 70%)`,
        }}
      />

      {/* İnce teknolojik ızgara deseni */}
      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(to_right,#27272a08_1px,transparent_1px),linear-gradient(to_bottom,#27272a08_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />

      {/* ─── 1. ÜST KONTROL & İLERLEME BARI (HEADER) ─── */}
      <header className="relative z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-zinc-800/40 px-4 sm:px-8 backdrop-blur-xl">
        {/* Hikaye İlerleme Çubukları */}
        {mode === "story" ? (
          <div className="flex flex-1 items-center gap-1 sm:gap-1.5 min-w-0 max-w-xl">
            {Array.from({ length: TOTAL_SLIDES }).map((_, i) => {
              const isPassed = i < slide;
              const isCurrent = i === slide;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSlide(i)}
                  title={`Bölüm ${i + 1}`}
                  className="group relative h-1.5 flex-1 rounded-full bg-zinc-800/80 overflow-hidden transition-all hover:h-2"
                >
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isPassed
                        ? "w-full"
                        : isCurrent
                        ? isPlaying
                          ? "w-full animate-[progress_5.5s_linear]"
                          : "w-full"
                        : "w-0"
                    }`}
                    style={{
                      backgroundColor:
                        isPassed || isCurrent ? ac : "transparent",
                    }}
                  />
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold tracking-wider text-zinc-200">
              DEV POSTER {"//"} {data.year} EDITION
            </span>
          </div>
        )}

        {/* Sağ Kontrol Kümesi */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Görünüm Modu Değiştirici: Story vs Poster */}
          <div className="flex items-center rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-0.5 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setMode("story")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                mode === "story"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Layers className="h-3.5 w-3.5 text-[var(--accent)]" />
              <span>{t.wrapped.storyMode}</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("poster")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-all ${
                mode === "poster"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <FileText className="h-3.5 w-3.5 text-amber-400" />
              <span>{t.wrapped.posterMode}</span>
            </button>
          </div>

          {/* Oynat / Duraklat (Sadece Story Modunda) */}
          {mode === "story" && (
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-100 cursor-pointer"
              title={isPlaying ? t.wrapped.pause : t.wrapped.autoPlay}
            >
              {isPlaying ? (
                <Pause className="h-3.5 w-3.5" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
            </button>
          )}

          {/* Yıl Seçici */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setYearOpen((v) => !v)}
              className="flex h-8 items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/60 px-2.5 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
            >
              <span>{data.year}</span>
              <ChevronDown
                className={`h-3 w-3 text-zinc-500 transition-transform ${
                  yearOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {yearOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-50 w-28 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/95 py-1 shadow-2xl backdrop-blur-xl ring-1 ring-white/5">
                {AVAILABLE_YEARS.map((y) => (
                  <Link
                    key={y}
                    href={`/u/${data.username}/${y}`}
                    onClick={() => setYearOpen(false)}
                    className="block px-3 py-1.5 text-xs transition-colors hover:bg-zinc-800"
                    style={{
                      color: y === data.year ? ac : "#a1a1aa",
                      fontWeight: y === data.year ? 600 : 400,
                    }}
                  >
                    {y} Wrapped
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Paylaş Butonu */}
          <button
            type="button"
            onClick={() => setShareModalOpen(true)}
            className="flex h-8 items-center gap-1.5 rounded-xl border border-zinc-700/80 bg-zinc-900/80 px-3 text-xs font-semibold text-zinc-200 shadow-sm transition-all hover:border-[var(--accent)]/50 hover:bg-zinc-800 hover:text-white cursor-pointer"
          >
            <Share2 className="h-3 w-3 text-[var(--accent)]" />
            <span>{t.common.share}</span>
          </button>
        </div>
      </header>

      {/* ─── 2. MERKEZ SAHNE: BÜTÜNSEL HİKAYE VEYA POSTER ─── */}
      <main
        className="relative z-10 flex flex-1 items-center justify-center overflow-hidden p-3 sm:p-6"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {mode === "story" ? (
          /* ──────── BÜTÜNSEL GENİŞ SAHNE (KART KUTUSU OLMADAN) ──────── */
          <div className="relative flex h-full max-h-[min(620px,calc(100dvh-160px))] w-full max-w-4xl flex-col justify-between overflow-hidden px-2 sm:px-8">
            {/* Sahne Üst Metadata Şeridi */}
            <div className="flex items-center justify-between border-b border-zinc-800/40 pb-2.5">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--accent)]">
                  {"//"} {t.wrapped.chapter} {slide + 1}:
                </span>
                <span className="text-xs font-semibold text-zinc-400">
                  {t.wrapped.slideTitles[slide] || ""}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-lg border border-zinc-800 bg-zinc-900/60 px-2 py-0.5 font-mono text-[10px] text-zinc-400">
                  {data.displayName} · @{data.username}
                </span>
              </div>
            </div>

            {/* Sahne Ana İçeriği (Geniş & Güçlü Tipografi) */}
            <div className="my-auto flex flex-1 flex-col items-center justify-center py-2 text-center">
              {/* SLAYT 0: GİRİŞ & KAPAK */}
              {slide === 0 && (
                <div className="space-y-5 animate-in fade-in zoom-in-95 duration-500 max-w-2xl">
                  <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
                    <div
                      className="absolute inset-0 rounded-full animate-ping opacity-25"
                      style={{ backgroundColor: ac }}
                    />
                    <div
                      className="absolute -inset-2 rounded-full border border-dashed border-[var(--accent)]/40 animate-[spin_20s_linear_infinite]"
                    />
                    {data.avatarUrl ? (
                      <Image
                        src={data.avatarUrl}
                        alt={data.username}
                        width={112}
                        height={112}
                        unoptimized
                        className="relative rounded-full shadow-2xl ring-4 ring-zinc-900"
                        style={{ outline: `3px solid ${ac}` }}
                      />
                    ) : (
                      <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-zinc-800 text-4xl font-black text-zinc-100 ring-4 ring-zinc-900">
                        {data.displayName[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="inline-block rounded-full border border-zinc-700/60 bg-zinc-900/80 px-4 py-1 text-xs font-mono font-medium text-zinc-400">
                      DEV ANALYTICS {"//"} ANNUAL DEVELOPER ARCHIVE
                    </span>
                    <h1 className="mt-3 text-5xl sm:text-7xl font-black tracking-tight text-white">
                      {data.year} <span style={{ color: ac }}>WRAPPED</span>
                    </h1>
                    <p className="mt-3 text-sm sm:text-base text-zinc-300 max-w-lg mx-auto">
                      Bir yıl boyunca klavyenden dökülen her satır kod, çözdüğün her problem ve ulaştığın geliştirici zirveleri hazır.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => setSlide(1)}
                      className="inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-bold text-zinc-950 shadow-2xl transition-all hover:scale-105 active:scale-95"
                      style={{ backgroundColor: ac }}
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Hikayeyi Keşfet</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SLAYT 1: COMMIT GÜCÜ (DEVASA TİPOGRAFİ) */}
              {slide === 1 && (
                <div className="space-y-5 animate-in fade-in duration-500 max-w-3xl w-full">
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-500">
                    KOD TABANINA ATTIĞIN İMZA
                  </span>

                  <div>
                    <p
                      className="text-7xl sm:text-9xl font-black tracking-tight drop-shadow-[0_0_40px_rgba(52,211,153,0.25)]"
                      style={{ color: ac }}
                    >
                      <CountUp value={data.totalCommits} active={slide === 1} />
                    </p>
                    <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">
                      Commit ile Dünyayı Kodladın!
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-5 py-3 text-left">
                      <span className="block text-[11px] font-mono text-zinc-500">AKTİF GÜN</span>
                      <strong className="text-xl font-bold text-zinc-100">
                        {data.activeDays} Gün
                      </strong>
                    </div>

                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-5 py-3 text-left">
                      <span className="block text-[11px] font-mono text-zinc-500">GÜNLÜK TEMPO</span>
                      <strong className="text-xl font-bold text-zinc-100">
                        {(data.totalCommits / Math.max(data.activeDays, 1)).toFixed(1)} commit / gün
                      </strong>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-zinc-400 italic max-w-md mx-auto">
                    &ldquo;Terminalin ve editörün bu yıl neredeyse hiç soğumadı; projelerin her commit ile bir adım daha ileri taşındı.&rdquo;
                  </p>
                </div>
              )}

              {/* SLAYT 2: KOD HACMİ (İKİ KUTUPLU PARLAK DÜELLO) */}
              {slide === 2 && (
                <div className="space-y-6 animate-in fade-in duration-500 max-w-3xl w-full">
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-500">
                    KOD MATRIXİ VE HACİM DENGESİ
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
                    <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center backdrop-blur-md shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                      <span className="font-mono text-xs font-bold text-emerald-400">
                        + DÜNYAYA EKLENEN KOD
                      </span>
                      <p className="mt-2 text-4xl sm:text-6xl font-black text-emerald-400">
                        +<CountUp value={data.totalLinesAdded} active={slide === 2} />
                      </p>
                      <span className="mt-1 block text-xs text-zinc-400">satır yeni kod üretildi</span>
                    </div>

                    <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-6 text-center backdrop-blur-md shadow-[0_0_30px_rgba(239,68,68,0.15)]">
                      <span className="font-mono text-xs font-bold text-red-400">
                        − REFACTOR EDİLEN KOD
                      </span>
                      <p className="mt-2 text-4xl sm:text-6xl font-black text-red-400">
                        −<CountUp value={data.totalLinesDeleted} active={slide === 2} />
                      </p>
                      <span className="mt-1 block text-xs text-zinc-400">satır silindi ve temizlendi</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 max-w-lg mx-auto">
                    <p className="text-xs text-zinc-300">
                      Net Kod Katkın:{" "}
                      <strong className="text-white font-mono text-sm">
                        {(data.totalLinesAdded - data.totalLinesDeleted).toLocaleString("tr-TR")}
                      </strong>{" "}
                      satır
                    </p>
                  </div>
                </div>
              )}

              {/* SLAYT 3: ZİRVE AY & RİTİM */}
              {slide === 3 && (
                <div className="space-y-5 animate-in fade-in duration-500 max-w-3xl w-full">
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-500">
                    EN BÜYÜK ÜRETİM PATLAMASI
                  </span>

                  <div>
                    <p className="text-5xl sm:text-7xl font-black" style={{ color: ac }}>
                      {data.peakMonth.toUpperCase()}
                    </p>
                    <p className="mt-2 text-sm text-zinc-300">
                      Bu ay tam <strong className="text-white font-bold">{data.peakMonthCommits} commit</strong> ile yılın zirvesini yaşadın.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/60 p-4 sm:p-6 backdrop-blur-xl">
                    <MonthWaveform data={data.monthlyData} accentColor={ac} />
                  </div>
                </div>
              )}

              {/* SLAYT 4: GELİŞTİRİCİ ARKETİPİ (HOLOGRAFİK KİMLİK KARTI) */}
              {slide === 4 && (
                <div className="space-y-4 animate-in fade-in duration-500 max-w-2xl w-full">
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-500">
                    KODLAMA TARZIN VE DNA ROZETİN
                  </span>

                  <div
                    className="relative overflow-hidden rounded-3xl border p-6 sm:p-8 shadow-2xl text-center backdrop-blur-2xl"
                    style={{
                      borderColor: `${data.archetype.color}60`,
                      background: `linear-gradient(135deg, ${data.archetype.color}20 0%, rgba(24,24,27,0.85) 100%)`,
                      boxShadow: `0 0 50px ${data.archetype.color}20`,
                    }}
                  >
                    <span
                      className="inline-block rounded-full px-4 py-1 font-mono text-xs font-bold tracking-wider shadow-inner"
                      style={{
                        backgroundColor: `${data.archetype.color}30`,
                        color: data.archetype.color,
                        border: `1px solid ${data.archetype.color}60`,
                      }}
                    >
                      {data.archetype.badge}
                    </span>

                    <h2
                      className="mt-3 text-3xl sm:text-5xl font-black tracking-tight"
                      style={{ color: data.archetype.color }}
                    >
                      {data.archetype.title}
                    </h2>

                    <p className="mt-2 text-sm font-semibold text-zinc-200">
                      &ldquo;{data.archetype.tagline}&rdquo;
                    </p>

                    <p className="mt-3 text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-lg mx-auto">
                      {data.archetype.desc}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3 pt-3 border-t border-zinc-800/60">
                      <div className="flex items-center justify-center gap-2 text-xs">
                        <Calendar className="h-4 w-4 text-zinc-400" />
                        <span className="text-zinc-400">Zirve Gün:</span>
                        <strong className="text-white">{data.peakDay}</strong>
                      </div>
                      <div className="flex items-center justify-center gap-2 text-xs">
                        <Clock className="h-4 w-4 text-zinc-400" />
                        <span className="text-zinc-400">Zirve Saat:</span>
                        <strong className="text-white">
                          {String(data.peakHour).padStart(2, "0")}:00
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SLAYT 5: TEKNOLOJİ CEPHANESİ & DİLLER */}
              {slide === 5 && (
                <div className="space-y-5 animate-in fade-in duration-500 max-w-2xl w-full">
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-500">
                    FAVORİ PROGRAMLAMA DİLLERİN
                  </span>

                  <div>
                    <span className="text-xs font-mono text-zinc-400">#1 NUMARALI SİLAHIN</span>
                    <p className="text-4xl sm:text-6xl font-black text-white mt-1">
                      {data.topLangs[0]?.lang ?? "Code"}
                    </p>
                    <span className="font-mono text-sm text-[var(--accent)] font-bold">
                      %{data.topLangs[0]?.pct ?? 0} pay ile zirvede
                    </span>
                  </div>

                  <div className="space-y-3 text-left w-full max-w-lg mx-auto pt-2">
                    {data.topLangs.map((l, i) => (
                      <div key={l.lang} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <span className="text-zinc-500 font-bold">#{i + 1}</span>
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: l.color }}
                            />
                            <span className="text-zinc-200 font-semibold">{l.lang}</span>
                          </div>
                          <span className="text-zinc-400">%{l.pct}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-zinc-800/80 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${l.pct}%`,
                              backgroundColor: l.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SLAYT 6: PROJELER & EVREN */}
              {slide === 6 && (
                <div className="space-y-5 animate-in fade-in duration-500 max-w-3xl w-full">
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-500">
                    REPO & PROJE EVRENİ
                  </span>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                      <span className="block text-[10px] font-mono text-zinc-500">YENİ REPO</span>
                      <strong className="text-3xl font-black" style={{ color: ac }}>
                        <CountUp value={data.reposCreated} active={slide === 6} />
                      </strong>
                    </div>

                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                      <span className="block text-[10px] font-mono text-zinc-500">AKTİF REPO</span>
                      <strong className="text-3xl font-black text-white">
                        <CountUp value={data.activeRepos} active={slide === 6} />
                      </strong>
                    </div>

                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                      <span className="block text-[10px] font-mono text-zinc-500">PULL REQUEST</span>
                      <strong className="text-3xl font-black text-purple-400">
                        <CountUp value={data.totalPRs} active={slide === 6} />
                      </strong>
                    </div>

                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
                      <span className="block text-[10px] font-mono text-zinc-500">YILDIZLAR</span>
                      <strong className="text-3xl font-black text-amber-400">
                        <CountUp value={data.totalStars} active={slide === 6} />
                      </strong>
                    </div>
                  </div>

                  {data.topRepo && (
                    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5 text-left max-w-lg mx-auto flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">
                          YILIN EN ÇOK GELİŞTİRİLEN REPOSU
                        </span>
                        <h4 className="text-base font-bold text-white mt-0.5">
                          {data.topRepo.name}
                        </h4>
                        <span className="text-xs text-zinc-400">
                          {data.topRepo.language} · {data.topRepo.stars} star
                        </span>
                      </div>
                      <span className="rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-1 font-mono text-xs font-bold text-zinc-100">
                        {data.topRepo.commits} commit
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* SLAYT 7: EFSANEVİ COMMİT */}
              {slide === 7 && (
                <div className="space-y-5 animate-in fade-in duration-500 max-w-2xl w-full">
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-500">
                    TEK SEFERDE EN BÜYÜK DEĞİŞİKLİK
                  </span>

                  {data.biggestCommit ? (
                    <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 sm:p-8 text-left space-y-4 shadow-2xl">
                      <span className="text-4xl text-[var(--accent)] font-serif leading-none">“</span>
                      <p className="text-lg sm:text-2xl font-bold text-white leading-snug">
                        {data.biggestCommit.message || "(mesajsız commit)"}
                      </p>
                      <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-2 border-t border-zinc-800/60">
                        <span className="font-bold text-emerald-400">
                          +{data.biggestCommit.additions.toLocaleString("tr-TR")} satır eklendi
                        </span>
                        <span className="font-bold text-red-400">
                          −{data.biggestCommit.deletions.toLocaleString("tr-TR")} satır silindi
                        </span>
                        <span className="text-zinc-500">{data.biggestCommit.date}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500">Commit verisi bulunamadı.</p>
                  )}
                </div>
              )}

              {/* SLAYT 8: 365 GÜNLÜK MOZAİK (HEATMAP) */}
              {slide === 8 && (
                <div className="space-y-5 animate-in fade-in duration-500 max-w-3xl w-full">
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-zinc-500">
                    365 GÜNLÜK KONTRIBÜSYON MATRİKSİ
                  </span>

                  <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/80 p-4 sm:p-6 backdrop-blur-xl">
                    <FullHeatmap
                      dates={data.heatmapDates}
                      maxCount={data.maxDayCount}
                      accentColor={ac}
                      year={data.year}
                    />
                  </div>

                  <div className="flex items-center justify-center gap-6 text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <Flame className="h-5 w-5 text-amber-400" />
                      <span>
                        En Uzun Seri:{" "}
                        <strong className="text-white text-base">{data.longestStreak} Gün</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                      <span>
                        Yıllık Aktiflik Oranı:{" "}
                        <strong className="text-white text-base">
                          %{Math.round((data.activeDays / 365) * 100)}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* SLAYT 9: BÜYÜK FİNAL */}
              {slide === 9 && (
                <div className="space-y-5 animate-in fade-in zoom-in-95 duration-500 max-w-xl">
                  <div>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1 text-xs font-mono font-bold text-emerald-400">
                      🎉 2026 RESMİ RAPORU TAMAMLANDI!
                    </span>
                    <h2 className="mt-3 text-4xl sm:text-5xl font-black text-white">
                      Harika bir yıldı, {data.displayName}!
                    </h2>
                    <p className="mt-2 text-sm text-zinc-300">
                      Topladığın tüm metrikler, yazdığın kodlar ve kurduğun sistemler seninle gurur duyuyor.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setMode("poster")}
                      className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-xs sm:text-sm font-bold text-zinc-950 shadow-2xl transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                      style={{ backgroundColor: ac }}
                    >
                      <FileText className="h-4 w-4" />
                      <span>{lang === "tr" ? "Posteri Görüntüle" : "View Poster"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShareModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-800/80 px-5 py-3 text-xs sm:text-sm font-semibold text-zinc-100 transition-colors hover:bg-zinc-700 cursor-pointer"
                    >
                      <Share2 className="h-4 w-4 text-[var(--accent)]" />
                      <span>{lang === "tr" ? "Sosyal Medyada Paylaş" : "Share on Social Media"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={fireConfetti}
                      className="inline-flex items-center gap-1 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-xs text-zinc-400 hover:text-white cursor-pointer"
                      title={lang === "tr" ? "Konfeti patlat" : "Confetti"}
                    >
                      🎊
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sahne Alt Bilgisi */}
            <div className="flex items-center justify-between border-t border-zinc-800/40 pt-2.5 text-[11px] font-mono text-zinc-500">
              <span>DEVBOARD.APP {"//"} WRAPPED-{data.year}</span>
              <button
                type="button"
                onClick={() => downloadSlidePng(slide)}
                disabled={sharing}
                className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
              >
                <Download className="h-3 w-3" />
                <span className="hidden sm:inline">
                  {lang === "tr" ? "Bu Slaytı İndir (PNG)" : "Download Slide (PNG)"}
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* ──────── KULLANICI İÇİN ÖZEL KOLEKSİYON GELİŞTİRİCİ POSTERİ (FESTIVAL/ART POSTER) ──────── */
          <div className="flex h-full max-h-[min(620px,calc(100dvh-160px))] w-full max-w-2xl flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
            {/* Poster Tuvali */}
            <div
              className="relative flex h-full w-full flex-col justify-between overflow-hidden rounded-3xl border border-zinc-800/90 bg-zinc-950 p-4 sm:p-6 shadow-[0_0_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl ring-1 ring-white/10"
              style={{
                boxShadow: `0 0 50px ${ac}18`,
              }}
            >
              {/* Poster Köşe Çapraz İşaretleri (+) */}
              <span className="absolute top-2 left-2 text-[10px] font-mono text-zinc-700">+</span>
              <span className="absolute top-2 right-2 text-[10px] font-mono text-zinc-700">+</span>
              <span className="absolute bottom-2 left-2 text-[10px] font-mono text-zinc-700">+</span>
              <span className="absolute bottom-2 right-2 text-[10px] font-mono text-zinc-700">+</span>

              {/* POSTER 1: ÜST MARKA VE BARKOD ALANI */}
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black tracking-widest text-zinc-100">
                      DEV ANALYTICS
                    </span>
                    <span className="rounded-md border border-zinc-700 bg-zinc-900 px-1.5 py-0.2 font-mono text-[9px] font-bold text-zinc-400">
                      OFFICIAL ARCHIVE
                    </span>
                  </div>
                  <span className="block font-mono text-[10px] text-zinc-500">
                    EDITION {data.year} {"//"} RECAP CERTIFICATE
                  </span>
                </div>

                {/* Vektör Barkod Görünümü */}
                <div className="flex items-center gap-0.5 opacity-80" aria-hidden="true">
                  <span className="h-6 w-1 bg-zinc-300" />
                  <span className="h-6 w-0.5 bg-zinc-300" />
                  <span className="h-6 w-1.5 bg-zinc-300" />
                  <span className="h-6 w-0.5 bg-zinc-300" />
                  <span className="h-6 w-1 bg-zinc-300" />
                  <span className="h-6 w-0.5 bg-zinc-300" />
                  <span className="h-6 w-2 bg-zinc-300" />
                  <span className="h-6 w-0.5 bg-zinc-300" />
                  <span className="h-6 w-1 bg-zinc-300" />
                </div>
              </div>

              {/* POSTER 2: PROFİL VE MERKEZ KAHRAMAN BÖLÜMÜ */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  {data.avatarUrl ? (
                    <Image
                      src={data.avatarUrl}
                      alt={data.username}
                      width={52}
                      height={52}
                      unoptimized
                      className="rounded-full shadow-lg"
                      style={{ outline: `3px solid ${ac}`, outlineOffset: "2px" }}
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-lg font-black text-white">
                      {data.displayName[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                      {data.displayName}
                    </h3>
                    <span className="font-mono text-xs text-zinc-400">
                      @{data.username}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className="inline-block rounded-full px-3 py-0.5 font-mono text-[10px] font-black uppercase tracking-wider"
                    style={{
                      backgroundColor: `${data.archetype.color}25`,
                      color: data.archetype.color,
                      border: `1px solid ${data.archetype.color}60`,
                    }}
                  >
                    {data.archetype.badge}
                  </span>
                  <span className="block mt-0.5 font-mono text-[11px] font-bold text-zinc-300">
                    {data.archetype.title}
                  </span>
                </div>
              </div>

              {/* POSTER 3: DEV HERO METRİK (COMMIT MANŞETİ) */}
              <div
                className="relative rounded-2xl border p-4 text-center overflow-hidden my-1"
                style={{
                  borderColor: `${ac}40`,
                  background: `linear-gradient(135deg, ${ac}15 0%, rgba(24,24,27,0.7) 100%)`,
                }}
              >
                <span className="font-mono text-[10px] font-bold tracking-widest text-zinc-400 uppercase">
                  TOTAL VERIFIED COMMITS {"//"} {data.year}
                </span>
                <p
                  className="text-5xl sm:text-6xl font-black tracking-tight"
                  style={{ color: ac }}
                >
                  {data.totalCommits.toLocaleString("tr-TR")}
                </p>
                <div className="flex items-center justify-center gap-4 text-xs font-mono text-zinc-300 mt-1">
                  <span>{data.activeDays} Aktif Gün</span>
                  <span>·</span>
                  <span>Ort. {(data.totalCommits / Math.max(data.activeDays, 1)).toFixed(1)} / gün</span>
                </div>
              </div>

              {/* POSTER 4: 4'LÜ EDİTÖRYAL VERİ PANELİ */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-1">
                {/* Modül: Kod Satırları */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5">
                  <span className="block font-mono text-[9px] text-zinc-500 uppercase">KOD HACMİ</span>
                  <p className="font-mono text-xs font-bold text-emerald-400">
                    +{data.totalLinesAdded.toLocaleString("tr-TR")}
                  </p>
                  <p className="font-mono text-xs font-bold text-red-400">
                    −{data.totalLinesDeleted.toLocaleString("tr-TR")}
                  </p>
                </div>

                {/* Modül: Seri (Streak) */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5">
                  <span className="block font-mono text-[9px] text-zinc-500 uppercase">SERİ (STREAK)</span>
                  <div className="flex items-center gap-1">
                    <Flame className="h-3.5 w-3.5 text-amber-400" />
                    <span className="font-mono text-base font-black text-amber-400">
                      {data.longestStreak} Gün
                    </span>
                  </div>
                  <span className="text-[9px] text-zinc-500">kesintisiz</span>
                </div>

                {/* Modül: Ana Dil */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5">
                  <span className="block font-mono text-[9px] text-zinc-500 uppercase">ANA DİL</span>
                  <p className="font-mono text-sm font-bold text-white truncate">
                    {data.topLangs[0]?.lang ?? "Code"}
                  </p>
                  <span className="font-mono text-[9px] text-[var(--accent)] font-semibold">
                    %{data.topLangs[0]?.pct ?? 0} pay
                  </span>
                </div>

                {/* Modül: Projeler & Yıldız */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5">
                  <span className="block font-mono text-[9px] text-zinc-500 uppercase">PROJELER</span>
                  <p className="font-mono text-xs font-bold text-zinc-100">
                    {data.activeRepos} repo · {data.totalPRs} PR
                  </p>
                  <p className="font-mono text-[9px] text-amber-400 font-semibold">
                    ★ {data.totalStars} star
                  </p>
                </div>
              </div>

              {/* POSTER 5: MİNİ HEATMAP ŞERİDİ & DOĞRULAMA STAMPI */}
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-2">
                <FullHeatmap
                  dates={data.heatmapDates}
                  maxCount={data.maxDayCount}
                  accentColor={ac}
                  year={data.year}
                />
              </div>

              {/* POSTER 6: ALT İMZA & WATERMARK */}
              <div className="flex items-center justify-between border-t border-zinc-800/80 pt-2 text-[10px] font-mono text-zinc-500">
                <span>VERIFIED BY DEVANALYTICS.APP</span>
                <span className="tracking-wider">LAT 41.0082° N, LON 28.9784° E</span>
              </div>
            </div>

            {/* Poster Hızlı Eylem Butonları */}
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => downloadSlidePng(9)}
                disabled={sharing}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:bg-zinc-800 disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Posteri İndir (PNG)</span>
              </button>

              <button
                type="button"
                onClick={() => setShareModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-zinc-950 shadow-md transition-transform active:scale-95"
                style={{ backgroundColor: ac }}
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>Paylaş</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-400 hover:text-white"
                title="Linki kopyala"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ─── 3. ALT GEZİNME ÇUBUĞU (FOOTER) ─── */}
      <footer className="relative z-20 flex h-14 shrink-0 items-center justify-between border-t border-zinc-800/40 px-4 sm:px-8 backdrop-blur-xl">
        {mode === "story" ? (
          <>
            <button
              type="button"
              onClick={() => setSlide((s) => Math.max(0, s - 1))}
              disabled={slide === 0}
              className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/50 px-4 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Geri</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-zinc-400 font-semibold">
                {slide + 1} / {TOTAL_SLIDES}
              </span>
              <span className="hidden sm:inline text-[11px] text-zinc-600">
                · Klavye ok tuşları ile gezinebilirsiniz
              </span>
            </div>

            {slide === TOTAL_SLIDES - 1 ? (
              <button
                type="button"
                onClick={() => setMode("poster")}
                className="flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold text-zinc-950 shadow-md"
                style={{ backgroundColor: ac }}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Posteri Gör</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setSlide((s) => Math.min(TOTAL_SLIDES - 1, s + 1))}
                className="flex items-center gap-1 rounded-xl px-4 py-1.5 text-xs font-bold text-zinc-950 shadow-md transition-transform active:scale-95"
                style={{ backgroundColor: ac }}
              >
                <span>İleri</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </>
        ) : (
          <div className="flex w-full items-center justify-between text-xs text-zinc-500 font-mono">
            <span>{"//"} DEVANALYTICS ANNUAL DEVELOPER POSTER</span>
            <button
              type="button"
              onClick={() => setMode("story")}
              className="flex items-center gap-1 text-zinc-300 hover:text-white font-sans text-xs underline"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Hikaye Moduna Dön</span>
            </button>
          </div>
        )}
      </footer>

      {/* ─── 4. SOSYAL MEDYA PAYLAŞIM MODALI ─── */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setShareModalOpen(false)}
          />

          <div
            role="dialog"
            aria-modal="true"
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl border border-zinc-800/90 bg-zinc-950/95 p-5 shadow-2xl backdrop-blur-2xl ring-1 ring-white/10 animate-in zoom-in-95 duration-200 space-y-4"
          >
            {/* Modal Başlık */}
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--accent)]" />
                <h3 className="text-sm font-bold text-zinc-100">
                  {data.year} Wrapped&apos;ini Paylaş
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Önizleme Mini Kartı */}
            <div
              className="rounded-2xl border p-4 text-center space-y-2"
              style={{
                borderColor: `${data.archetype.color}40`,
                background: `linear-gradient(135deg, ${data.archetype.color}15 0%, rgba(24,24,27,0.8) 100%)`,
              }}
            >
              <span
                className="rounded-full px-2.5 py-0.5 text-[9px] font-mono font-bold"
                style={{
                  backgroundColor: `${data.archetype.color}25`,
                  color: data.archetype.color,
                }}
              >
                {data.archetype.badge}
              </span>
              <p
                className="text-lg font-black"
                style={{ color: data.archetype.color }}
              >
                {data.archetype.title}
              </p>
              <div className="flex items-center justify-center gap-4 text-xs font-mono text-zinc-300 pt-1">
                <span>{data.totalCommits.toLocaleString("tr-TR")} Commit</span>
                <span>·</span>
                <span>{data.longestStreak} Gün Streak</span>
                <span>·</span>
                <span>{data.topLangs[0]?.lang ?? "Code"}</span>
              </div>
            </div>

            {/* 1-Tıkla Sosyal Medya Butonları */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Hızlı Paylaşım Kanalları
              </span>
              <div className="grid grid-cols-2 gap-2">
                {/* 𝕏 / Twitter */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    tweetText
                  )}&url=${encodeURIComponent(shareUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 p-2.5 text-xs font-semibold text-zinc-200 transition-colors hover:border-zinc-700 hover:bg-zinc-800"
                >
                  <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  <span>𝕏 (Twitter)</span>
                </a>

                {/* LinkedIn */}
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                    shareUrl
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 p-2.5 text-xs font-semibold text-zinc-200 transition-colors hover:border-blue-500/50 hover:bg-blue-500/10"
                >
                  <svg className="h-3.5 w-3.5 fill-[#0a66c2]" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  <span>LinkedIn</span>
                </a>

                {/* WhatsApp */}
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                    tweetText + " " + shareUrl
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 p-2.5 text-xs font-semibold text-zinc-200 transition-colors hover:border-emerald-500/50 hover:bg-emerald-500/10"
                >
                  <span className="text-emerald-400 font-bold">WA</span>
                  <span>WhatsApp</span>
                </a>

                {/* Telegram */}
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(
                    shareUrl
                  )}&text=${encodeURIComponent(tweetText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 p-2.5 text-xs font-semibold text-zinc-200 transition-colors hover:border-sky-500/50 hover:bg-sky-500/10"
                >
                  <span className="text-sky-400 font-bold">TG</span>
                  <span>Telegram</span>
                </a>
              </div>
            </div>

            {/* İndirme & Link Kopyalama Butonları */}
            <div className="pt-2 border-t border-zinc-800/60 space-y-2">
              <button
                type="button"
                onClick={() => downloadSlidePng(9)}
                disabled={sharing}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold text-zinc-950 transition-transform active:scale-95 disabled:opacity-50"
                style={{ backgroundColor: ac }}
              >
                {sharing ? (
                  <div className="h-3.5 w-3.5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>
                  {lang === "tr"
                    ? "1080x1080 Story Görseli İndir (PNG)"
                    : "Download 1080x1080 Story Image (PNG)"}
                </span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 py-2.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span className="text-emerald-400">{t.wrapped.linkCopied}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-zinc-400" />
                    <span>{t.wrapped.copyLink}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
