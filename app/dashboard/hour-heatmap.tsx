"use client";

import { Fragment as RowFrag } from "react";
import { Clock4 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Panel } from "@/components/ui/primitives";
import { useWidgetSize } from "@/components/ui/widget-size";
import { WEEKDAYS_SHORT, cn, type Lang } from "@/lib/ui/format";

type Entry = { hour: number; day: number; count: number };

const hh = (h: number) => String(h).padStart(2, "0");

export default function HourHeatmap({ data }: { data: Entry[] }) {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const { shape, w, h } = useWidgetSize();
  const grid = Array.from({ length: 7 }, () => new Array(24).fill(0) as number[]);
  for (const e of data) if (e.day >= 0 && e.day < 7 && e.hour >= 0 && e.hour < 24) grid[e.day][e.hour] = e.count;
  const max = Math.max(...grid.flat(), 1);
  const hours = Array.from({ length: 24 }, (_, i) => grid.reduce((s, r) => s + r[i], 0));
  const days = grid.map((r) => r.reduce((s, c) => s + c, 0));
  let peak = { d: 0, h: 0, v: 0 };
  grid.forEach((r, d) => r.forEach((v, hr) => v > peak.v && (peak = { d, h: hr, v })));
  const color = (v: number) => (v === 0 ? "var(--heat-0)" : `color-mix(in oklab, var(--accent) ${22 + (v / max) * 78}%, var(--bg-3))`);
  const title = l === "en" ? "Hour map" : "Saat haritası";
  const peakLabel = `${WEEKDAYS_SHORT[l][peak.d]} ${hh(peak.h)}:00`;

  const renderGrid = ({ labels, transpose, gap = 2 }: { labels?: boolean; transpose?: boolean; gap?: number }) =>
    transpose ? (
      <div className="grid h-full min-h-0" style={{ gridTemplateColumns: `${labels ? "22px " : ""}repeat(7, minmax(0,1fr))`, gridTemplateRows: `${labels ? "12px " : ""}repeat(24, minmax(0,1fr))`, gap }}>
        {labels && <span />}
        {labels && WEEKDAYS_SHORT[l].map((d) => <span key={d} className="text-center font-mono text-[9px] leading-none text-ink-4">{d.slice(0, 1)}</span>)}
        {Array.from({ length: 24 }).map((_, hr) => (
          <RowFrag key={hr}>{renderRow(hr)}</RowFrag>
        ))}
      </div>
    ) : (
      <div className="grid h-full min-h-0" style={{ gridTemplateColumns: `${labels ? "28px " : ""}repeat(24, minmax(0,1fr))`, gridTemplateRows: `repeat(7, minmax(0,1fr))${labels ? " 12px" : ""}`, gap }}>
        {grid.map((r, d) => (
          <RowFrag key={d}>{renderDayRow(r, d)}</RowFrag>
        ))}
        {labels && <span />}
        {labels &&
          Array.from({ length: 24 }).map((_, i) => (
            <span key={i} className="font-mono text-[9px] leading-none text-ink-4">{i % 6 === 0 ? hh(i) : ""}</span>
          ))}
      </div>
    );

  function renderDayRow(r: number[], d: number) {
    return (
      <>
        {shape === "block" || (shape === "strip" && w >= 3) ? (
          <span className={cn("flex items-center font-mono text-[9.5px] text-ink-4", d === peak.d && "text-accent")}>{WEEKDAYS_SHORT[l][d]}</span>
        ) : null}
        {r.map((v, hr) => (
          <span key={hr} title={`${WEEKDAYS_SHORT[l][d]} ${hh(hr)}:00 · ${v}`} className="rounded-[2px] min-h-[3px]" style={{ background: color(v), outline: d === peak.d && hr === peak.h ? "1px solid var(--ink-2)" : undefined }} />
        ))}
      </>
    );
  }

  function renderRow(hr: number) {
    return (
      <>
        <span className="flex items-center font-mono text-[9px] leading-none text-ink-4">{hr % 3 === 0 ? hh(hr) : ""}</span>
        {grid.map((r, d) => (
          <span key={d} title={`${WEEKDAYS_SHORT[l][d]} ${hh(hr)}:00 · ${r[hr]}`} className="rounded-[2px] min-h-[3px]" style={{ background: color(r[hr]) }} />
        ))}
      </>
    );
  }

  if (!data.length) {
    return (
      <Panel title={title} icon={Clock4}>
        <p className="text-[12.5px] text-ink-3">{l === "en" ? "No commit times in this range." : "Bu aralıkta commit saati yok."}</p>
      </Panel>
    );
  }

  return (
    <Panel title={title} icon={Clock4} meta={peakLabel}>
      {shape === "glance" && (
        <div className="flex h-full flex-col gap-2">
          <div>
            <div className="figure text-[20px] @min-[200px]:text-[24px]">{peakLabel}</div>
            <div className="mt-1 text-[11.5px] text-ink-3">{l === "en" ? `busiest slot · ${peak.v} commits` : `en yoğun dilim · ${peak.v} commit`}</div>
          </div>
          <div className="flex-1 min-h-0">
            {renderGrid({ gap: 1 })}
          </div>
        </div>
      )}
      {shape === "strip" && renderGrid({ labels: w >= 3, gap: 2 })}
      {shape === "column" && renderGrid({ transpose: true, labels: true, gap: 2 })}
      {shape === "block" && (
        <div className="flex h-full flex-col gap-3">
          <div className="flex-1 min-h-0 flex gap-3">
            <div className="flex-1 min-w-0">
              {renderGrid({ labels: true, gap: h >= 3 ? 3 : 2 })}
            </div>
            {w >= 3 && (
              <div className="grid w-16 shrink-0" style={{ gridTemplateRows: "repeat(7, minmax(0,1fr)) 12px", gap: h >= 3 ? 3 : 2 }}>
                {days.map((v, d) => (
                  <div key={d} className="flex items-center gap-1.5">
                    <span className="h-[60%] rounded-[2px]" style={{ width: `${(v / Math.max(...days, 1)) * 100}%`, background: d === peak.d ? "var(--accent)" : "var(--heat-2)" }} />
                    <span className="font-mono text-[9.5px] text-ink-4 num">{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-end gap-[2px] h-8 pl-[30px]">
            {hours.map((v, i) => (
              <span key={i} title={`${hh(i)}:00 · ${v}`} className="flex-1 rounded-[2px]" style={{ height: `${v ? Math.max(8, (v / Math.max(...hours, 1)) * 100) : 4}%`, background: i === peak.h ? "var(--accent)" : "var(--heat-2)" }} />
            ))}
            {w >= 3 && <span className="w-16 shrink-0 ml-3" />}
          </div>
        </div>
      )}
    </Panel>
  );
}
