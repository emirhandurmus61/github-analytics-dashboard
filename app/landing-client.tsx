"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";

/* ═══════════════════════════════════════════════════
   UTILS
   ═══════════════════════════════════════════════════ */
function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

function R({ children, d = 0, className = "" }: { children: ReactNode; d?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setV(true); }, { threshold: 0.1 });
    o.observe(el);
    return () => o.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={{
      opacity: v ? 1 : 0, transform: v ? "none" : "translateY(24px)",
      transition: `opacity 0.6s ease ${d}ms, transform 0.6s ease ${d}ms`,
    }}>{children}</div>
  );
}

function Ct({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const o = new IntersectionObserver(([e]) => {
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
    }, { threshold: 0.3 });
    o.observe(el);
    return () => o.disconnect();
  }, [end]);
  return <span ref={ref}>{count.toLocaleString("tr-TR")}{suffix}</span>;
}

const GH = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

/* ═══════════════════════════════════════════════════
   CONSTELLATION — Zarif nokta + bağlantı ağı (canvas)
   ═══════════════════════════════════════════════════ */
function Constellation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;

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

      // Noktaları hareket ettir
      for (const p of points) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }

      // Bağlantılar
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

      // Noktalar
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
    return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", onResize); };
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
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) setOn(true); }, { threshold: 0.25 });
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
export default function LandingClient({ signInAction }: { signInAction: () => Promise<void> }) {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 100); return () => clearTimeout(t); }, []);

  return (
    <div className="relative min-h-screen bg-[#08080a] text-zinc-100 overflow-x-hidden selection:bg-emerald-500/20">

      {/* ════════════════════════════════════════════════
           HERO
           ════════════════════════════════════════════════ */}
      <section className="relative min-h-[100dvh] flex flex-col overflow-hidden">

        {/* Arka plan: constellation + gradient orbs */}
        <div className="absolute inset-0">
          <Constellation />
          {/* Hafif radial glow'lar */}
          <div className="absolute top-[-20%] left-[-10%] h-[70vh] w-[70vh] rounded-full opacity-[0.07]" style={{ background: "radial-gradient(circle, #34d399, transparent 65%)", filter: "blur(80px)" }} />
          <div className="absolute bottom-[-15%] right-[-5%] h-[50vh] w-[50vh] rounded-full opacity-[0.05]" style={{ background: "radial-gradient(circle, #a78bfa, transparent 65%)", filter: "blur(60px)" }} />
        </div>

        {/* Nav */}
        <nav className="relative z-20 flex items-center justify-between px-6 py-5 sm:px-10">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/[0.08] ring-1 ring-emerald-500/15">
              <GH className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <span className="text-sm font-medium tracking-tight text-zinc-300">
              Dev Analytics
            </span>
          </div>
          <form action={signInAction}>
            <button type="submit" className="group flex items-center gap-2 rounded-full bg-zinc-100 py-2 pl-4 pr-3.5 text-xs font-medium text-zinc-900 transition-all hover:bg-white active:scale-[0.97]">
              <GH className="h-3.5 w-3.5" />
              <span>GitHub ile Bağlan</span>
            </button>
          </form>
        </nav>

        {/* Ana içerik */}
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 sm:px-10">
          <div className="max-w-2xl text-center">

            {/* Üst etiket */}
            <div
              className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-zinc-800/60 bg-zinc-900/40 py-1.5 pl-2 pr-4 backdrop-blur-sm sm:mb-10"
              style={{ opacity: ready ? 1 : 0, transform: ready ? "none" : "translateY(8px)", transition: "all 0.5s ease 0.15s" }}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </span>
              <span className="text-xs text-zinc-500">Açık kaynak · Ücretsiz · Sadece okuma izni</span>
            </div>

            {/* Başlık */}
            <h1
              className="text-[clamp(2.4rem,8vw,5.5rem)] font-bold leading-[0.95] tracking-[-0.04em]"
              style={{ opacity: ready ? 1 : 0, transform: ready ? "none" : "translateY(20px)", transition: "all 0.7s cubic-bezier(.22,.61,.36,1) 0.25s" }}
            >
              <span className="block text-zinc-100">GitHub&apos;ını</span>
              <span
                className="block"
                style={{
                  background: "linear-gradient(135deg, #34d399 0%, #2dd4bf 35%, #22d3ee 65%, #a78bfa 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                keşfet.
              </span>
            </h1>

            {/* Açıklama */}
            <p
              className="mx-auto mt-6 max-w-md text-[15px] leading-relaxed text-zinc-500 sm:mt-8"
              style={{ opacity: ready ? 1 : 0, transform: ready ? "none" : "translateY(12px)", transition: "all 0.6s ease 0.5s" }}
            >
              Commit ısı haritaları, dil dağılımı, streak takibi,
              yıllık wrapped ve paylaşılabilir geliştirici profili — tek bir yerde.
            </p>

            {/* CTA */}
            <div
              className="mt-10 flex flex-col items-center gap-4 sm:mt-12"
              style={{ opacity: ready ? 1 : 0, transform: ready ? "none" : "translateY(12px)", transition: "all 0.6s ease 0.65s" }}
            >
              <form action={signInAction}>
                <button
                  type="submit"
                  className="group relative flex items-center gap-3 rounded-2xl bg-zinc-100 py-4 pl-6 pr-7 text-sm font-semibold text-zinc-900 shadow-lg shadow-emerald-500/5 transition-all hover:bg-white hover:shadow-xl hover:shadow-emerald-500/10 active:scale-[0.97]"
                >
                  <GH className="h-[18px] w-[18px]" />
                  <span>GitHub ile Başla</span>
                  <svg className="h-4 w-4 text-zinc-400 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </button>
              </form>
              <p className="text-[11px] text-zinc-700">30 saniyede hazır · Kredi kartı gerekmez</p>
            </div>
          </div>

          {/* Hero alt: mini ısı haritası preview */}
          <div
            className="mt-16 sm:mt-20 w-full max-w-xl"
            style={{ opacity: ready ? 1 : 0, transform: ready ? "none" : "translateY(20px)", transition: "all 0.8s ease 0.9s" }}
          >
            <div className="overflow-hidden rounded-2xl border border-zinc-800/40 bg-zinc-900/20 p-4 backdrop-blur-sm sm:p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400/40" />
                  <span className="text-[10px] text-zinc-600">Commit aktivitesi</span>
                </div>
                <div className="flex items-center gap-1">
                  {[0.06, 0.25, 0.6, 1].map((op, i) => (
                    <div key={i} className="h-2 w-2 rounded-sm" style={{ backgroundColor: `rgba(52,211,153,${op})` }} />
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto custom-scroll">
                <PulseHeatmap />
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="relative z-10 flex justify-center pb-8 pt-4">
          <div
            className="h-10 w-px rounded-full"
            style={{
              background: "linear-gradient(to bottom, rgba(52,211,153,0.3), transparent)",
              opacity: ready ? 1 : 0,
              transition: "opacity 0.5s ease 1.3s",
            }}
          />
        </div>

        {/* Alt gradient kenar */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32" style={{ background: "linear-gradient(to top, #08080a, transparent)" }} />
      </section>

      {/* ════════════════════════════════════════════════
           SECTION 1 — Özellikler (Bento)
           ════════════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-24 sm:px-8 sm:py-32">
        <R>
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-emerald-400/60">Neler var?</p>
          <h2 className="mb-16 text-2xl font-bold tracking-tight sm:text-3xl">
            Kodunun tüm hikayesi, tek yerde.
          </h2>
        </R>

        {/* Üst satır — 2 büyük kart */}
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">

          {/* Wrapped */}
          <R>
            <div className="group relative h-full overflow-hidden rounded-2xl border border-zinc-800/40 bg-zinc-900/15 transition-colors hover:border-violet-500/20 hover:bg-zinc-900/25">
              {/* Dekoratif glow */}
              <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: "radial-gradient(circle, rgba(167,139,250,0.08), transparent)", filter: "blur(30px)" }} />
              <div className="relative p-6 sm:p-7">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/15">
                    <svg className="h-4 w-4 text-violet-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7 4V2m0 2a2 2 0 00-2 2v1a2 2 0 002 2h0a2 2 0 002-2V6a2 2 0 00-2-2zm0 10v2m0-2a2 2 0 01-2-2v-1a2 2 0 012-2h0a2 2 0 012 2v1a2 2 0 01-2 2zM17 4V2m0 2a2 2 0 00-2 2v1a2 2 0 002 2h0a2 2 0 002-2V6a2 2 0 00-2-2zm0 10v2m0-2a2 2 0 01-2-2v-1a2 2 0 012-2h0a2 2 0 012 2v1a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">Yıllık Wrapped</h3>
                    <p className="text-xs text-zinc-600">10 slaytlık sinematik yıl özeti</p>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { n: "01", t: "Commitler" },
                    { n: "02", t: "Satırlar" },
                    { n: "03", t: "Zirve Ay" },
                    { n: "04", t: "Kimlik" },
                    { n: "05", t: "Diller" },
                  ].map((s, i) => (
                    <div
                      key={s.n}
                      className="rounded-lg border border-zinc-800/30 bg-zinc-950/30 p-2.5 transition-colors group-hover:border-violet-500/10"
                      style={{ transitionDelay: `${i * 30}ms` }}
                    >
                      <span className="block font-mono text-[9px] text-violet-400/40">{s.n}</span>
                      <span className="mt-1 block text-[10px] text-zinc-400">{s.t}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {["Streak rekoru", "En aktif saat", "En büyük commit", "Repo stats", "Isı haritası"].map((t) => (
                    <span key={t} className="rounded-full border border-zinc-800/30 bg-zinc-950/30 px-2.5 py-0.5 text-[9px] text-zinc-600">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </R>

          {/* Dashboard Widget */}
          <R d={80}>
            <div className="group relative h-full overflow-hidden rounded-2xl border border-zinc-800/40 bg-zinc-900/15 transition-colors hover:border-emerald-500/20 hover:bg-zinc-900/25">
              <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100" style={{ background: "radial-gradient(circle, rgba(52,211,153,0.08), transparent)", filter: "blur(30px)" }} />
              <div className="relative p-6 sm:p-7">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/15">
                    <svg className="h-4 w-4 text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 3v18" /></svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">21 Analiz Widget&apos;ı</h3>
                    <p className="text-xs text-zinc-600">Her metriği analiz et, her trendi yakala</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    "Isı Haritası", "Saat Haritası", "Velocity",
                    "Dil Evrimi", "Ritim Analizi", "Repo Sağlığı",
                    "Commit Kalitesi", "Kod Stats", "Insights",
                  ].map((w, i) => (
                    <div
                      key={w}
                      className="rounded-lg border border-zinc-800/30 bg-zinc-950/30 px-2.5 py-2 text-center transition-colors group-hover:border-emerald-500/10"
                      style={{ transitionDelay: `${i * 20}ms` }}
                    >
                      <span className="text-[10px] text-zinc-500">{w}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[10px] text-zinc-700">30 / 90 / 365 gün filtreleme &middot; Fork gizleme &middot; Otomatik sync</p>
              </div>
            </div>
          </R>
        </div>

        {/* Orta satır — streak + dil */}
        <div className="mt-4 grid gap-4 sm:grid-cols-5 sm:mt-5 sm:gap-5">
          <R d={120} className="sm:col-span-2">
            <div className="group h-full rounded-2xl border border-zinc-800/40 bg-zinc-900/15 p-5 transition-colors hover:border-amber-500/15 hover:bg-zinc-900/25 sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/15">
                  <svg className="h-4 w-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 6.51 6.51 0 009 11.5a3 3 0 105.59-1.524A5.996 5.996 0 0015.362 5.214z" /></svg>
                </div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-600">Streak Takibi</p>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="font-mono text-4xl font-black text-amber-400 sm:text-5xl"><Ct end={47} /></p>
                  <p className="text-xs text-zinc-600">gün aktif</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-lg font-bold text-zinc-600"><Ct end={94} /></p>
                  <p className="text-[10px] text-zinc-700">rekor</p>
                </div>
              </div>
              <div className="mt-4 flex items-end gap-[3px]">
                {[3, 7, 5, 8, 4, 9, 6, 2, 7, 5, 8, 3, 6, 9].map((h, i) => (
                  <div key={i} className="flex-1 rounded-sm bg-amber-400/25" style={{ height: `${h * 2.5 + 3}px` }} />
                ))}
              </div>
            </div>
          </R>

          <R d={180} className="sm:col-span-3">
            <div className="group h-full rounded-2xl border border-zinc-800/40 bg-zinc-900/15 p-5 transition-colors hover:border-sky-500/15 hover:bg-zinc-900/25 sm:p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 ring-1 ring-sky-500/15">
                  <svg className="h-4 w-4 text-sky-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>
                </div>
                <p className="text-[10px] uppercase tracking-widest text-zinc-600">Dil Dağılımı</p>
              </div>
              <div className="mb-4 flex h-2.5 w-full overflow-hidden rounded-full">
                {LANGS.map((l) => (
                  <div key={l.name} style={{ width: `${l.pct}%`, backgroundColor: l.color }} />
                ))}
              </div>
              <LangBars />
            </div>
          </R>
        </div>

        {/* Alt satır — 3 eşit kart */}
        <div className="mt-4 grid gap-4 sm:grid-cols-3 sm:mt-5 sm:gap-5">
          {[
            {
              icon: <svg className="h-4 w-4 text-rose-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>,
              bg: "rgba(251,113,133,0.1)",
              ring: "rgba(251,113,133,0.15)",
              hoverBorder: "hover:border-rose-500/15",
              title: "8 Kazanılabilir Badge",
              desc: "Gece Kuşu, Poliglot, Hafta Sonu Savaşcısı, Büyük Temizlik — Common, Rare ve Epic nadirlik seviyeleri.",
            },
            {
              icon: <svg className="h-4 w-4 text-cyan-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v13.5A1.5 1.5 0 003.75 21z" /></svg>,
              bg: "rgba(34,211,238,0.1)",
              ring: "rgba(34,211,238,0.15)",
              hoverBorder: "hover:border-cyan-500/15",
              title: "Geliştirici Kartı",
              desc: "1200x630 PNG kart ve otomatik güncellenen SVG badge. README&apos;ine ekle, sosyal medyada paylaş.",
            },
            {
              icon: <svg className="h-4 w-4 text-violet-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>,
              bg: "rgba(167,139,250,0.1)",
              ring: "rgba(167,139,250,0.15)",
              hoverBorder: "hover:border-violet-500/15",
              title: "Otomatik Insights",
              desc: "En verimli saatin, ay bazlı büyüme, cleanup oranı, weekend aktivitesi — veriden çıkarılan akıllı özetler.",
            },
          ].map((item, i) => (
            <R key={item.title} d={240 + i * 60}>
              <div className={`group h-full rounded-2xl border border-zinc-800/40 bg-zinc-900/15 p-5 transition-colors ${item.hoverBorder} hover:bg-zinc-900/25 sm:p-6`}>
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: item.bg, boxShadow: `inset 0 0 0 1px ${item.ring}` }}>
                  {item.icon}
                </div>
                <h3 className="mb-1.5 text-sm font-semibold">{item.title}</h3>
                <p className="text-xs leading-relaxed text-zinc-500">{item.desc}</p>
              </div>
            </R>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════
           SECTION 2 — Profil özelleştirme
           ════════════════════════════════════════════════ */}
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-center">
          {/* Sol: açıklama */}
          <R>
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-cyan-400/60">Profil</p>
              <h2 className="mb-5 text-2xl font-bold tracking-tight sm:text-3xl">
                Senin profilin,<br />senin kuralların.
              </h2>
              <p className="mb-10 text-sm leading-relaxed text-zinc-500">
                Her detayı özelleştir. Widget sıralamasından tema rengine,
                README&apos;den sosyal linklere kadar profilinin kontrolü sende.
              </p>
              <div className="space-y-4">
                {[
                  {
                    icon: <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" /></svg>,
                    title: "6 Tema Rengi",
                    desc: "Emerald, Violet, Rose, Amber, Sky, Cyan",
                    color: "#34d399",
                  },
                  {
                    icon: <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
                    title: "Markdown README",
                    desc: "Profil sayfana Markdown ile kendi alanını yaz",
                    color: "#22d3ee",
                  },
                  {
                    icon: <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>,
                    title: "Widget Sıralaması",
                    desc: "Sürükle-bırak ile istediğin düzende göster",
                    color: "#a78bfa",
                  },
                  {
                    icon: <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>,
                    title: "Paylaşılabilir Profil",
                    desc: "devanalytics.app/u/sen — herkese açık, her yerden erişilebilir",
                    color: "#fb7185",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3.5">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${item.color}10`, color: item.color }}>
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-zinc-200">{item.title}</p>
                      <p className="text-[11px] text-zinc-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </R>

          {/* Sağ: Canlı profil kartı */}
          <R d={150}>
            <div className="relative mx-auto w-full max-w-sm">
              {/* Arka plan glow */}
              <div className="pointer-events-none absolute -inset-8 rounded-3xl opacity-40" style={{ background: "radial-gradient(ellipse at center, rgba(52,211,153,0.06), transparent 70%)" }} />

              <div className="relative overflow-hidden rounded-2xl border border-zinc-800/50 bg-zinc-900/30 backdrop-blur-sm">
                {/* Profil header */}
                <div className="border-b border-zinc-800/30 p-5">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500/20 via-emerald-500/5 to-transparent flex items-center justify-center ring-1 ring-emerald-500/10">
                      <GH className="h-6 w-6 text-emerald-400/50" />
                      <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-zinc-900 bg-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">developer</p>
                      <p className="text-[11px] text-zinc-600">Full-stack developer</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {["TypeScript", "React", "Next.js", "Rust", "Docker"].map((t) => (
                      <span key={t} className="rounded-full border border-zinc-800/30 bg-zinc-800/20 px-2 py-0.5 text-[9px] text-zinc-500">{t}</span>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-4 divide-x divide-zinc-800/30">
                  {[
                    { v: "94", l: "Repo" },
                    { v: "2.8K", l: "Commit" },
                    { v: "312", l: "Gün" },
                    { v: "12", l: "Dil" },
                  ].map((s) => (
                    <div key={s.l} className="py-3 text-center">
                      <p className="font-mono text-xs font-bold text-zinc-100">{s.v}</p>
                      <p className="text-[9px] text-zinc-600">{s.l}</p>
                    </div>
                  ))}
                </div>

                {/* Mini heatmap */}
                <div className="border-t border-zinc-800/30 p-4">
                  <div className="flex gap-[2px]">
                    {Array.from({ length: 16 }, (_, w) => {
                      const rng = seededRandom(w * 7 + 100);
                      return (
                        <div key={w} className="flex flex-col gap-[2px]">
                          {Array.from({ length: 7 }, (_, d) => {
                            const v = rng();
                            const op = v > 0.7 ? 0.9 : v > 0.45 ? 0.5 : v > 0.25 ? 0.18 : 0.05;
                            return <div key={d} className="h-[6px] w-[6px] rounded-[1.5px]" style={{ backgroundColor: `rgba(52,211,153,${op})` }} />;
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Dil bar */}
                <div className="border-t border-zinc-800/30 px-4 py-3">
                  <div className="flex h-1.5 w-full overflow-hidden rounded-full">
                    {LANGS.map((l) => (
                      <div key={l.name} style={{ width: `${l.pct}%`, backgroundColor: l.color }} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Tema noktaları */}
              <div className="mt-5 flex items-center justify-center gap-2.5">
                {["#34d399", "#a78bfa", "#fb7185", "#fbbf24", "#38bdf8", "#22d3ee"].map((c, i) => (
                  <div
                    key={c}
                    className="h-4 w-4 rounded-full transition-transform hover:scale-125 cursor-pointer"
                    style={{
                      backgroundColor: c,
                      boxShadow: i === 0 ? `0 0 0 2px #08080a, 0 0 0 3.5px ${c}` : `0 0 8px ${c}15`,
                    }}
                  />
                ))}
              </div>
            </div>
          </R>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
           SECTION 3 — Rakamlar
           ════════════════════════════════════════════════ */}
      <section className="relative z-10 border-y border-zinc-800/20 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <R>
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 sm:gap-10">
              {[
                { n: 21, l: "Widget" },
                { n: 10, l: "Wrapped Slayt" },
                { n: 8, l: "Badge" },
                { n: 6, l: "Tema" },
              ].map((item) => (
                <div key={item.l} className="text-center">
                  <p className="font-mono text-4xl font-black tracking-tighter text-zinc-100 sm:text-5xl"><Ct end={item.n} /></p>
                  <p className="mt-1 text-[10px] uppercase tracking-widest text-zinc-600">{item.l}</p>
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
            <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">
              GitHub hesabını bağla.
            </h2>
            <p className="mt-3 text-sm text-zinc-500">
              30 saniyede hazır. Ücretsiz. Açık kaynak.
            </p>
            <form action={signInAction} className="mt-10">
              <button
                type="submit"
                className="group inline-flex items-center gap-3 rounded-2xl bg-zinc-100 py-4 pl-6 pr-7 text-sm font-semibold text-zinc-900 shadow-lg shadow-emerald-500/5 transition-all hover:bg-white hover:shadow-xl hover:shadow-emerald-500/10 active:scale-[0.97]"
              >
                <GH className="h-[18px] w-[18px]" />
                <span>GitHub ile Başla</span>
                <svg className="h-4 w-4 text-zinc-400 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </form>
          </div>
        </R>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-800/20 px-5 py-6 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-2">
            <GH className="h-3 w-3 text-zinc-700" />
            <span className="text-[11px] text-zinc-700">Dev Analytics</span>
          </div>
          <p className="text-[10px] text-zinc-800">Açık kaynak · Sadece okuma izni · Veri yazılmaz</p>
        </div>
      </footer>
    </div>
  );
}
