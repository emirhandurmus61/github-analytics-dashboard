"use client";

import { FileDiff, GitPullRequest, CircleDot, GitCommitHorizontal } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Panel } from "@/components/ui/primitives";
import { KV } from "@/components/ui/glance";
import { useWidgetSize } from "@/components/ui/widget-size";
import { fmtCompact, fmtInt, cn, type Lang } from "@/lib/ui/format";

type Props = {
  linesAdded: number;
  linesDeleted: number;
  totalCommits: number;
  mergedPRs: number;
  openIssues: number;
  closedIssues: number;
};

/** GitHub-style diffstat: five squares split between additions and deletions. */
export function DiffSquares({ add, del, n = 5, size = 9 }: { add: number; del: number; n?: number; size?: number }) {
  const t = add + del;
  const g = t ? Math.round((add / t) * n) : 0;
  const r = t ? n - g : 0;
  return (
    <span className="inline-flex gap-[2px]" aria-hidden>
      {Array.from({ length: n }).map((_, i) => (
        <i
          key={i}
          className="block rounded-[2px]"
          style={{ width: size, height: size, background: i < g ? "var(--hue-green)" : i < g + r ? "var(--hue-red)" : "var(--bg-3)" }}
        />
      ))}
    </span>
  );
}

export default function CodeStats(p: Props) {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const { shape } = useWidgetSize();
  const net = p.linesAdded - p.linesDeleted;
  const churn = p.linesAdded + p.linesDeleted;
  const issues = p.openIssues + p.closedIssues;
  const title = l === "en" ? "Code stats" : "Kod istatistikleri";
  const diff = (
    <span className="inline-flex items-center gap-2 font-mono text-[13px] num">
      <span className="text-good">+{fmtCompact(p.linesAdded, l)}</span>
      <span className="text-bad">−{fmtCompact(p.linesDeleted, l)}</span>
      <DiffSquares add={p.linesAdded} del={p.linesDeleted} />
    </span>
  );

  const metrics = [
    { icon: GitCommitHorizontal, k: "commit", v: fmtInt(p.totalCommits, l) },
    { icon: GitPullRequest, k: l === "en" ? "PRs merged" : "birleşen PR", v: fmtInt(p.mergedPRs, l) },
    { icon: CircleDot, k: l === "en" ? "issues closed" : "kapanan issue", v: `${p.closedIssues}/${issues}` },
  ];

  return (
    <Panel title={title} icon={FileDiff} meta={l === "en" ? `${fmtCompact(churn, l)} lines touched` : `${fmtCompact(churn, l)} satır değişti`}>
      {shape === "glance" && (
        <div className="flex h-full flex-col">
          <div className="figure text-[26px] @min-[200px]:text-[30px]" style={{ color: net >= 0 ? "var(--ink-1)" : "var(--hue-orange)" }}>
            {net >= 0 ? "+" : "−"}
            {fmtCompact(Math.abs(net), l)}
          </div>
          <div className="mt-1.5 text-[11.5px] text-ink-3">{l === "en" ? "net lines" : "net satır"}</div>
          <div className="mt-auto">{diff}</div>
        </div>
      )}

      {shape === "strip" && (
        <div className="flex h-full items-center gap-6 overflow-hidden">
          <div className="shrink-0">
            <div className="flex items-baseline gap-3 font-mono num">
              <span className="figure text-[28px] !text-good">+{fmtCompact(p.linesAdded, l)}</span>
              <span className="figure text-[28px] !text-bad">−{fmtCompact(p.linesDeleted, l)}</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[12px] text-ink-3">
              <DiffSquares add={p.linesAdded} del={p.linesDeleted} />
              {l === "en" ? "net" : "net"} <span className="font-mono text-ink num">{net >= 0 ? "+" : "−"}{fmtCompact(Math.abs(net), l)}</span>
            </div>
          </div>
          <div className="ml-auto grid gap-x-6 gap-y-2 grid-cols-1 @min-[480px]:grid-cols-3">
            {metrics.map((m, i) => {
              const I = m.icon;
              return (
                <div key={m.k} className={cn("min-w-0", i > 0 && "hidden @min-[480px]:block")}>
                  <div className="flex items-center gap-1.5 text-[11.5px] text-ink-3"><I size={12} />{m.k}</div>
                  <div className="font-mono text-[18px] font-semibold text-ink num">{m.v}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(shape === "column" || shape === "block") && (
        <div className="flex h-full flex-col gap-3">
          <div>
            <div className="flex flex-wrap items-baseline gap-x-3 font-mono num">
              <span className="figure text-[30px] !text-good">+{fmtCompact(p.linesAdded, l)}</span>
              <span className="figure text-[30px] !text-bad">−{fmtCompact(p.linesDeleted, l)}</span>
            </div>
            <div className="mt-2 flex items-center gap-2"><DiffSquares add={p.linesAdded} del={p.linesDeleted} n={shape === "block" ? 10 : 7} size={10} /></div>
          </div>
          <div className="flex flex-col gap-1">
            <KV k={l === "en" ? "Net lines" : "Net satır"} v={`${net >= 0 ? "+" : "−"}${fmtInt(Math.abs(net), l)}`} />
            <KV k={l === "en" ? "Deleted per added" : "Eklenen başına silinen"} v={p.linesAdded ? (p.linesDeleted / p.linesAdded).toFixed(2) : "–"} />
            {metrics.map((m) => (
              <KV key={m.k} k={m.k.charAt(0).toLocaleUpperCase(l) + m.k.slice(1)} v={m.v} />
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}
