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
  GitCommit,
  Copy,
  Calendar,
  Clock,
  Layers,
  Grid,
  X,
  FolderGit2,
} from "lucide-react";

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

// 12 Aylık mini çubuk grafik
function MonthBarChart({
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
    <div className="flex h-20 w-full items-end gap-1 sm:gap-1.5">
      {data.map((d, i) => {
        const h = Math.max((d.commits / max) * 100, d.commits > 0 ? 6 : 2);
        const isPeak = i === peak;
        return (
          <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={`w-full rounded-t-sm transition-all duration-500 ${
                isPeak ? "shadow-sm shadow-emerald-500/20" : "opacity-40"
              }`}
              style={{
                height: `${h}%`,
                backgroundColor: isPeak ? accentColor : "#52525b",
              }}
            />
            <span
              className="text-[9px] font-mono leading-none"
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

// Yıllık mini heatmap grid
function CompactHeatmap({
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
  const startOffset = (yearStart.getDay() + 6) % 7; // Pzt=0

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

  const CELL = 8;
  const GAP = 1.5;
  const W = WEEKS * (CELL + GAP);
  const H = 7 * (CELL + GAP);

  function alpha(hex: string, a: number) {
    const r = parseInt(hex.slice(1, 3) || "34", 16);
    const g = parseInt(hex.slice(3, 5) || "d3", 16);
    const b = parseInt(hex.slice(5, 7) || "99", 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="block">
      {cells.map(({ week, day, count }) => (
        <rect
          key={`${week}-${day}`}
          x={week * (CELL + GAP)}
          y={day * (CELL + GAP)}
          width={CELL}
          height={CELL}
          rx={1.5}
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
  const [slide, setSlide] = useState(0);
  const [started, setStarted] = useState(false);
  const [mode, setMode] = useState<"story" | "bento">("story");
  const [isPlaying, setIsPlaying] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);

  const confettiFired = useRef(false);
  const autoPlayTimer = useRef<NodeJS.Timeout | null>(null);

  const ac = data.accentColor;
  const ab = data.accentBg;
  const TOTAL_SLIDES = 10;

  const shareUrl =
    typeof window !== "undefined"
      ? window.location.href
      : `https://devanalytics.app/u/${data.username}/${data.year}`;

  const tweetText = `🚀 ${data.displayName} (@${data.username}) — ${data.year} GitHub Wrapped!\n\n💻 ${data.totalCommits.toLocaleString("tr-TR")} commit\n🔥 ${data.longestStreak} gün streak\n🏆 Rolüm: ${data.archetype.title}\n\nDetaylı geliştirici özetim:`;

  // Confetti trigger
  const fireConfetti = useCallback(() => {
    import("canvas-confetti").then(({ default: confetti }) => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: [ac, "#38bdf8", "#f43f5e", "#ffffff"],
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 60,
          origin: { x: 0.1, y: 0.7 },
          colors: [ac, "#f59e0b", "#ffffff"],
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 60,
          origin: { x: 0.9, y: 0.7 },
          colors: [ac, "#a855f7", "#ffffff"],
        });
      }, 250);
    });
  }, [ac]);

  // Son slaytta otomatik konfeti patlat
  useEffect(() => {
    if (slide === TOTAL_SLIDES - 1 && !confettiFired.current) {
      confettiFired.current = true;
      fireConfetti();
    }
    if (slide !== TOTAL_SLIDES - 1) {
      confettiFired.current = false;
    }
  }, [slide, fireConfetti, TOTAL_SLIDES]);

  // Otomatik Oynatma Döngüsü
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
      {/* Arka Plan Yumuşak Ambiyans Işığı */}
      <div
        className="pointer-events-none absolute inset-0 z-0 opacity-40 transition-opacity"
        style={{
          background: `radial-gradient(circle 800px at 50% 10%, ${data.accentBg.replace(
            "0.08",
            "0.2"
          )} 0%, transparent 70%)`,
        }}
      />

      {/* ─── 1. ÜST KONTROL & İLERLEME BARI (HEADER) ─── */}
      <header className="relative z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-zinc-800/40 px-4 sm:px-6">
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
                  onClick={() => {
                    setStarted(true);
                    setSlide(i);
                  }}
                  title={`Slayt ${i + 1}`}
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
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              {data.year} Özet Tablosu
            </span>
          </div>
        )}

        {/* Sağ Kontrol Kümesi */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Görünüm Modu Değiştirici: Story vs Bento */}
          <div className="flex items-center rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-0.5 backdrop-blur-md">
            <button
              type="button"
              onClick={() => setMode("story")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                mode === "story"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Layers className="h-3 w-3" />
              <span className="hidden sm:inline">Hikaye</span>
            </button>
            <button
              type="button"
              onClick={() => setMode("bento")}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                mode === "bento"
                  ? "bg-zinc-800 text-zinc-100 shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Grid className="h-3 w-3" />
              <span className="hidden sm:inline">Özet Kartı</span>
            </button>
          </div>

          {/* Oynat / Duraklat (Sadece Story Modunda) */}
          {mode === "story" && (
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-100"
              title={isPlaying ? "Durdur" : "Otomatik Oynat"}
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
            className="flex h-8 items-center gap-1.5 rounded-xl border border-zinc-700/80 bg-zinc-900/80 px-3 text-xs font-semibold text-zinc-200 shadow-sm transition-all hover:border-[var(--accent)]/50 hover:bg-zinc-800 hover:text-white"
          >
            <Share2 className="h-3 w-3 text-[var(--accent)]" />
            <span>Paylaş</span>
          </button>
        </div>
      </header>

      {/* ─── 2. MERKEZ KANVAS: HİKAYE (STORY) VEYA BENTO ÖZET ─── */}
      <main
        className="relative z-10 flex flex-1 items-center justify-center overflow-hidden p-2 sm:p-4"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {mode === "story" ? (
          /* ──────── STORY MODU SLAYTLARI ──────── */
          <div className="relative flex h-full max-h-[min(590px,calc(100dvh-165px))] w-full max-w-xl flex-col justify-between overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-900/50 p-5 sm:p-7 shadow-2xl backdrop-blur-2xl ring-1 ring-white/5">
            {/* Kart Üst Başlık */}
            <div className="flex items-center justify-between border-b border-zinc-800/40 pb-3">
              <div className="flex items-center gap-2.5">
                {data.avatarUrl ? (
                  <Image
                    src={data.avatarUrl}
                    alt={data.username}
                    width={28}
                    height={28}
                    unoptimized
                    className="rounded-full ring-1 ring-[var(--accent)]/40"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300">
                    {data.displayName[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-zinc-200">
                    {data.displayName}
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500">
                    @{data.username}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-md border border-[var(--accent-border)] bg-[var(--accent-bg)] px-2 py-0.5 text-[10px] font-mono font-bold text-[var(--accent)]">
                  {slide === 0 ? "BAŞLANGIÇ" : `${slide} / ${TOTAL_SLIDES - 1}`}
                </span>
              </div>
            </div>

            {/* Slayt İçerikleri */}
            <div className="my-auto flex flex-1 flex-col items-center justify-center py-2 text-center">
              {/* SLAYT 0: KAPAK */}
              {slide === 0 && (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300 max-w-md">
                  <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
                    <div
                      className="absolute inset-0 rounded-full animate-ping opacity-25"
                      style={{ backgroundColor: ac }}
                    />
                    {data.avatarUrl ? (
                      <Image
                        src={data.avatarUrl}
                        alt={data.username}
                        width={96}
                        height={96}
                        unoptimized
                        className="relative rounded-full shadow-2xl ring-4 ring-zinc-900"
                        style={{ outline: `3px solid ${ac}` }}
                      />
                    ) : (
                      <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-zinc-800 text-3xl font-black text-zinc-100 ring-4 ring-zinc-900">
                        {data.displayName[0]?.toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="inline-block rounded-full border border-zinc-700/60 bg-zinc-800/60 px-3 py-0.5 text-[11px] font-medium text-zinc-400">
                      Dev Analytics Yıllık Özeti
                    </span>
                    <h1 className="mt-2 text-4xl sm:text-5xl font-black tracking-tight text-white">
                      {data.year} <span style={{ color: ac }}>WRAPPED</span>
                    </h1>
                    <p className="mt-2 text-xs sm:text-sm text-zinc-400">
                      Bir yıl boyunca klavyenden çıkan her commit, çözdüğün her problem ve ulaştığın zirveler hazır!
                    </p>
                  </div>

                  {!started && (
                    <button
                      type="button"
                      onClick={() => {
                        setStarted(true);
                        setSlide(1);
                      }}
                      className="mt-3 inline-flex items-center gap-2 rounded-2xl px-6 py-2.5 text-xs sm:text-sm font-bold text-zinc-950 shadow-lg transition-transform active:scale-95"
                      style={{ backgroundColor: ac }}
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Yolculuğu Başlat</span>
                    </button>
                  )}
                </div>
              )}

              {/* SLAYT 1: COMMIT GÜCÜ */}
              {slide === 1 && (
                <div className="space-y-4 animate-in fade-in duration-300 max-w-md">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                    BU YILKİ TOPLAM ETKİN
                  </span>
                  <div className="py-2">
                    <p
                      className="text-6xl sm:text-7xl font-black tracking-tight"
                      style={{ color: ac }}
                    >
                      <CountUp value={data.totalCommits} active={slide === 1} />
                    </p>
                    <p className="mt-1 text-2xl font-bold text-zinc-100">
                      Commit Gönderdin!
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-4 text-xs text-zinc-400">
                    <span className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-1.5">
                      📅 <strong className="text-zinc-200">{data.activeDays}</strong> aktif gün
                    </span>
                    <span className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-1.5">
                      ⚡ Günde ort.{" "}
                      <strong className="text-zinc-200">
                        {(data.totalCommits / Math.max(data.activeDays, 1)).toFixed(1)}
                      </strong>{" "}
                      commit
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 italic">
                    {data.totalCommits > 300
                      ? "Klavyen bu yıl resmen alev aldı!"
                      : "Her commit ile projelerine değer kattın."}
                  </p>
                </div>
              )}

              {/* SLAYT 2: KOD HACMİ (LINES OF CODE) */}
              {slide === 2 && (
                <div className="space-y-4 animate-in fade-in duration-300 max-w-md w-full">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                    KOD HACMİN VE MATRİKSİN
                  </span>
                  <div className="grid grid-cols-2 gap-3 py-2">
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
                      <span className="text-xs font-semibold text-emerald-400">EKLENEN</span>
                      <p className="mt-1 text-3xl sm:text-4xl font-black text-emerald-400">
                        +<CountUp value={data.totalLinesAdded} active={slide === 2} />
                      </p>
                      <span className="text-[10px] text-zinc-500">satır kod</span>
                    </div>

                    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-center">
                      <span className="text-xs font-semibold text-red-400">SİLİNEN</span>
                      <p className="mt-1 text-3xl sm:text-4xl font-black text-red-400">
                        −<CountUp value={data.totalLinesDeleted} active={slide === 2} />
                      </p>
                      <span className="text-[10px] text-zinc-500">satır kod</span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400">
                    Net kod üretimi:{" "}
                    <strong className="text-zinc-100 font-mono">
                      {(data.totalLinesAdded - data.totalLinesDeleted).toLocaleString("tr-TR")}
                    </strong>{" "}
                    satır
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {data.totalLinesDeleted > data.totalLinesAdded * 0.35
                      ? "🧹 Kod tabanını temiz ve hafif tutmayı seviyorsun!"
                      : "🚀 Hız kesmeden yeni modüller inşa ettin!"}
                  </p>
                </div>
              )}

              {/* SLAYT 3: EN AKTİF AY */}
              {slide === 3 && (
                <div className="space-y-4 animate-in fade-in duration-300 max-w-md w-full">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                    ZİRVE YAPTIĞIN AY
                  </span>
                  <div>
                    <p className="text-4xl sm:text-5xl font-black" style={{ color: ac }}>
                      {data.peakMonth}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      Bu ay tam <strong className="text-zinc-100">{data.peakMonthCommits} commit</strong> ile fırtınalar estirdin.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 pt-4">
                    <MonthBarChart data={data.monthlyData} accentColor={ac} />
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Yıl boyunca motivasyonunun tavan yaptığı dönem!
                  </p>
                </div>
              )}

              {/* SLAYT 4: GELİŞTİRİCİ ARKETİPİ & DNA */}
              {slide === 4 && (
                <div className="space-y-3.5 animate-in fade-in duration-300 max-w-md">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                    SENİN GELİŞTİRİCİ KİŞİLİĞİN
                  </span>

                  <div
                    className="relative overflow-hidden rounded-3xl border p-5 shadow-xl text-center"
                    style={{
                      borderColor: `${data.archetype.color}44`,
                      background: `linear-gradient(145deg, ${data.archetype.color}15 0%, rgba(24,24,27,0.7) 100%)`,
                    }}
                  >
                    <span
                      className="inline-block rounded-full px-3 py-1 font-mono text-[10px] font-bold tracking-wider"
                      style={{
                        backgroundColor: `${data.archetype.color}25`,
                        color: data.archetype.color,
                        border: `1px solid ${data.archetype.color}50`,
                      }}
                    >
                      {data.archetype.badge}
                    </span>

                    <h2
                      className="mt-2 text-2xl sm:text-3xl font-black tracking-tight"
                      style={{ color: data.archetype.color }}
                    >
                      {data.archetype.title}
                    </h2>
                    <p className="mt-1 text-xs font-medium text-zinc-300">
                      &ldquo;{data.archetype.tagline}&rdquo;
                    </p>
                    <p className="mt-2 text-[11px] text-zinc-400 leading-relaxed">
                      {data.archetype.desc}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-left">
                    <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5">
                      <Calendar className="h-4 w-4 text-zinc-500" />
                      <div>
                        <span className="block text-[10px] text-zinc-500">En Üretken Gün</span>
                        <span className="text-xs font-bold text-zinc-200">{data.peakDay}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5">
                      <Clock className="h-4 w-4 text-zinc-500" />
                      <div>
                        <span className="block text-[10px] text-zinc-500">En Aktif Saat</span>
                        <span className="text-xs font-bold text-zinc-200">
                          {String(data.peakHour).padStart(2, "0")}:00
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SLAYT 5: TOP DİLLER & TEKNOLOJİ */}
              {slide === 5 && (
                <div className="space-y-4 animate-in fade-in duration-300 max-w-md w-full">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                    FAVORİ PROGRAMLAMA DİLLERİN
                  </span>

                  {data.topLangs.length === 0 ? (
                    <p className="text-xs text-zinc-500">Dil verisi bulunamadı.</p>
                  ) : (
                    <div className="space-y-2.5 text-left w-full">
                      {data.topLangs.map((l, i) => (
                        <div key={l.lang} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span
                                className="font-mono text-xs font-bold"
                                style={{ color: i === 0 ? ac : "#71717a" }}
                              >
                                #{i + 1}
                              </span>
                              <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ backgroundColor: l.color }}
                              />
                              <span
                                className={`font-medium ${
                                  i === 0 ? "text-zinc-100 font-semibold" : "text-zinc-300"
                                }`}
                              >
                                {l.lang}
                              </span>
                            </div>
                            <span className="font-mono text-xs text-zinc-400">
                              %{l.pct}
                            </span>
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
                  )}

                  <p className="text-[11px] text-zinc-500">
                    {data.topLangs[0]
                      ? `Bu yıl ana silahın: ${data.topLangs[0].lang} (%${data.topLangs[0].pct})`
                      : "Farklı teknolojilerle projeler ürettin."}
                  </p>
                </div>
              )}

              {/* SLAYT 6: PROJELER & REPOLAR */}
              {slide === 6 && (
                <div className="space-y-4 animate-in fade-in duration-300 max-w-md w-full">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                    PROJELER & REPO EKOSİSTEMİ
                  </span>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 text-center">
                      <span className="text-[10px] text-zinc-500">YENİ AÇILAN</span>
                      <p className="text-2xl font-black" style={{ color: ac }}>
                        <CountUp value={data.reposCreated} active={slide === 6} />
                      </p>
                      <span className="text-[10px] text-zinc-600">repo</span>
                    </div>

                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 text-center">
                      <span className="text-[10px] text-zinc-500">AKTİF GELİŞTİRİLEN</span>
                      <p className="text-2xl font-black text-zinc-100">
                        <CountUp value={data.activeRepos} active={slide === 6} />
                      </p>
                      <span className="text-[10px] text-zinc-600">repo</span>
                    </div>

                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 text-center">
                      <span className="text-[10px] text-zinc-500">PULL REQUEST</span>
                      <p className="text-2xl font-black text-purple-400">
                        <CountUp value={data.totalPRs} active={slide === 6} />
                      </p>
                      <span className="text-[10px] text-zinc-600">
                        ({data.mergedPRs} merged)
                      </span>
                    </div>

                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-3 text-center">
                      <span className="text-[10px] text-zinc-500">TOPLAM YILDIZ</span>
                      <p className="text-2xl font-black text-amber-400">
                        <CountUp value={data.totalStars} active={slide === 6} />
                      </p>
                      <span className="text-[10px] text-zinc-600">stars</span>
                    </div>
                  </div>

                  {data.topRepo && (
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 text-left">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                          <FolderGit2 className="h-3.5 w-3.5 text-emerald-400" />
                          <span>{data.topRepo.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {data.topRepo.commits} commit
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-zinc-400">
                        Bu yıl en çok emek verdiğin ana projen!
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* SLAYT 7: EN BÜYÜK COMMİT */}
              {slide === 7 && (
                <div className="space-y-4 animate-in fade-in duration-300 max-w-md w-full">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                    TEK SEFERDE EN BÜYÜK DEĞİŞİKLİK
                  </span>

                  {data.biggestCommit ? (
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4 text-left space-y-3">
                      <p className="text-sm font-medium text-zinc-200 leading-snug">
                        &ldquo;{data.biggestCommit.message || "(mesajsız commit)"}&rdquo;
                      </p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="font-semibold text-emerald-400">
                          +{data.biggestCommit.additions.toLocaleString("tr-TR")} satır
                        </span>
                        <span className="font-semibold text-red-400">
                          −{data.biggestCommit.deletions.toLocaleString("tr-TR")} satır
                        </span>
                      </div>
                      <span className="block font-mono text-[10px] text-zinc-500">
                        {data.biggestCommit.date}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500">Satır verisi olan commit bulunamadı.</p>
                  )}

                  <p className="text-xs text-zinc-400">
                    Tek bir git push ile binlerce satırlık fark yarattın! 💥
                  </p>
                </div>
              )}

              {/* SLAYT 8: 365 GÜNLÜK MOZAİK (HEATMAP) */}
              {slide === 8 && (
                <div className="space-y-4 animate-in fade-in duration-300 max-w-md w-full">
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
                    365 GÜNLÜK KONTRIBÜSYON MATRİKSİ
                  </span>

                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3">
                    <CompactHeatmap
                      dates={data.heatmapDates}
                      maxCount={data.maxDayCount}
                      accentColor={ac}
                      year={data.year}
                    />
                  </div>

                  <div className="flex items-center justify-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Flame className="h-4 w-4 text-amber-400" />
                      <span>
                        En Uzun Seri:{" "}
                        <strong className="text-zinc-100">{data.longestStreak} Gün</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      <span>
                        Aktiflik:{" "}
                        <strong className="text-zinc-100">
                          %{Math.round((data.activeDays / 365) * 100)}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* SLAYT 9: BÜYÜK FİNAL & ÖZET KARTI */}
              {slide === 9 && (
                <div className="space-y-4 animate-in fade-in duration-300 max-w-md w-full">
                  <div>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-400">
                      🎉 2026 TAMAMLANDI!
                    </span>
                    <h2 className="mt-2 text-3xl font-black text-white">
                      Tebrikler, {data.displayName}!
                    </h2>
                    <p className="mt-1 text-xs text-zinc-400">
                      Bu yıl harika işler başardın. İşte senin gurur karnen:
                    </p>
                  </div>

                  {/* Özet Bento Mini */}
                  <div
                    className="rounded-2xl border p-3.5 space-y-2 text-xs text-left"
                    style={{ borderColor: data.accentBorder, backgroundColor: ab }}
                  >
                    <div className="flex justify-between border-b border-zinc-800/60 pb-1.5">
                      <span className="text-zinc-400">Geliştirici Rolü</span>
                      <strong className="text-zinc-100">{data.archetype.title}</strong>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800/60 pb-1.5">
                      <span className="text-zinc-400">Toplam Commit</span>
                      <strong className="text-zinc-100 font-mono">
                        {data.totalCommits.toLocaleString("tr-TR")}
                      </strong>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800/60 pb-1.5">
                      <span className="text-zinc-400">En Uzun Seri</span>
                      <strong className="text-zinc-100">{data.longestStreak} gün</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Ana Teknoloji</span>
                      <strong className="text-zinc-100">
                        {data.topLangs[0]?.lang ?? "Code"}
                      </strong>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShareModalOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-zinc-950 shadow-md transition-transform active:scale-95"
                      style={{ backgroundColor: ac }}
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      <span>Sosyal Medyada Paylaş</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadSlidePng(9)}
                      disabled={sharing}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800/80 px-3.5 py-2 text-xs font-medium text-zinc-200 transition-colors hover:bg-zinc-700 disabled:opacity-50"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>PNG İndir</span>
                    </button>
                    <button
                      type="button"
                      onClick={fireConfetti}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2 text-xs text-zinc-400 hover:text-white"
                      title="Tekrar konfeti patlat"
                    >
                      🎊
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Kart Alt Çubuğu */}
            <div className="flex items-center justify-between border-t border-zinc-800/40 pt-2.5 text-[11px] text-zinc-500">
              <span className="font-mono">devanalytics.app/wrapped</span>
              <button
                type="button"
                onClick={() => downloadSlidePng(slide)}
                disabled={sharing}
                className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors disabled:opacity-50"
                title="Bu anı görsel olarak indir"
              >
                <Download className="h-3 w-3" />
                <span className="hidden sm:inline">Görsel Olarak İndir</span>
              </button>
            </div>
          </div>
        ) : (
          /* ──────── TEK SAYFA BENTO ÖZET MODU (TÜM İSTATİSTİKLER) ──────── */
          <div className="grid h-full max-h-[min(590px,calc(100dvh-165px))] w-full max-w-4xl grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Kutu 1: Profil & Arketip (2 Kolon) */}
            <div className="col-span-2 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3.5 backdrop-blur-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                {data.avatarUrl ? (
                  <Image
                    src={data.avatarUrl}
                    alt={data.username}
                    width={48}
                    height={48}
                    unoptimized
                    className="rounded-full ring-2 ring-[var(--accent)]/40"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-lg font-bold text-white">
                    {data.displayName[0]?.toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">
                    {data.displayName}
                  </h3>
                  <span className="text-[11px] font-mono text-zinc-400">
                    @{data.username}
                  </span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span
                      className="rounded-md px-1.5 py-0.5 text-[10px] font-mono font-bold"
                      style={{
                        backgroundColor: `${data.archetype.color}20`,
                        color: data.archetype.color,
                        border: `1px solid ${data.archetype.color}40`,
                      }}
                    >
                      {data.archetype.badge}
                    </span>
                    <span className="text-[11px] text-zinc-300 font-medium">
                      {data.archetype.title}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="rounded-xl border border-zinc-700/60 bg-zinc-800/80 px-2.5 py-1 text-xs font-black text-white">
                  {data.year}
                </span>
              </div>
            </div>

            {/* Kutu 2: Commit Hacmi */}
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3 backdrop-blur-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-[10px] font-semibold uppercase">Toplam Commit</span>
                <GitCommit className="h-3.5 w-3.5 text-[var(--accent)]" />
              </div>
              <div>
                <p className="text-2xl font-black" style={{ color: ac }}>
                  {data.totalCommits.toLocaleString("tr-TR")}
                </p>
                <span className="text-[10px] text-zinc-500">
                  {data.activeDays} aktif gün
                </span>
              </div>
            </div>

            {/* Kutu 3: Kod Satırları */}
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3 backdrop-blur-xl flex flex-col justify-between">
              <span className="text-[10px] font-semibold uppercase text-zinc-500">Kod Satırları</span>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-emerald-400">
                  +{data.totalLinesAdded.toLocaleString("tr-TR")} satır
                </p>
                <p className="text-xs font-semibold text-red-400">
                  −{data.totalLinesDeleted.toLocaleString("tr-TR")} satır
                </p>
              </div>
            </div>

            {/* Kutu 4: En Uzun Seri (Streak) */}
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3 backdrop-blur-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-[10px] font-semibold uppercase">En Uzun Seri</span>
                <Flame className="h-3.5 w-3.5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-amber-400">
                  {data.longestStreak} Gün
                </p>
                <span className="text-[10px] text-zinc-500">kesintisiz kod</span>
              </div>
            </div>

            {/* Kutu 5: Ana Dil */}
            <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3 backdrop-blur-xl flex flex-col justify-between">
              <span className="text-[10px] font-semibold uppercase text-zinc-500">Ana Dil</span>
              <div>
                <p className="text-lg font-bold text-zinc-100 truncate">
                  {data.topLangs[0]?.lang ?? "Bilinmiyor"}
                </p>
                <span className="text-[10px] text-zinc-400 font-mono">
                  %{data.topLangs[0]?.pct ?? 0} pay
                </span>
              </div>
            </div>

            {/* Kutu 6: Zirve Ay & Ritim (2 Kolon) */}
            <div className="col-span-2 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3 backdrop-blur-xl flex flex-col justify-between">
              <div className="flex items-center justify-between text-zinc-500">
                <span className="text-[10px] font-semibold uppercase">
                  Zirve: {data.peakMonth} ({data.peakMonthCommits} commit)
                </span>
                <span className="text-[10px] text-zinc-400">
                  {data.peakDay} · {String(data.peakHour).padStart(2, "0")}:00
                </span>
              </div>
              <div className="py-1">
                <MonthBarChart data={data.monthlyData} accentColor={ac} />
              </div>
            </div>

            {/* Kutu 7: Projeler & PRlar (2 Kolon) */}
            <div className="col-span-2 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3 backdrop-blur-xl flex items-center justify-around text-center">
              <div>
                <span className="block text-[10px] text-zinc-500">YENİ REPO</span>
                <strong className="text-base font-bold text-white">{data.reposCreated}</strong>
              </div>
              <div className="h-6 w-px bg-zinc-800" />
              <div>
                <span className="block text-[10px] text-zinc-500">AKTİF REPO</span>
                <strong className="text-base font-bold text-white">{data.activeRepos}</strong>
              </div>
              <div className="h-6 w-px bg-zinc-800" />
              <div>
                <span className="block text-[10px] text-zinc-500">PULL REQUEST</span>
                <strong className="text-base font-bold text-purple-400">
                  {data.totalPRs} ({data.mergedPRs} merged)
                </strong>
              </div>
              <div className="h-6 w-px bg-zinc-800" />
              <div>
                <span className="block text-[10px] text-zinc-500">YILDIZLAR</span>
                <strong className="text-base font-bold text-amber-400">{data.totalStars}</strong>
              </div>
            </div>

            {/* Kutu 8: Yıllık Mini Mozaik (2 Kolon) */}
            <div className="col-span-2 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-3 backdrop-blur-xl flex flex-col justify-between">
              <span className="text-[10px] font-semibold uppercase text-zinc-500">
                Kontribüsyon Mozaiği ({data.activeDays} Gün Aktif)
              </span>
              <div className="py-1">
                <CompactHeatmap
                  dates={data.heatmapDates}
                  maxCount={data.maxDayCount}
                  accentColor={ac}
                  year={data.year}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ─── 3. ALT GEZİNME ÇUBUĞU (FOOTER) ─── */}
      <footer className="relative z-20 flex h-14 shrink-0 items-center justify-between border-t border-zinc-800/40 px-4 sm:px-6">
        {mode === "story" ? (
          <>
            <button
              type="button"
              onClick={() => setSlide((s) => Math.max(0, s - 1))}
              disabled={slide === 0}
              className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/50 px-3.5 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white disabled:opacity-25 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Geri</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-zinc-500">
                {slide + 1} / {TOTAL_SLIDES}
              </span>
              <span className="hidden sm:inline text-[11px] text-zinc-600">
                · Klavye ok tuşları ile geçiş yapabilirsiniz
              </span>
            </div>

            {slide === TOTAL_SLIDES - 1 ? (
              <button
                type="button"
                onClick={() => {
                  setSlide(0);
                  setStarted(true);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-700"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Tekrar İzle</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setStarted(true);
                  setSlide((s) => Math.min(TOTAL_SLIDES - 1, s + 1));
                }}
                className="flex items-center gap-1 rounded-xl px-4 py-1.5 text-xs font-bold text-zinc-950 shadow-md transition-transform active:scale-95"
                style={{ backgroundColor: ac }}
              >
                <span>İleri</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </>
        ) : (
          <div className="flex w-full items-center justify-between">
            <span className="text-xs text-zinc-500">
              Tüm yılın geliştirici metrikleri tek bir karede.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => downloadSlidePng(9)}
                disabled={sharing}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-white disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Kartı İndir</span>
              </button>
              <button
                type="button"
                onClick={() => setShareModalOpen(true)}
                className="flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold text-zinc-950"
                style={{ backgroundColor: ac }}
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>Paylaş</span>
              </button>
            </div>
          </div>
        )}
      </footer>

      {/* ─── 4. SOSYAL MEDYA PAYLAŞIM MODALI ─── */}
      {shareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setShareModalOpen(false)}
          />

          {/* Modal Panel */}
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
                <span>1080x1080 Story Görseli İndir (PNG)</span>
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 py-2.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-zinc-700 hover:text-white"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-400" />
                    <span className="text-emerald-400">Bağlantı Kopyalandı!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-zinc-400" />
                    <span>Wrapped Bağlantısını Kopyala</span>
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
