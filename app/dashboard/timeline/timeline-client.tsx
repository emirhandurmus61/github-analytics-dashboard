"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { Search, Download, X, ChevronRight, FolderGit2, ExternalLink, ChevronsUpDown, ChevronsDownUp, CalendarCheck } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, Kbd, Dot, Track } from "@/components/ui/primitives";
import { DiffSquares } from "@/app/dashboard/code-stats";
import { langColor } from "@/lib/ui/lang-colors";
import { MONTHS_SHORT, WEEKDAYS_SHORT, fmtCompact, fmtInt, cn, type Lang } from "@/lib/ui/format";

type Commit = {
  sha: string;
  message: string;
  committed_at: string;
  additions: number;
  deletions: number;
  repo_name: string | null;
  repo_language: string | null;
};

type Day = { date: string; commits: Commit[]; add: number; del: number };
type Week = { start: string; end: string; days: Day[]; total: number; perDay: number[] };

const TYPES = ["feat", "fix", "refactor", "chore", "docs", "test", "style", "perf", "build", "ci", "revert", "wip", "other"] as const;
type CType = (typeof TYPES)[number];

const TYPE_COLOR: Record<CType, string> = {
  feat: "var(--hue-green)",
  fix: "var(--hue-red)",
  refactor: "var(--hue-purple)",
  chore: "var(--ink-3)",
  docs: "var(--hue-blue)",
  test: "var(--hue-yellow)",
  style: "var(--hue-pink)",
  perf: "var(--hue-orange)",
  build: "var(--hue-cyan)",
  ci: "var(--hue-cyan)",
  revert: "var(--hue-pink)",
  wip: "var(--hue-orange)",
  other: "var(--ink-4)",
};

function typeOf(msg: string): CType {
  const m = msg.toLowerCase().match(/^(feat|fix|chore|docs|style|refactor|test|perf|build|ci|revert|wip)(\(.+?\))?!?:/);
  return (m?.[1] as CType) ?? "other";
}

const localDay = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function group(commits: Commit[]): Week[] {
  const days = new Map<string, Day>();
  for (const c of commits) {
    const k = localDay(c.committed_at);
    const d = days.get(k) ?? { date: k, commits: [], add: 0, del: 0 };
    d.commits.push(c);
    d.add += c.additions;
    d.del += c.deletions;
    days.set(k, d);
  }
  const weeks = new Map<string, Week>();
  for (const d of [...days.values()].sort((a, b) => b.date.localeCompare(a.date))) {
    const dt = new Date(d.date + "T12:00:00");
    const dow = (dt.getDay() + 6) % 7;
    const mon = new Date(dt);
    mon.setDate(dt.getDate() - dow);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    const key = localDay(mon.toISOString());
    const w = weeks.get(key) ?? { start: key, end: localDay(sun.toISOString()), days: [], total: 0, perDay: [0, 0, 0, 0, 0, 0, 0] };
    w.days.push(d);
    w.total += d.commits.length;
    w.perDay[dow] += d.commits.length;
    weeks.set(key, w);
  }
  return [...weeks.values()].sort((a, b) => b.start.localeCompare(a.start));
}

function weekLabel(w: Week, l: Lang) {
  const s = new Date(w.start + "T12:00:00");
  const e = new Date(w.end + "T12:00:00");
  const M = MONTHS_SHORT[l];
  return s.getMonth() === e.getMonth() ? `${s.getDate()}–${e.getDate()} ${M[s.getMonth()]} ${s.getFullYear()}` : `${s.getDate()} ${M[s.getMonth()]} – ${e.getDate()} ${M[e.getMonth()]} ${e.getFullYear()}`;
}

function isoWeekNo(start: string) {
  const d = new Date(start + "T12:00:00");
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - y.getTime()) / 86400000 + 1) / 7);
}

