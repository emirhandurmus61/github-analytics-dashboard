"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play, Pause, Download, Link2, Check, X, Rows3, Clapperboard, ChevronsUpDown } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useUIPrefs } from "@/components/ui-prefs";
import { Portal } from "@/components/ui/primitives";
import { useOrigin, useMediaQuery } from "@/lib/ui/hooks";
import { fmtInt, cn, type Lang } from "@/lib/ui/format";
import { type WrappedData, TOTAL, YEARS, Frame } from "./wrapped-parts";
import { buildSlides } from "./wrapped-slides";

export default function WrappedClient({ data }: { data: WrappedData; isOwner?: boolean }) {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const T = (tr: string, en: string) => (l === "en" ? en : tr);
  const { prefs } = useUIPrefs();
  const origin = useOrigin();
  const wide = useMediaQuery("(min-width: 640px)", true);
  const [slide, setSlide] = useState(0);
  const [mode, setMode] = useState<"story" | "poster">("story");
  const [playing, setPlaying] = useState(false);
  const [share, setShare] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const confettiDone = useRef(false);

  const arch = l === "en" && data.archetype.en ? data.archetype.en : data.archetype;
  const peakMonthIdx = data.peakMonthIdx ?? data.monthlyData.reduce((a, m, i, arr) => (m.commits > arr[a].commits ? i : a), 0);
  const peakDayIdx = data.peakDayIdx ?? 0;
  const perDay = data.activeDays ? data.totalCommits / data.activeDays : 0;
  const url = `${origin}/u/${data.username}/${data.year}`;

  const go = useCallback((d: number) => setSlide((s) => Math.max(0, Math.min(TOTAL - 1, s + d))), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (share || mode !== "story") return;
      const t = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA"].includes(t.tagName)) return;
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, share, mode]);

  useEffect(() => {
    if (!playing || mode !== "story") return;
    const t = setInterval(() => setSlide((s) => (s >= TOTAL - 1 ? s : s + 1)), 5200);
    return () => clearInterval(t);
  }, [playing, mode]);

  // One burst of confetti on the finale, tinted with the live accent.
  useEffect(() => {
    if (slide !== TOTAL - 1 || confettiDone.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || prefs.motion === "reduced") return;
    confettiDone.current = true;
    const accent = stageRef.current ? getComputedStyle(stageRef.current).getPropertyValue("--accent").trim() : "";
    import("canvas-confetti").then(({ default: confetti }) => {
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 }, colors: [accent || "#5fd396", "#ffffff"], disableForReducedMotion: true });
    });
  }, [slide, prefs.motion]);

  const touchX = useRef<number | null>(null);

  async function savePng(i = slide) {
    setSaving(true);
    try {
      const res = await fetch(`/api/wrapped-slide/${data.username}/${data.year}/${i}`);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${data.username}-${data.year}-wrapped-${i + 1}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setSaving(false);
    }
  }

  const slides = buildSlides({
    data, l, T, arch, peakMonthIdx, peakDayIdx, perDay, wide, saving,
    onShare: () => setShare(true),
    onSavePng: (i) => void savePng(i),
    onRestart: () => setSlide(0),
  });

  const controls = (
    <div className="flex items-center gap-1">
      <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => setPlaying((p) => !p)} aria-label={playing ? T("Duraklat", "Pause") : T("Oynat", "Play")} disabled={mode !== "story"}>
        {playing ? <Pause /> : <Play />}
      </button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setMode((m) => (m === "story" ? "poster" : "story"))} aria-pressed={mode === "poster"}>
        {mode === "story" ? <Rows3 /> : <Clapperboard />}
        <span className="hidden sm:inline">{mode === "story" ? T("Tek sayfa", "One page") : T("Hikâye", "Story")}</span>
      </button>
      <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => savePng()} disabled={saving} aria-label={T("Bu slaytı PNG indir", "Download this slide as PNG")}>
        <Download />
      </button>
      <button type="button" className="btn btn-sm" onClick={() => setShare(true)}>
        <Link2 /> {T("Paylaş", "Share")}
      </button>
    </div>
  );

  return (
    <div ref={stageRef} className="flex flex-col">
      {/* Top bar: year switcher, progress, controls */}
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="relative">
          <button type="button" className="btn btn-sm font-mono" onClick={() => setYearOpen((v) => !v)} aria-expanded={yearOpen}>
            wrapped/{data.year} <ChevronsUpDown className="!h-3 !w-3 text-ink-4" />
          </button>
          {yearOpen && (
            <div className="absolute left-0 top-full z-30 mt-1.5 w-40 surface-pop p-1 anim-pop">
              {YEARS.map((y) => (
                <Link key={y} href={`/u/${data.username}/${y}`} className={cn("flex h-8 items-center rounded-[var(--r-control)] px-2 font-mono text-[12.5px]", y === data.year ? "bg-raised text-ink" : "text-ink-2 hover:bg-raised")} onClick={() => setYearOpen(false)}>
                  {y}
                </Link>
              ))}
            </div>
          )}
        </div>
        {mode === "story" && (
          <div className="order-last flex w-full gap-1 sm:order-none sm:w-auto sm:flex-1" role="tablist" aria-label={T("Slaytlar", "Slides")}>
            {slides.map((s, i) => (
              <button key={i} type="button" role="tab" aria-selected={i === slide} aria-label={`${i + 1}. ${s.kicker}`} onClick={() => setSlide(i)} className="group flex-1 py-2">
                <span className="block h-[3px] rounded-full" style={{ background: i <= slide ? "var(--accent)" : "var(--bg-3)", opacity: i < slide ? 0.55 : 1 }} />
              </button>
            ))}
          </div>
        )}
        <div className="ml-auto">{controls}</div>
      </div>

      {mode === "story" ? (
        <div
          className="relative min-h-[calc(100dvh-180px)] md:min-h-[calc(100dvh-140px)] select-none overflow-hidden"
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = touchX.current - e.changedTouches[0].clientX;
            if (Math.abs(dx) > 40) go(dx > 0 ? 1 : -1);
            touchX.current = null;
          }}
        >
          <div key={slide} className="absolute inset-0 pb-14 anim-rise md:pb-0">
            <Frame n={slide} kicker={slides[slide].kicker} foot={slides[slide].foot}>
              {slides[slide].body(true)}
            </Frame>
          </div>
          {/* Click zones */}
          <button type="button" aria-label={T("Önceki", "Previous")} onClick={() => go(-1)} disabled={slide === 0} className="absolute left-0 top-1/2 hidden -translate-y-1/2 p-3 text-ink-4 hover:text-ink disabled:opacity-0 md:block">
            <ChevronLeft size={28} strokeWidth={1.5} />
          </button>
          <button type="button" aria-label={T("Sonraki", "Next")} onClick={() => go(1)} disabled={slide === TOTAL - 1} className="absolute right-0 top-1/2 hidden -translate-y-1/2 p-3 text-ink-4 hover:text-ink disabled:opacity-0 md:block">
            <ChevronRight size={28} strokeWidth={1.5} />
          </button>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2 md:hidden">
            <button type="button" className="btn btn-sm btn-icon" onClick={() => go(-1)} disabled={slide === 0} aria-label={T("Önceki", "Previous")}>
              <ChevronLeft />
            </button>
            <button type="button" className="btn btn-sm btn-icon" onClick={() => go(1)} disabled={slide === TOTAL - 1} aria-label={T("Sonraki", "Next")}>
              <ChevronRight />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          {slides.map((s, i) => (
            <section key={i} className="min-h-[80vh] border-b border-line">
              <Frame n={i} kicker={s.kicker} foot={s.foot}>
                {s.body(true)}
              </Frame>
            </section>
          ))}
        </div>
      )}

      {share && (
        <Portal>
          <div className="fixed inset-0 z-[85] flex items-end justify-center sm:items-center sm:p-4">
            <div className="absolute inset-0 bg-[var(--scrim)] anim-fade" onClick={() => setShare(false)} />
            <div role="dialog" aria-modal className="relative w-full max-w-md surface-pop rounded-b-none sm:rounded-b-[calc(var(--r-panel)+2px)] p-4 pb-[calc(env(safe-area-inset-bottom)+16px)] anim-sheet sm:anim-pop">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[14px] font-semibold text-ink">{T(`${data.year} Wrapped'ini paylaş`, `Share your ${data.year} Wrapped`)}</h3>
                <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => setShare(false)} aria-label={T("Kapat", "Close")}>
                  <X />
                </button>
              </div>
              <div className="flex items-stretch gap-2">
                <code className="flex-1 truncate rounded-[var(--r-control)] border border-line bg-canvas px-3 py-2 font-mono text-[12px] text-ink-2">{url}</code>
                <button
                  type="button"
                  className="btn"
                  onClick={() =>
                    navigator.clipboard.writeText(url).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 1600);
                    })
                  }
                >
                  {copied ? <Check className="text-good" /> : <Link2 />}
                  {copied ? T("Kopyalandı", "Copied") : T("Kopyala", "Copy")}
                </button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <a
                  className="btn"
                  target="_blank"
                  rel="noopener noreferrer"
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    T(`${data.year}: ${fmtInt(data.totalCommits, l)} commit, ${data.longestStreak} günlük en uzun seri. Rolüm: ${arch.title}`, `${data.year}: ${fmtInt(data.totalCommits, l)} commits, ${data.longestStreak}-day best streak. Archetype: ${arch.title}`),
                  )}&url=${encodeURIComponent(url)}`}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.726-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  {T("X'te paylaş", "Post on X")}
                </a>
                <button type="button" className="btn" onClick={() => savePng(slide)} disabled={saving}>
                  <Download /> {T(`Slayt ${slide + 1} PNG`, `Slide ${slide + 1} PNG`)}
                </button>
              </div>
              <p className="mt-3 text-[12px] text-ink-3">{T("Her slayt paylaşım için ayrı bir görsel olarak indirilebilir.", "Every slide can be downloaded as its own image for sharing.")}</p>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
