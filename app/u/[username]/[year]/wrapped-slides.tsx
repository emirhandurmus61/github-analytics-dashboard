"use client";

import type { ReactNode } from "react";
import { Download, Link2 } from "lucide-react";
import { Kbd } from "@/components/ui/primitives";
import { DiffSquares } from "@/app/dashboard/code-stats";
import { langColor } from "@/lib/ui/lang-colors";
import { MONTHS_LONG, MONTHS_SHORT, fmtCompact, fmtInt, fmtDay, type Lang } from "@/lib/ui/format";
import { type WrappedData, TOTAL, Count, Months, YearGrid } from "./wrapped-parts";

export type Slide = { kicker: string; body: (active: boolean) => ReactNode; foot?: ReactNode };

export function buildSlides({
  data,
  l,
  T,
  arch,
  peakMonthIdx,
  peakDayIdx,
  perDay,
  wide,
  saving,
  onShare,
  onSavePng,
  onRestart,
}: {
  data: WrappedData;
  l: Lang;
  T: (tr: string, en: string) => string;
  arch: { title: string; tagline: string; badge: string; desc: string; color?: string };
  peakMonthIdx: number;
  peakDayIdx: number;
  perDay: number;
  wide: boolean;
  saving: boolean;
  onShare: () => void;
  onSavePng: (index: number) => void;
  onRestart: () => void;
}): Slide[] {
  return [
    {
      kicker: `devboard wrapped --year ${data.year}`,
      body: () => (
        <div>
          <p className="font-mono text-[13px] text-ink-3 sm:text-[15px]">
            <span className="text-accent">❯</span> git log --author={data.username} --since={data.year}-01-01
          </p>
          <h1 className="mt-6 font-mono text-[clamp(88px,22vw,280px)] font-[800] leading-[0.82] tracking-[-0.06em] text-ink num">{data.year}</h1>
          <p className="mt-6 max-w-[34ch] text-[20px] font-semibold leading-snug text-ink sm:text-[26px]">
            {T(`${data.displayName} için bir yıl, commit commit.`, `${data.displayName}'s year, one commit at a time.`)}
          </p>
        </div>
      ),
      foot: <span className="inline-flex items-center gap-2">{T("İlerlemek için", "Press")} <Kbd>→</Kbd> {T("ya da kaydır", "or swipe to continue")}</span>,
    },
    {
      kicker: T("toplam commit", "total commits"),
      body: (a) => (
        <div>
          <div className="text-[clamp(96px,24vw,300px)] font-[800] leading-[0.85] tracking-[-0.05em] text-accent num">
            <Count value={data.totalCommits} active={a} l={l} />
          </div>
          <p className="mt-6 text-[20px] font-semibold text-ink sm:text-[26px]">{T(`commit, ${data.activeDays} farklı günde.`, `commits, across ${data.activeDays} different days.`)}</p>
        </div>
      ),
      foot: T(`Aktif bir günde ortalama ${perDay.toFixed(1)} commit.`, `About ${perDay.toFixed(1)} commits on an active day.`),
    },
    {
      kicker: "git diff --shortstat",
      body: (a) => (
        <div>
          <div className="flex flex-wrap items-baseline gap-x-8 gap-y-2 font-mono font-[800] leading-[0.9] tracking-[-0.05em] num">
            <span className="text-[clamp(56px,13vw,170px)] text-good">+<Count value={data.totalLinesAdded} active={a} l={l} /></span>
            <span className="text-[clamp(40px,9vw,120px)] text-bad">−<Count value={data.totalLinesDeleted} active={a} l={l} /></span>
          </div>
          <div className="mt-8">
            <DiffSquares add={data.totalLinesAdded} del={data.totalLinesDeleted} n={20} size={wide ? 18 : 12} />
          </div>
          <p className="mt-6 text-[18px] text-ink-2 sm:text-[22px]">
            {T(`Net ${data.totalLinesAdded >= data.totalLinesDeleted ? "+" : "−"}${fmtInt(Math.abs(data.totalLinesAdded - data.totalLinesDeleted), l)} satır.`, `Net ${data.totalLinesAdded >= data.totalLinesDeleted ? "+" : "−"}${fmtInt(Math.abs(data.totalLinesAdded - data.totalLinesDeleted), l)} lines.`)}
          </p>
        </div>
      ),
    },
    {
      kicker: T("en yoğun ay", "busiest month"),
      body: () => (
        <div>
          <h2 className="text-[clamp(56px,11vw,140px)] font-[800] leading-[0.9] tracking-[-0.04em] text-ink">{MONTHS_LONG[l][peakMonthIdx]}</h2>
          <p className="mt-3 text-[18px] text-ink-2 sm:text-[22px]">{T(`${fmtInt(data.peakMonthCommits, l)} commit ile yılın zirvesi.`, `The peak of the year with ${fmtInt(data.peakMonthCommits, l)} commits.`)}</p>
          <div className="mt-10">
            <Months data={data.monthlyData} peak={peakMonthIdx} l={l} big />
          </div>
        </div>
      ),
    },
    {
      kicker: T("çalışma kimliğin", "how you work"),
      body: () => (
        <div>
          <div className="font-mono text-[13px] text-accent">{arch.badge}</div>
          <h2 className="mt-3 max-w-[16ch] text-[clamp(48px,9vw,120px)] font-[800] leading-[0.92] tracking-[-0.04em] text-ink">{arch.title}</h2>
          <p className="mt-5 max-w-[48ch] text-[18px] leading-relaxed text-ink-2 sm:text-[21px]">{arch.tagline}</p>
          <dl className="mt-10 grid max-w-xl grid-cols-2 gap-6 sm:grid-cols-3">
            <div>
              <dt className="text-[13px] text-ink-3">{T("en yoğun gün", "busiest day")}</dt>
              <dd className="mt-1 text-[24px] font-bold text-ink">{l === "en" ? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][peakDayIdx] ?? data.peakDay : data.peakDay}</dd>
            </div>
            <div>
              <dt className="text-[13px] text-ink-3">{T("en yoğun saat", "busiest hour")}</dt>
              <dd className="mt-1 font-mono text-[24px] font-bold text-ink num">{String(data.peakHour).padStart(2, "0")}:00</dd>
            </div>
            <div>
              <dt className="text-[13px] text-ink-3">{T("en uzun seri", "longest streak")}</dt>
              <dd className="mt-1 text-[24px] font-bold text-ink">
                {data.longestStreak} <span className="text-[15px] font-normal text-ink-3">{T("gün", "days")}</span>
              </dd>
            </div>
          </dl>
        </div>
      ),
    },
    {
      kicker: T("dillerin", "your languages"),
      body: () => (
        <div>
          {data.topLangs[0] ? (
            <>
              <div className="font-mono text-[14px] text-ink-3">#1</div>
              <h2 className="text-[clamp(64px,14vw,180px)] font-[800] leading-[0.88] tracking-[-0.05em]" style={{ color: langColor(data.topLangs[0].lang) }}>
                {data.topLangs[0].lang}
              </h2>
              <div className="mt-8 flex h-4 w-full max-w-3xl overflow-hidden rounded-full gap-[2px] bg-inset">
                {data.topLangs.map((x) => (
                  <span key={x.lang} style={{ width: `${x.pct}%`, background: langColor(x.lang) }} />
                ))}
              </div>
              <ol className="mt-6 grid max-w-3xl gap-x-8 gap-y-2 sm:grid-cols-2">
                {data.topLangs.map((x, i) => (
                  <li key={x.lang} className="flex items-baseline gap-3 text-[17px]">
                    <span className="w-6 font-mono text-[13px] text-ink-4">{i + 1}</span>
                    <span className="text-ink">{x.lang}</span>
                    <span className="ml-auto font-mono text-ink-3 num">{x.pct}%</span>
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <p className="text-[22px] text-ink-2">{T("Bu yıl dil verisi yok.", "No language data this year.")}</p>
          )}
        </div>
      ),
    },
    {
      kicker: T("repolar ve işbirliği", "repos and collaboration"),
      body: (a) => (
        <div className="grid max-w-4xl grid-cols-2 gap-x-10 gap-y-10 sm:grid-cols-4">
          {[
            [data.reposCreated, T("yeni repo", "new repos")],
            [data.activeRepos, T("aktif repo", "active repos")],
            [data.mergedPRs, T("birleşen PR", "merged PRs")],
            [data.totalStars, T("yıldız", "stars")],
          ].map(([v, k]) => (
            <div key={k as string}>
              <div className="text-[clamp(56px,9vw,112px)] font-[800] leading-none tracking-[-0.05em] text-ink num">
                <Count value={v as number} active={a} l={l} />
              </div>
              <div className="mt-3 text-[16px] text-ink-3">{k}</div>
            </div>
          ))}
          {data.topRepo && (
            <div className="col-span-2 sm:col-span-4 border-t border-line pt-6 text-[18px] text-ink-2">
              {T("En çok commit:", "Most commits:")} <span className="font-mono text-ink">{data.topRepo.name}</span> · <span className="font-mono num">{fmtInt(data.topRepo.commits, l)}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      kicker: "git show --stat HEAD~big",
      body: () =>
        data.biggestCommit ? (
          <div className="max-w-4xl rounded-panel border border-line bg-surface p-5 font-mono sm:p-8">
            <div className="text-[13px] text-ink-3">
              commit · <span className="text-ink-2">{fmtDay(data.biggestCommit.date, l, { day: "numeric", month: "long", year: "numeric" })}</span>
            </div>
            <p className="mt-4 text-[clamp(22px,4vw,40px)] font-semibold leading-tight text-ink">{data.biggestCommit.message || T("(mesaj yok)", "(no message)")}</p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-[clamp(26px,5vw,52px)] font-[800] num">
              <span className="text-good">+{fmtInt(data.biggestCommit.additions, l)}</span>
              <span className="text-bad">−{fmtInt(data.biggestCommit.deletions, l)}</span>
              <DiffSquares add={data.biggestCommit.additions} del={data.biggestCommit.deletions} n={10} size={14} />
            </div>
          </div>
        ) : (
          <p className="text-[22px] text-ink-2">{T("Bu yıl satır bilgisi olan commit yok.", "No commits with line stats this year.")}</p>
        ),
      foot: T("Tek seferde en çok değişen commit.", "The commit that changed the most at once."),
    },
    {
      kicker: T(`${data.year} katkı haritası`, `${data.year} contributions`),
      body: () => (
        <div className="w-full">
          <YearGrid year={data.year} dates={data.heatmapDates} max={data.maxDayCount} />
          <div className="mt-6 flex flex-wrap items-baseline gap-x-8 gap-y-2 text-[17px] text-ink-2">
            <span>
              <span className="font-mono text-[28px] font-bold text-ink num">{data.activeDays}</span> {T("aktif gün", "active days")}
            </span>
            <span>
              <span className="font-mono text-[28px] font-bold text-ink num">{Math.round((data.activeDays / 365) * 100)}%</span> {T("yılın", "of the year")}
            </span>
          </div>
        </div>
      ),
    },
    {
      kicker: T("özet", "summary"),
      body: () => (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-end">
          <div>
            <div className="font-mono text-[14px] text-ink-3">@{data.username} · {data.year}</div>
            <h2 className="mt-3 text-[clamp(48px,8vw,104px)] font-[800] leading-[0.9] tracking-[-0.04em] text-ink">{arch.title}</h2>
            <div className="mt-8 flex flex-wrap gap-2">
              <button type="button" className="btn btn-primary btn-lg" onClick={onShare}>
                <Link2 /> {T("Paylaş", "Share")}
              </button>
              <button type="button" className="btn btn-lg" onClick={() => onSavePng(TOTAL - 1)} disabled={saving}>
                <Download /> PNG
              </button>
              <button type="button" className="btn btn-lg btn-ghost" onClick={onRestart}>
                {T("Baştan izle", "Watch again")}
              </button>
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-panel border border-line bg-line">
            {[
              [fmtInt(data.totalCommits, l), "commit"],
              [`${data.longestStreak} ${T("gün", "d")}`, T("en uzun seri", "longest streak")],
              [`+${fmtCompact(data.totalLinesAdded, l)}`, T("eklenen satır", "lines added")],
              [data.topLangs[0]?.lang ?? "–", T("ana dil", "top language")],
              [MONTHS_SHORT[l][peakMonthIdx], T("zirve ayı", "peak month")],
              [`${String(data.peakHour).padStart(2, "0")}:00`, T("zirve saati", "peak hour")],
            ].map(([v, k]) => (
              <div key={k} className="bg-surface p-4">
                <dt className="text-[12px] text-ink-3">{k}</dt>
                <dd className="mt-1 truncate font-mono text-[22px] font-bold text-ink num">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      ),
    },
  ];
}
