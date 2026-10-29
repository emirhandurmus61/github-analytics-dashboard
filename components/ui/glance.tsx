"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/ui/format";

/**
 * The 1×1 layout shared by every card: one figure, one line of context and a
 * micro visual pinned to the bottom. Type scales with the tile width.
 */
export function Glance({
  figure,
  unit,
  sub,
  viz,
  figureColor,
  className,
}: {
  figure: ReactNode;
  unit?: ReactNode;
  sub?: ReactNode;
  viz?: ReactNode;
  figureColor?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="flex items-baseline gap-1.5 min-w-0">
        <span
          className="figure text-[26px] @min-[180px]:text-[32px] @min-[260px]:text-[38px] truncate"
          style={figureColor ? { color: figureColor } : undefined}
        >
          {figure}
        </span>
        {unit && <span className="text-[12px] text-ink-3 truncate">{unit}</span>}
      </div>
      {sub && <div className="mt-1.5 min-w-0 text-[12px] text-ink-3 truncate">{sub}</div>}
      {viz && <div className="mt-auto pt-2 min-h-0">{viz}</div>}
    </div>
  );
}

/** A compact label/value row used in lists inside cards. */
export function KV({ k, v, className }: { k: ReactNode; v: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3 text-[12.5px]", className)}>
      <span className="text-ink-3 truncate">{k}</span>
      <span className="font-mono text-ink num shrink-0">{v}</span>
    </div>
  );
}
