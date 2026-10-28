"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { HeartPulse, Search, X, ChevronDown, ExternalLink, ArrowUpDown } from "lucide-react";
import { calcRepoHealth, type RepoHealth, type HealthStatus } from "@/lib/repo-health";
import { useLanguage } from "@/lib/i18n";
import { Panel, Dot, Track } from "@/components/ui/primitives";
import { useWidgetSize } from "@/components/ui/widget-size";
import { Ring } from "./goal-tracker";
import { langColor } from "@/lib/ui/lang-colors";
import { timeAgo, cn, type Lang } from "@/lib/ui/format";
import type { RepoHealthRow } from "./types";

export const HEALTH: Record<HealthStatus, { color: string; tr: string; en: string }> = {
  active: { color: "var(--hue-green)", tr: "aktif", en: "active" },
  slowing: { color: "var(--hue-yellow)", tr: "yavaşlıyor", en: "slowing" },
  idle: { color: "var(--ink-3)", tr: "durgun", en: "idle" },
  archived: { color: "var(--line-2)", tr: "arşiv", en: "archived" },
};
const ORDER: HealthStatus[] = ["active", "slowing", "idle", "archived"];

type Row = { repo: RepoHealthRow; health: RepoHealth };

function Score({ v, status }: { v: number; status: HealthStatus }) {
  return (
    <span className="inline-flex w-9 justify-center rounded-[4px] py-0.5 font-mono text-[11.5px] font-semibold num" style={{ color: HEALTH[status].color, background: `color-mix(in oklab, ${HEALTH[status].color} 14%, transparent)` }}>
      {v}
    </span>
  );
}