/** A dropdown filter that looks like a button. */
function Picker({ label, value, options, onChange, all }: { label: string; value: string; options: { v: string; label: string; color?: string }[]; onChange: (v: string) => void; all: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", off);
    return () => document.removeEventListener("mousedown", off);
  }, [open]);
  const cur = options.find((o) => o.v === value);
  return (
    <div className="relative" ref={ref}>
      <button type="button" className={cn("btn btn-sm", value && "!border-accent !text-accent")} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span className="text-ink-3 font-normal">{label}:</span>
        {cur?.color && <Dot color={cur.color} size={7} />}
        <span className="max-w-[12ch] truncate">{cur?.label ?? all}</span>
        <ChevronsUpDown className="!h-3 !w-3 text-ink-4" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-40 mt-1.5 max-h-72 w-56 overflow-y-auto surface-pop p-1 anim-pop">
          {[{ v: "", label: all } as { v: string; label: string; color?: string }, ...options].map((o) => (
            <button
              key={o.v || "__all"}
              type="button"
              onClick={() => {
                onChange(o.v);
                setOpen(false);
              }}
              className={cn("flex h-8 w-full items-center gap-2 rounded-[var(--r-control)] px-2 text-left text-[12.5px]", o.v === value ? "bg-raised text-ink" : "text-ink-2 hover:bg-raised")}
            >
              {o.color ? <Dot color={o.color} size={7} /> : <span className="w-[7px]" />}
              <span className="truncate font-mono">{o.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ c, username, l, open, onToggle }: { c: Commit; username: string; l: Lang; open: boolean; onToggle: () => void }) {
  const t = typeOf(c.message);
  const [head, ...rest] = c.message.split("\n");
  const body = rest.join("\n").trim();
  const m = head.match(/^(\w+)(\(.+?\))?(!)?:\s*(.*)$/);
  const time = new Date(c.committed_at).toLocaleTimeString(l === "en" ? "en-GB" : "tr-TR", { hour: "2-digit", minute: "2-digit" });
  return (
    <li className="relative">
      <span className="absolute left-[11px] top-0 bottom-0 w-px bg-line" aria-hidden />
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="group relative grid w-full grid-cols-[24px_minmax(0,1fr)] items-start gap-x-2 rounded-[var(--r-control)] py-1.5 pr-2 text-left hover:bg-raised md:grid-cols-[24px_68px_minmax(0,1fr)_auto]"
      >
        <span className="relative z-[1] mt-[5px] flex justify-center">
          <span className="size-[9px] rounded-full ring-[3px] ring-[var(--bg-0)] group-hover:ring-[var(--bg-2)]" style={{ background: TYPE_COLOR[t] }} />
        </span>
        <span className="hidden font-mono text-[12px] text-ink-4 md:block">{c.sha.slice(0, 7)}</span>
        <span className="min-w-0">
          <span className="block truncate font-mono text-[12.5px] text-ink-2">
            {m ? (
              <>
                <span style={{ color: TYPE_COLOR[t] }}>{m[1]}</span>
                {m[2] && <span className="text-ink-4">{m[2]}</span>}
                <span className="text-ink-4">{m[3] ?? ""}: </span>
                <span className="text-ink">{m[4]}</span>
              </>
            ) : (
              <span className="text-ink">{head || "(no message)"}</span>
            )}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11.5px] text-ink-3 md:hidden">
            <span className="font-mono text-ink-4">{c.sha.slice(0, 7)}</span>
            {c.repo_name && <span className="font-mono">{c.repo_name}</span>}
            <span className="font-mono num"><span className="text-good">+{c.additions}</span> <span className="text-bad">−{c.deletions}</span></span>
            <span className="font-mono">{time}</span>
          </span>
        </span>
        <span className="hidden items-center gap-3 md:flex">
          {c.repo_name && (
            <span className="inline-flex max-w-[16ch] items-center gap-1.5 truncate font-mono text-[11.5px] text-ink-3">
              <Dot color={langColor(c.repo_language)} size={6} />
              {c.repo_name}
            </span>
          )}
          <span className="w-[11ch] text-right font-mono text-[11.5px] num">
            <span className="text-good">+{fmtCompact(c.additions, l)}</span> <span className="text-bad">−{fmtCompact(c.deletions, l)}</span>
          </span>
          <span className="w-[5ch] text-right font-mono text-[11.5px] text-ink-4">{time}</span>
        </span>
      </button>
      {open && (
        <div className="relative ml-[34px] mb-2 mt-0.5 rounded-[var(--r-control)] border border-line bg-surface p-3 anim-fade">
          <div className="mb-2 flex flex-wrap items-center gap-2 font-mono text-[11.5px] text-ink-3">
            <span className="text-ink-2">{c.sha}</span>
            <DiffSquares add={c.additions} del={c.deletions} />
          </div>
          {body ? <pre className="whitespace-pre-wrap break-words font-mono text-[12px] leading-relaxed text-ink-2">{body}</pre> : <p className="text-[12px] text-ink-4">{l === "en" ? "No message body." : "Mesaj gövdesi yok."}</p>}
          {c.repo_name && (
            <a href={`https://github.com/${username}/${c.repo_name}/commit/${c.sha}`} target="_blank" rel="noopener noreferrer" className="mt-2.5 inline-flex items-center gap-1 text-[12px] text-accent hover:underline">
              {l === "en" ? "Open on GitHub" : "GitHub'da aç"} <ExternalLink size={11} />
            </a>
          )}
        </div>
      )}
    </li>
  );
}

export default function TimelineClient({ commits, repos, languages, username }: { commits: Commit[]; repos: string[]; languages: string[]; username: string }) {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const [q, setQ] = useState("");
  const [repo, setRepo] = useState("");
  const [langF, setLangF] = useState("");
  const [type, setType] = useState("");
  const [todayOnly, setTodayOnly] = useState(false);
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [exportOpen, setExportOpen] = useState(false);
  const [limit, setLimit] = useState(12);
  const searchRef = useRef<HTMLInputElement>(null);
  const today = localDay(new Date().toISOString());
  const T = (tr: string, en: string) => (l === "en" ? en : tr);

  // "/" focuses search while on this page (the palette still opens with ⌘K).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key === "f" && !e.metaKey && !e.ctrlKey && !["INPUT", "TEXTAREA"].includes(el.tagName)) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return commits.filter(
      (c) =>
        (!todayOnly || localDay(c.committed_at) === today) &&
        (!repo || c.repo_name === repo) &&
        (!langF || c.repo_language === langF) &&
        (!type || typeOf(c.message) === type) &&
        (!s || c.message.toLowerCase().includes(s) || c.sha.startsWith(s) || (c.repo_name?.toLowerCase().includes(s) ?? false)),
    );
  }, [commits, q, repo, langF, type, todayOnly, today]);

  const weeks = useMemo(() => group(filtered), [filtered]);
  const add = filtered.reduce((s, c) => s + c.additions, 0);
  const del = filtered.reduce((s, c) => s + c.deletions, 0);
  const typeCounts = useMemo(() => {
    const m = new Map<CType, number>();
    for (const c of filtered) m.set(typeOf(c.message), (m.get(typeOf(c.message)) ?? 0) + 1);
    return TYPES.map((t) => ({ t, n: m.get(t) ?? 0 })).filter((x) => x.n);
  }, [filtered]);
  const repoCounts = useMemo(() => {
    const m = new Map<string, { n: number; lang: string | null }>();
    for (const c of filtered) if (c.repo_name) m.set(c.repo_name, { n: (m.get(c.repo_name)?.n ?? 0) + 1, lang: c.repo_language });
    return [...m.entries()].sort((a, b) => b[1].n - a[1].n);
  }, [filtered]);
  const active = [q.trim(), repo, langF, type, todayOnly ? "1" : ""].filter(Boolean).length;
  const clear = () => {
    setQ("");
    setRepo("");
    setLangF("");
    setType("");
    setTodayOnly(false);
  };

  const toggleDay = useCallback((d: string) => {
    setCollapsed((prev) => {
      const n = new Set(prev);
      if (n.has(d)) n.delete(d);
      else n.add(d);
      return n;
    });
  }, []);

  function download(fmt: "csv" | "json") {
    const data =
      fmt === "csv"
        ? [
            "sha,message,committed_at,additions,deletions,repo,language",
            ...filtered.map((c) => [c.sha, `"${c.message.split("\n")[0].replace(/"/g, '""')}"`, c.committed_at, c.additions, c.deletions, c.repo_name ?? "", c.repo_language ?? ""].join(",")),
          ].join("\n")
        : JSON.stringify(filtered, null, 2);
    const blob = new Blob([data], { type: fmt === "csv" ? "text/csv" : "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `commits_${username}_${today}.${fmt}`;
    a.click();
    URL.revokeObjectURL(a.href);
    setExportOpen(false);
  }

  const flags = [repo && `--repo=${repo}`, type && `--type=${type}`, langF && `--lang=${langF}`, todayOnly && "--today", q.trim() && `--grep="${q.trim()}"`].filter(Boolean).join(" ");

  return (
    <div>
      <PageHeader
        title={T("Zaman çizelgesi", "Timeline")}
        command={`log --since=1y --graph${flags ? " " + flags : ""}`}
        subtitle={T(`Son bir yılın ${fmtInt(commits.length, l)} commiti, ${repos.length} repoda`, `${fmtInt(commits.length, l)} commits over the last year, across ${repos.length} repos`)}
      />

      {/* Toolbar */}
      <div className="sticky top-0 md:top-11 z-20 -mx-4 mb-4 border-y border-line bg-[color-mix(in_oklab,var(--bg-0)_92%,transparent)] px-4 py-2.5 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 [[data-ui=terminal]_&]:md:top-7 [[data-ui=studio]_&]:md:top-16">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-[200px] flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-4" />
            <input ref={searchRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder={T("mesaj, sha veya repo", "message, sha or repo")} className="input !h-[26px] !pl-8 !pr-8 font-mono !text-[12.5px]" aria-label={T("Commit ara", "Search commits")} />
            {q ? (
              <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink" onClick={() => setQ("")} aria-label={T("Temizle", "Clear")}>
                <X size={13} />
              </button>
            ) : (
              <Kbd className="absolute right-1.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex">F</Kbd>
            )}
          </label>
          <Picker label="repo" value={repo} onChange={setRepo} all={T("tümü", "all")} options={repos.map((r) => ({ v: r, label: r }))} />
          <Picker label={T("dil", "lang")} value={langF} onChange={setLangF} all={T("tümü", "all")} options={languages.map((x) => ({ v: x, label: x, color: langColor(x) }))} />
          <Picker label={T("tür", "type")} value={type} onChange={setType} all={T("tümü", "all")} options={TYPES.map((t) => ({ v: t, label: t, color: TYPE_COLOR[t] }))} />
          <button type="button" className={cn("btn btn-sm", todayOnly && "!border-accent !text-accent")} aria-pressed={todayOnly} onClick={() => setTodayOnly((v) => !v)}>
            <CalendarCheck /> {T("Bugün", "Today")}
          </button>
          {active > 0 && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={clear}>
              <X /> {T("Filtreleri temizle", "Clear filters")}
            </button>
          )}
          <div className="ml-auto flex items-center gap-1">
            <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => setCollapsed(new Set())} title={T("Tümünü aç", "Expand all")} aria-label={T("Tümünü aç", "Expand all")}>
              <ChevronsUpDown />
            </button>
            <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => setCollapsed(new Set(weeks.flatMap((w) => w.days.map((d) => d.date))))} title={T("Tümünü kapat", "Collapse all")} aria-label={T("Tümünü kapat", "Collapse all")}>
              <ChevronsDownUp />
            </button>
            <div className="relative">
              <button type="button" className="btn btn-sm" onClick={() => setExportOpen((v) => !v)} aria-expanded={exportOpen}>
                <Download /> {T("Dışa aktar", "Export")}
              </button>
              {exportOpen && (
                <div className="absolute right-0 top-full z-40 mt-1.5 w-44 surface-pop p-1 anim-pop">
                  {(["csv", "json"] as const).map((f) => (
                    <button key={f} type="button" onClick={() => download(f)} className="flex h-8 w-full items-center justify-between rounded-[var(--r-control)] px-2 text-[12.5px] text-ink-2 hover:bg-raised">
                      <span className="font-mono">.{f}</span>
                      <span className="font-mono text-[11px] text-ink-4">{filtered.length}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        {/* Log */}
        <div className="min-w-0">
          {weeks.length === 0 ? (
            <div className="rounded-panel border border-dashed border-line-strong px-6 py-12 text-center">
              <p className="text-[14px] text-ink-2">{T("Bu filtrelerle eşleşen commit yok.", "No commits match these filters.")}</p>
              {active > 0 && (
                <button type="button" className="btn btn-sm mt-3" onClick={clear}>
                  {T("Filtreleri temizle", "Clear filters")}
                </button>
              )}
            </div>
          ) : (
            <ol className="flex flex-col gap-6">
              {weeks.slice(0, limit).map((w) => {
                const max = Math.max(...w.perDay, 1);
                return (
                  <li key={w.start}>
                    <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-mono text-[12px] font-semibold text-accent">{T("hf", "wk")} {isoWeekNo(w.start)}</span>
                      <span className="text-[13px] font-semibold text-ink">{weekLabel(w, l)}</span>
                      <span className="font-mono text-[11.5px] text-ink-3">{w.total} commit</span>
                      <span className="ml-auto flex items-end gap-[3px] h-4" aria-hidden>
                        {w.perDay.map((v, i) => (
                          <span key={i} className="w-2.5 rounded-[2px]" title={`${WEEKDAYS_SHORT[l][i]} ${v}`} style={{ height: `${v ? Math.max(25, (v / max) * 100) : 12}%`, background: v ? "var(--heat-3)" : "var(--bg-3)" }} />
                        ))}
                      </span>
                    </div>
                    <div className="rounded-panel border border-line bg-surface">
                      {w.days.map((d, di) => {
                        const isOpen = !collapsed.has(d.date);
                        const dt = new Date(d.date + "T12:00:00");
                        return (
                          <section key={d.date} className={cn(di > 0 && "border-t border-line")}>
                            <button type="button" onClick={() => toggleDay(d.date)} aria-expanded={isOpen} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-raised">
                              <ChevronRight size={13} className={cn("shrink-0 text-ink-4 transition-transform", isOpen && "rotate-90")} />
                              <span className={cn("text-[12.5px] font-medium", d.date === today ? "text-accent" : "text-ink")}>
                                {d.date === today ? T("Bugün", "Today") : `${WEEKDAYS_SHORT[l][(dt.getDay() + 6) % 7]}, ${dt.getDate()} ${MONTHS_SHORT[l][dt.getMonth()]}`}
                              </span>
                              <span className="font-mono text-[11.5px] text-ink-4">{d.commits.length}</span>
                              <span className="ml-auto hidden items-center gap-2 font-mono text-[11.5px] num sm:flex">
                                <span className="text-good">+{fmtCompact(d.add, l)}</span>
                                <span className="text-bad">−{fmtCompact(d.del, l)}</span>
                                <DiffSquares add={d.add} del={d.del} size={8} />
                              </span>
                            </button>
                            {isOpen && (
                              <ul className="px-2 pb-2">
                                {d.commits.map((c) => (
                                  <Row key={c.sha} c={c} username={username} l={l} open={openRow === c.sha} onToggle={() => setOpenRow((v) => (v === c.sha ? null : c.sha))} />
                                ))}
                              </ul>
                            )}
                          </section>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
          {weeks.length > limit && (
            <div className="mt-5 flex justify-center">
              <button type="button" className="btn" onClick={() => setLimit((n) => n + 12)}>
                {T(`Daha eski haftalar (${weeks.length - limit})`, `Older weeks (${weeks.length - limit})`)}
              </button>
            </div>
          )}
        </div>

        {/* Summary */}
        <aside className="order-first xl:order-none">
          <div className="xl:sticky xl:top-28 flex flex-col gap-4">
            <Panel title={T("Özet", "Summary")} meta={active ? T("filtreli", "filtered") : T("1 yıl", "1 year")} className="!h-auto">
              <div className="grid grid-cols-3 gap-3 xl:grid-cols-1">
                <div>
                  <div className="figure text-[26px]">{fmtInt(filtered.length, l)}</div>
                  <div className="label mt-1">commit</div>
                </div>
                <div>
                  <div className="flex items-baseline gap-2 font-mono text-[15px] font-semibold num">
                    <span className="text-good">+{fmtCompact(add, l)}</span>
                    <span className="text-bad">−{fmtCompact(del, l)}</span>
                  </div>
                  <div className="label mt-1">{T("satır", "lines")}</div>
                </div>
                <div>
                  <div className="figure text-[20px]">{repoCounts.length}</div>
                  <div className="label mt-1">repo</div>
                </div>
              </div>
            </Panel>
            {typeCounts.length > 0 && (
              <Panel title={T("Türler", "Types")} className="!h-auto hidden sm:flex">
                <ul className="flex flex-col gap-1.5">
                  {typeCounts.map(({ t, n }) => (
                    <li key={t}>
                      <button type="button" onClick={() => setType((v) => (v === t ? "" : t))} className={cn("w-full text-left", type && type !== t && "opacity-40")}>
                        <div className="mb-0.5 flex justify-between font-mono text-[11.5px]">
                          <span style={{ color: TYPE_COLOR[t] }}>{t}</span>
                          <span className="text-ink-4">{n}</span>
                        </div>
                        <Track value={n} max={typeCounts[0] ? Math.max(...typeCounts.map((x) => x.n)) : 1} color={TYPE_COLOR[t]} height={3} />
                      </button>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
            {repoCounts.length > 0 && (
              <Panel title="Repo" icon={FolderGit2} className="!h-auto hidden xl:flex">
                <ul className="flex flex-col gap-1">
                  {repoCounts.slice(0, 8).map(([name, v]) => (
                    <li key={name}>
                      <button type="button" onClick={() => setRepo((r) => (r === name ? "" : name))} className={cn("flex w-full items-center gap-2 text-left text-[12.5px]", repo && repo !== name && "opacity-40")}>
                        <Dot color={langColor(v.lang)} size={7} />
                        <span className="truncate font-mono text-ink-2">{name}</span>
                        <span className="ml-auto font-mono text-[11.5px] text-ink-4">{v.n}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </Panel>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
