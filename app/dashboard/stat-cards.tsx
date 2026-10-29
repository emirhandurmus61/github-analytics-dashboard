"use client";

import { GitCommitHorizontal, FolderGit2, Braces, ChartPie, Star, GitFork } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Panel, Spark, Bars, Delta, Dot, Track } from "@/components/ui/primitives";
import { Glance, KV } from "@/components/ui/glance";
import { useWidgetSize } from "@/components/ui/widget-size";
import { fmtCompact, fmtInt, fmtPct, fmtDay, type Lang } from "@/lib/ui/format";
import { dayKey } from "@/lib/tz";
import { useTz } from "@/lib/tz-context";
import { langColor } from "@/lib/ui/lang-colors";
import type { DashboardData, DateRange, DayCount } from "./types";

const DAY = 86400000;

function lastDays(daily: DayCount[], n: number, tz: string) {
  const m = new Map(daily.map((d) => [d.date, d.commit_count]));
  return Array.from({ length: n }, (_, i) => {
    const date = dayKey(Date.now() - (n - 1 - i) * DAY, tz);
    return { date, v: m.get(date) ?? 0 };
  });
}

function weekly(daily: DayCount[], weeks: number, tz: string) {
  const days = lastDays(daily, weeks * 7, tz);
  return Array.from({ length: weeks }, (_, w) => days.slice(w * 7, w * 7 + 7).reduce((s, d) => s + d.v, 0));
}

function rangeLabel(r: DateRange, l: Lang) {
  return r === "365" ? (l === "en" ? "1 year" : "1 yıl") : l === "en" ? `${r} days` : `${r} gün`;
}

function fmtBytes(b: number, l: Lang) {
  if (b >= 1e9) return `${(b / 1e9).toLocaleString(l === "en" ? "en-US" : "tr-TR", { maximumFractionDigits: 1 })} GB`;
  if (b >= 1e6) return `${(b / 1e6).toLocaleString(l === "en" ? "en-US" : "tr-TR", { maximumFractionDigits: 1 })} MB`;
  if (b >= 1e3) return `${Math.round(b / 1e3)} KB`;
  return `${b} B`;
}

/* ── Commits ─────────────────────────────────────────────────────────── */

