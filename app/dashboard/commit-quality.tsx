"use client";

import { MessageSquareCode } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Panel, Track, Dot } from "@/components/ui/primitives";
import { KV } from "@/components/ui/glance";
import { useWidgetSize } from "@/components/ui/widget-size";
import { Ring } from "./goal-tracker";
import { fmtCompact, fmtDay, fmtPct, type Lang } from "@/lib/ui/format";
import type { CommitQualityData } from "./types";

export const TYPE_COLOR: Record<string, string> = {
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
};

function grade(pct: number, l: Lang) {
  if (pct >= 80) return { label: l === "en" ? "Consistent" : "Tutarlı", color: "var(--hue-green)" };
  if (pct >= 40) return { label: l === "en" ? "Getting there" : "Gelişiyor", color: "var(--hue-yellow)" };
  if (pct >= 10) return { label: l === "en" ? "Occasional" : "Ara sıra", color: "var(--hue-orange)" };
  return { label: l === "en" ? "Free-form" : "Serbest", color: "var(--ink-3)" };
}

function TypeBar({ dist, height = 8 }: { dist: { type: string; count: number }[]; height?: number }) {
  const total = Math.max(1, dist.reduce((s, x) => s + x.count, 0));
  return (
    <div className="flex w-full overflow-hidden rounded-full bg-inset gap-px" style={{ height }}>
      {dist.map((x) => (
        <span key={x.type} title={`${x.type}: ${x.count}`} style={{ width: `${(x.count / total) * 100}%`, background: TYPE_COLOR[x.type] ?? "var(--accent)" }} />
      ))}
    </div>
  );
}

/** `git log --shortstat` flavored list. */
function GitLog({ commits, l, max }: { commits: CommitQualityData["biggestCommits"]; l: Lang; max: number }) {
  return (
    <ul className="flex flex-col font-mono text-[11.5px] leading-[1.45]">
      {commits.slice(0, max).map((c, i) => {
        const m = c.message.match(/^(\w+)(\(.+?\))?!?:\s*(.*)$/);
        return (
          <li key={i} className="flex items-baseline gap-2 border-b border-dashed border-line py-1 last:border-0 min-w-0">
            <span className="shrink-0 w-[4.5ch] text-right text-good num">+{fmtCompact(c.additions, l)}</span>
            <span className="shrink-0 w-[4.5ch] text-right text-bad num">−{fmtCompact(c.deletions, l)}</span>
            <span className="min-w-0 flex-1 truncate text-ink-2">
              {m ? (
                <>
                  <span style={{ color: TYPE_COLOR[m[1].toLowerCase()] ?? "var(--ink-2)" }}>{m[1]}</span>
                  {m[2] && <span className="text-ink-4">{m[2]}</span>}
                  <span className="text-ink-4">: </span>
                  {m[3]}
                </>
              ) : (
                c.message || (l === "en" ? "(no message)" : "(mesaj yok)")
              )}
            </span>
            <span className="shrink-0 text-ink-4 hidden @min-[360px]:inline">{fmtDay(c.date, l)}</span>
          </li>
        );
      })}
    </ul>
  );
}

