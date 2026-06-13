"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import {
  Search, Download, CalendarDays, Filter, X,
  ChevronDown, ChevronRight, GitCommit, Plus, Minus,
  Clock, FileCode, FolderGit2, Calendar,
} from "lucide-react";
import { useThemeColors } from "@/components/theme-provider";

/* ─── Tipler ─── */

type Commit = {
  sha: string;
  message: string;
  committed_at: string;
  additions: number;
  deletions: number;
  repo_name: string | null;
  repo_language: string | null;
};

type DayGroup = {
  date: string; // YYYY-MM-DD
  label: string; // "Pazartesi, 9 Haz"
  commits: Commit[];
};

type WeekGroup = {
  weekLabel: string; // "9–15 Haz 2025"
  weekStart: string; // YYYY-MM-DD
  days: DayGroup[];
  totalCommits: number;
};

type Props = {
  commits: Commit[];
  repos: string[];
  languages: string[];
  username: string;
};

/* ─── Yardımcılar ─── */

const DAYS_TR = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
const MONTHS_TR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const MONTHS_LONG_TR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

function fmtDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return `${DAYS_TR[d.getDay()]}, ${d.getDate()} ${MONTHS_TR[d.getMonth()]}`;
}

function fmtWeekRange(start: string, end: string) {
  const s = new Date(start + "T00:00:00");
  const e = new Date(end + "T00:00:00");
  if (s.getMonth() === e.getMonth()) {
    return `${s.getDate()}–${e.getDate()} ${MONTHS_TR[s.getMonth()]} ${s.getFullYear()}`;
  }
  return `${s.getDate()} ${MONTHS_TR[s.getMonth()]} – ${e.getDate()} ${MONTHS_TR[e.getMonth()]} ${e.getFullYear()}`;
}

function getCommitType(msg: string): string {
  const m = msg.toLowerCase().match(/^(feat|fix|chore|docs|style|refactor|test|perf|build|ci|revert|wip)(\(.+?\))?:/);
  return m ? m[1] : "other";
}

const TYPE_COLORS: Record<string, string> = {
  feat: "#4ade80",
  fix: "#f87171",
  chore: "#94a3b8",
  docs: "#60a5fa",
  style: "#f472b6",
  refactor: "#a78bfa",
  test: "#fbbf24",
  perf: "#34d399",
  build: "#fb923c",
  ci: "#22d3ee",
  revert: "#f43f5e",
  wip: "#e879f9",
  other: "#6b7280",
};

const TYPE_LABELS: Record<string, string> = {
  feat: "Özellik",
  fix: "Düzeltme",
  chore: "Bakım",
  docs: "Dokümantasyon",
  style: "Stil",
  refactor: "Refaktör",
  test: "Test",
  perf: "Performans",
  build: "Build",
  ci: "CI",
  revert: "Geri Al",
  wip: "WIP",
  other: "Diğer",
};

function groupCommitsByWeek(commits: Commit[]): WeekGroup[] {
  const dayMap = new Map<string, DayGroup>();

  for (const c of commits) {
    const date = c.committed_at.slice(0, 10);
    if (!dayMap.has(date)) {
      dayMap.set(date, { date, label: fmtDate(date), commits: [] });
    }
    dayMap.get(date)!.commits.push(c);
  }

  const sortedDays = [...dayMap.values()].sort((a, b) => b.date.localeCompare(a.date));

  const weekMap = new Map<string, WeekGroup>();
  for (const day of sortedDays) {
    const d = new Date(day.date + "T00:00:00");
    // Pazartesi başlangıcı
    const dow = (d.getDay() + 6) % 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - dow);
    const weekStart = monday.toISOString().slice(0, 10);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const weekEnd = sunday.toISOString().slice(0, 10);

    if (!weekMap.has(weekStart)) {
      weekMap.set(weekStart, {
        weekLabel: fmtWeekRange(weekStart, weekEnd),
        weekStart,
        days: [],
        totalCommits: 0,
      });
    }
    const wg = weekMap.get(weekStart)!;
    wg.days.push(day);
    wg.totalCommits += day.commits.length;
  }

  return [...weekMap.values()].sort((a, b) => b.weekStart.localeCompare(a.weekStart));
}

/* ─── Bileşenler ─── */

function CommitBadge({ type }: { type: string }) {
  const color = TYPE_COLORS[type] ?? TYPE_COLORS.other;
  return (
    <span
      className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
      style={{ backgroundColor: `${color}18`, color }}
    >
      {type}
    </span>
  );
}

