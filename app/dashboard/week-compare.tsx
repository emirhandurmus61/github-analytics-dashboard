"use client";

import { CalendarRange } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Panel, Delta, Dot } from "@/components/ui/primitives";
import { Glance } from "@/components/ui/glance";
import { useWidgetSize } from "@/components/ui/widget-size";
import { WEEKDAYS_MIN, WEEKDAYS_SHORT, cn, type Lang } from "@/lib/ui/format";

const pct = (a: number, b: number) => (b > 0 ? Math.round(((a - b) / b) * 100) : a > 0 ? 100 : 0);

/** Side-by-side columns per weekday: last week (muted) and this week (accent). */
function Paired({ current, previous, today, labels, height }: { current: number[]; previous: number[]; today: number; labels?: string[]; height: number | string }) {
  const max = Math.max(...current, ...previous, 1);
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-1 min-h-0 items-end gap-[6%]" style={{ height }}>
        {current.map((c, i) => {
          const future = i > today;
          return (
            <div key={i} className="flex h-full flex-1 items-end gap-[2px]" title={`${previous[i]} → ${future ? "–" : c}`}>
              <span className="flex-1 rounded-[2px] bg-line-strong" style={{ height: `${previous[i] ? Math.max(6, (previous[i] / max) * 100) : 3}%` }} />
              <span
                className={cn("flex-1 rounded-[2px]", future && "border border-dashed border-line-strong bg-transparent")}
                style={future ? { height: "8%" } : { height: `${c ? Math.max(6, (c / max) * 100) : 3}%`, background: i === today ? "var(--accent)" : "color-mix(in oklab, var(--accent) 62%, var(--bg-3))" }}
              />
            </div>
          );
        })}
      </div>
      {labels && (
        <div className="mt-1.5 flex gap-[6%] font-mono text-[10px] text-ink-4">
          {labels.map((d, i) => (
            <span key={i} className={cn("flex-1 text-center", i === today && "text-accent font-semibold")}>
              {d}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WeekCompare({ current, previous }: { current: number[]; previous: number[] }) {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const { shape, w } = useWidgetSize();
  const today = (new Date().getDay() + 6) % 7;
  const thisWeek = current.reduce((s, v) => s + v, 0);
  const lastWeek = previous.reduce((s, v) => s + v, 0);
  const lastToDate = previous.slice(0, today + 1).reduce((s, v) => s + v, 0);
  const d = pct(thisWeek, lastToDate);
  const title = l === "en" ? "This week" : "Bu hafta";
  const legend = (
    <div className="flex items-center gap-3 text-[11px] text-ink-3">
      <span className="inline-flex items-center gap-1.5"><Dot color="var(--accent)" size={7} />{l === "en" ? "this week" : "bu hafta"}</span>
      <span className="inline-flex items-center gap-1.5"><Dot color="var(--line-2)" size={7} />{l === "en" ? "last week" : "geçen hafta"}</span>
    </div>
  );
  const pace =
    l === "en"
      ? `Last week had ${lastToDate} by ${WEEKDAYS_SHORT.en[today]}, ${lastWeek} in total`
      : `Geçen hafta ${WEEKDAYS_SHORT.tr[today]} itibarıyla ${lastToDate}, toplam ${lastWeek}`;

  return (
    <Panel title={title} icon={CalendarRange} meta={`${l === "en" ? "wk" : "hf"} ${isoWeek()}`}>
      {shape === "glance" && (
        <Glance
          figure={thisWeek}
          unit="commit"
          sub={
            <span className="inline-flex items-center gap-1.5">
              <Delta value={d} lang={l} />
              <span>{l === "en" ? `vs ${lastToDate} same point` : `aynı günde ${lastToDate}`}</span>
            </span>
          }
          viz={<div className="h-9"><Paired current={current} previous={previous} today={today} height={36} /></div>}
        />
      )}

      {shape === "strip" && (
        <div className="flex h-full gap-5">
          <div className="flex shrink-0 flex-col justify-center gap-2">
            <div className="flex items-baseline gap-3">
              <span className="figure text-[36px]">{thisWeek}</span>
              <span className="font-mono text-[15px] text-ink-4 num">/ {lastWeek}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-ink-3">
              <Delta value={d} lang={l} />
              {l === "en" ? "vs last week to date" : "geçen haftanın aynı gününe göre"}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <Paired current={current} previous={previous} today={today} labels={(w >= 3 ? WEEKDAYS_SHORT : WEEKDAYS_MIN)[l]} height="100%" />
          </div>
        </div>
      )}

      {shape === "column" && (
        <div className="flex h-full flex-col gap-3">
          <div>
            <div className="figure text-[38px]">{thisWeek}</div>
            <div className="mt-2 flex items-center gap-1.5 text-[12px] text-ink-3"><Delta value={d} lang={l} />{l === "en" ? `last week ${lastWeek}` : `geçen hafta ${lastWeek}`}</div>
          </div>
          <ul className="mt-auto flex flex-col gap-1.5">
            {current.map((c, i) => {
              const max = Math.max(...current, ...previous, 1);
              return (
                <li key={i} className="grid grid-cols-[28px_1fr_22px] items-center gap-2 text-[11px]">
                  <span className={cn("font-mono", i === today ? "text-accent" : "text-ink-4")}>{WEEKDAYS_SHORT[l][i]}</span>
                  <span className="relative h-3">
                    <span className="absolute inset-y-0 left-0 rounded-[2px] bg-line-strong" style={{ width: `${(previous[i] / max) * 100}%` }} />
                    {i <= today && <span className="absolute inset-y-[3px] left-0 rounded-[2px] bg-accent" style={{ width: `${(c / max) * 100}%` }} />}
                  </span>
                  <span className="text-right font-mono text-ink-2 num">{i <= today ? c : "·"}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {shape === "block" && (
        <div className="flex h-full flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-end gap-5">
              <div>
                <div className="figure text-[40px]">{thisWeek}</div>
                <div className="label mt-1.5">{l === "en" ? "this week" : "bu hafta"}</div>
              </div>
              <div>
                <div className="figure text-[24px] !text-ink-3">{lastWeek}</div>
                <div className="label mt-1.5">{l === "en" ? "last week" : "geçen hafta"}</div>
              </div>
              <Delta value={d} lang={l} className="mb-1 text-[12.5px]" />
            </div>
            {legend}
          </div>
          <div className="flex-1 min-h-0">
            <Paired current={current} previous={previous} today={today} labels={WEEKDAYS_SHORT[l]} height="100%" />
          </div>
          <p className="text-[12px] text-ink-3">{pace}</p>
        </div>
      )}
    </Panel>
  );
}

function isoWeek() {
  const d = new Date();
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const y = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t.getTime() - y.getTime()) / 86400000 + 1) / 7);
}
