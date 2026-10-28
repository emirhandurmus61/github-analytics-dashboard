"use client";

import { Medal, GitCommitHorizontal, Flame, CalendarDays, Braces } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Panel } from "@/components/ui/primitives";
import { useWidgetSize } from "@/components/ui/widget-size";
import type { PercentileData } from "@/lib/percentile";
import { fmtInt, fmtPct, type Lang } from "@/lib/ui/format";

function tierOf(p: number, l: Lang) {
  if (p >= 90) return { label: l === "en" ? "Legendary" : "Efsanevi", color: "var(--hue-yellow)" };
  if (p >= 75) return { label: l === "en" ? "Expert" : "Uzman", color: "var(--accent)" };
  if (p >= 50) return { label: l === "en" ? "Above average" : "Ortalamanın üstünde", color: "var(--hue-blue)" };
  return { label: l === "en" ? "Growing" : "Gelişmekte", color: "var(--ink-3)" };
}

/** 0–100 number line with the median tick and your position. */
function Line({ p, color }: { p: number; color: string }) {
  return (
    <div className="relative h-4" aria-hidden>
      <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-inset" />
      <span className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full" style={{ left: 0, width: `${p}%`, background: `color-mix(in oklab, ${color} 55%, transparent)` }} />
      <span className="absolute top-0.5 bottom-0.5 w-px bg-ink-4" style={{ left: "50%" }} />
      <span className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[var(--bg-1)]" style={{ left: `${p}%`, background: color }} />
    </div>
  );
}

export default function PercentileRankCard({ data }: { data: PercentileData | null }) {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const { shape, h } = useWidgetSize();
  const title = l === "en" ? "Your ranking" : "Sıralaman";

  if (!data) {
    return (
      <Panel title={title} icon={Medal}>
        <p className="text-[12.5px] text-ink-3">{l === "en" ? "Rankings appear once enough developers have synced." : "Yeterli geliştirici senkron olduğunda sıralama görünür."}</p>
      </Panel>
    );
  }

  const overall = Math.round((data.commitPercentile + data.streakPercentile + data.activeDayPercentile) / 3);
  const top = Math.max(1, 100 - overall);
  const t = tierOf(overall, l);
  const rows = [
    { icon: GitCommitHorizontal, k: l === "en" ? "Commits / year" : "Yıllık commit", p: data.commitPercentile, you: data.commitCount, med: data.platformMedianCommits, unit: "" },
    { icon: Flame, k: l === "en" ? "Streak" : "Seri", p: data.streakPercentile, you: data.streakDays, med: data.platformMedianStreak, unit: l === "en" ? "d" : "g" },
    { icon: CalendarDays, k: l === "en" ? "Active days" : "Aktif gün", p: data.activeDayPercentile, you: data.activeDays, med: data.platformMedianActiveDays, unit: l === "en" ? "d" : "g" },
  ];
  const topLabel = l === "en" ? `Top ${top}%` : `İlk %${top}`;

  return (
    <Panel title={title} icon={Medal} meta={l === "en" ? `of ${fmtInt(data.totalUsers, l)}` : `${fmtInt(data.totalUsers, l)} kişide`}>
      {shape === "glance" && (
        <div className="flex h-full flex-col">
          <div className="figure text-[26px] @min-[200px]:text-[30px]" style={{ color: t.color }}>{topLabel}</div>
          <div className="mt-1.5 text-[11.5px] text-ink-3">{l === "en" ? "across commits, streak, active days" : "commit, seri ve aktif güne göre"}</div>
          <div className="mt-auto"><Line p={overall} color={t.color} /></div>
        </div>
      )}

      {shape === "strip" && (
        <div className="flex h-full items-center gap-6">
          <div className="shrink-0">
            <div className="figure text-[32px]" style={{ color: t.color }}>{topLabel}</div>
            <div className="label mt-1.5">{t.label}</div>
          </div>
          <div className="flex-1 min-w-0 grid gap-1.5">
            {rows.map((r) => (
              <div key={r.k} className="grid grid-cols-[92px_1fr_40px] items-center gap-2 text-[12px]">
                <span className="truncate text-ink-3">{r.k}</span>
                <Line p={r.p} color="var(--accent)" />
                <span className="text-right font-mono text-[11.5px] text-ink num">{fmtPct(r.p, l)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(shape === "column" || shape === "block") && (
        <div className="flex h-full flex-col gap-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="figure text-[34px]" style={{ color: t.color }}>{topLabel}</div>
              <div className="label mt-1.5">{t.label}</div>
            </div>
            <div className="text-right font-mono text-[11px] text-ink-4 leading-tight">
              <div>{l === "en" ? "percentile" : "yüzdelik"}</div>
              <div className="text-[18px] text-ink font-semibold">{overall}</div>
            </div>
          </div>
          <div className="flex flex-1 min-h-0 flex-col justify-between gap-3">
            {[...rows, ...(data.langPercentile !== null && data.topLang ? [{ icon: Braces, k: data.topLang, p: data.langPercentile, you: data.commitCount, med: -1, unit: "" }] : [])].map((r) => {
              const I = r.icon;
              return (
                <div key={r.k}>
                  <div className="mb-1 flex items-center gap-1.5 text-[12px]">
                    <I size={12} className="text-ink-4" />
                    <span className="text-ink-2 truncate">{r.k}</span>
                    <span className="ml-auto font-mono text-[11.5px] text-ink num">{fmtPct(r.p, l)}</span>
                  </div>
                  <Line p={r.p} color="var(--accent)" />
                  {(shape === "block" || h >= 3) && r.med >= 0 && (
                    <div className="mt-0.5 flex justify-between font-mono text-[10.5px] text-ink-4">
                      <span>{l === "en" ? "you" : "sen"} {fmtInt(r.you, l)}{r.unit}</span>
                      <span>{l === "en" ? "median" : "medyan"} {fmtInt(r.med, l)}{r.unit}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {h >= 3 && <p className="text-[11px] text-ink-4">{l === "en" ? "Computed from anonymous platform aggregates." : "Anonim platform toplamlarından hesaplanır."}</p>}
        </div>
      )}
    </Panel>
  );
}
