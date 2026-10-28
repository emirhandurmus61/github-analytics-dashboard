"use client";

import Link from "next/link";
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { ArrowLeft, ExternalLink, Star, GitFork, CalendarPlus, HeartPulse, GitPullRequest, Clock4, CircleDot, ScatterChart as ScatterIcon, FileDiff, Braces } from "lucide-react";
import type { RepoHealth } from "@/lib/repo-health";
import { useLanguage } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, Track, Dot } from "@/components/ui/primitives";
import { ChartMount, ChartTip, axisTick, gridStroke } from "@/components/ui/chart";
import { WidgetSlotProvider } from "@/components/ui/widget-size";
import ContributionHeatmap from "@/app/dashboard/contribution-heatmap";
import { DiffSquares } from "@/app/dashboard/code-stats";
import { HEALTH } from "@/app/dashboard/repo-health-list";
import { Ring } from "@/app/dashboard/goal-tracker";
import { TYPE_COLOR } from "@/app/dashboard/commit-quality";
import { langColor } from "@/lib/ui/lang-colors";
import { fmtCompact, fmtDay, fmtInt, type Lang } from "@/lib/ui/format";

type Props = {
  repo: { name: string; full_name: string; description: string | null; language: string | null; stars: number; forks: number; created_at: string | null };
  commits: { total: number; totalAdded: number; totalDeleted: number };
  langs: { language: string; bytes: number; pct: number }[];
  heatmapDays: { date: string; count: number }[];
  heatmapMax: number;
  scatterData: { date: string; additions: number; deletions: number; message: string; sha: string }[];
  hourMap: number[];
  prs: { total: number; merged: number; open: number; avgMergeHours: number | null };
  issueTrend: { label: string; opened: number; closed: number }[];
  bigCommits: { sha: string; message: string; date: string; additions: number; deletions: number }[];
  health: RepoHealth;
  healthColor: string;
  username: string;
};

