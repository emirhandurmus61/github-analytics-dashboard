"use client";

import { useState } from "react";
import Link from "next/link";
import { calcRepoHealth, HEALTH_COLORS, type RepoHealth } from "@/lib/repo-health";
import { useThemeColors } from "@/components/theme-provider";

type RepoInput = {
  name: string;
  full_name: string;
  language: string | null;
  stars: number;
  forks: number;
  lastCommitDate: string | null;
  commitCount90d: number;
  openIssues: number;
  totalIssues: number;
  isArchived: boolean;
};

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
  Rust: "#dea584", Go: "#00ADD8", CSS: "#563d7c", HTML: "#e34c26",
  Java: "#b07219", "C++": "#f34b7d", "C#": "#178600", C: "#555555",
};

function ScoreRing({ score, color, size = 40 }: { score: number; color: string; size?: number }) {
  const r = (size - 6) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#27272a" strokeWidth={3} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
        fontSize={size < 44 ? 10 : 12} fontWeight="600" fill={color}
        transform={`rotate(90, ${size / 2}, ${size / 2})`}>
        {score}
      </text>
    </svg>
  );
}

function FactorBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-zinc-500">{label}</span>
        <span className="text-zinc-600">{value}/{max}</span>
      </div>
      <div className="h-1 w-full rounded-full bg-zinc-800 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function RepoRow({ repo, health }: { repo: RepoInput; health: RepoHealth }) {
  const [expanded, setExpanded] = useState(false);
  const color = HEALTH_COLORS[health.status];
  const langColor = repo.language ? (LANG_COLORS[repo.language] ?? "#6b7280") : null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-800/30 overflow-hidden">
      <button
        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-zinc-800/50 transition-colors text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <ScoreRing score={health.score} color={color} size={38} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {langColor && <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: langColor }} />}
            <span className="text-sm font-medium text-zinc-200 truncate">{repo.name}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            <span className="rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: `${color}18`, color }}>{health.label}</span>
            {repo.language && <span>{repo.language}</span>}
            <span>{repo.stars} stars</span>
          </div>
        </div>
        <svg className={`h-4 w-4 text-zinc-600 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-zinc-800 px-3 py-2.5 space-y-2">
          <FactorBar label="Guncellik" value={health.factors.recency} max={40} color={color} />
          <FactorBar label="Aktivite" value={health.factors.activity} max={30} color={color} />
          <FactorBar label="Topluluk" value={health.factors.community} max={20} color={color} />
          <FactorBar label="Issue" value={health.factors.issues} max={10} color={color} />
          <div className="flex gap-3 mt-2 pt-2 border-t border-zinc-800">
            <Link href={`/dashboard/repos/${repo.name}`} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors" onClick={(e) => e.stopPropagation()}>Detay</Link>
            <a href={`https://github.com/${repo.full_name}`} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors" onClick={(e) => e.stopPropagation()}>GitHub</a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RepoHealthList({ repos }: { repos: RepoInput[] }) {
  const theme = useThemeColors();
  const [sortBy, setSortBy] = useState<"score" | "name" | "activity">("score");

  if (repos.length === 0) return null;

  const withHealth = repos.map((repo) => ({
    repo,
    health: calcRepoHealth({
      lastCommitDate: repo.lastCommitDate,
      commitCount90d: repo.commitCount90d,
      stars: repo.stars,
      forks: repo.forks,
      openIssues: repo.openIssues,
      totalIssues: repo.totalIssues,
      isArchived: repo.isArchived,
    }),
  }));

  const sorted = [...withHealth].sort((a, b) => {
    if (sortBy === "score") return b.health.score - a.health.score;
    if (sortBy === "name") return a.repo.name.localeCompare(b.repo.name);
    return b.repo.commitCount90d - a.repo.commitCount90d;
  });

  const active = withHealth.filter((r) => r.health.status === "active").length;
  const slowing = withHealth.filter((r) => r.health.status === "slowing").length;
  const idle = withHealth.filter((r) => r.health.status === "idle").length;
  const archived = withHealth.filter((r) => r.health.status === "archived").length;
  const avgScore = Math.round(withHealth.reduce((s, r) => s + r.health.score, 0) / withHealth.length);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <h2 className="text-sm font-medium text-zinc-400">Repo Saglik Skoru</h2>
          <p className="text-xs text-zinc-600">{repos.length} repo</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-zinc-800 p-1 self-start">
          {(["score", "activity", "name"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className="rounded-md px-2.5 py-1 text-xs transition-colors"
              style={sortBy === key ? { backgroundColor: theme.accentBg, color: theme.accent } : { color: "#71717a" }}
            >
              {key === "score" ? "Skor" : key === "activity" ? "Aktivite" : "Isim"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-3 my-3 shrink-0">
        <div className="flex-1 flex h-2.5 rounded-full overflow-hidden gap-px">
          {active > 0 && <div className="h-full" style={{ width: `${(active / repos.length) * 100}%`, backgroundColor: HEALTH_COLORS.active }} />}
          {slowing > 0 && <div className="h-full" style={{ width: `${(slowing / repos.length) * 100}%`, backgroundColor: HEALTH_COLORS.slowing }} />}
          {idle > 0 && <div className="h-full" style={{ width: `${(idle / repos.length) * 100}%`, backgroundColor: HEALTH_COLORS.idle }} />}
          {archived > 0 && <div className="h-full" style={{ width: `${(archived / repos.length) * 100}%`, backgroundColor: HEALTH_COLORS.archived }} />}
        </div>
        <span className="text-sm text-zinc-500 shrink-0">
          Ort. <span className="font-bold text-base" style={{ color: theme.accent }}>{avgScore}</span>/100
        </span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs shrink-0 mb-3">
        {[
          { status: "active" as const, label: "Aktif", count: active },
          { status: "slowing" as const, label: "Yavasliyor", count: slowing },
          { status: "idle" as const, label: "Hareketsiz", count: idle },
          { status: "archived" as const, label: "Arsiv", count: archived },
        ].map(({ status, label, count }) => count > 0 && (
          <div key={status} className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: HEALTH_COLORS[status] }} />
            <span className="text-zinc-500">{label}</span>
            <span className="text-zinc-700">{count}</span>
          </div>
        ))}
      </div>

      {/* Repo list */}
      <div className="space-y-2 flex-1 min-h-0 overflow-auto custom-scroll">
        {sorted.map(({ repo, health }) => (
          <RepoRow key={repo.name} repo={repo} health={health} />
        ))}
      </div>
    </div>
  );
}
