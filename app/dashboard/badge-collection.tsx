"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Rocket, Flame, Zap, Moon, Sunrise, Swords, Eraser, Globe, Globe2, Lock, Trophy, Gem, Languages, Hash, Award,
  Footprints, Package, Building2, GitMerge, Bug, Star, Crown, Check, Target, ChevronRight, ChevronLeft, X, Code,
  Hammer, Calendar, CalendarDays, FolderGit2, GitPullRequest, GitFork, Trash2, Shield, ShieldCheck, Users, Activity,
  Medal, Sun, Mountain, Compass, Search, Wrench, Layers, Milestone, CircleCheck, Landmark, Lightbulb, Sparkles,
  GitCommitHorizontal,
} from "lucide-react";
import { type Badge, type BadgeId, type BadgeSeries, getLocalizedBadge, getLocalizedSeriesInfo } from "@/lib/badges";
import { useLanguage } from "@/lib/i18n";
import { Panel, Seg, Track, Portal } from "@/components/ui/primitives";
import { useWidgetSize } from "@/components/ui/widget-size";
import { Ring } from "./goal-tracker";
import { fmtInt, cn, type Lang } from "@/lib/ui/format";

type Icon = React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;

const BADGE_ICON: Record<string, Icon> = {
  first_sync: Rocket, commit_1: Lightbulb, commit_25: Hammer, century: Hash, commit_500: Code, millennium: Award, commit_2500: Award,
  commit_5000: Crown, streak_3: Zap, streak_7: Flame, streak_14: Target, streak_30: Sparkles, streak_60: Activity, streak_100: Gem,
  dedicated: Crown, active_7: Calendar, active_30: CalendarDays, marathoner: Footprints, active_200: Compass, active_300: Medal,
  repo_3: FolderGit2, collector: Package, repo_25: Building2, repo_50: Landmark, lang_2: Globe, polyglot: Globe, hexaglot: Languages,
  lang_12: Sparkles, lines_1k: Layers, lines_10k: Wrench, lines_50k: Milestone, architect: Building2, lines_500k: Mountain,
  pr_3: GitPullRequest, pr_10: Users, merge_master: GitMerge, pr_50: Trophy, issue_5: Search, issue_15: CircleCheck, bug_hunter: Bug,
  issue_75: ShieldCheck, stars_5: Sparkles, stars_20: Star, stargazer: Star, stars_100: Sun, night_owl: Moon, night_owl_2: Moon,
  early_bird: Sunrise, early_bird_2: Sun, weekend_warrior: Swords, weekend_warrior_2: Shield, open_source_1: GitFork, open_source: Globe2,
  cleanup_1: Eraser, big_cleanup: Trash2,
};

const SERIES_ICON: Record<BadgeSeries, Icon> = {
  special: Rocket, commits: GitCommitHorizontal, streak: Flame, active_days: CalendarDays, repos: FolderGit2, languages: Languages,
  code_volume: Layers, pull_requests: GitPullRequest, issues: Bug, stars: Star, night_owl: Moon, early_bird: Sunrise, weekend: Swords,
  open_source: GitFork, cleanup: Eraser,
};

const SERIES: BadgeSeries[] = ["commits", "streak", "active_days", "repos", "languages", "code_volume", "pull_requests", "issues", "stars", "night_owl", "early_bird", "weekend", "open_source", "cleanup", "special"];

const RARITY: Record<Badge["rarity"], { color: string; tr: string; en: string }> = {
  common: { color: "var(--ink-2)", tr: "yaygın", en: "common" },
  rare: { color: "var(--hue-blue)", tr: "nadir", en: "rare" },
  epic: { color: "var(--hue-purple)", tr: "epik", en: "epic" },
};

type Filter = "all" | "next" | "earned" | "locked";

const short = (v?: number) => (v === undefined ? "" : v >= 1e6 ? `${v / 1e6}M` : v >= 1e3 ? `${v / 1e3}k` : `${v}`);
const pctOf = (b: Badge) => Math.min(100, Math.round(((b.current ?? 0) / Math.max(1, b.target ?? 1)) * 100));