export default function CommitQuality({ data }: { data: CommitQualityData | null }) {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const { shape, w, h } = useWidgetSize();
  const title = l === "en" ? "Commit quality" : "Commit kalitesi";

  if (!data) {
    return (
      <Panel title={title} icon={MessageSquareCode}>
        <p className="text-[12.5px] text-ink-3">{l === "en" ? "No commits in this range to analyze." : "Bu aralıkta incelenecek commit yok."}</p>
      </Panel>
    );
  }

  const g = grade(data.conventionalPct, l);
  const msgLabel = data.avgMsgLength >= 50 ? (l === "en" ? "descriptive" : "açıklayıcı") : data.avgMsgLength >= 20 ? (l === "en" ? "adequate" : "yeterli") : l === "en" ? "terse" : "kısa";
  const types = data.typeDist.slice(0, 6);
  const typeLegend = (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {types.map((x) => (
        <span key={x.type} className="inline-flex items-center gap-1.5 font-mono text-[11.5px] text-ink-2">
          <Dot color={TYPE_COLOR[x.type] ?? "var(--accent)"} size={7} />
          {x.type}
          <span className="text-ink-4">{x.count}</span>
        </span>
      ))}
    </div>
  );

  return (
    <Panel title={title} icon={MessageSquareCode} meta={`${data.totalAnalyzed} commit`}>
      {shape === "glance" && (
        <div className="flex h-full items-center gap-3">
          <Ring value={data.conventionalPct} max={100} size={64} stroke={6} color={g.color}>
            <span className="figure text-[15px]">{data.conventionalPct}%</span>
          </Ring>
          <div className="min-w-0">
            <div className="text-[14px] font-semibold" style={{ color: g.color }}>{g.label}</div>
            <div className="mt-1 text-[11.5px] text-ink-3 leading-snug">{l === "en" ? "conventional commits" : "conventional commit"}</div>
            <div className="mt-1 font-mono text-[11px] text-ink-4">{l === "en" ? `avg ${data.avgMsgLength} chars` : `ort. ${data.avgMsgLength} kr`}</div>
          </div>
        </div>
      )}

      {shape === "strip" && (
        <div className="flex h-full flex-col justify-center gap-3">
          <div className="flex flex-wrap gap-x-7 gap-y-2">
            <Metric v={fmtPct(data.conventionalPct, l)} k="conventional" color={g.color} />
            <Metric v={`${data.avgMsgLength}`} k={l === "en" ? `chars, ${msgLabel}` : `karakter, ${msgLabel}`} />
            <Metric v={fmtPct(data.multiLinePct, l)} k={l === "en" ? "with a body" : "gövdeli"} />
          </div>
          {types.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <TypeBar dist={types} />
              {w >= 3 && typeLegend}
            </div>
          )}
        </div>
      )}

      {shape === "column" && (
        <div className="flex h-full flex-col gap-3">
          <div className="flex items-center gap-3">
            <Ring value={data.conventionalPct} max={100} size={70} stroke={7} color={g.color}>
              <span className="figure text-[16px]">{data.conventionalPct}%</span>
            </Ring>
            <div className="text-[13px] font-semibold" style={{ color: g.color }}>{g.label}</div>
          </div>
          <div className="flex flex-col gap-1">
            <KV k={l === "en" ? "Avg message" : "Ort. mesaj"} v={`${data.avgMsgLength}`} />
            <KV k={l === "en" ? "With body" : "Gövdeli"} v={fmtPct(data.multiLinePct, l)} />
          </div>
          <ul className="flex flex-col gap-1.5">
            {types.map((x) => (
              <li key={x.type}>
                <div className="mb-0.5 flex justify-between font-mono text-[11.5px]">
                  <span style={{ color: TYPE_COLOR[x.type] ?? "var(--accent)" }}>{x.type}</span>
                  <span className="text-ink-4">{x.count}</span>
                </div>
                <Track value={x.count} max={types[0].count} color={TYPE_COLOR[x.type]} height={3} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {shape === "block" && (
        <div className="grid h-full gap-5 @min-[520px]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)]">
          <div className="flex min-h-0 flex-col gap-3">
            <div className="flex items-center gap-3">
              <Ring value={data.conventionalPct} max={100} size={76} stroke={7} color={g.color}>
                <span className="figure text-[17px]">{data.conventionalPct}%</span>
              </Ring>
              <div>
                <div className="text-[14px] font-semibold" style={{ color: g.color }}>{g.label}</div>
                <div className="text-[12px] text-ink-3">conventional commits</div>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <KV k={l === "en" ? "Avg message length" : "Ort. mesaj uzunluğu"} v={`${data.avgMsgLength} ${l === "en" ? "chars" : "kr"}`} />
              <KV k={l === "en" ? "Messages with a body" : "Gövdesi olan mesaj"} v={fmtPct(data.multiLinePct, l)} />
            </div>
            {types.length > 0 && (
              <div className="mt-auto flex flex-col gap-2">
                <TypeBar dist={types} />
                {typeLegend}
              </div>
            )}
          </div>
          <div className="min-h-0 flex flex-col @max-[519px]:hidden">
            <div className="mb-1 text-[11px] text-ink-4">{l === "en" ? "Largest commits" : "En büyük commitler"}</div>
            {data.biggestCommits.length ? (
              <GitLog commits={data.biggestCommits} l={l} max={h >= 3 ? 8 : w >= 3 ? 5 : 5} />
            ) : (
              <p className="text-[12px] text-ink-3">{l === "en" ? "No line stats for these commits." : "Bu commitlerde satır bilgisi yok."}</p>
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}

function Metric({ v, k, color }: { v: string; k: string; color?: string }) {
  return (
    <div>
      <div className="figure text-[26px]" style={color ? { color } : undefined}>
        {v}
      </div>
      <div className="label mt-1.5">{k}</div>
    </div>
  );
}