export function StatCommits({ count, prev, range, daily }: { count: number; prev: number | null; range: DateRange; daily: DayCount[] }) {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const tz = useTz();
  const { shape, h, wide } = useWidgetSize();
  const delta = prev !== null && prev > 0 ? Math.round(((count - prev) / prev) * 100) : null;
  const d30 = lastDays(daily, 30, tz);
  const span = Number(range);
  const inRange = lastDays(daily, Math.min(span, 365), tz);
  const active = inRange.filter((d) => d.v > 0).length;
  const best = inRange.reduce((a, b) => (b.v > a.v ? b : a), { date: "", v: 0 });
  const avg = count / Math.max(1, Math.min(span, 365));
  const figure = count >= 100_000 ? fmtCompact(count, l) : fmtInt(count, l);
  const deltaLine =
    delta !== null ? (
      <span className="inline-flex items-center gap-1.5">
        <Delta value={delta} lang={l} />
        <span>{l === "en" ? `vs previous ${range}d` : `önceki ${range} güne göre`}</span>
      </span>
    ) : (
      <span>{l === "en" ? `in the last ${rangeLabel(range, l)}` : `son ${rangeLabel(range, l)}`}</span>
    );

  return (
    <Panel title="Commit" icon={GitCommitHorizontal} meta={range === "365" ? "1y" : `${range}${l === "en" ? "d" : "g"}`}>
      {shape === "glance" && <Glance figure={figure} sub={deltaLine} viz={<Spark values={d30.map((d) => d.v)} height={26} />} />}

      {shape === "strip" && (
        <div className="flex h-full gap-5">
          <div className="flex flex-col justify-center shrink-0">
            <div className="figure text-[34px] @min-[420px]:text-[42px]">{figure}</div>
            <div className="mt-2 text-[12px] text-ink-3">{deltaLine}</div>
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-end">
            <Bars values={d30.map((d) => d.v)} height="100%" className="min-h-0 flex-1" titles={d30.map((d) => `${fmtDay(d.date, l)} · ${d.v}`)} />
            <div className="mt-1.5 flex justify-between font-mono text-[10.5px] text-ink-4">
              <span>{fmtDay(d30[0].date, l)}</span>
              <span>{l === "en" ? "today" : "bugün"}</span>
            </div>
          </div>
        </div>
      )}

      {(shape === "column" || shape === "block") && (
        <div className="flex h-full flex-col gap-3">
          <div>
            <div className="figure text-[36px] @min-[300px]:text-[44px]">{figure}</div>
            <div className="mt-2 text-[12px] text-ink-3">{deltaLine}</div>
          </div>
          <div className="flex flex-col gap-1.5">
            <KV k={l === "en" ? "Per day" : "Günlük ort."} v={avg.toLocaleString(l === "en" ? "en-US" : "tr-TR", { maximumFractionDigits: 1 })} />
            <KV k={l === "en" ? "Active days" : "Aktif gün"} v={`${active}/${Math.min(span, 365)}`} />
            {best.v > 0 && <KV k={l === "en" ? "Busiest day" : "En yoğun gün"} v={`${fmtDay(best.date, l)} · ${best.v}`} />}
          </div>
          <div className="mt-auto min-h-0 flex flex-col">
            <div className="mb-1.5 text-[11px] text-ink-4">{h >= 2 && (wide || shape === "block") ? (l === "en" ? "Weekly, last 12 weeks" : "Haftalık, son 12 hafta") : l === "en" ? "Last 30 days" : "Son 30 gün"}</div>
            {shape === "block" ? (
              <Bars values={weekly(daily, 12, tz)} height={h >= 2 ? 72 : 40} gap={4} />
            ) : (
              <Bars values={d30.map((d) => d.v)} height={56} />
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}

/* ── Repositories ────────────────────────────────────────────────────── */

export function StatRepos({ stats }: { stats: DashboardData["stats"] }) {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const { shape } = useWidgetSize();
  const own = stats.ownRepos - stats.archivedRepos;
  const parts = [
    { k: l === "en" ? "Own" : "Kendi", v: Math.max(0, own), c: "var(--accent)" },
    { k: "Fork", v: stats.forkRepos, c: "var(--ink-4)" },
    { k: l === "en" ? "Archived" : "Arşiv", v: stats.archivedRepos, c: "var(--line-2)" },
  ];
  const total = Math.max(1, parts.reduce((s, p) => s + p.v, 0));
  const split = (
    <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-inset gap-px">
      {parts.map((p) => p.v > 0 && <span key={p.k} style={{ width: `${(p.v / total) * 100}%`, background: p.c }} />)}
    </div>
  );

  return (
    <Panel title={l === "en" ? "Repositories" : "Repolar"} icon={FolderGit2} meta={<span className="inline-flex items-center gap-1"><Star size={11} />{fmtCompact(stats.totalStars, l)}</span>}>
      {shape === "glance" && (
        <Glance
          figure={fmtInt(stats.repoCount, l)}
          unit="repo"
          sub={`${fmtInt(stats.ownRepos, l)} ${l === "en" ? "own" : "kendi"} · ${fmtInt(stats.forkRepos, l)} fork`}
          viz={split}
        />
      )}
      {shape === "strip" && (
        <div className="flex h-full items-center gap-6">
          <div>
            <div className="figure text-[38px]">{fmtInt(stats.repoCount, l)}</div>
            <div className="label mt-2">{l === "en" ? "repositories" : "repo"}</div>
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-2.5">
            {split}
            <div className="grid grid-cols-3 gap-2">
              {parts.map((p) => (
                <div key={p.k} className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11.5px] text-ink-3"><Dot color={p.c} size={6} />{p.k}</div>
                  <div className="font-mono text-[15px] text-ink num">{p.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {(shape === "column" || shape === "block") && (
        <div className="flex h-full flex-col gap-3">
          <div className="flex items-end justify-between">
            <div>
              <div className="figure text-[40px]">{fmtInt(stats.repoCount, l)}</div>
              <div className="label mt-2">{l === "en" ? "repositories" : "repo"}</div>
            </div>
            <div className="text-right font-mono text-[12px] text-ink-3">
              <div className="flex items-center justify-end gap-1"><Star size={11} />{fmtInt(stats.totalStars, l)}</div>
              <div className="flex items-center justify-end gap-1"><GitFork size={11} />{fmtInt(stats.totalForks, l)}</div>
            </div>
          </div>
          {split}
          <div className="flex flex-col gap-1">
            {parts.map((p) => (
              <KV key={p.k} k={<span className="inline-flex items-center gap-1.5"><Dot color={p.c} size={6} />{p.k}</span>} v={p.v} />
            ))}
          </div>
          {stats.topStarred.length > 0 && (
            <div className="mt-auto">
              <div className="mb-1.5 text-[11px] text-ink-4">{l === "en" ? "Most starred" : "En çok yıldız"}</div>
              <ul className="flex flex-col gap-1">
                {stats.topStarred.map((r) => (
                  <li key={r.name} className="flex items-center gap-2 text-[12.5px]">
                    <Dot color={langColor(r.language)} size={7} />
                    <span className="truncate text-ink-2 font-mono">{r.name}</span>
                    <span className="ml-auto inline-flex items-center gap-0.5 font-mono text-ink-3 num"><Star size={10} />{fmtCompact(r.stars, l)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

/* ── Language count ──────────────────────────────────────────────────── */

function StackBar({ languages, height = 6 }: { languages: { language: string; bytes: number }[]; height?: number }) {
  const total = Math.max(1, languages.reduce((s, x) => s + x.bytes, 0));
  return (
    <div className="flex w-full overflow-hidden rounded-full bg-inset gap-px" style={{ height }}>
      {languages.map((x) => (
        <span key={x.language} title={`${x.language} ${Math.round((x.bytes / total) * 100)}%`} style={{ width: `${(x.bytes / total) * 100}%`, background: langColor(x.language) }} />
      ))}
    </div>
  );
}

export function StatLangs({ count, languages }: { count: number; languages: { language: string; bytes: number }[] }) {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const { shape } = useWidgetSize();
  const total = Math.max(1, languages.reduce((s, x) => s + x.bytes, 0));
  const top = languages[0];

  return (
    <Panel title={l === "en" ? "Languages" : "Diller"} icon={Braces} meta={top ? top.language : undefined}>
      {shape === "glance" && (
        <Glance
          figure={count}
          unit={l === "en" ? "languages" : "dil"}
          sub={top ? `${top.language} ${fmtPct((top.bytes / total) * 100, l)}` : l === "en" ? "No code yet" : "Henüz kod yok"}
          viz={<StackBar languages={languages} />}
        />
      )}
      {shape === "strip" && (
        <div className="flex h-full items-center gap-6">
          <div className="shrink-0">
            <div className="figure text-[38px]">{count}</div>
            <div className="label mt-2">{l === "en" ? "languages" : "dil"}</div>
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-2.5">
            <StackBar languages={languages} height={8} />
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {languages.slice(0, 5).map((x) => (
                <span key={x.language} className="inline-flex items-center gap-1.5 text-[12px] text-ink-2">
                  <Dot color={langColor(x.language)} size={7} />
                  {x.language}
                  <span className="font-mono text-ink-4 text-[11px]">{fmtPct((x.bytes / total) * 100, l)}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
      {(shape === "column" || shape === "block") && (
        <div className="flex h-full flex-col gap-3">
          <div className="flex items-baseline gap-2">
            <span className="figure text-[40px]">{count}</span>
            <span className="label">{l === "en" ? "languages in your repos" : "dil, repolarında"}</span>
          </div>
          <StackBar languages={languages} height={8} />
          <ul className="flex flex-col gap-1.5 min-h-0 overflow-hidden">
            {languages.map((x) => (
              <li key={x.language} className="flex items-center gap-2 text-[12.5px]">
                <Dot color={langColor(x.language)} size={7} />
                <span className="text-ink-2 truncate">{x.language}</span>
                <span className="ml-auto font-mono text-[11.5px] text-ink-3 num">{fmtPct((x.bytes / total) * 100, l)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}

/* ── Language mix (distribution) ─────────────────────────────────────── */

function Donut({ languages, size = 120, thickness = 14 }: { languages: { language: string; bytes: number }[]; size?: number; thickness?: number }) {
  const total = Math.max(1, languages.reduce((s, x) => s + x.bytes, 0));
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const offsets = languages.reduce<number[]>((a, x, i) => [...a, i === 0 ? 0 : a[i - 1] + (languages[i - 1].bytes / total) * c], []);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0 -rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-3)" strokeWidth={thickness} />
      {languages.map((x, i) => {
        const len = (x.bytes / total) * c;
        return (
          <circle
            key={x.language}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={langColor(x.language)}
            strokeWidth={thickness}
            strokeDasharray={`${Math.max(0, len - 1.5).toFixed(2)} ${c.toFixed(2)}`}
            strokeDashoffset={(-offsets[i]).toFixed(2)}
          />
        );
      })}
    </svg>
  );
}

export function LangDist({ languages }: { languages: { language: string; bytes: number }[] }) {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const { shape, w, h } = useWidgetSize();
  const total = Math.max(1, languages.reduce((s, x) => s + x.bytes, 0));
  const top = languages[0];
  const title = l === "en" ? "Language mix" : "Dil dağılımı";

  if (!languages.length) {
    return (
      <Panel title={title} icon={ChartPie}>
        <p className="text-[12.5px] text-ink-3">{l === "en" ? "No language data yet. Run a sync." : "Henüz dil verisi yok. Bir senkron çalıştır."}</p>
      </Panel>
    );
  }

  return (
    <Panel title={title} icon={ChartPie} meta={fmtBytes(total, l)}>
      {shape === "glance" && (
        <Glance
          figure={<span className="text-[22px] @min-[180px]:text-[26px]">{top.language}</span>}
          sub={`${fmtPct((top.bytes / total) * 100, l)} ${l === "en" ? "of all code" : "toplam kodun"}`}
          viz={<StackBar languages={languages} height={8} />}
        />
      )}
      {shape === "strip" && (
        <div className="flex h-full flex-col justify-center gap-3">
          <StackBar languages={languages} height={12} />
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {languages.slice(0, w >= 3 ? 8 : 5).map((x) => (
              <span key={x.language} className="inline-flex items-center gap-1.5 text-[12px]">
                <Dot color={langColor(x.language)} size={7} />
                <span className="text-ink-2">{x.language}</span>
                <span className="font-mono text-[11px] text-ink-4">{fmtPct((x.bytes / total) * 100, l)}</span>
              </span>
            ))}
          </div>
        </div>
      )}
      {shape === "column" && (
        <ul className="flex h-full flex-col gap-2.5 overflow-hidden">
          {languages.slice(0, h >= 3 ? 8 : 6).map((x) => {
            const pct = (x.bytes / total) * 100;
            return (
              <li key={x.language}>
                <div className="mb-1 flex items-center gap-1.5 text-[12.5px]">
                  <Dot color={langColor(x.language)} size={7} />
                  <span className="text-ink-2 truncate">{x.language}</span>
                  <span className="ml-auto font-mono text-[11.5px] text-ink-3 num">{pct.toFixed(1)}%</span>
                </div>
                <Track value={pct} color={langColor(x.language)} height={4} />
              </li>
            );
          })}
        </ul>
      )}
      {shape === "block" && (
        <div className="flex h-full items-center gap-5 @max-[340px]:flex-col @max-[340px]:items-stretch">
          <div className="relative grid place-items-center self-center">
            <Donut languages={languages} size={h >= 3 || w >= 3 ? 156 : 124} thickness={h >= 3 ? 16 : 14} />
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <div className="figure text-[22px]">{fmtPct((top.bytes / total) * 100, l)}</div>
                <div className="text-[11px] text-ink-3 mt-1">{top.language}</div>
              </div>
            </div>
          </div>
          <ul className="flex-1 min-w-0 flex flex-col gap-1.5">
            {languages.map((x) => (
              <li key={x.language} className="flex items-center gap-2 text-[12.5px]">
                <Dot color={langColor(x.language)} size={8} />
                <span className="text-ink-2 truncate">{x.language}</span>
                <span className="ml-auto font-mono text-[11px] text-ink-4">{fmtBytes(x.bytes, l)}</span>
                <span className="w-12 text-right font-mono text-[11.5px] text-ink-2 num">{((x.bytes / total) * 100).toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}
