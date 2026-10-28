"use client";

import type { ReactNode } from "react";
import { useIsClient } from "@/lib/ui/hooks";

/** Shared Recharts styling that follows the active scheme. */
export const axisTick = { fill: "var(--ink-4)", fontSize: 10, fontFamily: "var(--font-code)" } as const;
export const gridStroke = "var(--line)";

/** Recharts measures the DOM, so render it only after mount. */
export function ChartMount({ children, className }: { children: ReactNode; className?: string }) {
  const ready = useIsClient();
  return <div className={className ?? "h-full w-full min-h-0"}>{ready ? children : <div className="skel h-full w-full" />}</div>;
}

export function ChartTip({ title, rows }: { title?: ReactNode; rows: { label: ReactNode; value: ReactNode; color?: string }[] }) {
  return (
    <div className="tip">
      {title && <div className="mb-1 text-[11.5px] font-medium text-ink">{title}</div>}
      {rows.map((r, i) => (
        <div key={i} className="flex items-center justify-between gap-4 text-[11.5px] leading-5">
          <span className="flex items-center gap-1.5 text-ink-3">
            {r.color && <i className="inline-block size-2 rounded-full" style={{ background: r.color }} />}
            {r.label}
          </span>
          <span className="font-mono text-ink num">{r.value}</span>
        </div>
      ))}
    </div>
  );
}