export default function RepoDetailClient(p: Props) {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const T = (tr: string, en: string) => (l === "en" ? en : tr);
  const h = p.health;
  const hc = HEALTH[h.status].color;
  const hourMax = Math.max(...p.hourMap, 1);
  const peakHour = p.hourMap.indexOf(Math.max(...p.hourMap));
  const issueMax = Math.max(...p.issueTrend.map((x) => Math.max(x.opened, x.closed)), 1);
  const scatter = p.scatterData.map((c) => ({ ...c, t: new Date(c.date + "T12:00:00").getTime(), size: c.additions + c.deletions }));

  return (
    <div>
      <Link href="/dashboard" className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] text-ink-3 hover:text-ink">
        <ArrowLeft size={13} /> {T("Genel bakış", "Overview")}
      </Link>
      <PageHeader
        title={<span className="font-mono">{p.repo.name}</span>}
        command={`cd ~/${p.repo.name} && git log --stat`}
        subtitle={p.repo.description ?? T("Açıklama yok.", "No description.")}
        actions={
          <a href={`https://github.com/${p.repo.full_name}`} target="_blank" rel="noopener noreferrer" className="btn btn-sm">
            GitHub <ExternalLink />
          </a>
        }
      >
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[12.5px] text-ink-2">
          {p.repo.language && (
            <span className="inline-flex items-center gap-1.5">
              <Dot color={langColor(p.repo.language)} size={8} />
              {p.repo.language}
            </span>
          )}
          <span className="inline-flex items-center gap-1"><Star size={13} />{fmtInt(p.repo.stars, l)}</span>
          <span className="inline-flex items-center gap-1"><GitFork size={13} />{fmtInt(p.repo.forks, l)}</span>
          {p.repo.created_at && <span className="inline-flex items-center gap-1"><CalendarPlus size={13} />{fmtDay(p.repo.created_at, l, { day: "numeric", month: "short", year: "numeric" })}</span>}
          <span className="inline-flex items-center gap-2">
            <span className="text-good">+{fmtCompact(p.commits.totalAdded, l)}</span>
            <span className="text-bad">−{fmtCompact(p.commits.totalDeleted, l)}</span>
            <DiffSquares add={p.commits.totalAdded} del={p.commits.totalDeleted} />
          </span>
          <span className="chip" style={{ color: hc }}>
            <Dot color={hc} size={6} /> {HEALTH[h.status][l]} · {h.score}
          </span>
        </div>
      </PageHeader>

      <div className="grid gap-3 lg:grid-cols-4">
        <div className="h-[300px] lg:col-span-4">
          <WidgetSlotProvider value={{ w: 4, h: 2, mobile: false }}>
            <ContributionHeatmap data={p.heatmapDays.map((d) => ({ date: d.date, commit_count: d.count }))} />
          </WidgetSlotProvider>
        </div>

        <Panel title={T("Sağlık", "Health")} icon={HeartPulse} meta={`${h.score}/100`} className="!h-auto">
          <div className="flex items-center gap-4">
            <Ring value={h.score} max={100} size={76} stroke={7} color={hc}>
              <span className="figure text-[20px]">{h.score}</span>
            </Ring>
            <div className="text-[13px] font-semibold" style={{ color: hc }}>{HEALTH[h.status][l]}</div>
          </div>
          <div className="mt-4 flex flex-col gap-2.5">
            {(
              [
                [T("Güncellik", "Recency"), h.factors.recency, 40],
                [T("Aktivite", "Activity"), h.factors.activity, 30],
                [T("Topluluk", "Community"), h.factors.community, 20],
                ["Issue", h.factors.issues, 10],
              ] as const
            ).map(([k, v, m]) => (
              <div key={k}>
                <div className="mb-1 flex justify-between text-[12px]">
                  <span className="text-ink-3">{k}</span>
                  <span className="font-mono text-ink-2">{v}/{m}</span>
                </div>
                <Track value={v} max={m} color={hc} height={4} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Pull request" icon={GitPullRequest} meta={`${p.prs.total}`} className="!h-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="figure text-[30px]">{p.prs.merged}</div>
              <div className="label mt-1.5">{T("birleşti", "merged")}</div>
            </div>
            <div>
              <div className="figure text-[30px] !text-ink-2">{p.prs.open}</div>
              <div className="label mt-1.5">{T("açık", "open")}</div>
            </div>
          </div>
          <div className="mt-4">
            <Track value={p.prs.merged} max={Math.max(1, p.prs.total)} height={6} color="var(--hue-purple)" />
            <p className="mt-2 text-[12.5px] text-ink-3">
              {p.prs.avgMergeHours !== null
                ? T(`Ortalama birleşme süresi ${p.prs.avgMergeHours < 48 ? `${p.prs.avgMergeHours} saat` : `${Math.round(p.prs.avgMergeHours / 24)} gün`}`, `Average time to merge ${p.prs.avgMergeHours < 48 ? `${p.prs.avgMergeHours}h` : `${Math.round(p.prs.avgMergeHours / 24)}d`}`)
                : T("Henüz birleşen PR yok.", "No merged PRs yet.")}
            </p>
          </div>
        </Panel>

        <Panel title={T("Saatler", "Hours")} icon={Clock4} meta={`${T("zirve", "peak")} ${String(peakHour).padStart(2, "0")}:00`} className="!h-auto lg:col-span-2">
          <div className="flex h-[150px] items-end gap-[3px]">
            {p.hourMap.map((v, i) => (
              <span key={i} title={`${String(i).padStart(2, "0")}:00 · ${v}`} className="flex-1 rounded-[2px]" style={{ height: `${v ? Math.max(4, (v / hourMax) * 100) : 2}%`, background: i === peakHour ? "var(--accent)" : v ? "var(--heat-2)" : "var(--bg-3)" }} />
            ))}
          </div>
          <div className="mt-1.5 grid grid-cols-4 font-mono text-[10px] text-ink-4">
            <span>00</span>
            <span>06</span>
            <span>12</span>
            <span>18</span>
          </div>
        </Panel>

        <Panel title={T("Commit büyüklüğü", "Commit size")} icon={ScatterIcon} meta={`${scatter.length}`} className="!h-[300px] lg:col-span-2">
          {scatter.length ? (
            <ChartMount>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 6, right: 8, bottom: 0, left: -6 }}>
                  <CartesianGrid stroke={gridStroke} strokeDasharray="2 4" />
                  <XAxis dataKey="t" type="number" domain={["dataMin", "dataMax"]} tick={axisTick} axisLine={false} tickLine={false} tickFormatter={(v) => fmtDay(new Date(v).toISOString().slice(0, 10), l)} />
                  <YAxis dataKey="size" type="number" scale="sqrt" tick={axisTick} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => fmtCompact(v, l)} />
                  <ZAxis range={[24, 24]} />
                  <Tooltip
                    cursor={{ stroke: "var(--line-2)" }}
                    content={({ active, payload }) => {
                      const d = active && payload?.[0]?.payload;
                      return d ? (
                        <ChartTip
                          title={<span className="font-mono">{d.sha}</span>}
                          rows={[
                            { label: d.message, value: "" },
                            { label: "+", value: fmtInt(d.additions, l), color: "var(--hue-green)" },
                            { label: "−", value: fmtInt(d.deletions, l), color: "var(--hue-red)" },
                          ]}
                        />
                      ) : null;
                    }}
                  />
                  <Scatter data={scatter} fill="var(--accent)" fillOpacity={0.7} isAnimationActive={false} />
                </ScatterChart>
              </ResponsiveContainer>
            </ChartMount>
          ) : (
            <p className="text-[12.5px] text-ink-3">{T("Satır bilgisi olan commit yok.", "No commits with line stats.")}</p>
          )}
        </Panel>

        <Panel title="Issue" icon={CircleDot} meta={T("12 ay", "12 months")} className="!h-[300px] lg:col-span-2">
          <div className="flex h-full flex-col">
            <div className="flex flex-1 min-h-0 items-end gap-1.5">
              {p.issueTrend.map((x) => (
                <div key={x.label} className="flex h-full flex-1 items-end gap-[2px]" title={`${x.label}: +${x.opened} / ✓${x.closed}`}>
                  <span className="flex-1 rounded-[2px]" style={{ height: `${x.opened ? Math.max(4, (x.opened / issueMax) * 100) : 2}%`, background: x.opened ? "var(--hue-yellow)" : "var(--bg-3)" }} />
                  <span className="flex-1 rounded-[2px]" style={{ height: `${x.closed ? Math.max(4, (x.closed / issueMax) * 100) : 2}%`, background: x.closed ? "var(--hue-green)" : "var(--bg-3)" }} />
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex gap-1.5 font-mono text-[9.5px] text-ink-4">
              {p.issueTrend.map((x, i) => (
                <span key={x.label} className="flex-1 truncate text-center">{i % 2 === 0 ? x.label.split(" ")[0] : ""}</span>
              ))}
            </div>
            <div className="mt-2 flex gap-4 text-[11.5px] text-ink-3">
              <span className="inline-flex items-center gap-1.5"><Dot color="var(--hue-yellow)" size={7} />{T("açılan", "opened")}</span>
              <span className="inline-flex items-center gap-1.5"><Dot color="var(--hue-green)" size={7} />{T("kapanan", "closed")}</span>
            </div>
          </div>
        </Panel>

        <Panel title={T("En büyük commitler", "Largest commits")} icon={FileDiff} className="!h-auto lg:col-span-3">
          {p.bigCommits.length ? (
            <ul className="flex flex-col font-mono text-[12px]">
              {p.bigCommits.map((c) => {
                const m = c.message.match(/^(\w+)(\(.+?\))?!?:\s*(.*)$/);
                return (
                  <li key={c.sha}>
                    <a href={`https://github.com/${p.repo.full_name}/commit/${c.sha}`} target="_blank" rel="noopener noreferrer" className="grid grid-cols-[60px_minmax(0,1fr)_auto] items-baseline gap-3 border-b border-dashed border-line py-1.5 last:border-0 hover:bg-raised sm:grid-cols-[60px_minmax(0,1fr)_120px_70px]">
                      <span className="text-ink-4">{c.sha}</span>
                      <span className="truncate text-ink-2">
                        {m ? (
                          <>
                            <span style={{ color: TYPE_COLOR[m[1].toLowerCase()] ?? "var(--ink-2)" }}>{m[1]}</span>
                            <span className="text-ink-4">{m[2] ?? ""}: </span>
                            <span className="text-ink">{m[3]}</span>
                          </>
                        ) : (
                          <span className="text-ink">{c.message}</span>
                        )}
                      </span>
                      <span className="text-right num">
                        <span className="text-good">+{fmtCompact(c.additions, l)}</span> <span className="text-bad">−{fmtCompact(c.deletions, l)}</span>
                      </span>
                      <span className="hidden text-right text-ink-4 sm:block">{fmtDay(c.date, l)}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-[12.5px] text-ink-3">{T("Henüz büyük commit yok.", "No large commits yet.")}</p>
          )}
        </Panel>

        <Panel title={T("Diller", "Languages")} icon={Braces} meta={`${p.langs.length}`} className="!h-auto">
          {p.langs.length ? (
            <>
              <div className="flex h-2.5 overflow-hidden rounded-full gap-px bg-inset">
                {p.langs.map((x) => <span key={x.language} style={{ width: `${x.pct}%`, background: langColor(x.language) }} />)}
              </div>
              <ul className="mt-3 flex flex-col gap-1.5">
                {p.langs.slice(0, 8).map((x) => (
                  <li key={x.language} className="flex items-center gap-2 text-[12.5px]">
                    <Dot color={langColor(x.language)} size={8} />
                    <span className="text-ink-2">{x.language}</span>
                    <span className="ml-auto font-mono text-[11.5px] text-ink-3 num">{x.pct.toFixed(1)}%</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-[12.5px] text-ink-3">{T("Dil verisi yok.", "No language data.")}</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
