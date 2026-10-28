"use client";

import { useState } from "react";
import { Lightbulb, CircleCheck, TriangleAlert, CircleX, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Panel } from "@/components/ui/primitives";
import { useWidgetSize } from "@/components/ui/widget-size";
import type { Insight } from "@/lib/insights";
import { cn, type Lang } from "@/lib/ui/format";

// Rendered like an editor's Problems panel: severity glyph + message.
const SEV: Record<Insight["type"], { icon: typeof Info; color: string; tr: string; en: string }> = {
  positive: { icon: CircleCheck, color: "var(--hue-green)", tr: "iyi", en: "good" },
  neutral: { icon: Info, color: "var(--hue-blue)", tr: "bilgi", en: "info" },
  warning: { icon: TriangleAlert, color: "var(--hue-yellow)", tr: "uyarı", en: "warning" },
  negative: { icon: CircleX, color: "var(--hue-red)", tr: "dikkat", en: "attention" },
};

// Insight copy ships with emoji; the panel already carries tone through its glyphs.
const clean = (s: string) => s.replace(/\s*[\p{Extended_Pictographic}\u{FE0F}]+/gu, "").trim();

export default function InsightCards({ insights: raw }: { insights: Insight[] }) {
  const insights = raw.map((x) => ({ ...x, message: clean(x.message) }));
  const { lang } = useLanguage();
  const l = lang as Lang;
  const { shape, w, h } = useWidgetSize();
  const [i, setI] = useState(0);
  const title = l === "en" ? "Insights" : "İçgörüler";
  const counts = (Object.keys(SEV) as Insight["type"][]).map((k) => ({ k, n: insights.filter((x) => x.type === k).length })).filter((x) => x.n);

  const meta = (
    <span className="inline-flex items-center gap-2">
      {counts.map(({ k, n }) => {
        const S = SEV[k];
        const I = S.icon;
        return (
          <span key={k} className="inline-flex items-center gap-0.5" style={{ color: S.color }}>
            <I size={11} />
            {n}
          </span>
        );
      })}
    </span>
  );

  if (!insights.length) {
    return (
      <Panel title={title} icon={Lightbulb}>
        <p className="text-[12.5px] text-ink-3">{l === "en" ? "Nothing to report. Insights show up after a few weeks of activity." : "Şimdilik söylenecek bir şey yok. Birkaç haftalık aktiviteden sonra içgörüler belirir."}</p>
      </Panel>
    );
  }

  const row = (x: Insight, k: number, compact?: boolean) => {
    const S = SEV[x.type];
    const I = S.icon;
    return (
      <li key={k} className={cn("flex items-start gap-2.5", !compact && "py-2 border-b border-line last:border-0")}>
        <I size={14} className="mt-[2px] shrink-0" style={{ color: S.color }} />
        <p className="text-[12.5px] leading-snug text-ink-2">{x.message}</p>
      </li>
    );
  };

  if (shape === "glance") {
    const x = insights[i % insights.length];
    const S = SEV[x.type];
    const I = S.icon;
    return (
      <Panel
        title={title}
        icon={Lightbulb}
        meta={`${(i % insights.length) + 1}/${insights.length}`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-start gap-2">
            <I size={15} className="mt-[1px] shrink-0" style={{ color: S.color }} />
            <p className="text-[12.5px] leading-snug text-ink-2 line-clamp-4">{x.message}</p>
          </div>
          {insights.length > 1 && (
            <div className="mt-auto flex justify-end gap-1">
              <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => setI((v) => (v - 1 + insights.length) % insights.length)} aria-label={l === "en" ? "Previous" : "Önceki"}>
                <ChevronLeft />
              </button>
              <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => setI((v) => (v + 1) % insights.length)} aria-label={l === "en" ? "Next" : "Sonraki"}>
                <ChevronRight />
              </button>
            </div>
          )}
        </div>
      </Panel>
    );
  }

  if (shape === "strip") {
    const per = Math.max(1, Math.min(w, 4));
    return (
      <Panel title={title} icon={Lightbulb} meta={meta}>
        <ul className="flex h-full gap-3 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none]">
          {insights.map((x, k) => {
            const S = SEV[x.type];
            const I = S.icon;
            return (
              <li
                key={k}
                className="snap-start shrink-0 flex flex-col gap-1.5 rounded-[var(--r-control)] border border-line bg-raised p-2.5 overflow-hidden"
                style={{ width: `calc((100% - ${(per - 1) * 12}px) / ${per})` }}
              >
                <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px]" style={{ color: S.color }}>
                  <I size={12} /> {S[l]}
                </span>
                <p className="text-[12.5px] leading-snug text-ink-2 line-clamp-3">{x.message}</p>
              </li>
            );
          })}
        </ul>
      </Panel>
    );
  }

  return (
    <Panel title={title} icon={Lightbulb} meta={meta}>
      <ul className={cn("h-full overflow-y-auto pr-1", shape === "column" && h < 3 && "text-[12px]")}>{insights.map((x, k) => row(x, k))}</ul>
    </Panel>
  );
}