function CommitRow({ commit, theme }: { commit: Commit; theme: ReturnType<typeof useThemeColors> }) {
  const type = getCommitType(commit.message);
  const firstLine = commit.message.split("\n")[0];
  const timeStr = new Date(commit.committed_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  const net = commit.additions - commit.deletions;

  return (
    <div
      className="group flex items-start gap-3 rounded-xl px-3 py-2.5 transition-all duration-150 hover:bg-zinc-800/40"
    >
      {/* Timeline nokta */}
      <div className="relative mt-1.5 shrink-0">
        <div
          className="h-2 w-2 rounded-full ring-2 ring-zinc-900"
          style={{ backgroundColor: TYPE_COLORS[type] ?? TYPE_COLORS.other }}
        />
      </div>

      {/* İçerik */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
          <CommitBadge type={type} />
          {commit.repo_name && (
            <span className="inline-flex items-center gap-1 text-[10px] text-zinc-600">
              <FolderGit2 size={9} />
              {commit.repo_name}
            </span>
          )}
        </div>
        <p className="text-sm text-zinc-300 leading-snug truncate">{firstLine}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2.5 text-[10px] text-zinc-600">
          <span className="font-mono">{commit.sha.slice(0, 7)}</span>
          <span className="flex items-center gap-0.5">
            <Clock size={9} />
            {timeStr}
          </span>
          {commit.additions > 0 && (
            <span className="flex items-center gap-0.5 text-emerald-600">
              <Plus size={9} />
              {commit.additions}
            </span>
          )}
          {commit.deletions > 0 && (
            <span className="flex items-center gap-0.5 text-red-600">
              <Minus size={9} />
              {commit.deletions}
            </span>
          )}
          {(commit.additions > 0 || commit.deletions > 0) && (
            <span style={{ color: net >= 0 ? "#4ade80" : "#f87171" }} className="font-medium">
              {net >= 0 ? "+" : ""}{net} net
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function DaySection({
  day,
  isExpanded,
  onToggle,
  theme,
}: {
  day: DayGroup;
  isExpanded: boolean;
  onToggle: () => void;
  theme: ReturnType<typeof useThemeColors>;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const isToday = day.date === today;

  return (
    <div className="relative">
      {/* Gün başlığı */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-zinc-800/30 text-left"
      >
        {isToday ? (
          <ChevronDown
            size={13}
            className="shrink-0 text-zinc-500 transition-transform duration-200"
            style={{ transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)" }}
          />
        ) : (
          <ChevronRight
            size={13}
            className="shrink-0 text-zinc-500 transition-transform duration-200"
            style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
          />
        )}
        <span
          className="text-xs font-semibold"
          style={{ color: isToday ? theme.accent : "#a1a1aa" }}
        >
          {isToday ? "Bugün" : day.label}
        </span>
        {isToday && (
          <span
            className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
            style={{ backgroundColor: `${theme.accent}18`, color: theme.accent }}
          >
            bugün
          </span>
        )}
        <span className="ml-auto shrink-0 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-500">
          {day.commits.length}
        </span>
      </button>

      {/* Commit listesi */}
      {isExpanded && (
        <div className="ml-4 border-l border-zinc-800/60 pl-2 mt-1 mb-2">
          {day.commits.map((c) => (
            <CommitRow key={c.sha} commit={c} theme={theme} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Ana Bileşen ─── */

export default function TimelineClient({ commits, repos, languages, username }: Props) {
  const theme = useThemeColors();

  const [search, setSearch] = useState("");
  const [repoFilter, setRepoFilter] = useState<string>("");
  const [langFilter, setLangFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [showToday, setShowToday] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(() => {
    const today = new Date().toISOString().slice(0, 10);
    return new Set([today]);
  });
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");
  const [showExportMenu, setShowExportMenu] = useState(false);

  const todayRef = useRef<HTMLDivElement>(null);

  const todayDate = new Date().toISOString().slice(0, 10);

  /* ─── Filtreleme ─── */
  const filtered = useMemo(() => {
    let out = commits;

    if (showToday) {
      out = out.filter((c) => c.committed_at.startsWith(todayDate));
    }

    if (repoFilter) {
      out = out.filter((c) => c.repo_name === repoFilter);
    }

    if (langFilter) {
      out = out.filter((c) => c.repo_language === langFilter);
    }

    if (typeFilter) {
      out = out.filter((c) => getCommitType(c.message) === typeFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(
        (c) =>
          c.message.toLowerCase().includes(q) ||
          c.sha.toLowerCase().startsWith(q) ||
          (c.repo_name?.toLowerCase().includes(q) ?? false)
      );
    }

    return out;
  }, [commits, search, repoFilter, langFilter, typeFilter, showToday, todayDate]);

  const weeks = useMemo(() => groupCommitsByWeek(filtered), [filtered]);

  /* ─── Bugün moduna git ─── */
  function goToday() {
    setShowToday(true);
    setExpandedDays((prev) => new Set([...prev, todayDate]));
    setTimeout(() => {
      todayRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  /* ─── Gün expand/collapse ─── */
  const toggleDay = useCallback((date: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  }, []);

  /* ─── Tümünü aç/kapat ─── */
  function expandAll() {
    const allDates = weeks.flatMap((w) => w.days.map((d) => d.date));
    setExpandedDays(new Set(allDates));
  }
  function collapseAll() {
    setExpandedDays(new Set());
  }

  /* ─── Export ─── */
  function doExport() {
    if (exportFormat === "csv") {
      const header = "sha,message,committed_at,additions,deletions,repo,language";
      const rows = filtered.map((c) =>
        [
          c.sha,
          `"${c.message.replace(/"/g, '""').split("\n")[0]}"`,
          c.committed_at,
          c.additions,
          c.deletions,
          c.repo_name ?? "",
          c.repo_language ?? "",
        ].join(",")
      );
      const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `commits_${username}_${todayDate}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `commits_${username}_${todayDate}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setShowExportMenu(false);
  }

  /* ─── Özet istatistikler ─── */
  const totalAdd = filtered.reduce((s, c) => s + c.additions, 0);
  const totalDel = filtered.reduce((s, c) => s + c.deletions, 0);
  const uniqueRepos = new Set(filtered.map((c) => c.repo_name).filter(Boolean)).size;

  const activeFilters = [repoFilter, langFilter, typeFilter, search.trim(), showToday ? "today" : ""].filter(Boolean).length;

  function clearFilters() {
    setSearch("");
    setRepoFilter("");
    setLangFilter("");
    setTypeFilter("");
    setShowToday(false);
  }

  const COMMIT_TYPES = ["feat", "fix", "chore", "docs", "style", "refactor", "test", "perf", "wip", "other"];

  return (
    <div className="space-y-5">

      {/* ── Sayfa başlığı ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
              style={{ backgroundColor: `${theme.accent}18`, color: theme.accent, boxShadow: `0 0 14px ${theme.accent}25` }}
            >
              <CalendarDays size={17} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-zinc-100">Commit Zaman Çizelgesi</h1>
              <p className="text-xs text-zinc-500">Son 365 gün · {commits.length.toLocaleString("tr")} commit</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Bugün modu */}
          <button
            onClick={showToday ? () => { setShowToday(false); } : goToday}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all"
            style={{
              borderColor: showToday ? `${theme.accent}40` : "#3f3f46",
              backgroundColor: showToday ? `${theme.accent}12` : "transparent",
              color: showToday ? theme.accent : "#a1a1aa",
            }}
          >
            <Calendar size={12} />
            Bugün
          </button>

          {/* Tümünü aç/kapat */}
          <button
            onClick={expandAll}
            className="rounded-lg border border-zinc-800 px-2.5 py-1.5 text-[11px] text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
          >
            Tümünü Aç
          </button>
          <button
            onClick={collapseAll}
            className="rounded-lg border border-zinc-800 px-2.5 py-1.5 text-[11px] text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300"
          >
            Tümünü Kapat
          </button>

          {/* Export */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition-all hover:border-zinc-700 hover:text-zinc-200"
            >
              <Download size={12} />
              İndir
              <ChevronDown size={10} />
            </button>

            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 top-full z-40 mt-1.5 w-44 rounded-xl border border-zinc-800 bg-zinc-950 py-2 shadow-2xl">
                  <p className="px-3 pb-1.5 text-[10px] text-zinc-600 uppercase tracking-wider">Format</p>
                  {(["csv", "json"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setExportFormat(f)}
                      className="flex w-full items-center justify-between px-3 py-2 text-xs text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-200"
                    >
                      {f.toUpperCase()}
                      {exportFormat === f && (
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: theme.accent }}
                        />
                      )}
                    </button>
                  ))}
                  <div className="my-1 border-t border-zinc-800/60" />
                  <button
                    onClick={doExport}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium transition-colors hover:bg-zinc-800/60"
                    style={{ color: theme.accent }}
                  >
                    <Download size={11} />
                    {filtered.length} commit indir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Özet kartlar ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Commit", value: filtered.length.toLocaleString("tr"), icon: <GitCommit size={13} /> },
          { label: "Repo", value: uniqueRepos.toLocaleString("tr"), icon: <FolderGit2 size={13} /> },
          { label: "Eklenen", value: `+${totalAdd.toLocaleString("tr")}`, icon: <Plus size={13} />, color: "#4ade80" },
          { label: "Silinen", value: `-${totalDel.toLocaleString("tr")}`, icon: <Minus size={13} />, color: "#f87171" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2.5"
          >
            <div className="flex items-center gap-1.5 mb-1" style={{ color: s.color ?? "#6b7280" }}>
              {s.icon}
              <span className="text-[10px] uppercase tracking-wide text-zinc-500">{s.label}</span>
            </div>
            <p className="text-base font-bold" style={{ color: s.color ?? "#e4e4e7" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Filtreler ── */}
      <div
        className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4"
        style={{ borderColor: activeFilters > 0 ? `${theme.accentBorder}` : undefined }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Filter size={12} className="text-zinc-500" />
          <span className="text-xs text-zinc-500 font-medium">Filtrele</span>
          {activeFilters > 0 && (
            <button
              onClick={clearFilters}
              className="ml-auto flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <X size={10} />
              Temizle ({activeFilters})
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {/* Arama */}
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Mesaj, SHA veya repo ara…"
              className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 pl-7 pr-3 text-xs text-zinc-300 placeholder-zinc-700 outline-none transition-colors focus:border-zinc-600"
            />
          </div>

          {/* Repo filtresi */}
          <div className="relative">
            <FolderGit2 size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
            <select
              value={repoFilter}
              onChange={(e) => setRepoFilter(e.target.value)}
              className="w-full appearance-none rounded-lg border border-zinc-800 bg-zinc-950 py-2 pl-7 pr-3 text-xs text-zinc-300 outline-none transition-colors focus:border-zinc-600"
            >
              <option value="">Tüm repolar</option>
              {repos.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Dil filtresi */}
          <div className="relative">
            <FileCode size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
            <select
              value={langFilter}
              onChange={(e) => setLangFilter(e.target.value)}
              className="w-full appearance-none rounded-lg border border-zinc-800 bg-zinc-950 py-2 pl-7 pr-3 text-xs text-zinc-300 outline-none transition-colors focus:border-zinc-600"
            >
              <option value="">Tüm diller</option>
              {languages.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* Commit tipi filtresi */}
          <div className="relative">
            <GitCommit size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-600" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full appearance-none rounded-lg border border-zinc-800 bg-zinc-950 py-2 pl-7 pr-3 text-xs text-zinc-300 outline-none transition-colors focus:border-zinc-600"
            >
              <option value="">Tüm tipler</option>
              {COMMIT_TYPES.map((t) => (
                <option key={t} value={t}>{TYPE_LABELS[t] ?? t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tip hızlı seç */}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {COMMIT_TYPES.map((t) => {
            const color = TYPE_COLORS[t];
            const active = typeFilter === t;
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(active ? "" : t)}
                className="rounded-lg px-2 py-1 text-[10px] font-medium transition-all"
                style={{
                  backgroundColor: active ? `${color}22` : "#18181b",
                  color: active ? color : "#52525b",
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: active ? `${color}50` : "#27272a",
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Timeline ── */}
      {weeks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
          <CalendarDays size={40} className="mb-4 opacity-30" />
          <p className="text-sm">Filtrelere uyan commit bulunamadı</p>
          {activeFilters > 0 && (
            <button onClick={clearFilters} className="mt-2 text-xs underline underline-offset-2 hover:text-zinc-400 transition-colors">
              Filtreleri temizle
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {weeks.map((week) => (
            <div
              key={week.weekStart}
              id={week.weekStart === todayDate ? "today-week" : undefined}
              ref={week.days.some((d) => d.date === todayDate) ? todayRef : undefined}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden"
            >
              {/* Hafta başlığı */}
              <div
                className="flex items-center justify-between gap-3 px-4 py-3 border-b border-zinc-800/60"
                style={{
                  background: `linear-gradient(135deg, ${theme.accent}06 0%, transparent 60%)`,
                }}
              >
                <div className="flex items-center gap-2">
                  <CalendarDays size={13} style={{ color: theme.accent }} />
                  <span className="text-xs font-semibold text-zinc-300">{week.weekLabel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-600">{week.days.length} gün aktif</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{ backgroundColor: `${theme.accent}18`, color: theme.accent }}
                  >
                    {week.totalCommits}
                  </span>
                </div>
              </div>

              {/* Günler */}
              <div className="p-2 space-y-0.5">
                {week.days.map((day) => (
                  <DaySection
                    key={day.date}
                    day={day}
                    isExpanded={expandedDays.has(day.date)}
                    onToggle={() => toggleDay(day.date)}
                    theme={theme}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
