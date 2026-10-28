"use client";

import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Layers } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Panel, Seg, Dot } from "@/components/ui/primitives";
import { ChartMount, ChartTip, axisTick, gridStroke } from "@/components/ui/chart";
import { useWidgetSize } from "@/components/ui/widget-size";
import { langColor } from "@/lib/ui/lang-colors";
import { fmtPct, type Lang } from "@/lib/ui/format";

export type MonthLangPoint = {
  month: string;
  label: string;
  [lang: string]: string | number;
};

/** 100% stacked columns, one per month. */
function Columns({ data, languages, labels }: { data: MonthLangPoint[]; languages: string[]; labels?: boolean }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-1 min-h-0 items-stretch gap-[3px]">
        {data.map((p) => {
          const total = languages.reduce((s, x) => s + ((p[x] as number) ?? 0), 0);
          return (
            <div key={p.month} className="flex flex-1 flex-col-reverse overflow-hidden rounded-[3px] bg-inset" title={p.label}>
              {total > 0 &&
                languages.map((x) => {
                  const v = (p[x] as number) ?? 0;
                  return v ? <span key={x} style={{ height: `${(v / total) * 100}%`, background: langColor(x) }} /> : null;
                })}
            </div>
          );
        })}
      </div>
      {labels && (
        <div className="mt-1.5 flex gap-[3px] font-mono text-[9.5px] text-ink-4">
          {data.map((p, i) => (
            <span key={p.month} className="flex-1 text-center truncate">
              {i % 2 === 0 ? String(p.label).split(" ")[0] : ""}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LangEvolution({ data, languages }: { data: MonthLangPoint[]; languages: string[] }) {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const { shape, w } = useWidgetSize();
  const [mode, setMode] = useState<"pct" | "count">("pct");
  const title = l === "en" ? "Language evolution" : "Dil evrimi";

  if (!data.length || !languages.length) {
    return (
      <Panel title={title} icon={Layers}>
        <p className="text-[12.5px] text-ink-3">{l === "en" ? "Needs a few months of commits in repos with a primary language." : "Birincil dili olan repolarda birkaç aylık commit gerekiyor."}</p>
      </Panel>
    );
  }

  const share = (p: MonthLangPoint, x: string) => {
    const t = languages.reduce((s, k) => s + ((p[k] as number) ?? 0), 0);
    return t ? (((p[x] as number) ?? 0) / t) * 100 : 0;
  };
  const totals = languages.map((x) => ({ x, total: data.reduce((s, p) => s + ((p[x] as number) ?? 0), 0) })).sort((a, b) => b.total - a.total);
  const last = [...data].reverse().find((p) => languages.some((x) => ((p[x] as number) ?? 0) > 0)) ?? data[data.length - 1];
  const first = data.find((p) => languages.some((x) => ((p[x] as number) ?? 0) > 0)) ?? data[0];
  const nowTop = [...languages].sort((a, b) => share(last, b) - share(last, a))[0];

  const chartData =
    mode === "pct"
      ? data.map((p) => {
          const o: MonthLangPoint = { month: p.month, label: p.label };
          for (const x of languages) o[x] = Math.round(share(p, x));
          return o;
        })
      : data;

  return (
    <Panel
      title={title}
      icon={Layers}
      meta={shape === "block" ? undefined : l === "en" ? "12 months" : "12 ay"}
      actions={
        shape === "block" ? (
          <Seg
            size="sm"
            value={mode}
            onChange={setMode}
            options={[
              { value: "pct", label: "%" },
              { value: "count", label: l === "en" ? "count" : "adet" },
            ]}
          />
        ) : undefined
      }
    >
      {shape === "glance" && (
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-1.5 min-w-0">
            <Dot color={langColor(nowTop)} size={9} />
            <span className="figure text-[20px] @min-[200px]:text-[24px] truncate">{nowTop}</span>
          </div>
          <div className="mt-1.5 text-[11.5px] text-ink-3">{l === "en" ? `${fmtPct(share(last, nowTop), l)} of commits now` : `şu an commitlerin ${fmtPct(share(last, nowTop), l)}`}</div>
          <div className="mt-auto pt-2 h-10">
            <Columns data={data} languages={languages} />
          </div>
        </div>
      )}

      {shape === "strip" && (
        <div className="flex h-full gap-4">
          <div className="flex-1 min-w-0">
            <Columns data={data} languages={languages} labels />
          </div>
          {w >= 2 && (
            <ul className="flex w-[34%] max-w-[220px] flex-col justify-center gap-1">
              {totals.slice(0, 4).map(({ x }) => (
                <li key={x} className="flex items-center gap-1.5 text-[12px]">
                  <Dot color={langColor(x)} size={7} />
                  <span className="text-ink-2 truncate">{x}</span>
                  <span className="ml-auto font-mono text-[11px] text-ink-4">{fmtPct(share(last, x), l)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {shape === "column" && (
        <div className="flex h-full flex-col gap-3">
          <ul className="flex flex-col gap-2">
            {totals.map(({ x }) => {
              const a = share(first, x);
              const b = share(last, x);
              const diff = Math.round(b - a);
              return (
                <li key={x} className="flex items-center gap-2 text-[12.5px]">
                  <Dot color={langColor(x)} size={8} />
                  <span className="text-ink-2 truncate">{x}</span>
                  <span className="ml-auto font-mono text-[11.5px] text-ink num">{Math.round(b)}%</span>
                  <span className="w-10 text-right font-mono text-[10.5px] num" style={{ color: diff > 0 ? "var(--hue-green)" : diff < 0 ? "var(--hue-red)" : "var(--ink-4)" }}>
                    {diff > 0 ? "+" : diff < 0 ? "−" : "±"}
                    {Math.abs(diff)}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="mt-auto flex-1 min-h-[60px] max-h-40">
            <Columns data={data} languages={languages} />
          </div>
        </div>
      )}

      {shape === "block" && (
        <div className="flex h-full flex-col gap-2">
          <ChartMount className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 6, right: 6, bottom: 0, left: -4 }}>
                <CartesianGrid stroke={gridStroke} strokeDasharray="2 4" vertical={false} />
                <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={16} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} width={36} ticks={mode === "pct" ? [0, 25, 50, 75, 100] : undefined} domain={[0, mode === "pct" ? 100 : "auto"]} tickFormatter={(v) => (mode === "pct" ? `${v}%` : String(v))} />
                <Tooltip
                  cursor={{ stroke: "var(--line-2)" }}
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <ChartTip
                        title={label}
                        rows={[...payload]
                          .reverse()
                          .filter((p) => (p.value as number) > 0)
                          .map((p) => ({ label: String(p.dataKey), value: mode === "pct" ? `${p.value}%` : (p.value as number), color: langColor(String(p.dataKey)) }))}
                      />
                    ) : null
                  }
                />
                {languages.map((x) => (
                  <Area isAnimationActive={false} key={x} type="monotone" dataKey={x} stackId="1" stroke={langColor(x)} strokeWidth={1.25} fill={langColor(x)} fillOpacity={0.22} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </ChartMount>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {totals.map(({ x, total }) => (
              <span key={x} className="inline-flex items-center gap-1.5 text-[12px] text-ink-2">
                <Dot color={langColor(x)} size={7} />
                {x}
                <span className="font-mono text-[11px] text-ink-4">{total}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </Panel>
  );
}