export default function RepoHealthList({ repos }: { repos: RepoHealthRow[] }) {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const { shape, w, h } = useWidgetSize();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<HealthStatus | "all">("all");
  const [sort, setSort] = useState<"score" | "activity" | "name">("score");
  const [open, setOpen] = useState<string | null>(null);
  const title = l === "en" ? "Repo health" : "Repo sağlığı";

  const rows: Row[] = useMemo(
    () =>
      repos.map((repo) => ({
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
      })),
    [repos],
  );
  const by = Object.fromEntries(ORDER.map((s) => [s, rows.filter((r) => r.health.status === s).length])) as Record<HealthStatus, number>;
  const avg = rows.length ? Math.round(rows.reduce((s, r) => s + r.health.score, 0) / rows.length) : 0;

  const list = useMemo(() => {
    const f = rows.filter((r) => (status === "all" || r.health.status === status) && (!q || r.repo.name.toLowerCase().includes(q.toLowerCase())));
    return f.sort((a, b) => (sort === "score" ? b.health.score - a.health.score : sort === "activity" ? b.repo.commitCount90d - a.repo.commitCount90d : a.repo.name.localeCompare(b.repo.name)));
  }, [rows, status, q, sort]);

  if (!rows.length) {
    return (
      <Panel title={title} icon={HeartPulse}>
        <p className="text-[12.5px] text-ink-3">{l === "en" ? "No repositories of your own yet." : "Henüz kendine ait repo yok."}</p>
      </Panel>
    );
  }

  const dist = (height = 8) => (
    <div className="flex w-full overflow-hidden rounded-full gap-px bg-inset" style={{ height }}>
      {ORDER.map((s) =>
        by[s] ? (
          <button
            key={s}
            type="button"
            title={`${HEALTH[s][l]}: ${by[s]}`}
            onClick={() => setStatus((c) => (c === s ? "all" : s))}
            className={cn("h-full transition-opacity", status !== "all" && status !== s && "opacity-30")}
            style={{ width: `${(by[s] / rows.length) * 100}%`, background: HEALTH[s].color }}
          />
        ) : null,
      )}
    </div>
  );
  const legend = (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {ORDER.map((s) =>
        by[s] ? (
          <button key={s} type="button" onClick={() => setStatus((c) => (c === s ? "all" : s))} className={cn("inline-flex items-center gap-1.5 text-[12px]", status === s ? "text-ink" : "text-ink-3 hover:text-ink")}>
            <Dot color={HEALTH[s].color} size={7} />
            {HEALTH[s][l]}
            <span className="font-mono text-[11px] text-ink-4">{by[s]}</span>
          </button>
        ) : null,
      )}
    </div>
  );
  const ring = (size: number) => (
    <Ring value={avg} max={100} size={size} stroke={Math.round(size / 10)} color={avg >= 65 ? "var(--hue-green)" : avg >= 35 ? "var(--hue-yellow)" : "var(--ink-3)"}>
      <div className="text-center">
        <div className="figure" style={{ fontSize: size * 0.26 }}>{avg}</div>
      </div>
    </Ring>
  );

  return (
    <Panel title={title} icon={HeartPulse} meta={`${l === "en" ? "avg" : "ort."} ${avg}/100`}>
      {shape === "glance" && (
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3">
            {ring(56)}
            <div className="min-w-0 text-[12px] text-ink-3 leading-snug">
              <div><span className="font-mono text-ink">{by.active}</span> {HEALTH.active[l]}</div>
              <div><span className="font-mono text-ink">{by.slowing + by.idle}</span> {l === "en" ? "need care" : "ilgi bekliyor"}</div>
            </div>
          </div>
          <div className="mt-auto">{dist(6)}</div>
        </div>
      )}

      {shape === "strip" && (
        <div className="flex h-full items-center gap-5">
          {ring(76)}
          <div className="flex-1 min-w-0 flex flex-col gap-2.5">
            {dist(10)}
            {legend}
          </div>
        </div>
      )}

      {shape === "column" && (
        <div className="flex h-full flex-col gap-3">
          <div className="flex items-center gap-3">
            {ring(64)}
            <div className="text-[12px] text-ink-3">{l === "en" ? `${rows.length} repos` : `${rows.length} repo`}</div>
          </div>
          {dist(8)}
          <div className="text-[11px] text-ink-4">{l === "en" ? "Needs attention" : "İlgi bekleyenler"}</div>
          <ul className="flex flex-col gap-1 overflow-hidden">
            {[...rows].filter((r) => r.health.status !== "archived").sort((a, b) => a.health.score - b.health.score).slice(0, h >= 3 ? 8 : 4).map(({ repo, health }) => (
              <li key={repo.name} className="flex items-center gap-2">
                <Score v={health.score} status={health.status} />
                <Link href={`/dashboard/repos/${repo.name}`} className="truncate font-mono text-[12px] text-ink-2 hover:text-accent">{repo.name}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {shape === "block" && (
        <div className="flex h-full flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative flex-1 min-w-[140px]">
              <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-4" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={l === "en" ? "Filter repos" : "Repo filtrele"} className="input !h-7 !pl-8 !text-[12.5px] font-mono" aria-label={l === "en" ? "Filter repos" : "Repo filtrele"} />
              {q && (
                <button type="button" className="absolute right-1.5 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink" onClick={() => setQ("")} aria-label={l === "en" ? "Clear" : "Temizle"}>
                  <X size={13} />
                </button>
              )}
            </label>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setSort((s) => (s === "score" ? "activity" : s === "activity" ? "name" : "score"))}
              title={l === "en" ? "Change sort" : "Sıralamayı değiştir"}
            >
              <ArrowUpDown />
              {sort === "score" ? (l === "en" ? "score" : "skor") : sort === "activity" ? (l === "en" ? "activity" : "aktivite") : l === "en" ? "name" : "isim"}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">{dist(6)}</div>
            {w >= 3 && legend}
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto -mx-1">
            <div className="sticky top-0 z-[1] grid grid-cols-[40px_minmax(0,1fr)_auto] @min-[520px]:grid-cols-[40px_minmax(0,1fr)_88px_86px_48px] gap-3 bg-surface px-1 pb-1.5 text-[11px] text-ink-4 border-b border-line">
              <span>{l === "en" ? "score" : "skor"}</span>
              <span>repo</span>
              <span className="hidden @min-[520px]:block">{l === "en" ? "status" : "durum"}</span>
              <span className="hidden @min-[520px]:block">{l === "en" ? "last commit" : "son commit"}</span>
              <span className="text-right">{l === "en" ? "90d" : "90g"}</span>
            </div>
            {list.length === 0 ? (
              <div className="py-6 text-center text-[12.5px] text-ink-3">
                {l === "en" ? "No repo matches." : "Eşleşen repo yok."}{" "}
                <button type="button" className="text-accent hover:underline" onClick={() => { setQ(""); setStatus("all"); }}>
                  {l === "en" ? "Clear filters" : "Filtreleri temizle"}
                </button>
              </div>
            ) : (
              list.map(({ repo, health }) => {
                const isOpen = open === repo.name;
                return (
                  <div key={repo.name} className="border-b border-line last:border-0">
                    <button type="button" onClick={() => setOpen(isOpen ? null : repo.name)} className="grid w-full grid-cols-[40px_minmax(0,1fr)_auto] @min-[520px]:grid-cols-[40px_minmax(0,1fr)_88px_86px_48px] items-center gap-3 px-1 py-1.5 text-left hover:bg-raised rounded-[var(--r-control)]" aria-expanded={isOpen}>
                      <Score v={health.score} status={health.status} />
                      <span className="flex items-center gap-2 min-w-0">
                        <Dot color={langColor(repo.language)} size={7} />
                        <span className="truncate font-mono text-[12.5px] text-ink">{repo.name}</span>
                        <ChevronDown size={12} className={cn("shrink-0 text-ink-4 transition-transform", isOpen && "rotate-180")} />
                      </span>
                      <span className="hidden @min-[520px]:inline-flex items-center gap-1.5 text-[12px]" style={{ color: HEALTH[health.status].color }}>
                        <Dot color={HEALTH[health.status].color} size={6} />
                        {HEALTH[health.status][l]}
                      </span>
                      <span className="hidden @min-[520px]:block font-mono text-[11.5px] text-ink-3">{timeAgo(repo.lastCommitDate, l)}</span>
                      <span className="text-right font-mono text-[12px] text-ink-2 num">{repo.commitCount90d}</span>
                    </button>
                    {isOpen && (
                      <div className="grid gap-x-6 gap-y-2 px-1 pb-3 pt-1 @min-[420px]:grid-cols-2 anim-fade">
                        {(
                          [
                            [l === "en" ? "Recency" : "Güncellik", health.factors.recency, 40],
                            [l === "en" ? "Activity" : "Aktivite", health.factors.activity, 30],
                            [l === "en" ? "Community" : "Topluluk", health.factors.community, 20],
                            ["Issue", health.factors.issues, 10],
                          ] as const
                        ).map(([k, v, m]) => (
                          <div key={k}>
                            <div className="mb-1 flex justify-between text-[11.5px]">
                              <span className="text-ink-3">{k}</span>
                              <span className="font-mono text-ink-2">{v}/{m}</span>
                            </div>
                            <Track value={v} max={m} color={HEALTH[health.status].color} height={4} />
                          </div>
                        ))}
                        <div className="flex gap-3 @min-[420px]:col-span-2 text-[12px]">
                          <Link href={`/dashboard/repos/${repo.name}`} className="text-accent hover:underline">{l === "en" ? "Open details" : "Detayları aç"}</Link>
                          <a href={`https://github.com/${repo.full_name}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-ink-3 hover:text-ink">
                            GitHub <ExternalLink size={11} />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}
