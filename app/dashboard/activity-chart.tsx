"use client";

import { useState } from "react";
import { Activity } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Panel, Bars } from "@/components/ui/primitives";
import { Glance } from "@/components/ui/glance";
import { useWidgetSize } from "@/components/ui/widget-size";
import { fmtDay, cn, type Lang } from "@/lib/ui/format";
import type { DayCount } from "./types";

/** Interactive daily bars with a readout that replaces the summary on hover. */
function DayBars({ data, l, axis }: { data: DayCount[]; l: Lang; axis?: boolean }) {
  const [hi, setHi] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.commit_count), 1);
  const avg = data.reduce((s, d) => s + d.commit_count, 0) / Math.max(1, data.length);
  const pt = hi !== null ? data[hi] : null;
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-2 h-4 font-mono text-[11.5px] text-ink-3">
        {pt ? (
          <>
            <span className="text-ink font-semibold">{pt.commit_count}</span> commit · {fmtDay(pt.date, l, { weekday: "short", day: "numeric", month: "short" })}
          </>
        ) : (
          <span>
            {l === "en" ? "avg" : "ort."} {avg.toFixed(1)}/{l === "en" ? "day" : "gün"} · {l === "en" ? "peak" : "zirve"} {max}
          </span>
        )}
      </div>
      <div className="relative flex flex-1 min-h-0 items-end gap-[3px]" onMouseLeave={() => setHi(null)}>
        <span className="pointer-events-none absolute inset-x-0 border-t border-dashed border-line-strong" style={{ bottom: `${(avg / max) * 100}%` }} />
        {data.map((d, i) => {
          const wd = new Date(d.date + "T12:00:00").getDay();
          const weekend = wd === 0 || wd === 6;
          const on = hi === i;
          return (
            <button
              key={d.date}
              type="button"
              tabIndex={-1}
              onMouseEnter={() => setHi(i)}
              onFocus={() => setHi(i)}
              onClick={() => setHi(on ? null : i)}
              className="relative flex h-full flex-1 items-end"
              aria-label={`${d.date}: ${d.commit_count}`}
            >
              <span
                className="w-full rounded-[2px] transition-[height,background-color] duration-300"
                style={{
                  height: `${d.commit_count ? Math.max(5, (d.commit_count / max) * 100) : 2.5}%`,
                  background: d.commit_count === 0 ? "var(--bg-3)" : on ? "var(--ink-1)" : i === data.length - 1 ? "var(--accent)" : weekend ? "var(--heat-2)" : "var(--heat-3)",
                }}
              />
            </button>
          );
        })}
      </div>
      {axis && (
        <div className="mt-1.5 flex justify-between font-mono text-[10px] text-ink-4">
          <span>{fmtDay(data[0].date, l)}</span>
          <span>{fmtDay(data[Math.floor(data.length / 2)].date, l)}</span>
          <span>{l === "en" ? "today" : "bugün"}</span>
        </div>
      )}
    </div>
  );
}

export default function ActivityChart({ data }: { data: DayCount[] }) {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const { shape } = useWidgetSize();
  const total = data.reduce((s, d) => s + d.commit_count, 0);
  const active = data.filter((d) => d.commit_count > 0).length;
  const title = l === "en" ? "Last 30 days" : "Son 30 gün";

  if (!data.length) {
    return (
      <Panel title={title} icon={Activity}>
        <p className="text-[12.5px] text-ink-3">{l === "en" ? "No activity yet." : "Henüz aktivite yok."}</p>
      </Panel>
    );
  }

  return (
    <Panel title={title} icon={Activity} meta={`${active}/30 ${l === "en" ? "days" : "gün"}`}>
      {shape === "glance" && (
        <Glance figure={total} unit="commit" sub={l === "en" ? `${active} active days` : `${active} aktif gün`} viz={<Bars values={data.map((d) => d.commit_count)} height={30} />} />
      )}
      {shape === "strip" && (
        <div className="flex h-full gap-5">
          <div className="flex shrink-0 flex-col justify-center">
            <div className="figure text-[34px]">{total}</div>
            <div className="label mt-2">{l === "en" ? `commits, ${active} days` : `commit, ${active} gün`}</div>
          </div>
          <div className="flex-1 min-w-0">
            <DayBars data={data} l={l} />
          </div>
        </div>
      )}
      {(shape === "column" || shape === "block") && (
        <div className="flex h-full flex-col gap-3">
          <div className={cn("flex items-end gap-6", shape === "column" && "flex-col items-start gap-1")}>
            <div>
              <div className="figure text-[36px]">{total}</div>
              <div className="label mt-1.5">commit</div>
            </div>
            <div>
              <div className="figure text-[22px] !text-ink-2">{active}</div>
              <div className="label mt-1.5">{l === "en" ? "active days" : "aktif gün"}</div>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <DayBars data={data} l={l} axis />
          </div>
        </div>
      )}
    </Panel>
  );
}
