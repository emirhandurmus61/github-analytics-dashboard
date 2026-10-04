"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { calcRepoHealth, HEALTH_COLORS, type RepoHealth, type HealthStatus } from "@/lib/repo-health";
import { useThemeColors } from "@/components/theme-provider";
import { useLanguage } from "@/lib/i18n";
import { Search, X, ChevronLeft, ChevronRight, Filter } from "lucide-react";

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

const STATUS_LABELS: Record<HealthStatus, { tr: string; en: string }> = {
  active: { tr: "Aktif", en: "Active" },
  slowing: { tr: "Yavaşlıyor", en: "Slowing" },
  idle: { tr: "Hareketsiz", en: "Idle" },
  archived: { tr: "Arşiv", en: "Archived" },
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

function RepoRow({ repo, health, lang }: { repo: RepoInput; health: RepoHealth; lang: string }) {
  const [expanded, setExpanded] = useState(false);
  const color = HEALTH_COLORS[health.status];
  const langColor = repo.language ? (LANG_COLORS[repo.language] ?? "#6b7280") : null;
  const statusLabel = STATUS_LABELS[health.status]?.[lang === "en" ? "en" : "tr"] ?? health.label;

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
            <span className="rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: `${color}18`, color }}>
              {statusLabel}
            </span>
            {repo.language && <span>{repo.language}</span>}
            <span>{repo.stars} star{lang === "en" && repo.stars !== 1 ? "s" : ""}</span>
          </div>
        </div>
        <svg className={`h-4 w-4 text-zinc-600 shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-zinc-800 px-3 py-2.5 space-y-2">
          <FactorBar label={lang === "en" ? "Recency" : "Güncellik"} value={health.factors.recency} max={40} color={color} />
          <FactorBar label={lang === "en" ? "Activity" : "Aktivite"} value={health.factors.activity} max={30} color={color} />
          <FactorBar label={lang === "en" ? "Community" : "Topluluk"} value={health.factors.community} max={20} color={color} />
          <FactorBar label="Issue" value={health.factors.issues} max={10} color={color} />
          <div className="flex gap-3 mt-2 pt-2 border-t border-zinc-800">
            <Link href={`/dashboard/repos/${repo.name}`} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors" onClick={(e) => e.stopPropagation()}>
              {lang === "en" ? "Details" : "Detay"}
            </Link>
            <a href={`https://github.com/${repo.full_name}`} target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors" onClick={(e) => e.stopPropagation()}>
              GitHub
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RepoHealthList({ repos }: { repos: RepoInput[] }) {
  const theme = useThemeColors();
  const { lang } = useLanguage();
  const [sortBy, setSortBy] = useState<"score" | "name" | "activity">("score");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<HealthStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(5);

  const withHealth = useMemo(() => {
    return repos.map((repo) => ({
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
  }, [repos]);

  const active = withHealth.filter((r) => r.health.status === "active").length;
  const slowing = withHealth.filter((r) => r.health.status === "slowing").length;
  const idle = withHealth.filter((r) => r.health.status === "idle").length;
  const archived = withHealth.filter((r) => r.health.status === "archived").length;
  const avgScore = withHealth.length > 0 ? Math.round(withHealth.reduce((s, r) => s + r.health.score, 0) / withHealth.length) : 0;

  const sorted = useMemo(() => {
    return [...withHealth].sort((a, b) => {
      if (sortBy === "score") return b.health.score - a.health.score;
      if (sortBy === "name") return a.repo.name.localeCompare(b.repo.name);
      return b.repo.commitCount90d - a.repo.commitCount90d;
    });
  }, [withHealth, sortBy]);

  const filtered = useMemo(() => {
    return sorted.filter(({ repo, health }) => {
      if (statusFilter !== "all" && health.status !== statusFilter) return false;
      if (search.trim() && !repo.name.toLowerCase().includes(search.toLowerCase().trim())) return false;
      return true;
    });
  }, [sorted, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleStatusFilter = (st: HealthStatus | "all") => {
    setStatusFilter((curr) => (curr === st ? "all" : st));
    setPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const handleSortChange = (key: "score" | "name" | "activity") => {
    setSortBy(key);
    setPage(1);
  };

  if (repos.length === 0) return null;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div>
          <h2 className="text-sm font-medium text-zinc-400">
            {lang === "en" ? "Repo Health Score" : "Repo Sağlık Skoru"}
          </h2>
          <p className="text-xs text-zinc-600">
            {filtered.length !== repos.length
              ? (lang === "en" ? `${filtered.length} of ${repos.length} repos` : `${repos.length} repodan ${filtered.length} tanesi`)
              : `${repos.length} repo`}
          </p>
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-1 rounded-lg border border-zinc-800 p-1 self-start">
          {(["score", "activity", "name"] as const).map((key) => (
            <button
              key={key}
              onClick={() => handleSortChange(key)}
              className="rounded-md px-2.5 py-1 text-xs transition-colors"
              style={sortBy === key ? { backgroundColor: theme.accentBg, color: theme.accent } : { color: "#71717a" }}
            >
              {key === "score"
                ? (lang === "en" ? "Score" : "Skor")
                : key === "activity"
                ? (lang === "en" ? "Activity" : "Aktivite")
                : (lang === "en" ? "Name" : "İsim")}
            </button>
          ))}
        </div>
      </div>

      {/* Summary health bar with interactive click */}
      <div className="flex items-center gap-3 my-3 shrink-0">
        <div className="flex-1 flex h-2.5 rounded-full overflow-hidden gap-px cursor-pointer" title={lang === "en" ? "Click to filter" : "Filtrelemek için tıkla"}>
          {active > 0 && (
            <div
              className={`h-full transition-opacity ${statusFilter === "active" ? "ring-2 ring-emerald-400" : statusFilter !== "all" ? "opacity-30" : ""}`}
              style={{ width: `${(active / repos.length) * 100}%`, backgroundColor: HEALTH_COLORS.active }}
              onClick={() => handleStatusFilter("active")}
            />
          )}
          {slowing > 0 && (
            <div
              className={`h-full transition-opacity ${statusFilter === "slowing" ? "ring-2 ring-amber-400" : statusFilter !== "all" ? "opacity-30" : ""}`}
              style={{ width: `${(slowing / repos.length) * 100}%`, backgroundColor: HEALTH_COLORS.slowing }}
              onClick={() => handleStatusFilter("slowing")}
            />
          )}
          {idle > 0 && (
            <div
              className={`h-full transition-opacity ${statusFilter === "idle" ? "ring-2 ring-orange-400" : statusFilter !== "all" ? "opacity-30" : ""}`}
              style={{ width: `${(idle / repos.length) * 100}%`, backgroundColor: HEALTH_COLORS.idle }}
              onClick={() => handleStatusFilter("idle")}
            />
          )}
          {archived > 0 && (
            <div
              className={`h-full transition-opacity ${statusFilter === "archived" ? "ring-2 ring-zinc-400" : statusFilter !== "all" ? "opacity-30" : ""}`}
              style={{ width: `${(archived / repos.length) * 100}%`, backgroundColor: HEALTH_COLORS.archived }}
              onClick={() => handleStatusFilter("archived")}
            />
          )}
        </div>
        <span className="text-sm text-zinc-500 shrink-0">
          {lang === "en" ? "Avg." : "Ort."} <span className="font-bold text-base" style={{ color: theme.accent }}>{avgScore}</span>/100
        </span>
      </div>

      {/* Filter Chips & Search Bar for Mobile Usability */}
      <div className="space-y-2 shrink-0 mb-3">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={lang === "en" ? "Search repos..." : "Repo ara..."}
            className="w-full bg-zinc-800/60 border border-zinc-800 rounded-lg pl-8 pr-8 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
          />
          {search && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status filter buttons */}
        <div className="flex flex-wrap gap-1.5 text-xs">
          <button
            onClick={() => handleStatusFilter("all")}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors"
            style={
              statusFilter === "all"
                ? { backgroundColor: theme.accentBg, color: theme.accent }
                : { backgroundColor: "rgba(39, 39, 42, 0.6)", color: "#71717a" }
            }
          >
            <span>{lang === "en" ? "All" : "Tümü"}</span>
            <span className="text-[10px] opacity-75">{repos.length}</span>
          </button>

          {[
            { status: "active" as const, label: lang === "en" ? "Active" : "Aktif", count: active },
            { status: "slowing" as const, label: lang === "en" ? "Slowing" : "Yavaşlıyor", count: slowing },
            { status: "idle" as const, label: lang === "en" ? "Idle" : "Hareketsiz", count: idle },
            { status: "archived" as const, label: lang === "en" ? "Archived" : "Arşiv", count: archived },
          ].map(({ status, label, count }) => count > 0 && (
            <button
              key={status}
              onClick={() => handleStatusFilter(status)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors"
              style={
                statusFilter === status
                  ? { backgroundColor: `${HEALTH_COLORS[status]}25`, color: HEALTH_COLORS[status], boxShadow: `0 0 0 1px ${HEALTH_COLORS[status]}` }
                  : { backgroundColor: "rgba(39, 39, 42, 0.6)", color: "#71717a" }
              }
            >
              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: HEALTH_COLORS[status] }} />
              <span>{label}</span>
              <span className="text-[10px] opacity-75">{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Repo list (paginated on mobile to prevent endless scrolling) */}
      <div className="space-y-2 flex-1 min-h-0 overflow-auto custom-scroll">
        {paginated.length > 0 ? (
          paginated.map(({ repo, health }) => (
            <RepoRow key={repo.name} repo={repo} health={health} lang={lang} />
          ))
        ) : (
          <div className="py-8 text-center text-xs text-zinc-500">
            <p>{lang === "en" ? "No repositories match criteria" : "Kriterlere uygun repo bulunamadı"}</p>
            {(statusFilter !== "all" || search) && (
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setSearch("");
                  setPage(1);
                }}
                className="mt-2 text-xs underline text-zinc-400 hover:text-zinc-200"
              >
                {lang === "en" ? "Clear filters" : "Filtreleri temizle"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mobile-friendly Pagination & View Controls */}
      {filtered.length > pageSize && (
        <div className="flex items-center justify-between pt-3 mt-2 border-t border-zinc-800 text-xs text-zinc-500 shrink-0">
          <span className="text-[11px]">
            {lang === "en"
              ? `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, filtered.length)} of ${filtered.length}`
              : `${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, filtered.length)} / ${filtered.length}`}
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1 rounded-md border border-zinc-800 bg-zinc-800/40 text-zinc-300 disabled:opacity-30 disabled:pointer-events-none hover:bg-zinc-800"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2 py-0.5 text-[11px] font-medium text-zinc-400">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1 rounded-md border border-zinc-800 bg-zinc-800/40 text-zinc-300 disabled:opacity-30 disabled:pointer-events-none hover:bg-zinc-800"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="ml-2 bg-zinc-800/80 border border-zinc-700/60 rounded px-1.5 py-0.5 text-[10px] text-zinc-300 focus:outline-none cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={filtered.length}>{lang === "en" ? "All" : "Tümü"}</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
