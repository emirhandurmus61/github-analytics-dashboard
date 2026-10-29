"use client";

import { useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Play, Pause, Download, Link2, Check, X, Rows3, Clapperboard, ChevronsUpDown } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useUIPrefs } from "@/components/ui-prefs";
import { Kbd, Portal } from "@/components/ui/primitives";
import { DiffSquares } from "@/app/dashboard/code-stats";
import { langColor } from "@/lib/ui/lang-colors";
import { useOrigin, useMediaQuery } from "@/lib/ui/hooks";
import { MONTHS_LONG, MONTHS_SHORT, fmtCompact, fmtInt, fmtDay, cn, type Lang } from "@/lib/ui/format";
import { WrappedData, TOTAL, YEARS, Count, Frame, Months, YearGrid } from "./wrapped-parts";

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

  const slides: { kicker: string; body: (active: boolean) => ReactNode; foot?: ReactNode }[] = [
    {
      kicker: `devboard wrapped --year ${data.year}`,
      body: () => (
        <div>
          <p className="font-mono text-[13px] text-ink-3 sm:text-[15px]">
            <span className="text-accent">❯</span> git log --author={data.username} --since={data.year}-01-01
          </p>
          <h1 className="mt-6 font-mono text-[clamp(88px,22vw,280px)] font-[800] leading-[0.82] tracking-[-0.06em] text-ink num">{data.year}</h1>
          <p className="mt-6 max-w-[34ch] text-[20px] font-semibold leading-snug text-ink sm:text-[26px]">
            {T(`${data.displayName} için bir yıl, commit commit.`, `${data.displayName}'s year, one commit at a time.`)}
          </p>
        </div>
      ),
      foot: <span className="inline-flex items-center gap-2">{T("İlerlemek için", "Press")} <Kbd>→</Kbd> {T("ya da kaydır", "or swipe to continue")}</span>,
    },
    {
      kicker: T("toplam commit", "total commits"),
      body: (a) => (
        <div>
          <div className="text-[clamp(96px,24vw,300px)] font-[800] leading-[0.85] tracking-[-0.05em] text-accent num">
            <Count value={data.totalCommits} active={a} l={l} />
          </div>
          <p className="mt-6 text-[20px] font-semibold text-ink sm:text-[26px]">{T(`commit, ${data.activeDays} farklı günde.`, `commits, across ${data.activeDays} different days.`)}</p>
        </div>
      ),
      foot: T(`Aktif bir günde ortalama ${perDay.toFixed(1)} commit.`, `About ${perDay.toFixed(1)} commits on an active day.`),
    },
    {
      kicker: "git diff --shortstat",
      body: (a) => (
        <div>
          <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2 font-mono font-[800] leading-[0.9] tracking-[-0.05em] num">
            <span className="text-[clamp(56px,13vw,170px)] text-good">+<Count value={data.totalLinesAdded} active={a} l={l} /></span>
            <span className="text-[clamp(40px,9vw,120px)] text-bad">−<Count value={data.totalLinesDeleted} active={a} l={l} /></span>
          </div>
          <div className="mt-8">
            <DiffSquares add={data.totalLinesAdded} del={data.totalLinesDeleted} n={20} size={wide ? 18 : 12} />
          </div>
          <p className="mt-6 text-[18px] text-ink-2 sm:text-[22px]">
            {T(`Net ${data.totalLinesAdded >= data.totalLinesDeleted ? "+" : "−"}${fmtInt(Math.abs(data.totalLinesAdded - data.totalLinesDeleted), l)} satır.`, `Net ${data.totalLinesAdded >= data.totalLinesDeleted ? "+" : "−"}${fmtInt(Math.abs(data.totalLinesAdded - data.totalLinesDeleted), l)} lines.`)}
          </p>
        </div>
      ),
    },
    {
      kicker: T("en yoğun ay", "busiest month"),
      body: () => (
        <div>
          <h2 className="text-[clamp(56px,11vw,140px)] font-[800] leading-[0.9] tracking-[-0.04em] text-ink">{MONTHS_LONG[l][peakMonthIdx]}</h2>
          <p className="mt-3 text-[18px] text-ink-2 sm:text-[22px]">{T(`${fmtInt(data.peakMonthCommits, l)} commit ile yılın zirvesi.`, `The peak of the year with ${fmtInt(data.peakMonthCommits, l)} commits.`)}</p>
          <div className="mt-10">
            <Months data={data.monthlyData} peak={peakMonthIdx} l={l} big />
          </div>
        </div>
      ),
    },
    {
      kicker: T("çalışma kimliğin", "how you work"),
      body: () => (
        <div>
          <div className="font-mono text-[13px] text-accent">{arch.badge}</div>
          <h2 className="mt-3 max-w-[16ch] text-[clamp(48px,9vw,120px)] font-[800] leading-[0.92] tracking-[-0.04em] text-ink">{arch.title}</h2>
          <p className="mt-5 max-w-[48ch] text-[18px] leading-relaxed text-ink-2 sm:text-[21px]">{arch.tagline}</p>
          <dl className="mt-10 grid max-w-xl grid-cols-2 gap-6 sm:grid-cols-3">
            <div>
              <dt className="text-[13px] text-ink-3">{T("en yoğun gün", "busiest day")}</dt>
              <dd className="mt-1 text-[24px] font-bold text-ink">{l === "en" ? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][peakDayIdx] ?? data.peakDay : data.peakDay}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-ink-3">{T("en yoğun saat", "busiest hour")}</dt>
              <dd className="mt-1 font-mono text-[24px] font-bold text-ink num">{String(data.peakHour).padStart(2, "0")}:00</dd>
            </div>
            <div>
              <dt className="text-[13px] text-ink-3">{T("en uzun seri", "longest streak")}</dt>
              <dd className="mt-1 text-[24px] font-bold text-ink">
                {data.longestStreak} <span className="text-[15px] font-normal text-ink-3">{T("gün", "days")}</span>
              </dd>
            </div>
          </dl>
        </div>
      ),
    },
    {
      kicker: T("dillerin", "your languages"),
      body: () => (
        <div>
          {data.topLangs[0] ? (
            <>
              <div className="font-mono text-[14px] text-ink-3">#1</div>
              <h2 className="text-[clamp(64px,14vw,180px)] font-[800] leading-[0.88] tracking-[-0.05em]" style={{ color: langColor(data.topLangs[0].lang) }}>
                {data.topLangs[0].lang}
              </h2>
              <div className="mt-8 flex h-4 w-full max-w-3xl overflow-hidden rounded-full gap-[2px] bg-inset">
                {data.topLangs.map((x) => (
                  <span key={x.lang} style={{ width: `${x.pct}%`, background: langColor(x.lang) }} />
                ))}
              </div>
              <ol className="mt-6 grid max-w-3xl gap-x-8 gap-y-2 sm:grid-cols-2">
                {data.topLangs.map((x, i) => (
                  <li key={x.lang} className="flex items-baseline gap-3 text-[17px]">
                    <span className="w-6 font-mono text-[13px] text-ink-4">{i + 1}</span>
                    <span className="text-ink">{x.lang}</span>
                    <span className="ml-auto font-mono text-ink-3 num">{x.pct}%</span>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <p className="text-[22px] text-ink-2">{T("Bu yıl dil verisi yok.", "No language data this year.")}</p>
          )}
        </div>
      ),
    },
    {
      kicker: T("repolar ve işbirliği", "repos and collaboration"),
      body: (a) => (
        <div className="grid max-w-4xl grid-cols-2 gap-x-10 gap-y-10 sm:grid-cols-4">
          {[
            [data.reposCreated, T("yeni repo", "new repos")],
            [data.activeRepos, T("aktif repo", "active repos")],
            [data.mergedPRs, T("birleşen PR", "merged PRs")],
            [data.totalStars, T("yıldız", "stars")],
          ].map(([v, k]) => (
            <div key={k as string}>
              <div className="text-[clamp(56px,9vw,112px)] font-[800] leading-none tracking-[-0.05em] text-ink num">
                <Count value={v as number} active={a} l={l} />
              </div>
              <div className="mt-3 text-[16px] text-ink-3">{k}</div>
            </div>
          ))}
          {data.topRepo && (
            <div className="col-span-2 sm:col-span-4 border-t border-line pt-6 text-[18px] text-ink-2">
              {T("En çok commit:", "Most commits:")} <span className="font-mono text-ink">{data.topRepo.name}</span> · <span className="font-mono num">{fmtInt(data.topRepo.commits, l)}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      kicker: "git show --stat HEAD~big",
      body: () =>
        data.biggestCommit ? (
          <div className="max-w-4xl rounded-panel border border-line bg-surface p-5 font-mono sm:p-8">
            <div className="text-[13px] text-ink-3">
              commit · <span className="text-ink-2">{fmtDay(data.biggestCommit.date, l, { day: "numeric", month: "long", year: "numeric" })}</span>
            </div>
            <p className="mt-4 text-[clamp(22px,4vw,40px)] font-semibold leading-tight text-ink">{data.biggestCommit.message || T("(mesaj yok)", "(no message)")}</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[clamp(26px,5vw,52px)] font-[800] num">
              <span className="text-good">+{fmtInt(data.biggestCommit.additions, l)}</span>
              <span className="text-bad">−{fmtInt(data.biggestCommit.deletions, l)}</span>
              <DiffSquares add={data.biggestCommit.additions} del={data.biggestCommit.deletions} n={10} size={14} />
            </div>
          </div>
        ) : (
          <p className="text-[22px] text-ink-2">{T("Bu yıl satır bilgisi olan commit yok.", "No commits with line stats this year.")}</p>
        ),
      foot: T("Tek seferde en çok değişen commit.", "The commit that changed the most at once."),
    },
    {
      kicker: T(`${data.year} katkı haritası`, `${data.year} contributions`),
      body: () => (
        <div className="w-full">
          <YearGrid year={data.year} dates={data.heatmapDates} max={data.maxDayCount} />
          <div className="mt-6 flex flex-wrap items-baseline gap-x-8 gap-y-2 text-[17px] text-ink-2">
            <span>
              <span className="font-mono text-[28px] font-bold text-ink num">{data.activeDays}</span> {T("aktif gün", "active days")}
            </span>
            <span>
              <span className="font-mono text-[28px] font-bold text-ink num">{Math.round((data.activeDays / 365) * 100)}%</span> {T("yılın", "of the year")}
            </span>
          </div>
        </div>
      ),
    },
    {
      kicker: T("özet", "summary"),
      body: () => (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
          <div>
            <div className="font-mono text-[14px] text-ink-3">@{data.username} · {data.year}</div>
            <h2 className="mt-3 text-[clamp(48px,8vw,104px)] font-[800] leading-[0.9] tracking-[-0.04em] text-ink">{arch.title}</h2>
            <div className="mt-8 flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary btn-lg" onClick={() => setShare(true)}>
                <Link2 /> {T("Paylaş", "Share")}
              </button>
              <button type="button" className="btn btn-lg" onClick={() => savePng(TOTAL - 1)} disabled={saving}>
                <Download /> PNG
              </button>
              <button type="button" className="btn btn-lg btn-ghost" onClick={() => setSlide(0)}>
                {T("Baştan izle", "Watch again")}
              </button>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-panel border border-line bg-line">
            {[
              [fmtInt(data.totalCommits, l), "commit"],
              [`${data.longestStreak} ${T("gün", "d")}`, T("en uzun seri", "longest streak")],
              [`+${fmtCompact(data.totalLinesAdded, l)}`, T("eklenen satır", "lines added")],
              [data.topLangs[0]?.lang ?? "–", T("ana dil", "top language")],
              [MONTHS_SHORT[l][peakMonthIdx], T("zirve ayı", "peak month")],
              [`${String(data.peakHour).padStart(2, "0")}:00`, T("zirve saati", "peak hour")],
            ].map(([v, k]) => (
              <div key={k} className="bg-surface p-4">
                <dt className="text-[12px] text-ink-3">{k}</dt>
                <dd className="mt-1 truncate font-mono text-[22px] font-bold text-ink num">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      ),
    },
  ];

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