/** shields.io-style two-part badge. */
export function Shield2({ left, right, color, earned, icon: I, size = "md" }: { left: string; right: string; color: string; earned: boolean; icon?: Icon; size?: "sm" | "md" }) {
  const h = size === "sm" ? 18 : 22;
  return (
    <span className="inline-flex max-w-full overflow-hidden rounded-[4px] font-mono leading-none" style={{ height: h, fontSize: size === "sm" ? 10.5 : 11.5 }}>
      <span className="flex items-center gap-1 bg-[var(--bg-3)] px-1.5 text-ink-2 min-w-0">
        {I && <I size={size === "sm" ? 10 : 12} strokeWidth={2} />}
        <span className="truncate">{left}</span>
      </span>
      <span
        className="flex items-center px-1.5 font-semibold whitespace-nowrap"
        style={earned ? { background: color, color: "var(--on-accent)" } : { color: "var(--ink-3)", boxShadow: "inset 0 0 0 1px var(--line-2)", borderRadius: "0 4px 4px 0" }}
      >
        {earned ? right : <span className="inline-flex items-center gap-1"><Lock size={9} />{right}</span>}
      </span>
    </span>
  );
}

function Pips({ list, current }: { list: Badge[]; current?: BadgeId }) {
  return (
    <span className="inline-flex gap-[3px]" aria-hidden>
      {list.map((b) => (
        <i key={b.id} className={cn("block h-1.5 w-3 rounded-[2px]", b.id === current && !b.earned && "ring-1 ring-accent")} style={{ background: b.earned ? "var(--accent)" : "var(--bg-3)" }} />
      ))}
    </span>
  );
}

/* ── Series detail dialog ────────────────────────────────────────────── */

