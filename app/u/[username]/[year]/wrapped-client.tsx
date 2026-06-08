"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

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

// Sayı animasyonu hook
function useCountUp(target: number, active: boolean, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) { setValue(0); return; }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * ease));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, active, duration]);
  return value;
}

// Mini bar chart için
function MonthBar({ data, accentColor, accentBg }: {
  data: MonthPoint[];
  accentColor: string;
  accentBg: string;
}) {
  const max = Math.max(...data.map((d) => d.commits), 1);
  const peak = data.indexOf(data.reduce((a, b) => b.commits > a.commits ? b : a));
  return (
    <div className="flex items-end gap-1 h-20 w-full">
      {data.map((d, i) => {
        const h = Math.max((d.commits / max) * 100, d.commits > 0 ? 4 : 2);
        const isPeak = i === peak;
        return (
          <div key={d.month} className="flex flex-col items-center flex-1 gap-1">
            <div
              className="w-full rounded-t-sm transition-all"
              style={{
                height: `${h}%`,
                backgroundColor: isPeak ? accentColor : accentBg,
                opacity: isPeak ? 1 : 0.6,
              }}
            />
            <span className="text-xs" style={{ color: isPeak ? accentColor : "#52525b", fontSize: 9 }}>
              {d.month}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Heatmap mini
function MiniHeatmap({ dates, maxCount, accentColor, year }: {
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

  const CELL = 10;
  const GAP = 2;
  const W = WEEKS * (CELL + GAP);
  const H = 7 * (CELL + GAP);

  function alpha(hex: string, a: number) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
  }

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      {cells.map(({ week, day, count }) => (
        <rect
          key={`${week}-${day}`}
          x={week * (CELL + GAP)}
          y={day * (CELL + GAP)}
          width={CELL}
          height={CELL}
          rx={2}
          fill={
            count === 0 ? "#18181b"
            : count / maxCount < 0.25 ? alpha(accentColor, 0.25)
            : count / maxCount < 0.5  ? alpha(accentColor, 0.5)
            : count / maxCount < 0.75 ? alpha(accentColor, 0.75)
            : accentColor
          }
        />
      ))}
    </svg>
  );
}

// Tek bir slide
type SlideProps = {
  active: boolean;
  children: React.ReactNode;
  gradient?: string;
};

function Slide({ active, children, gradient }: SlideProps) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center transition-all duration-700 px-6"
      style={{
        opacity: active ? 1 : 0,
        transform: active ? "scale(1) translateY(0)" : "scale(0.97) translateY(16px)",
        pointerEvents: active ? "auto" : "none",
        background: gradient ?? "transparent",
      }}
    >
      {children}
    </div>
  );
}

function CountUp({ value, active, suffix = "", prefix = "" }: {
  value: number; active: boolean; suffix?: string; prefix?: string;
}) {
  const v = useCountUp(value, active);
  return <>{prefix}{v.toLocaleString("tr-TR")}{suffix}</>;
}

export default function WrappedClient({ data }: { data: WrappedData }) {
  const [slide, setSlide] = useState(0);
  const [started, setStarted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const ac = data.accentColor;
  const ab = data.accentBg;

  const shareUrl = typeof window !== "undefined"
    ? window.location.href
    : `https://devanalytics.app/u/${data.username}/${data.year}`;

  function copy() {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
  }

  const SLIDES = [
    // 0 — Kapak
    <Slide key="cover" active={slide === 0}>
      <div className="text-center space-y-6 max-w-lg">
        {data.avatarUrl && (
          <Image
            src={data.avatarUrl}
            alt={data.username}
            width={96}
            height={96}
            className="rounded-full mx-auto"
            style={{ outline: `4px solid ${ac}`, outlineOffset: "2px" }}
          />
        )}
        <div>
          <p className="text-zinc-500 text-sm mb-1">Dev Analytics Sunuyor</p>
          <h1 className="text-5xl font-black text-zinc-100 leading-none">
            {data.year}
          </h1>
          <h2 className="text-4xl font-black mt-1" style={{ color: ac }}>
            Wrapped
          </h2>
        </div>
        <p className="text-zinc-400">
          <span className="font-semibold text-zinc-200">{data.displayName}</span> için
          <br />
          <span className="text-zinc-600">@{data.username}</span>
        </p>
        {!started && (
          <button
            onClick={() => { setStarted(true); setSlide(1); }}
            className="mt-2 rounded-2xl px-8 py-3 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
            style={{ backgroundColor: ac }}
          >
            Başla →
          </button>
        )}
      </div>
    </Slide>,

    // 1 — Toplam commit
    <Slide key="commits" active={slide === 1}>
      <div className="text-center space-y-4 max-w-sm">
        <p className="text-zinc-500 text-xs uppercase tracking-widest">Bu yıl toplam</p>
        <p className="text-8xl font-black" style={{ color: ac }}>
          <CountUp value={data.totalCommits} active={slide === 1} />
        </p>
        <p className="text-3xl font-bold text-zinc-100">commit yaptın</p>
        <p className="text-zinc-500">
          {data.activeDays} aktif gün — {Math.round(data.totalCommits / Math.max(data.activeDays, 1) * 10) / 10} commit/gün
        </p>
      </div>
    </Slide>,

    // 2 — Satır istatistikleri
    <Slide key="lines" active={slide === 2}>
      <div className="text-center space-y-6 max-w-sm w-full">
        <p className="text-zinc-500 text-xs uppercase tracking-widest">Kod satırları</p>
        <div className="space-y-4">
          <div>
            <p className="text-5xl font-black text-emerald-400">
              +<CountUp value={data.totalLinesAdded} active={slide === 2} />
            </p>
            <p className="text-zinc-400 mt-1">satır eklendi</p>
          </div>
          <div className="h-px bg-zinc-800 w-full" />
          <div>
            <p className="text-5xl font-black text-red-400">
              −<CountUp value={data.totalLinesDeleted} active={slide === 2} />
            </p>
            <p className="text-zinc-400 mt-1">satır silindi</p>
          </div>
        </div>
        {data.totalLinesDeleted > data.totalLinesAdded * 0.3 && (
          <p className="text-xs text-zinc-600">Temizlik yapmayı seviyorsun.</p>
        )}
      </div>
    </Slide>,

    // 3 — En aktif ay
    <Slide key="month" active={slide === 3}>
      <div className="text-center space-y-6 max-w-md w-full">
        <p className="text-zinc-500 text-xs uppercase tracking-widest">En aktif ayın</p>
        <p className="text-6xl font-black" style={{ color: ac }}>{data.peakMonth}</p>
        <p className="text-zinc-400">
          <span className="text-zinc-200 font-semibold text-xl">{data.peakMonthCommits}</span> commit ile
        </p>
        <div className="w-full pt-2">
          <MonthBar data={data.monthlyData} accentColor={ac} accentBg={ab} />
        </div>
      </div>
    </Slide>,

    // 4 — Çalışma ritmi
    <Slide key="rhythm" active={slide === 4}>
      <div className="text-center space-y-6 max-w-sm">
        <p className="text-zinc-500 text-xs uppercase tracking-widest">Çalışma tarzın</p>
        <div
          className="rounded-3xl border p-8 space-y-2"
          style={{ borderColor: data.accentBorder, backgroundColor: ab }}
        >
          <p className="text-5xl">{data.identity.emoji}</p>
          <p className="text-2xl font-bold" style={{ color: ac }}>{data.identity.label}</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="text-zinc-400">
            En üretken günün: <span className="text-zinc-100 font-semibold">{data.peakDay}</span>
          </p>
          <p className="text-zinc-400">
            En aktif saatin:{" "}
            <span className="text-zinc-100 font-semibold">
              {String(data.peakHour).padStart(2, "0")}:00–{String(data.peakHour + 1).padStart(2, "0")}:00
            </span>
          </p>
          <p className="text-zinc-400">
            En uzun streak:{" "}
            <span className="font-semibold" style={{ color: ac }}>{data.longestStreak} gün</span>
          </p>
        </div>
      </div>
    </Slide>,

    // 5 — Top diller
    <Slide key="langs" active={slide === 5}>
      <div className="text-center space-y-5 max-w-sm w-full">
        <p className="text-zinc-500 text-xs uppercase tracking-widest">Bu yılın dilleri</p>
        {data.topLangs.length === 0 ? (
          <p className="text-zinc-600">Dil verisi yok</p>
        ) : (
          <div className="space-y-3 text-left">
            {data.topLangs.map((l, i) => (
              <div key={l.lang}>
                <div className="flex justify-between text-sm mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-base font-bold"
                      style={{ color: i === 0 ? ac : "#a1a1aa" }}
                    >
                      #{i + 1}
                    </span>
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                    <span className={i === 0 ? "text-zinc-100 font-semibold" : "text-zinc-400"}>
                      {l.lang}
                    </span>
                  </div>
                  <span className="text-zinc-600">{l.pct}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: slide === 5 ? `${l.pct}%` : "0%",
                      backgroundColor: l.color,
                      transition: `width 0.8s ease ${i * 0.12}s`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Slide>,

    // 6 — Repolar
    <Slide key="repos" active={slide === 6}>
      <div className="text-center space-y-6 max-w-sm">
        <p className="text-zinc-500 text-xs uppercase tracking-widest">Repolar</p>
        <div className="grid grid-cols-2 gap-4">
          <div
            className="rounded-2xl border p-5"
            style={{ borderColor: data.accentBorder, backgroundColor: ab }}
          >
            <p className="text-xs text-zinc-500 mb-1">Yeni açılan</p>
            <p className="text-4xl font-black" style={{ color: ac }}>
              <CountUp value={data.reposCreated} active={slide === 6} />
            </p>
            <p className="text-xs text-zinc-600 mt-1">repo</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-xs text-zinc-500 mb-1">Aktif tutulan</p>
            <p className="text-4xl font-black text-zinc-100">
              <CountUp value={data.activeRepos} active={slide === 6} />
            </p>
            <p className="text-xs text-zinc-600 mt-1">repo</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-xs text-zinc-500 mb-1">Açılan issue</p>
            <p className="text-4xl font-black text-zinc-100">
              <CountUp value={data.issuesOpened} active={slide === 6} />
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-xs text-zinc-500 mb-1">Kapatılan</p>
            <p className="text-4xl font-black text-zinc-100">
              <CountUp value={data.issuesClosed} active={slide === 6} />
            </p>
          </div>
        </div>
      </div>
    </Slide>,

    // 7 — En büyük commit
    <Slide key="bigcommit" active={slide === 7}>
      <div className="text-center space-y-6 max-w-md">
        <p className="text-zinc-500 text-xs uppercase tracking-widest">En büyük commit</p>
        {data.biggestCommit ? (
          <>
            <div
              className="rounded-2xl border p-6 text-left space-y-4"
              style={{ borderColor: data.accentBorder, backgroundColor: ab }}
            >
              <p className="text-zinc-200 text-lg font-medium leading-snug">
                &ldquo;{data.biggestCommit.message || "(boş mesaj)"}&rdquo;
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-emerald-400 font-semibold">
                  +{data.biggestCommit.additions.toLocaleString("tr-TR")} satır
                </span>
                <span className="text-red-400 font-semibold">
                  −{data.biggestCommit.deletions.toLocaleString("tr-TR")} satır
                </span>
              </div>
              <p className="text-xs text-zinc-600">{data.biggestCommit.date}</p>
            </div>
            <p className="text-zinc-500 text-sm">
              Tek seferde{" "}
              <span className="font-semibold" style={{ color: ac }}>
                {(data.biggestCommit.additions + data.biggestCommit.deletions).toLocaleString("tr-TR")}
              </span>{" "}
              satır değişiklik!
            </p>
          </>
        ) : (
          <p className="text-zinc-600">Satır verisi bulunan commit yok</p>
        )}
      </div>
    </Slide>,

    // 8 — Heatmap
    <Slide key="heatmap" active={slide === 8}>
      <div className="text-center space-y-5 max-w-2xl w-full">
        <p className="text-zinc-500 text-xs uppercase tracking-widest">{data.year} kontribüsyon haritası</p>
        <div className="w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <MiniHeatmap
            dates={data.heatmapDates}
            maxCount={data.maxDayCount}
            accentColor={ac}
            year={data.year}
          />
        </div>
        <p className="text-zinc-500 text-sm">
          <span className="font-semibold text-zinc-200">{data.activeDays}</span> gün aktiftin
        </p>
      </div>
    </Slide>,

    // 9 — Kapanış + paylaş
    <Slide key="end" active={slide === 9}>
      <div className="text-center space-y-6 max-w-sm">
        <div>
          <p className="text-zinc-500 text-sm">Harika bir yıldı</p>
          <h2 className="text-5xl font-black mt-2" style={{ color: ac }}>
            {data.displayName}!
          </h2>
        </div>
        <div
          className="rounded-2xl border p-5 space-y-1 text-sm text-left"
          style={{ borderColor: data.accentBorder, backgroundColor: ab }}
        >
          {[
            ["Toplam commit", data.totalCommits.toLocaleString("tr-TR")],
            ["Aktif gün", data.activeDays.toString()],
            ["En uzun streak", `${data.longestStreak} gün`],
            ["En aktif ay", data.peakMonth],
            ...(data.topLangs[0] ? [["Ana dil", data.topLangs[0].lang]] : []),
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between">
              <span className="text-zinc-500">{label}</span>
              <span className="text-zinc-200 font-semibold">{value}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={copy}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors"
          >
            Linki Kopyala
          </button>
          <a
            href={`/u/${data.username}`}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-zinc-950 transition-opacity hover:opacity-90"
            style={{ backgroundColor: ac }}
          >
            Profile Git →
          </a>
        </div>
        <p className="text-xs text-zinc-700">
          devanalytics.app/u/{data.username}/{data.year}
        </p>
      </div>
    </Slide>,
  ];

  const TOTAL = SLIDES.length;

  function prev() { setSlide((s) => Math.max(0, s - 1)); }
  function next() { setSlide((s) => Math.min(TOTAL - 1, s + 1)); }

  // Klavye navigasyonu
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") next();
      if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Dokunmatik swipe
  const touchStart = useRef<number | null>(null);
  function onTouchStart(e: React.TouchEvent) {
    touchStart.current = e.touches[0].clientX;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStart.current === null) return;
    const delta = touchStart.current - e.changedTouches[0].clientX;
    if (delta > 50) next();
    else if (delta < -50) prev();
    touchStart.current = null;
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Navbar */}
      <header className="border-b border-zinc-800 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-zinc-800 flex items-center justify-center">
            <svg className="h-3.5 w-3.5 text-zinc-100" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </div>
          <span className="text-xs text-zinc-500">Dev Analytics</span>
        </div>
        <a
          href={`/u/${data.username}`}
          className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          @{data.username} ↗
        </a>
      </header>

      {/* Progress bar */}
      <div className="flex gap-1 px-6 py-3 shrink-0">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => { if (i > 0) setStarted(true); setSlide(i); }}
            className="h-1 flex-1 rounded-full transition-all"
            style={{ backgroundColor: i <= slide ? ac : "#27272a" }}
          />
        ))}
      </div>

      {/* Slide alanı */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Arka plan glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${data.accentBg.replace("0.08", "0.12")} 0%, transparent 70%)`,
          }}
        />
        {SLIDES}
      </div>

      {/* Navigasyon butonları */}
      <div className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-zinc-800">
        <button
          onClick={prev}
          disabled={slide === 0}
          className="rounded-xl border border-zinc-800 px-4 py-2 text-sm text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Geri
        </button>
        <span className="text-xs text-zinc-700">{slide + 1} / {TOTAL}</span>
        <button
          onClick={next}
          disabled={slide === TOTAL - 1}
          className="rounded-xl px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ backgroundColor: ac, color: "#09090b" }}
        >
          İleri →
        </button>
      </div>
    </div>
  );
}
