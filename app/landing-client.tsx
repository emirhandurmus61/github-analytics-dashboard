"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import {
  Trophy,
  Sparkles,
  Flame,
  Award,
  LayoutDashboard,
  Share2,
  Check,
  ArrowRight,
  ShieldCheck,
  Cpu,
  BarChart3,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";

/* ═══════════════════════════════════════════════════
   UTILS
   ═══════════════════════════════════════════════════ */
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function R({
  children,
  d = 0,
  className = "",
}: {
  children: ReactNode;
  d?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const o = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setV(true);
      },
      { threshold: 0.1 }
    );
    o.observe(el);
    return () => o.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: v ? 1 : 0,
        transform: v ? "none" : "translateY(24px)",
        transition: `opacity 0.6s ease ${d}ms, transform 0.6s ease ${d}ms`,
      }}
    >
      {children}
    </div>
  );
}

function Ct({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const o = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          const t0 = performance.now();
          const tick = (now: number) => {
            const p = Math.min((now - t0) / 1600, 1);
            setCount(Math.floor((1 - Math.pow(1 - p, 3)) * end));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    o.observe(el);
    return () => o.disconnect();
  }, [end]);
  return (
    <span ref={ref}>
      {count.toLocaleString("tr-TR")}
      {suffix}
    </span>
  );
}

const GH = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

/* ═══════════════════════════════════════════════════
   CONSTELLATION — Nokta + bağlantı ağı (canvas)
   ═══════════════════════════════════════════════════ */
