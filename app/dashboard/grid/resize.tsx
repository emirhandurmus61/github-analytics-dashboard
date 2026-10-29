"use client";

import React, { useEffect, useRef, useState } from "react";
import { Scaling } from "lucide-react";
import { type WidgetConfig } from "@/lib/widget-config";
import { shapeOf } from "@/components/ui/widget-size";
import { cn, type Lang } from "@/lib/ui/format";
import { useGrid, clamp, SHAPE_NAME } from "./state";

/* ── Resize handle (desktop) ─────────────────────────────────────────── */

export function ResizeHandle({ cfg, dir }: { cfg: WidgetConfig; dir: "e" | "s" | "se" }) {
  const { setSize, metrics } = useGrid();
  const start = useRef<{ x: number; y: number; w: number; h: number; colW: number; rowH: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const grid = (e.currentTarget as HTMLElement).closest(".dash-grid") as HTMLElement | null;
    const colW = grid ? (grid.getBoundingClientRect().width - metrics.gap * 3) / 4 : 280;
    start.current = { x: e.clientX, y: e.clientY, w: cfg.colSpan, h: cfg.rowSpan, colW: colW + metrics.gap, rowH: metrics.cell + metrics.gap };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const s = start.current;
    if (!s) return;
    const w = dir === "s" ? s.w : clamp(s.w + (e.clientX - s.x) / s.colW, cfg.minCol, cfg.maxCol);
    const h = dir === "e" ? s.h : clamp(s.h + (e.clientY - s.y) / s.rowH, cfg.minRow, cfg.maxRow);
    if (w !== cfg.colSpan || h !== cfg.rowSpan) setSize(cfg.id, w, h);
  };
  const end = () => (start.current = null);

  const common = {
    onPointerDown,
    onPointerMove,
    onPointerUp: end,
    onPointerCancel: end,
  };

  if (dir === "e")
    return (
      <div {...common} className="group/h absolute right-[-5px] top-6 bottom-6 z-30 w-[10px] cursor-ew-resize flex items-center justify-center" aria-hidden>
        <span className="h-10 w-[3px] rounded-full bg-line-strong group-hover/h:bg-accent transition-colors" />
      </div>
    );
  if (dir === "s")
    return (
      <div {...common} className="group/h absolute bottom-[-5px] left-6 right-6 z-30 h-[10px] cursor-ns-resize flex items-center justify-center" aria-hidden>
        <span className="w-10 h-[3px] rounded-full bg-line-strong group-hover/h:bg-accent transition-colors" />
      </div>
    );
  return (
    <div {...common} className="group/h absolute right-[-4px] bottom-[-4px] z-30 size-5 cursor-nwse-resize" aria-hidden>
      <span className="absolute right-[4px] bottom-[4px] size-2.5 border-r-2 border-b-2 border-line-strong group-hover/h:border-accent rounded-br-[3px] transition-colors" />
    </div>
  );
}

/* ── Size picker: a matrix like "insert table" ───────────────────────── */

export function SizePicker({ cfg, lang, open, setOpen }: { cfg: WidgetConfig; lang: Lang; open: boolean; setOpen: (v: boolean | ((p: boolean) => boolean)) => void }) {
  const { setSize } = useGrid();
  const [hover, setHover] = useState<{ w: number; h: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const off = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", off);
    return () => document.removeEventListener("mousedown", off);
  }, [open, setOpen]);

  const cur = hover ?? { w: cfg.colSpan, h: cfg.rowSpan };
  const shape = shapeOf(cur.w, cur.h);

  return (
    <div className="relative" ref={ref} onPointerDown={(e) => e.stopPropagation()}>
      <button
        type="button"
        className="btn btn-sm surface-pop !h-7 !px-2 gap-1.5"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        title={lang === "en" ? "Choose size" : "Boyut seç"}
      >
        <Scaling size={13} />
        <span className="font-mono text-[11.5px]">
          {cfg.colSpan}×{cfg.rowSpan}
        </span>
        <span className="hidden text-[11px] font-normal text-ink-3 @min-[260px]:inline">{SHAPE_NAME[shapeOf(cfg.colSpan, cfg.rowSpan)][lang]}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-40 surface-pop p-2.5 anim-pop w-[176px]" role="dialog">
          <div className="grid gap-[3px]" style={{ gridTemplateColumns: "repeat(4, 1fr)" }} onMouseLeave={() => setHover(null)}>
            {Array.from({ length: 4 * 4 }).map((_, i) => {
              const c = (i % 4) + 1;
              const r = Math.floor(i / 4) + 1;
              const allowed = c >= cfg.minCol && c <= cfg.maxCol && r >= cfg.minRow && r <= cfg.maxRow;
              const inSel = c <= cur.w && r <= cur.h;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={!allowed}
                  onMouseEnter={() => allowed && setHover({ w: c, h: r })}
                  onFocus={() => allowed && setHover({ w: c, h: r })}
                  onClick={() => {
                    setSize(cfg.id, c, r);
                    setOpen(false);
                  }}
                  aria-label={`${c}×${r}`}
                  className={cn(
                    "aspect-[1.6] rounded-[3px] border transition-colors",
                    !allowed && "opacity-25 cursor-not-allowed border-line",
                    allowed && (inSel ? "bg-accent border-accent" : "bg-inset border-line-strong hover:border-accent"),
                  )}
                />
              );
            })}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11.5px]">
            <span className="font-mono text-ink">
              {cur.w}×{cur.h}
            </span>
            <span className="text-ink-3">{SHAPE_NAME[shape][lang]}</span>
          </div>
        </div>
      )}
    </div>
  );
}
