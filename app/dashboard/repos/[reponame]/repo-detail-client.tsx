"use client";

import Link from "next/link";
import { useState } from "react";
import { useThemeColors } from "@/components/theme-provider";
import { useLanguage } from "@/lib/i18n";
import {
  ChevronLeft, Star, GitFork, GitPullRequest, CircleDot,
  TrendingUp, Clock, Share2, Check, ExternalLink, Activity,
  GitCommit, Code2, Zap, Calendar,
} from "lucide-react";
import type { RepoHealth } from "@/lib/repo-health";

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
  Rust: "#dea584", Go: "#00ADD8", CSS: "#563d7c", HTML: "#e34c26",
  Java: "#b07219", "C++": "#f34b7d", "C#": "#178600", C: "#555555",
  Swift: "#F05138", Kotlin: "#7F52FF", Ruby: "#701516", Dart: "#00B4AB",
  Shell: "#89e051", PHP: "#4F5D95", Scala: "#c22d40",
};

const HEALTH_LABEL: Record<string, { tr: string; en: string }> = {
  active: { tr: "Aktif", en: "Active" },
  slowing: { tr: "Yavaşlıyor", en: "Slowing" },
  idle: { tr: "Hareketsiz", en: "Idle" },
  archived: { tr: "Arşiv", en: "Archived" },
};

type Props = {
  repo: {
    name: string;
    full_name: string;
    description: string | null;
    language: string | null;
    stars: number;
    forks: number;
    created_at: string | null;
  };
  commits: { total: number; totalAdded: number; totalDeleted: number };
  langs: { language: string; bytes: number; pct: number }[];
  heatmapDays: { date: string; count: number }[];
  heatmapMax: number;
  scatterData: { date: string; additions: number; deletions: number; message: string; sha: string }[];
  hourMap: number[];
  prs: { total: number; merged: number; open: number; avgMergeHours: number | null };
  issueTrend: { label: string; opened: number; closed: number }[];
  bigCommits: { sha: string; message: string; date: string; additions: number; deletions: number }[];
  health: RepoHealth;
  healthColor: string;
  username: string;
};

/* ─── Score ring ─── */
function ScoreRing({ score, color, size = 52 }: { score: number; color: string; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#27272a" strokeWidth={4} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 4px ${color}60)` }} />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        fontSize={13} fontWeight="700" fill={color} transform={`rotate(90,${size / 2},${size / 2})`}>
        {score}
      </text>
    </svg>
  );
}

/* ─── Stat card ─── */
function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-zinc-500 mb-1">{icon}<span className="text-xs">{label}</span></div>
      <p className="text-2xl font-bold tabular-nums" style={{ color: color ?? "#f4f4f5" }}>
        {typeof value === "number" ? value.toLocaleString("tr-TR") : value}
      </p>
      {sub && <p className="text-xs text-zinc-600">{sub}</p>}
    </div>
  );
}

/* ─── Section wrapper ─── */
function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  const theme = useThemeColors();
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: `${theme.accent}18`, color: theme.accent }}>
          {icon}
        </div>
        <h2 className="text-sm font-semibold text-zinc-300">{title}</h2>
      </div>
      {children}
    </div>
  );
}