function Constellation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const POINT_COUNT = Math.min(Math.floor((w * h) / 18000), 80);
    const points = Array.from({ length: POINT_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      r: 1 + Math.random() * 1.2,
    }));

    let frame: number;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      for (const p of points) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }

      const maxDist = 160;
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dx = points[i].x - points[j].x;
          const dy = points[i].y - points[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * 0.08;
            ctx.beginPath();
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(points[j].x, points[j].y);
            ctx.strokeStyle = `rgba(52,211,153,${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      for (const p of points) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(161,161,170,0.12)";
        ctx.fill();
      }

      frame = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0" />;
}

/* ═══════════════════════════════════════════════════
   PULSE HEATMAP — Canlı nabız atan ısı haritası
   ═══════════════════════════════════════════════════ */
function PulseHeatmap() {
  const [cells, setCells] = useState<number[]>(() => {
    const rng = seededRandom(42);
    return Array.from({ length: 371 }, () => rng());
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setCells((prev) => {
        const next = [...prev];
        for (let i = 0; i < 5; i++) {
          const idx = Math.floor(Math.random() * next.length);
          next[idx] = Math.min(1, Math.random() * 0.3 + next[idx] * 0.7 + 0.15);
        }
        return next;
      });
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const weeks: number[][] = [];
  for (let w = 0; w < 53; w++) weeks.push(cells.slice(w * 7, w * 7 + 7));

  return (
    <div className="flex gap-[3px]">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-[3px]">
          {week.map((v, di) => {
            const op = v > 0.78 ? 1 : v > 0.55 ? 0.6 : v > 0.32 ? 0.25 : 0.06;
            return (
              <div
                key={di}
                className="h-[9px] w-[9px] rounded-[2px] sm:h-[11px] sm:w-[11px]"
                style={{
                  backgroundColor: `rgba(52,211,153,${op})`,
                  transition: mounted ? "background-color 1.2s ease" : "none",
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   LANGUAGE BARS
   ═══════════════════════════════════════════════════ */
const LANGS = [
  { name: "TypeScript", pct: 44, color: "#3178c6" },
  { name: "Python", pct: 21, color: "#3572A5" },
  { name: "Rust", pct: 14, color: "#dea584" },
  { name: "Go", pct: 12, color: "#00ADD8" },
  { name: "JavaScript", pct: 9, color: "#f1e05a" },
];

function LangBars() {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const o = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setOn(true);
      },
      { threshold: 0.25 }
    );
    o.observe(el);
    return () => o.disconnect();
  }, []);

  return (
    <div ref={ref} className="space-y-3">
      {LANGS.map((l, i) => (
        <div key={l.name}>
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
              <span className="text-[11px] text-zinc-300">{l.name}</span>
            </div>
            <span className="font-mono text-[10px] text-zinc-600">{l.pct}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800/40">
            <div
              className="h-full rounded-full"
              style={{
                width: on ? `${l.pct}%` : "0%",
                backgroundColor: l.color,
                transition: `width 1s ease ${i * 100 + 200}ms`,
                boxShadow: `0 0 10px ${l.color}25`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN LANDING COMPONENT
   ═══════════════════════════════════════════════════ */
export default function LandingClient({
  signInAction,
}: {
  signInAction: () => Promise<void>;
}) {
  const { lang, t } = useLanguage();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 80);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#08080a] text-zinc-100 overflow-x-hidden selection:bg-emerald-500/20">
      {/* ════════════════════════════════════════════════
           HERO
           ════════════════════════════════════════════════ */}
      <section className="relative min-h-[calc(100dvh-64px)] flex flex-col justify-center overflow-hidden py-12 sm:py-20">
        {/* Arka plan: constellation + gradient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <Constellation />
          <div
            className="absolute top-[-10%] left-[-10%] h-[70vh] w-[70vh] rounded-full opacity-[0.08]"
            style={{
              background: "radial-gradient(circle, #34d399, transparent 65%)",
              filter: "blur(90px)",
            }}
          />
          <div
            className="absolute bottom-[-10%] right-[-5%] h-[60vh] w-[60vh] rounded-full opacity-[0.06]"
            style={{
              background: "radial-gradient(circle, #a78bfa, transparent 65%)",
              filter: "blur(80px)",
            }}
          />
        </div>

        {/* Ana içerik */}
        <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center justify-center px-6 text-center">
          {/* Üst etiket */}
          <div
            className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-zinc-800/80 bg-zinc-900/60 py-1.5 pl-2.5 pr-4 backdrop-blur-md"
            style={{
              opacity: ready ? 1 : 0,
              transform: ready ? "none" : "translateY(8px)",
              transition: "all 0.5s ease 0.15s",
            }}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </span>
            <span className="text-xs font-medium text-zinc-400">
              {t.landing.heroBadge}
            </span>
          </div>

          {/* Başlık */}
          <h1
            className="text-[clamp(2.6rem,8vw,5.6rem)] font-black leading-[0.95] tracking-[-0.04em]"
            style={{
              opacity: ready ? 1 : 0,
              transform: ready ? "none" : "translateY(20px)",
              transition: "all 0.7s cubic-bezier(.22,.61,.36,1) 0.25s",
            }}
          >
            <span className="block text-zinc-100">{t.landing.heroTitle1}</span>
            <span
              className="block"
              style={{
                background:
                  "linear-gradient(135deg, #34d399 0%, #2dd4bf 35%, #22d3ee 65%, #a78bfa 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {t.landing.heroTitle2}
            </span>
          </h1>

          {/* Açıklama */}
          <p
            className="mx-auto mt-6 max-w-lg text-[15px] sm:text-base leading-relaxed text-zinc-400"
            style={{
              opacity: ready ? 1 : 0,
              transform: ready ? "none" : "translateY(12px)",
              transition: "all 0.6s ease 0.45s",
            }}
          >
            {t.landing.heroSub}
          </p>

          {/* Çift Butonlu CTA */}
          <div
            className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4"
            style={{
              opacity: ready ? 1 : 0,
              transform: ready ? "none" : "translateY(12px)",
              transition: "all 0.6s ease 0.6s",
            }}
          >
            <form action={signInAction}>
              <button
                type="submit"
                className="group relative flex items-center gap-2.5 rounded-2xl bg-zinc-100 py-3.5 pl-6 pr-6 text-sm font-bold text-zinc-950 shadow-xl shadow-emerald-500/10 transition-all hover:bg-white hover:scale-105 active:scale-95"
              >
                <GH className="h-[18px] w-[18px]" />
                <span>{t.landing.startWithGithub}</span>
                <ArrowRight className="h-4 w-4 text-zinc-600 transition-transform group-hover:translate-x-1" />
              </button>
            </form>

            <Link
              href="/leaderboard"
              className="flex items-center gap-2 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 px-5 py-3.5 text-sm font-semibold text-zinc-300 backdrop-blur-md transition-all hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
            >
              <Trophy className="h-4 w-4 text-amber-400" />
              <span>{t.landing.viewLeaderboard}</span>
            </Link>
          </div>

          <p className="mt-3 text-[11px] text-zinc-600">
            {t.landing.heroFootnote}
          </p>

          {/* Hero alt: mini ısı haritası preview */}
          <div
            className="mt-12 sm:mt-16 w-full max-w-xl"
            style={{
              opacity: ready ? 1 : 0,
              transform: ready ? "none" : "translateY(20px)",
              transition: "all 0.8s ease 0.8s",
            }}
          >
            <div className="overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/40 p-4 backdrop-blur-xl shadow-2xl">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] font-mono text-zinc-400">{t.landing.liveMatrix}</span>
                </div>
                <div className="flex items-center gap-1">
                  {[0.06, 0.25, 0.6, 1].map((op, i) => (
                    <div
                      key={i}
                      className="h-2 w-2 rounded-sm"
                      style={{ backgroundColor: `rgba(52,211,153,${op})` }}
                    />
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto custom-scroll">
                <PulseHeatmap />
              </div>
            </div>
          </div>
        </div>

        {/* Alt gradient geçiş */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-24"
          style={{ background: "linear-gradient(to top, #08080a, transparent)" }}
        />
      </section>

      {/* ════════════════════════════════════════════════
           SECTION 0 — Ne İşe Yarar & Nasıl Çalışır?
           ════════════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 pt-8 pb-16 sm:px-8 sm:pt-14 sm:pb-24">
        {/* Bölüm Başlığı & Giriş Açıklaması */}
        <R>
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>{t.landing.sec0Pill}</span>
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
              {t.landing.sec0Title1} <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 bg-clip-text text-transparent">
                {t.landing.sec0Title2}
              </span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
              {t.landing.sec0Desc}
            </p>
          </div>
        </R>

        {/* 1. Kısım: Ne İşe Yarar? (3 Temel Değer Kartı) */}
        <div className="mt-14 sm:mt-16">
          <R>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
                {t.landing.whatItDoes}
              </h3>
              <span className="text-xs font-mono text-zinc-600">{t.landing.threeBenefits}</span>
            </div>
          </R>

          <div className="grid gap-5 md:grid-cols-3">
            {/* Kart 1: Derin Analitik & Geliştirici DNA'sı */}
            <R d={40}>
              <div className="group relative h-full flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-800/60 bg-zinc-900/30 p-6 sm:p-7 backdrop-blur-xl transition-all duration-300 hover:border-emerald-500/40 hover:bg-zinc-900/50 hover:-translate-y-1">
                <div
                  className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: "radial-gradient(circle, rgba(52,211,153,0.15), transparent 70%)" }}
                />
                <div>
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20 transition-transform duration-300 group-hover:scale-110">
                    <BarChart3 className="h-6 w-6 text-emerald-400" />
                  </div>
                  <h4 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {t.landing.card1Title}
                  </h4>
                  <p className="mt-3 text-xs sm:text-sm leading-relaxed text-zinc-400">
                    {t.landing.card1Desc}
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-zinc-800/60 pt-4 text-[11px] font-mono text-emerald-400/90">
                  <span className="rounded-md bg-emerald-950/40 px-2 py-0.5 border border-emerald-500/20">Punch Card</span>
                  <span className="rounded-md bg-emerald-950/40 px-2 py-0.5 border border-emerald-500/20">Streak &amp; Goals</span>
                  <span className="rounded-md bg-emerald-950/40 px-2 py-0.5 border border-emerald-500/20">Languages</span>
                </div>
              </div>
            </R>

            {/* Kart 2: Oyunlaştırma & Küresel Lig */}
            <R d={80}>
              <div className="group relative h-full flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-800/60 bg-zinc-900/30 p-6 sm:p-7 backdrop-blur-xl transition-all duration-300 hover:border-amber-500/40 hover:bg-zinc-900/50 hover:-translate-y-1">
                <div
                  className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: "radial-gradient(circle, rgba(251,191,36,0.15), transparent 70%)" }}
                />
                <div>
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/20 transition-transform duration-300 group-hover:scale-110">
                    <Trophy className="h-6 w-6 text-amber-400" />
                  </div>
                  <h4 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                    {t.landing.card2Title}
                  </h4>
                  <p className="mt-3 text-xs sm:text-sm leading-relaxed text-zinc-400">
                    {t.landing.card2Desc}
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-zinc-800/60 pt-4 text-[11px] font-mono text-amber-400/90">
                  <span className="rounded-md bg-amber-950/40 px-2 py-0.5 border border-amber-500/20">40+ Badges</span>
                  <span className="rounded-md bg-amber-950/40 px-2 py-0.5 border border-amber-500/20">Global League</span>
                  <span className="rounded-md bg-amber-950/40 px-2 py-0.5 border border-amber-500/20">Tier &amp; Rank</span>
                </div>
              </div>
            </R>

            {/* Kart 3: Sinematik Yıllık Hikaye & Festival Posteri */}
            <R d={120}>
              <div className="group relative h-full flex flex-col justify-between overflow-hidden rounded-3xl border border-zinc-800/60 bg-zinc-900/30 p-6 sm:p-7 backdrop-blur-xl transition-all duration-300 hover:border-violet-500/40 hover:bg-zinc-900/50 hover:-translate-y-1">
                <div
                  className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                  style={{ background: "radial-gradient(circle, rgba(167,139,250,0.15), transparent 70%)" }}
                />
                <div>
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 ring-1 ring-violet-500/20 transition-transform duration-300 group-hover:scale-110">
                    <Sparkles className="h-6 w-6 text-violet-400" />
                  </div>
                  <h4 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">
                    {t.landing.card3Title}
                  </h4>
                  <p className="mt-3 text-xs sm:text-sm leading-relaxed text-zinc-400">
                    {t.landing.card3Desc}
                  </p>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-zinc-800/60 pt-4 text-[11px] font-mono text-violet-400/90">
                  <span className="rounded-md bg-violet-950/40 px-2 py-0.5 border border-violet-500/20">1080x1080 Poster</span>
                  <span className="rounded-md bg-violet-950/40 px-2 py-0.5 border border-violet-500/20">Archetypes</span>
                  <span className="rounded-md bg-violet-950/40 px-2 py-0.5 border border-violet-500/20">1-Click Share</span>
                </div>
              </div>
            </R>
          </div>
        </div>

        {/* 2. Kısım: Nasıl Çalışır? (3 Adımlı Akış) */}
        <div className="mt-16 sm:mt-24">
          <R>
            <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
                  {t.landing.howItWorks}
                </h3>
                <h4 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                  {t.landing.howItWorksSub}
                </h4>
              </div>
              <p className="text-xs text-zinc-500 max-w-xs">
                {t.landing.howItWorksDesc}
              </p>
            </div>
          </R>

          <div className="relative grid gap-6 md:grid-cols-3">
            {/* Adım 1: GitHub ile Tek Tıkla Bağlan */}
            <R d={40}>
              <div className="relative h-full flex flex-col justify-between rounded-3xl border border-zinc-800/70 bg-zinc-900/40 p-6 sm:p-7 backdrop-blur-xl">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/25 font-mono text-xs font-bold text-emerald-400">
                      01
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-400 border border-emerald-500/20">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>{t.landing.step1Badge}</span>
                    </span>
                  </div>
                  <h5 className="text-base font-bold text-white">
                    {t.landing.step1Title}
                  </h5>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-400">
                    {t.landing.step1Desc}
                  </p>
                </div>
                <div className="mt-5 rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3 text-[11px] font-mono text-zinc-400">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    <span>read:user &middot; public_repo</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 block">{t.landing.step1Foot}</span>
                </div>
              </div>
            </R>

            {/* Adım 2: Otomatik Senkronizasyon & Analiz */}
            <R d={80}>
              <div className="relative h-full flex flex-col justify-between rounded-3xl border border-zinc-800/70 bg-zinc-900/40 p-6 sm:p-7 backdrop-blur-xl">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 border border-sky-500/25 font-mono text-xs font-bold text-sky-400">
                      02
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-1 text-[11px] font-medium text-sky-400 border border-sky-500/20">
                      <Cpu className="h-3.5 w-3.5" />
                      <span>{t.landing.step2Badge}</span>
                    </span>
                  </div>
                  <h5 className="text-base font-bold text-white">
                    {t.landing.step2Title}
                  </h5>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-400">
                    {t.landing.step2Desc}
                  </p>
                </div>
                <div className="mt-5 rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3 text-[11px] font-mono text-zinc-400">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                    <span>GraphQL &middot; REST &middot; Cron Sync</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 block">{t.landing.step2Foot}</span>
                </div>
              </div>
            </R>

            {/* Adım 3: Keşfet, Yarış ve Paylaş */}
            <R d={120}>
              <div className="relative h-full flex flex-col justify-between rounded-3xl border border-zinc-800/70 bg-zinc-900/40 p-6 sm:p-7 backdrop-blur-xl">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/25 font-mono text-xs font-bold text-violet-400">
                      03
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-500/10 px-2.5 py-1 text-[11px] font-medium text-violet-400 border border-violet-500/20">
                      <Share2 className="h-3.5 w-3.5" />
                      <span>{t.landing.step3Badge}</span>
                    </span>
                  </div>
                  <h5 className="text-base font-bold text-white">
                    {t.landing.step3Title}
                  </h5>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-zinc-400">
                    {t.landing.step3Desc}
                  </p>
                </div>
                <div className="mt-5 rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3 text-[11px] font-mono text-zinc-400">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                    <span>21 Widgets &middot; Leaderboard &middot; PNG Poster</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 block">{t.landing.step3Foot}</span>
                </div>
              </div>
            </R>
          </div>
        </div>

        {/* Bölüm Ayırıcı Gradient Çizgi */}
        <div className="mt-20 sm:mt-28 h-[1px] bg-gradient-to-r from-transparent via-zinc-800/80 to-transparent" />
      </section>

      {/* ════════════════════════════════════════════════
           SECTION 1 — Özellikler (Bento Grid)
           ════════════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28">
        <R>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
            KAPSAMLI ÖZELLİKLER
          </p>
          <h2 className="mb-14 text-3xl font-black tracking-tight sm:text-4xl text-white">
            Geliştirici kimliğinin tüm yönleri, tek çatı altında.
          </h2>
        </R>

        {/* Üst satır — 2 büyük kart (Wrapped & Dashboard) */}
        <div className="grid gap-5 sm:grid-cols-2">
          {/* Kart 1: Sinematik Wrapped & Festival Posteri */}
          <R>
            <div className="group relative h-full overflow-hidden rounded-3xl border border-zinc-800/60 bg-zinc-900/30 p-6 sm:p-8 backdrop-blur-xl transition-all hover:border-violet-500/30 hover:bg-zinc-900/50">
              <div
                className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                style={{
                  background: "radial-gradient(circle, rgba(167,139,250,0.15), transparent 70%)",
                  filter: "blur(40px)",
                }}
              />
              <div className="relative">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-500/10 ring-1 ring-violet-500/25">
                    <Sparkles className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Sinematik Wrapped &middot; Festival Posteri
                    </h3>
                    <p className="text-xs text-zinc-400">
                      10 bölümlük interaktif hikaye ve koleksiyonluk editoryal poster
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2 my-4">
                  {[
                    { n: "01", t: "Commitler" },
                    { n: "02", t: "Satırlar" },
                    { n: "03", t: "Zirve Ay" },
                    { n: "04", t: "Arketip" },
                    { n: "05", t: "Diller" },
                  ].map((s, i) => (
                    <div
                      key={s.n}
                      className="rounded-xl border border-zinc-800/40 bg-zinc-950/40 p-2.5 transition-colors group-hover:border-violet-500/20"
                      style={{ transitionDelay: `${i * 30}ms` }}
                    >
                      <span className="block font-mono text-[9px] font-bold text-violet-400">
                        {s.n}
                      </span>
                      <span className="mt-1 block text-[11px] font-medium text-zinc-300">
                        {s.t}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-1.5">
                  {[
                    t.landing.bentoChipArchetypes,
                    t.landing.bentoChipPoster,
                    t.landing.bentoChipShare,
                    t.landing.bentoChipMatrix,
                    t.landing.bentoChipWaveform,
                  ].map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-zinc-800/60 bg-zinc-950/40 px-3 py-1 text-[10px] font-medium text-zinc-400"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </R>

          {/* Kart 2: Dashboard & 21 Widget */}
          <R d={80}>
            <div className="group relative h-full overflow-hidden rounded-3xl border border-zinc-800/60 bg-zinc-900/30 p-6 sm:p-8 backdrop-blur-xl transition-all hover:border-emerald-500/30 hover:bg-zinc-900/50">
              <div
                className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full opacity-0 transition-opacity duration-700 group-hover:opacity-100"
                style={{
                  background: "radial-gradient(circle, rgba(52,211,153,0.15), transparent 70%)",
                  filter: "blur(40px)",
                }}
              />
              <div className="relative">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/25">
                    <LayoutDashboard className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      21 Analiz Widget&apos;ı &middot; Dashboard
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Kodlama hızından geliştirici DNA&apos;sına derin analiz
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 my-4">
                  {[
                    "Isı Haritası",
                    "Saatlik Yoğunluk",
                    "Velocity",
                    "Dil Evrimi",
                    "Ritim Analizi",
                    "Repo Sağlığı",
                    "Geliştirici DNA",
                    "Percentile Ligi",
                    "Hedef Takibi",
                  ].map((w, i) => (
                    <div
                      key={w}
                      className="rounded-xl border border-zinc-800/40 bg-zinc-950/40 px-2.5 py-2.5 text-center transition-colors group-hover:border-emerald-500/20"
                      style={{ transitionDelay: `${i * 20}ms` }}
                    >
                      <span className="text-[11px] font-medium text-zinc-300">{w}</span>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-[11px] text-zinc-500">
                  30 / 90 / 365 gün filtreleme &middot; Sürükle-bırak düzenleme &middot; Otomatik senkronizasyon
                </p>
              </div>
            </div>
          </R>
        </div>

        {/* Orta satır — Streak & Diller */}
        <div className="mt-5 grid gap-5 sm:grid-cols-5">
          <R d={120} className="sm:col-span-2">
            <div className="group h-full rounded-3xl border border-zinc-800/60 bg-zinc-900/30 p-6 backdrop-blur-xl transition-all hover:border-amber-500/25 hover:bg-zinc-900/50">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/25">
                  <Flame className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                    {t.landing.bentoStreakLabel}
                  </p>
                  <p className="text-[11px] text-zinc-500">{t.landing.bentoStreakSub}</p>
                </div>
              </div>
              <div className="flex items-end justify-between py-2">
                <div>
                  <p className="font-mono text-5xl font-black text-amber-400">
                    <Ct end={47} />
                  </p>
                  <p className="text-xs text-zinc-400">{t.landing.bentoStreakDays}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xl font-bold text-zinc-500">
                    <Ct end={94} />
                  </p>
                  <p className="text-[10px] text-zinc-600 font-mono">{t.landing.bentoStreakRecord}</p>
                </div>
              </div>
              <div className="mt-4 flex items-end gap-[3px]">
                {[3, 7, 5, 8, 4, 9, 6, 2, 7, 5, 8, 3, 6, 9].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-amber-400/30"
                    style={{ height: `${h * 2.8 + 4}px` }}
                  />
                ))}
              </div>
            </div>
          </R>

          <R d={180} className="sm:col-span-3">
            <div className="group h-full rounded-3xl border border-zinc-800/60 bg-zinc-900/30 p-6 backdrop-blur-xl transition-all hover:border-sky-500/25 hover:bg-zinc-900/50">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
                    {t.landing.bentoLangsLabel}
                  </p>
                  <p className="text-[11px] text-zinc-500">{t.landing.bentoLangsSub}</p>
                </div>
              </div>
              <div className="mb-4 flex h-2.5 w-full overflow-hidden rounded-full">
                {LANGS.map((l) => (
                  <div
                    key={l.name}
                    style={{ width: `${l.pct}%`, backgroundColor: l.color }}
                  />
                ))}
              </div>
              <LangBars />
            </div>
          </R>
        </div>

        {/* Alt satır — 3 kart (Leaderboard, 40+ Rozet, Kart API) */}
        <div className="mt-5 grid gap-5 sm:grid-cols-3">
          {/* Global Sıralama Kartı */}
          <R d={240}>
            <div className="group h-full rounded-3xl border border-zinc-800/60 bg-zinc-900/30 p-6 backdrop-blur-xl transition-all hover:border-amber-500/25 hover:bg-zinc-900/50">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 ring-1 ring-amber-500/25">
                <Trophy className="h-5 w-5 text-amber-400" />
              </div>
              <h3 className="mb-1.5 text-base font-bold text-white">
                Global Sıralama &middot; Geliştirici Ligi
              </h3>
              <p className="text-xs leading-relaxed text-zinc-400">
                Haftalık commit hacmi, aktiflik serileri ve rozet sayısına göre
                global developer liginde yerini al. Altın, Gümüş ve Bronz taç için yarış.
              </p>
            </div>
          </R>

          {/* 40+ Rozet Başarı Sistemi */}
          <R d={300}>
            <div className="group h-full rounded-3xl border border-zinc-800/60 bg-zinc-900/30 p-6 backdrop-blur-xl transition-all hover:border-rose-500/25 hover:bg-zinc-900/50">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 ring-1 ring-rose-500/25">
                <Award className="h-5 w-5 text-rose-400" />
              </div>
              <h3 className="mb-1.5 text-base font-bold text-white">
                40+ Kazanılabilir Rozet &middot; Başarılar
              </h3>
              <p className="text-xs leading-relaxed text-zinc-400">
                Gece Kuşu, Poliglot, Ateş Serisi, Hafta Sonu Savaşçısı, Büyük Temizlik.
                Common, Rare, Epic ve Efsanevi seviyelerle başarılarını sergile.
              </p>
            </div>
          </R>

          {/* Paylaşılabilir Kart & Widget */}
          <R d={360}>
            <div className="group h-full rounded-3xl border border-zinc-800/60 bg-zinc-900/30 p-6 backdrop-blur-xl transition-all hover:border-cyan-500/25 hover:bg-zinc-900/50">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 ring-1 ring-cyan-500/25">
                <Share2 className="h-5 w-5 text-cyan-400" />
              </div>
              <h3 className="mb-1.5 text-base font-bold text-white">
                Geliştirici Kartı &middot; Dinamik SVG API
              </h3>
              <p className="text-xs leading-relaxed text-zinc-400">
                Otomatik güncellenen canlı SVG rozetleri ve 1200x630 PNG geliştirici kartı.
                GitHub README profiline ekle, sosyal medyada gururla paylaş.
              </p>
            </div>
          </R>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
           SECTION 2 — Profil & Ayarlar Özelleştirme
           ════════════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Sol: Açıklama */}
          <R>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
                {t.landing.sec2Pill}
              </p>
              <h2 className="mb-5 text-3xl font-black tracking-tight sm:text-4xl text-white">
                {t.landing.sec2Title1}<br />{t.landing.sec2Title2}
              </h2>
              <p className="mb-8 text-sm leading-relaxed text-zinc-400">
                {t.landing.sec2Desc}
              </p>
              <div className="space-y-4">
                {[
                  {
                    title: t.landing.sec2Item1Title,
                    desc: t.landing.sec2Item1Desc,
                    color: "#34d399",
                  },
                  {
                    title: t.landing.sec2Item2Title,
                    desc: t.landing.sec2Item2Desc,
                    color: "#a78bfa",
                  },
                  {
                    title: t.landing.sec2Item3Title,
                    desc: t.landing.sec2Item3Desc,
                    color: "#22d3ee",
                  },
                  {
                    title: t.landing.sec2Item4Title,
                    desc: t.landing.sec2Item4Desc,
                    color: "#fb7185",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3.5">
                    <div
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: `${item.color}15`,
                        color: item.color,
                        border: `1px solid ${item.color}30`,
                      }}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-100">{item.title}</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </R>

          {/* Sağ: Canlı Profil Önizleme Kartı */}
          <R d={150}>
            <div className="relative mx-auto w-full max-w-sm">
              <div
                className="pointer-events-none absolute -inset-8 rounded-3xl opacity-40"
                style={{
                  background:
                    "radial-gradient(ellipse at center, rgba(52,211,153,0.1), transparent 70%)",
                }}
              />

              <div className="relative overflow-hidden rounded-3xl border border-zinc-800/70 bg-zinc-900/40 backdrop-blur-2xl shadow-2xl">
                {/* Profil Header */}
                <div className="border-b border-zinc-800/40 p-5">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500/20 via-emerald-500/5 to-transparent flex items-center justify-center ring-2 ring-emerald-500/30">
                      <GH className="h-6 w-6 text-emerald-400" />
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-zinc-900 bg-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">emirhandurmus61</p>
                      <p className="text-[11px] text-zinc-500">Full-stack Developer &middot; Pro</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {["TypeScript", "React", "Next.js", "Rust", "Tailwind"].map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-zinc-800/60 bg-zinc-800/30 px-2.5 py-0.5 text-[9px] font-mono text-zinc-400"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Mini Stats */}
                <div className="grid grid-cols-4 divide-x divide-zinc-800/40 border-b border-zinc-800/40">
                  {[
                    { v: "94", l: "Repo" },
                    { v: "2.8K", l: "Commit" },
                    { v: "27", l: "Rozet" },
                    { v: "12", l: "Dil" },
                  ].map((s) => (
                    <div key={s.l} className="py-3 text-center">
                      <p className="font-mono text-xs font-black text-zinc-100">{s.v}</p>
                      <p className="text-[9px] text-zinc-500">{s.l}</p>
                    </div>
                  ))}
                </div>

                {/* Mini Heatmap Strip */}
                <div className="p-4 border-b border-zinc-800/40">
                  <div className="flex gap-[2px]">
                    {Array.from({ length: 18 }, (_, w) => {
                      const rng = seededRandom(w * 7 + 100);
                      return (
                        <div key={w} className="flex flex-col gap-[2px]">
                          {Array.from({ length: 7 }, (_, d) => {
                            const v = rng();
                            const op =
                              v > 0.7 ? 0.9 : v > 0.45 ? 0.5 : v > 0.25 ? 0.18 : 0.05;
                            return (
                              <div
                                key={d}
                                className="h-[6px] w-[6px] rounded-[1.5px]"
                                style={{
                                  backgroundColor: `rgba(52,211,153,${op})`,
                                }}
                              />
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Dil Bar */}
                <div className="px-4 py-3">
                  <div className="flex h-1.5 w-full overflow-hidden rounded-full">
                    {LANGS.map((l) => (
                      <div
                        key={l.name}
                        style={{ width: `${l.pct}%`, backgroundColor: l.color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* 6 Tema Noktası */}
              <div className="mt-5 flex items-center justify-center gap-2.5">
                {[
                  "#34d399",
                  "#a78bfa",
                  "#fb7185",
                  "#fbbf24",
                  "#38bdf8",
                  "#22d3ee",
                ].map((c, i) => (
                  <div
                    key={c}
                    className="h-4 w-4 rounded-full transition-transform hover:scale-125 cursor-pointer"
                    style={{
                      backgroundColor: c,
                      boxShadow:
                        i === 0
                          ? `0 0 0 2px #08080a, 0 0 0 3.5px ${c}`
                          : `0 0 8px ${c}25`,
                    }}
                  />
                ))}
              </div>
            </div>
          </R>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
           SECTION 3 — Rakamlar & Metrikler
           ════════════════════════════════════════════════ */}
      <section className="relative z-10 border-y border-zinc-800/40 py-16 sm:py-20 backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <R>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 sm:gap-10">
              {[
                { n: 21, suffix: "", l: t.landing.metricWidgets },
                { n: 10, suffix: "", l: t.landing.metricSlides },
                { n: 40, suffix: "+", l: t.landing.metricBadges },
                { n: 6, suffix: "", l: t.landing.metricThemes },
              ].map((item) => (
                <div key={item.l} className="text-center">
                  <p className="font-mono text-4xl sm:text-5xl font-black tracking-tighter text-white">
                    <Ct end={item.n} suffix={item.suffix} />
                  </p>
                  <p className="mt-1 text-[11px] font-mono uppercase tracking-widest text-zinc-500">
                    {item.l}
                  </p>
                </div>
              ))}
            </div>
          </R>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
           SON CTA
           ════════════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto max-w-3xl px-5 py-24 sm:px-8 sm:py-32">
        <R>
          <div className="text-center">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              {t.landing.ctaTitle}
            </h2>
            <p className="mt-3 text-sm text-zinc-400">
              {t.landing.ctaSub}
            </p>
            <form action={signInAction} className="mt-8">
              <button
                type="submit"
                className="group inline-flex items-center gap-3 rounded-2xl bg-zinc-100 py-4 pl-7 pr-8 text-sm font-bold text-zinc-950 shadow-2xl transition-all hover:bg-white hover:scale-105 active:scale-95"
              >
                <GH className="h-[18px] w-[18px]" />
                <span>{t.landing.startWithGithub}</span>
                <ArrowRight className="h-4 w-4 text-zinc-600 transition-transform group-hover:translate-x-1" />
              </button>
            </form>
          </div>
        </R>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800/40 px-5 py-6 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <GH className="h-3.5 w-3.5 text-zinc-500" />
            <span className="font-semibold text-zinc-400">Devboard</span>
            <span>&middot;</span>
            <Link href="/leaderboard" className="hover:text-zinc-300 transition-colors">
              {t.nav.leaderboard}
            </Link>
          </div>
          <p className="text-[11px] text-zinc-600">
            {t.landing.footerText}
          </p>
        </div>
      </footer>
    </div>
  );
}
