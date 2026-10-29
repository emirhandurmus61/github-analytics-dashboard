"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import React, { useState } from "react";
import { ArrowDown, ArrowUp, EyeOff, GripVertical } from "lucide-react";
import { MOBILE_DIMS, getWidgetLabel, type WidgetId } from "@/lib/widget-config";
import { useLanguage } from "@/lib/i18n";
import { WidgetSlotProvider } from "@/components/ui/widget-size";
import { cn, type Lang } from "@/lib/ui/format";
import { useGrid } from "./state";
import { ResizeHandle, SizePicker } from "./resize";

/* ── SortableWidget ──────────────────────────────────────────────────── */

export function SortableWidget({ id, children }: { id: WidgetId; children: React.ReactNode; "data-widget-id"?: string }) {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const g = useGrid();
  const cfg = g.configs.find((c) => c.id === id);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !g.editing || g.compact,
  });

  const [picker, setPicker] = useState(false);

  if (!cfg || !cfg.visible) return null;

  const m = MOBILE_DIMS[cfg.mobile];
  const w = g.compact ? m.w : cfg.colSpan;
  const h = g.compact ? m.h : cfg.rowSpan;
  const label = getWidgetLabel(id, l);
  const idx = g.order.indexOf(id);

  return (
    <div
      ref={setNodeRef}
      className={cn("gi relative min-w-0 @container", isDragging && "opacity-30", picker && "z-40")}
      style={
        {
          "--wd": cfg.colSpan,
          "--hd": cfg.rowSpan,
          "--wm": m.w,
          "--hm": m.h,
          transform: CSS.Transform.toString(transform),
          transition,
        } as React.CSSProperties
      }
      data-widget={id}
    >
      <WidgetSlotProvider value={{ w, h, mobile: g.compact }}>
        <div className={cn("h-full", g.editing && "pointer-events-none select-none")} aria-hidden={g.editing || undefined}>
          {children}
        </div>
      </WidgetSlotProvider>

      {g.editing && !g.compact && (
        <>
          <div
            {...attributes}
            {...listeners}
            className="absolute inset-0 z-20 cursor-grab active:cursor-grabbing rounded-panel outline-1 outline-dashed outline-offset-[-1px] outline-line-strong hover:outline-accent focus-visible:outline-accent bg-[color-mix(in_oklab,var(--bg-0)_14%,transparent)] transition-[outline-color]"
            aria-label={`${label}, ${cfg.colSpan}×${cfg.rowSpan}`}
          >
            <div className="absolute left-2 top-2 flex items-center gap-1.5 surface-pop h-7 pl-1.5 pr-2 text-[12px] text-ink pointer-events-none max-w-[calc(100%-110px)]">
              <GripVertical size={13} className="text-ink-3 shrink-0" />
              <span className="truncate font-medium">{label}</span>
            </div>
            <div className="absolute right-2 top-2 flex items-center gap-1">
              <SizePicker cfg={cfg} lang={l} open={picker} setOpen={setPicker} />
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => g.toggleVisible(id)}
                className="btn btn-sm btn-icon surface-pop !h-7 !w-7"
                title={lang === "en" ? "Hide card" : "Kartı gizle"}
                aria-label={lang === "en" ? `Hide ${label}` : `${label} kartını gizle`}
              >
                <EyeOff size={13} />
              </button>
            </div>
          </div>
          {cfg.maxCol > cfg.minCol && <ResizeHandle cfg={cfg} dir="e" />}
          {cfg.maxRow > cfg.minRow && <ResizeHandle cfg={cfg} dir="s" />}
          <ResizeHandle cfg={cfg} dir="se" />
        </>
      )}

      {g.editing && g.compact && (
        <div className="absolute inset-0 z-20 rounded-panel outline-1 outline-dashed outline-offset-[-1px] outline-line-strong bg-[color-mix(in_oklab,var(--bg-0)_40%,transparent)] flex flex-col justify-between p-1.5">
          <div className="flex items-center gap-1">
            <button type="button" className="btn btn-sm btn-icon surface-pop" disabled={idx <= 0} onClick={() => g.move(id, -1)} aria-label={lang === "en" ? "Move up" : "Yukarı taşı"}>
              <ArrowUp size={13} />
            </button>
            <button type="button" className="btn btn-sm btn-icon surface-pop" disabled={idx >= g.order.length - 1} onClick={() => g.move(id, 1)} aria-label={lang === "en" ? "Move down" : "Aşağı taşı"}>
              <ArrowDown size={13} />
            </button>
            <button type="button" className="btn btn-sm btn-icon surface-pop ml-auto" onClick={() => g.toggleVisible(id)} aria-label={lang === "en" ? `Hide ${label}` : `${label} kartını gizle`}>
              <EyeOff size={13} />
            </button>
          </div>
          <div className="text-center text-[12px] font-semibold text-ink px-1 truncate">{label}</div>
          <div className="seg w-full !bg-surface [&>button]:flex-1 [&>button]:justify-center [&>button]:font-mono [&>button]:!px-0" role="group" aria-label={lang === "en" ? "Size" : "Boyut"}>
            {cfg.mobileSizes.map((s) => (
              <button key={s} type="button" aria-pressed={cfg.mobile === s} onClick={() => g.setMobile(id, s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