function SeriesDialog({ series, all, onClose, onStep }: { series: BadgeSeries; all: Badge[]; onClose: () => void; onStep: (dir: -1 | 1) => void }) {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const info = getLocalizedSeriesInfo(series, l);
  const tiers = all.filter((b) => b.series === series).sort((a, b) => (a.tier ?? 0) - (b.tier ?? 0));
  const earned = tiers.filter((b) => b.earned).length;
  const SI = SERIES_ICON[series];

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onStep(1);
      if (e.key === "ArrowLeft") onStep(-1);
    };
    window.addEventListener("keydown", k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", k);
      document.body.style.overflow = prev;
    };
  }, [onClose, onStep]);

  return (
    <div className="fixed inset-0 z-[85] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-[var(--scrim)] anim-fade" onClick={onClose} />
      <div className="relative w-full sm:max-w-md surface-pop rounded-b-none sm:rounded-b-[calc(var(--r-panel)+2px)] max-h-[88vh] flex flex-col anim-sheet sm:anim-pop pb-[env(safe-area-inset-bottom)]" role="dialog" aria-modal aria-label={info.title}>
        <div className="flex items-center gap-3 border-b border-line px-4 h-12">
          <SI size={16} className="text-accent" />
          <h3 className="text-[14px] font-semibold text-ink truncate">{info.title}</h3>
          <span className="font-mono text-[11.5px] text-ink-3">{earned}/{tiers.length}</span>
          <div className="ml-auto flex gap-1">
            <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => onStep(-1)} aria-label={l === "en" ? "Previous series" : "Önceki seri"}><ChevronLeft /></button>
            <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => onStep(1)} aria-label={l === "en" ? "Next series" : "Sonraki seri"}><ChevronRight /></button>
            <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={onClose} aria-label={l === "en" ? "Close" : "Kapat"}><X /></button>
          </div>
        </div>
        <p className="px-4 pt-3 text-[12.5px] text-ink-3">{info.description}</p>
        <ol className="flex-1 overflow-y-auto px-4 py-3">
          {tiers.map((b, i) => {
            const I = BADGE_ICON[b.id] ?? Trophy;
            const next = !b.earned && (i === 0 || tiers[i - 1].earned);
            const r = RARITY[b.rarity];
            return (
              <li key={b.id} className="relative flex gap-3 pb-4 last:pb-0">
                {i < tiers.length - 1 && <span className="absolute left-[13px] top-7 bottom-0 w-px" style={{ background: b.earned ? "var(--accent)" : "var(--line-2)" }} />}
                <span
                  className={cn("relative z-[1] grid size-7 shrink-0 place-items-center rounded-full border", next && "ring-2 ring-accent ring-offset-2 ring-offset-[var(--bg-1)]")}
                  style={b.earned ? { background: "var(--accent)", borderColor: "transparent", color: "var(--on-accent)" } : { borderColor: "var(--line-2)", color: "var(--ink-3)", background: "var(--bg-1)" }}
                >
                  {b.earned ? <Check size={14} strokeWidth={3} /> : <I size={13} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[13px] font-medium", b.earned ? "text-ink" : "text-ink-2")}>{b.name}</span>
                    <span className="font-mono text-[10.5px]" style={{ color: r.color }}>{r[l]}</span>
                    <span className="ml-auto font-mono text-[11.5px] text-ink-3">{short(b.target)} {b.unit}</span>
                  </div>
                  <p className="text-[12px] text-ink-3 leading-snug">{b.description}</p>
                  {next && (
                    <div className="mt-1.5">
                      <Track value={pctOf(b)} height={4} />
                      <div className="mt-1 flex justify-between font-mono text-[10.5px] text-ink-4">
                        <span>{fmtInt(b.current ?? 0, l)} / {fmtInt(b.target ?? 0, l)}</span>
                        <span>{l === "en" ? `${fmtInt(Math.max(0, (b.target ?? 0) - (b.current ?? 0)), l)} to go` : `${fmtInt(Math.max(0, (b.target ?? 0) - (b.current ?? 0)), l)} kaldı`}</span>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

/* ── Collection ──────────────────────────────────────────────────────── */

export default function BadgeCollection({ badges }: { badges: Badge[] }) {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const { shape, w, h } = useWidgetSize();
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<BadgeSeries | null>(null);
  const list = useMemo(() => badges.map((b) => getLocalizedBadge(b, l)), [badges, l]);
  const earned = list.filter((b) => b.earned);
  const total = list.length;

  // One representative per series: the next tier to unlock, or the top tier when done.
  const series = useMemo(() => {
    return SERIES.map((s) => {
      const tiers = list.filter((b) => b.series === s).sort((a, b) => (a.tier ?? 0) - (b.tier ?? 0));
      if (!tiers.length) return null;
      const next = tiers.find((b) => !b.earned);
      const top = [...tiers].reverse().find((b) => b.earned);
      return { s, tiers, next, top, rep: next ?? tiers[tiers.length - 1], done: !next };
    }).filter(Boolean) as { s: BadgeSeries; tiers: Badge[]; next?: Badge; top?: Badge; rep: Badge; done: boolean }[];
  }, [list]);

  const shown = useMemo(() => {
    let x = series;
    if (filter === "earned") x = x.filter((s) => s.top);
    if (filter === "locked") x = x.filter((s) => !s.done);
    if (filter === "next") x = [...x].filter((s) => s.next).sort((a, b) => pctOf(b.next!) - pctOf(a.next!));
    return x;
  }, [series, filter]);

  const closest = series.filter((s) => s.next).sort((a, b) => pctOf(b.next!) - pctOf(a.next!))[0];

  const step = useCallback(
    (dir: -1 | 1) =>
      setOpen((cur) => {
        if (!cur) return cur;
        const i = series.findIndex((x) => x.s === cur);
        return series[(i + dir + series.length) % series.length].s;
      }),
    [series],
  );

  const title = l === "en" ? "Badges" : "Rozetler";
  const meta = `${earned.length}/${total}`;
  const tile = (x: (typeof series)[number]) => {
    const SI = SERIES_ICON[x.s];
    const info = getLocalizedSeriesInfo(x.s, l);
    const b = x.rep;
    const r = RARITY[(x.top ?? b).rarity];
    return (
      <button
        key={x.s}
        type="button"
        onClick={() => setOpen(x.s)}
        className="group flex min-w-0 flex-col gap-2 rounded-[var(--r-control)] border border-line bg-raised/60 p-2.5 text-left transition-colors hover:border-line-strong hover:bg-raised"
      >
        <Shield2 left={info.title} right={x.top ? `${short(x.top.target)} ${x.top.unit ?? ""}`.trim() : `${short(b.target)}`} color={r.color} earned={!!x.top} icon={SI} size="sm" />
        <div className="min-w-0">
          <div className="truncate text-[12.5px] font-medium text-ink">{x.done ? x.tiers[x.tiers.length - 1].name : b.name}</div>
          <div className="truncate text-[11.5px] text-ink-3">{x.done ? (l === "en" ? "Series complete" : "Seri tamam") : b.description}</div>
        </div>
        <div className="mt-auto flex items-center gap-2">
          <Pips list={x.tiers} current={x.next?.id} />
          {!x.done && <span className="ml-auto font-mono text-[10.5px] text-ink-3 num">{pctOf(b)}%</span>}
        </div>
      </button>
    );
  };

  return (
    <>
      <Panel
        title={title}
        icon={Award}
        meta={meta}
        actions={
          shape === "block" ? (
            <Seg
              size="sm"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: l === "en" ? "all" : "tümü" },
                { value: "next", label: l === "en" ? "next" : "sıradaki" },
                { value: "earned", label: l === "en" ? "earned" : "kazanılan" },
                { value: "locked", label: l === "en" ? "locked" : "kilitli" },
              ]}
            />
          ) : undefined
        }
      >
        {shape === "glance" && (
          <div className="flex h-full items-center gap-3">
            <Ring value={earned.length} max={total} size={60} stroke={6}>
              <span className="font-mono text-[11.5px] font-semibold text-ink">{earned.length}</span>
            </Ring>
            {closest?.next ? (
              <button type="button" className="min-w-0 text-left" onClick={() => setOpen(closest.s)}>
                <div className="text-[11px] text-ink-4">{l === "en" ? "closest" : "en yakın"}</div>
                <div className="truncate text-[13px] font-medium text-ink">{closest.next.name}</div>
                <div className="font-mono text-[11px] text-accent">{pctOf(closest.next)}%</div>
              </button>
            ) : (
              <div className="text-[12.5px] text-ink-2">{l === "en" ? "All series complete" : "Tüm seriler tamam"}</div>
            )}
          </div>
        )}

        {shape === "strip" && (
          <div className="flex h-full flex-col justify-center gap-2.5">
            <div className="flex flex-wrap gap-1.5 overflow-hidden max-h-[52px]">
              {series.filter((x) => x.top).map((x) => (
                <button key={x.s} type="button" onClick={() => setOpen(x.s)}>
                  <Shield2 left={getLocalizedSeriesInfo(x.s, l).title} right={`${short(x.top!.target)}`} color={RARITY[x.top!.rarity].color} earned icon={SERIES_ICON[x.s]} size="sm" />
                </button>
              ))}
              {!earned.length && <span className="text-[12.5px] text-ink-3">{l === "en" ? "No badges yet." : "Henüz rozet yok."}</span>}
            </div>
            {closest?.next && (
              <button type="button" onClick={() => setOpen(closest.s)} className="flex items-center gap-3 text-left">
                <span className="shrink-0 text-[11.5px] text-ink-4">{l === "en" ? "next" : "sıradaki"}</span>
                <span className="truncate text-[12.5px] text-ink">{closest.next.name}</span>
                <span className="flex-1 min-w-[60px] max-w-[240px]"><Track value={pctOf(closest.next)} height={4} /></span>
                <span className="font-mono text-[11px] text-ink-3">{pctOf(closest.next)}%</span>
              </button>
            )}
          </div>
        )}

        {shape === "column" && (
          <ul className="h-full overflow-y-auto">
            {series.map((x) => {
              const SI = SERIES_ICON[x.s];
              return (
                <li key={x.s}>
                  <button type="button" onClick={() => setOpen(x.s)} className="flex w-full items-center gap-2 border-b border-line py-1.5 text-left last:border-0 hover:text-accent">
                    <SI size={13} className={x.top ? "text-accent" : "text-ink-4"} />
                    <span className="truncate text-[12.5px] text-ink-2">{getLocalizedSeriesInfo(x.s, l).title}</span>
                    <span className="ml-auto"><Pips list={x.tiers} current={x.next?.id} /></span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {shape === "block" && (
          <div className="flex h-full flex-col gap-3">
            <div className="flex items-center gap-3">
              <Track value={earned.length} max={total} height={5} className="flex-1" />
              <span className="font-mono text-[11.5px] text-ink-3">{Math.round((earned.length / Math.max(1, total)) * 100)}%</span>
            </div>
            <div
              className="grid flex-1 min-h-0 auto-rows-min gap-2 overflow-y-auto pr-0.5"
              style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${w >= 4 ? 200 : 180}px, 1fr))` }}
            >
              {shown.map(tile)}
              {!shown.length && <p className="text-[12.5px] text-ink-3">{l === "en" ? "Nothing here with this filter." : "Bu filtreyle bir şey yok."}</p>}
            </div>
            {h >= 3 && closest?.next && (
              <p className="text-[12px] text-ink-3">
                {l === "en" ? "Closest unlock:" : "En yakın açılış:"} <span className="text-ink">{closest.next.name}</span>,{" "}
                {fmtInt(Math.max(0, (closest.next.target ?? 0) - (closest.next.current ?? 0)), l)} {closest.next.unit} {l === "en" ? "to go" : "kaldı"}
              </p>
            )}
          </div>
        )}
      </Panel>
      {open && (
        <Portal>
          <SeriesDialog series={open} all={list} onClose={() => setOpen(null)} onStep={step} />
        </Portal>
      )}
    </>
  );
}