/* ─── 52‑week heatmap ─── */
function WeeklyHeatmap({ days, max }: { days: { date: string; count: number }[]; max: number }) {
  const theme = useThemeColors();
  const { lang } = useLanguage();
  const MONTHS = lang === "tr"
    ? ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"]
    : ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const DAYS = lang === "tr"
    ? ["Pzt","","Çar","","Cum","","Paz"]
    : ["Mon","","Wed","","Fri","","Sun"];

  // weeks[col][row] = day
  const weeks: (typeof days[0] | null)[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7).concat(Array(7).fill(null)).slice(0, 7));
  }

  function cellColor(count: number) {
    if (count === 0) return "#1a1a1e";
    const t = count / max;
    if (t < 0.25) return theme.shades[0];
    if (t < 0.5)  return theme.shades[1];
    if (t < 0.75) return theme.shades[2];
    return theme.shades[3];
  }

  // Month labels — her ayın başlangıç sütununu bul
  const monthLabels: { col: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, col) => {
    const day = week.find((d) => d !== null);
    if (!day) return;
    const m = new Date(day.date).getMonth();
    if (m !== lastMonth) { monthLabels.push({ col, label: MONTHS[m] }); lastMonth = m; }
  });

  return (
    <div className="overflow-x-auto">
      {/* Month labels */}
      <div className="flex mb-1 ml-8" style={{ gap: "3px" }}>
        {weeks.map((_, col) => {
          const ml = monthLabels.find((m) => m.col === col);
          return (
            <div key={col} className="text-[9px] text-zinc-600 shrink-0" style={{ width: 12 }}>
              {ml ? ml.label : ""}
            </div>
          );
        })}
      </div>
      <div className="flex gap-0.5">
        {/* Day labels */}
        <div className="flex flex-col justify-between mr-1" style={{ gap: "3px" }}>
          {DAYS.map((d, i) => (
            <div key={i} className="text-[9px] text-zinc-600 h-3 flex items-center">{d}</div>
          ))}
        </div>
        {/* Grid */}
        {weeks.map((week, col) => (
          <div key={col} className="flex flex-col" style={{ gap: "3px" }}>
            {week.map((day, row) => (
              <div
                key={row}
                title={day ? `${day.date}: ${day.count} commit` : ""}
                className="rounded-sm shrink-0"
                style={{ width: 12, height: 12, backgroundColor: day ? cellColor(day.count) : "transparent" }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Scatter plot ─── */
function CommitScatter({ data, fullName }: {
  data: Props["scatterData"]; fullName: string;
}) {
  const theme = useThemeColors();
  const { lang } = useLanguage();
  if (data.length === 0) return <p className="text-sm text-zinc-600">{lang === "tr" ? "Değişiklik verisi yok" : "No change data"}</p>;

  const maxAdd = Math.max(...data.map((d) => d.additions), 1);
  const dates = data.map((d) => d.date).sort();
  const minDate = new Date(dates[0]).getTime();
  const maxDate = new Date(dates[dates.length - 1]).getTime();
  const dateRange = maxDate - minDate || 1;

  return (
    <div className="relative h-40 w-full">
      <svg className="w-full h-full" viewBox="0 0 400 160" preserveAspectRatio="none">
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map((t) => (
          <line key={t} x1={0} y1={160 - t * 140} x2={400} y2={160 - t * 140}
            stroke="#27272a" strokeWidth={1} />
        ))}
        {data.map((d, i) => {
          const x = ((new Date(d.date).getTime() - minDate) / dateRange) * 380 + 10;
          const y = 160 - (d.additions / maxAdd) * 140;
          const r = Math.max(2, Math.min(8, Math.sqrt((d.additions + d.deletions) / 50)));
          return (
            <g key={i}>
              <circle
                cx={x} cy={y} r={r}
                fill={`${theme.accent}60`}
                stroke={theme.accent}
                strokeWidth={1}
                className="hover:fill-opacity-100 cursor-pointer"
              >
                <title>{`${d.date} — ${d.message}\n+${d.additions} / -${d.deletions}`}</title>
              </circle>
            </g>
          );
        })}
      </svg>
      <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
        <span>{dates[0]}</span>
        <span className="text-zinc-700">{lang === "tr" ? "← commit büyüklüğü →" : "← commit size →"}</span>
        <span>{dates[dates.length - 1]}</span>
      </div>
    </div>
  );
}

/* ─── Hour distribution ─── */
function HourBars({ data }: { data: number[] }) {
  const theme = useThemeColors();
  const { lang } = useLanguage();
  const max = Math.max(...data, 1);
  const peakH = data.indexOf(Math.max(...data));
  return (
    <div>
      <div className="flex items-end gap-px h-16">
        {data.map((count, h) => (
          <div
            key={h}
            title={`${String(h).padStart(2, "0")}:00 — ${count} commit`}
            className="flex-1 rounded-t-sm transition-opacity hover:opacity-80"
            style={{
              height: `${Math.max((count / max) * 100, count > 0 ? 6 : 2)}%`,
              backgroundColor: h === peakH ? theme.accent : count > 0 ? theme.shades[1] : "#1a1a1e",
            }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-zinc-700 mt-1">
        <span>00:00</span>
        <span style={{ color: theme.accent }}>
          {lang === "tr" ? "Pik" : "Peak"}: {String(peakH).padStart(2, "0")}:00
        </span>
        <span>23:00</span>
      </div>
    </div>
  );
}

/* ─── Issue trend bar chart ─── */
function IssueTrend({ data }: { data: Props["issueTrend"] }) {
  const theme = useThemeColors();
  const { lang } = useLanguage();
  const maxVal = Math.max(...data.flatMap((d) => [d.opened, d.closed]), 1);
  if (data.every((d) => d.opened === 0 && d.closed === 0)) {
    return <p className="text-sm text-zinc-600">{lang === "tr" ? "Issue verisi yok" : "No issue data"}</p>;
  }
  return (
    <div>
      <div className="flex items-end gap-1 h-24">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex gap-px items-end" title={`${d.label}: ${d.opened} ${lang === "tr" ? "açıldı" : "opened"}, ${d.closed} ${lang === "tr" ? "kapandı" : "closed"}`}>
            <div
              className="flex-1 rounded-t-sm"
              style={{ height: `${Math.max((d.opened / maxVal) * 100, d.opened > 0 ? 6 : 0)}%`, backgroundColor: "#f43f5e80" }}
            />
            <div
              className="flex-1 rounded-t-sm"
              style={{ height: `${Math.max((d.closed / maxVal) * 100, d.closed > 0 ? 6 : 0)}%`, backgroundColor: `${theme.accent}80` }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
        <span>{data[0]?.label}</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500/70 inline-block"/>{lang === "tr" ? "Açıldı" : "Opened"}</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: `${theme.accent}80` }}/>{lang === "tr" ? "Kapandı" : "Closed"}</span>
        </div>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}

/* ─── Big commit timeline ─── */
function BigCommitList({ commits, fullName }: { commits: Props["bigCommits"]; fullName: string }) {
  const theme = useThemeColors();
  const { lang } = useLanguage();
  if (commits.length === 0) return <p className="text-sm text-zinc-600">{lang === "tr" ? "Veri yok" : "No data"}</p>;
  const maxLines = Math.max(...commits.map((c) => c.additions + c.deletions), 1);

  return (
    <div className="space-y-2">
      {commits.map((c, i) => {
        const total = c.additions + c.deletions;
        const pct = (total / maxLines) * 100;
        return (
          <a
            key={c.sha}
            href={`https://github.com/${fullName}/commit/${c.sha}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl border border-zinc-800 bg-zinc-800/30 px-3 py-2.5 hover:border-zinc-700 hover:bg-zinc-800/60 transition-all"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold tabular-nums text-zinc-500 shrink-0">#{i + 1}</span>
                <p className="text-xs text-zinc-300 truncate">{c.message}</p>
              </div>
              <span className="text-[10px] font-mono text-zinc-600 shrink-0">{c.sha}</span>
            </div>
            <div className="flex items-center gap-3 mb-1.5">
              <span className="text-[10px] text-zinc-600">{c.date}</span>
              <span className="text-[10px] text-emerald-500">+{c.additions.toLocaleString(lang === "tr" ? "tr-TR" : "en-US")}</span>
              <span className="text-[10px] text-red-500">-{c.deletions.toLocaleString(lang === "tr" ? "tr-TR" : "en-US")}</span>
              <span className="text-[10px] text-zinc-600">{total.toLocaleString(lang === "tr" ? "tr-TR" : "en-US")} {lang === "tr" ? "satır" : "lines"}</span>
            </div>
            {/* Additions/deletions bar */}
            <div className="h-1 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${theme.accent}60, ${theme.accent})`,
                }}
              />
            </div>
          </a>
        );
      })}
    </div>
  );
}

/* ─── Health score card ─── */
function HealthScoreCard({ health, color }: { health: RepoHealth; color: string }) {
  const { lang } = useLanguage();
  const FACTOR_LABELS = [
    { key: "recency" as const, label: lang === "tr" ? "Güncellik" : "Recency", max: 40, desc: lang === "tr" ? "Son commit ne kadar eski?" : "How recent is latest commit?" },
    { key: "activity" as const, label: lang === "tr" ? "Aktivite" : "Activity", max: 30, desc: lang === "tr" ? "Son 90 günde commit sayısı" : "Commits in last 90 days" },
    { key: "community" as const, label: lang === "tr" ? "Topluluk" : "Community", max: 20, desc: lang === "tr" ? "Star ve fork engagement'ı" : "Star & fork engagement" },
    { key: "issues" as const, label: lang === "tr" ? "Issue" : "Issues", max: 10, desc: lang === "tr" ? "Kapatılmamış issue oranı" : "Open issue ratio" },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4">
        <ScoreRing score={health.score} color={color} size={64} />
        <div>
          <p className="text-xl font-bold text-zinc-100">{health.score}<span className="text-sm text-zinc-600">/100</span></p>
          <span
            className="text-xs font-semibold rounded-full px-2.5 py-1"
            style={{ backgroundColor: `${color}18`, color }}
          >
            {HEALTH_LABEL[health.status]?.[lang] ?? health.status}
          </span>
        </div>
      </div>
      <div className="space-y-2 pt-1">
        {FACTOR_LABELS.map(({ key, label, max, desc }) => {
          const val = health.factors[key];
          const pct = (val / max) * 100;
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <div>
                  <span className="text-xs text-zinc-400 font-medium">{label}</span>
                  <span className="text-[10px] text-zinc-600 ml-2">{desc}</span>
                </div>
                <span className="text-xs tabular-nums" style={{ color }}>{val}/{max}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: color, boxShadow: `0 0 4px ${color}60` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main ─── */
export default function RepoDetailClient({
  repo, commits, langs, heatmapDays, heatmapMax,
  scatterData, hourMap, prs, issueTrend, bigCommits,
  health, healthColor, username,
}: Props) {
  const theme = useThemeColors();
  const { lang } = useLanguage();
  const [copied, setCopied] = useState(false);
  const langColor = repo.language ? (LANG_COLORS[repo.language] ?? "#6b7280") : null;

  function share() {
    navigator.clipboard.writeText(`${window.location.origin}/u/${username}`).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const hourMax = Math.max(...hourMap, 1);
  const peakHour = hourMap.indexOf(Math.max(...hourMap));

  return (
    <div className="space-y-5">

      {/* ── Geri ── */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <ChevronLeft size={15} />
        {lang === "tr" ? "Panoya Dön" : "Dashboard"}
      </Link>

      {/* ── Hero başlık ── */}
      <div
        className="rounded-2xl border p-5"
        style={{ borderColor: `${theme.accent}30`, background: `linear-gradient(135deg, ${theme.accent}10 0%, transparent 60%)` }}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 mb-1">
              {langColor && <div className="h-3.5 w-3.5 rounded-full shrink-0" style={{ backgroundColor: langColor }} />}
              <h1 className="text-2xl font-bold text-zinc-100 truncate">{repo.name}</h1>
              <span
                className="hidden sm:inline text-[10px] font-semibold rounded-full px-2 py-0.5 shrink-0"
                style={{ backgroundColor: `${healthColor}18`, color: healthColor }}
              >
                {HEALTH_LABEL[health.status]?.[lang] ?? health.status}
              </span>
            </div>
            {repo.description && <p className="text-sm text-zinc-500 mt-1 line-clamp-2">{repo.description}</p>}
            <div className="flex items-center gap-4 mt-3 text-xs text-zinc-500">
              <span className="flex items-center gap-1"><Star size={12} />{repo.stars}</span>
              <span className="flex items-center gap-1"><GitFork size={12} />{repo.forks}</span>
              {repo.language && (
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: langColor ?? "#6b7280" }} />
                  {repo.language}
                </span>
              )}
              {repo.created_at && (
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(repo.created_at).getFullYear()}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={share}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2 text-xs text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-all cursor-pointer"
            >
              {copied ? <Check size={12} className="text-emerald-400" /> : <Share2 size={12} />}
              {copied ? (lang === "tr" ? "Kopyalandı" : "Copied") : (lang === "tr" ? "Paylaş" : "Share")}
            </button>
            <a
              href={`https://github.com/${repo.full_name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2 text-xs text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-all"
            >
              <ExternalLink size={12} />
              GitHub
            </a>
          </div>
        </div>
      </div>

      {/* ── Özet stat kartlar ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={<GitCommit size={13} />}
          label={lang === "tr" ? "Commit (1 yıl)" : "Commits (1 year)"}
          value={commits.total}
          color={theme.accent}
        />
        <StatCard
          icon={<TrendingUp size={13} />}
          label={lang === "tr" ? "Eklenen Satır" : "Lines Added"}
          value={`+${commits.totalAdded.toLocaleString(lang === "tr" ? "tr-TR" : "en-US")}`}
          color="#4ade80"
        />
        <StatCard
          icon={<Zap size={13} />}
          label={lang === "tr" ? "Silinen Satır" : "Lines Deleted"}
          value={`-${commits.totalDeleted.toLocaleString(lang === "tr" ? "tr-TR" : "en-US")}`}
          color="#f87171"
        />
        <StatCard
          icon={<GitPullRequest size={13} />}
          label="PR"
          value={prs.total}
          sub={lang === "tr" ? `${prs.merged} merge, ${prs.open} açık` : `${prs.merged} merged, ${prs.open} open`}
          color="#a78bfa"
        />
      </div>

      {/* ── 52 haftalık heatmap ── */}
      <Section title={lang === "tr" ? "52 Haftalık Commit Haritası" : "52-Week Commit Heatmap"} icon={<Activity size={14} />}>
        {commits.total === 0 ? (
          <p className="text-sm text-zinc-600">{lang === "tr" ? "Commit verisi yok" : "No commit data"}</p>
        ) : (
          <WeeklyHeatmap days={heatmapDays} max={heatmapMax} />
        )}
      </Section>

      {/* ── Commit büyüklük scatter + saat dağılımı ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Section title={lang === "tr" ? "Commit Büyüklük Dağılımı" : "Commit Size Distribution"} icon={<TrendingUp size={14} />}>
            <p className="text-[10px] text-zinc-600 mb-3">
              {lang === "tr" ? "Her nokta bir commit — Y ekseni eklenen satır, boyut toplam değişiklik" : "Each dot is a commit — Y-axis additions, size total diff"}
            </p>
            <CommitScatter data={scatterData} fullName={repo.full_name} />
          </Section>
        </div>
        <Section title={lang === "tr" ? "Saat Dağılımı" : "Hourly Distribution"} icon={<Clock size={14} />}>
          <p className="text-[10px] text-zinc-600 mb-3">
            {lang === "tr" ? "Hangi saatte commit atıldı" : "Commit frequency by hour"}
          </p>
          <HourBars data={hourMap} />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-3 text-center">
              <p className="text-[10px] text-zinc-600 mb-1">{lang === "tr" ? "Pik Saat" : "Peak Hour"}</p>
              <p className="text-lg font-bold tabular-nums" style={{ color: theme.accent }}>
                {String(peakHour).padStart(2, "0")}:00
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-3 text-center">
              <p className="text-[10px] text-zinc-600 mb-1">{lang === "tr" ? "Toplam" : "Total"}</p>
              <p className="text-lg font-bold tabular-nums" style={{ color: theme.accent }}>
                {commits.total}
              </p>
            </div>
          </div>
        </Section>
      </div>

      {/* ── PR bilgisi + Issue trendi ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* PR */}
        <Section title={lang === "tr" ? "Pull Request Özeti" : "Pull Request Summary"} icon={<GitPullRequest size={14} />}>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: lang === "tr" ? "Toplam PR" : "Total PRs", value: prs.total, color: theme.accent },
              { label: lang === "tr" ? "Merge" : "Merged", value: prs.merged, color: "#4ade80" },
              { label: lang === "tr" ? "Açık" : "Open", value: prs.open, color: "#f59e0b" },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-3 text-center">
                <p className="text-[10px] text-zinc-600 mb-1">{label}</p>
                <p className="text-xl font-bold tabular-nums" style={{ color }}>{value}</p>
              </div>
            ))}
          </div>
          {prs.avgMergeHours !== null && (
            <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-800/30 px-3 py-2.5">
              <Clock size={13} className="text-zinc-500 shrink-0" />
              <div>
                <p className="text-xs text-zinc-400">{lang === "tr" ? "Ortalama Merge Süresi" : "Average Merge Time"}</p>
                <p className="text-sm font-bold" style={{ color: theme.accent }}>
                  {prs.avgMergeHours < 24
                    ? `${prs.avgMergeHours} ${lang === "tr" ? "saat" : "hours"}`
                    : `${Math.round(prs.avgMergeHours / 24)} ${lang === "tr" ? "gün" : "days"}`}
                </p>
              </div>
            </div>
          )}
          {prs.total === 0 && <p className="text-sm text-zinc-600">{lang === "tr" ? "PR verisi yok" : "No PR data"}</p>}
        </Section>

        {/* Issue trend */}
        <Section title={lang === "tr" ? "Issue Trendi (12 Ay)" : "Issue Trend (12 Months)"} icon={<CircleDot size={14} />}>
          <IssueTrend data={issueTrend} />
        </Section>
      </div>

      {/* ── En büyük commitler + Dil dağılımı ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Section title={lang === "tr" ? "En Büyük Commitler" : "Top Largest Commits"} icon={<Zap size={14} />}>
            <p className="text-[10px] text-zinc-600 mb-3">
              {lang === "tr" ? "Eklenen + silinen satır sayısına göre sıralanmış top 10" : "Top 10 sorted by additions + deletions"}
            </p>
            <BigCommitList commits={bigCommits} fullName={repo.full_name} />
          </Section>
        </div>

        {/* Dil + Sağlık */}
        <div className="space-y-4">
          {/* Dil dağılımı */}
          <Section title={lang === "tr" ? "Dil Dağılımı" : "Language Distribution"} icon={<Code2 size={14} />}>
            {langs.length === 0 ? (
              <p className="text-sm text-zinc-600">{lang === "tr" ? "Veri yok" : "No data"}</p>
            ) : (
              <div className="space-y-2.5">
                {langs.map(({ language, pct }) => {
                  const color = LANG_COLORS[language] ?? "#6b7280";
                  return (
                    <div key={language}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                          <span className="text-zinc-300">{language}</span>
                        </span>
                        <span className="text-zinc-500">{pct.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          {/* Repo sağlık skoru */}
          <Section title={lang === "tr" ? "Repo Sağlık Skoru" : "Repo Health Score"} icon={<Activity size={14} />}>
            <HealthScoreCard health={health} color={healthColor} />
          </Section>
        </div>
      </div>

    </div>
  );
}
