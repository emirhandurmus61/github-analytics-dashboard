"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  EyeOff,
  GripVertical,
  LayoutTemplate,
  Plus,
  RotateCcw,
  Scaling,
  X,
} from "lucide-react";
import {
  DEFAULT_WIDGET_CONFIGS,
  MOBILE_DIMS,
  getWidgetLabel,
  type MobileSize,
  type WidgetConfig,
  type WidgetId,
} from "@/lib/widget-config";
import { useLanguage } from "@/lib/i18n";
import { useUIPrefs } from "@/components/ui-prefs";
import { DENSITY_GRID } from "@/lib/ui/prefs";
import { WidgetSlotProvider, shapeOf, type WidgetShape } from "@/components/ui/widget-size";
import { useShell } from "@/components/shell/shell-context";
import { cn, type Lang } from "@/lib/ui/format";
import { useMediaQuery } from "@/lib/ui/hooks";
import { Kbd } from "@/components/ui/primitives";

/* ── Context ──────────────────────────────────────────────────────────── */

interface GridCtx {
  editing: boolean;
  compact: boolean;
  configs: WidgetConfig[];
  order: WidgetId[];
  setSize: (id: WidgetId, w: number, h: number) => void;
  setMobile: (id: WidgetId, s: MobileSize) => void;
  toggleVisible: (id: WidgetId) => void;
  move: (id: WidgetId, dir: -1 | 1) => void;
  metrics: { cell: number; gap: number };
}

const GridContext = createContext<GridCtx | null>(null);
const useGrid = () => useContext(GridContext)!;

/* ── Persistence ─────────────────────────────────────────────────────── */

const KEY = "dashboard_grid_v15";
type Saved = {
  configs: Pick<WidgetConfig, "id" | "colSpan" | "rowSpan" | "visible" | "mobile">[];
  order: WidgetId[];
};

// Layout lives in localStorage, read through useSyncExternalStore so the
// server render (defaults) and the client (saved layout) never fight.
const listeners = new Set<() => void>();
let memRaw: string | null | undefined;

function getRaw(): string | null {
  if (memRaw === undefined) {
    try {
      memRaw = localStorage.getItem(KEY);
    } catch {
      memRaw = null;
    }
  }
  return memRaw;
}

function writeRaw(v: string | null) {
  memRaw = v;
  try {
    if (v === null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, v);
  } catch {
    /* storage unavailable: the layout lasts for this visit */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      memRaw = e.newValue;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function serialize(configs: WidgetConfig[], order: WidgetId[]) {
  const data: Saved = {
    configs: configs.map(({ id, colSpan, rowSpan, visible, mobile }) => ({ id, colSpan, rowSpan, visible, mobile })),
    order,
  };
  return JSON.stringify(data);
}

function resolve(raw: string | null, widgetIds: WidgetId[]): { configs: WidgetConfig[]; order: WidgetId[] } {
  let saved: Saved | null = null;
  try {
    saved = raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    saved = null;
  }
  if (!saved) return { configs: DEFAULT_WIDGET_CONFIGS, order: widgetIds };
  const byId = new Map(saved.configs.map((x) => [x.id, x]));
  const configs = DEFAULT_WIDGET_CONFIGS.map((d) => {
    const s = byId.get(d.id);
    if (!s) return d;
    return {
      ...d,
      colSpan: clamp(s.colSpan ?? d.colSpan, d.minCol, d.maxCol),
      rowSpan: clamp(s.rowSpan ?? d.rowSpan, d.minRow, d.maxRow),
      visible: s.visible ?? true,
      mobile: s.mobile && d.mobileSizes.includes(s.mobile) ? s.mobile : d.mobile,
    };
  });
  const known = new Set(widgetIds);
  const kept = (saved.order ?? []).filter((id) => known.has(id));
  return { configs, order: [...kept, ...widgetIds.filter((id) => !kept.includes(id))] };
}

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(v)));

export const SHAPE_NAME: Record<WidgetShape, { tr: string; en: string }> = {
  glance: { tr: "Bakış", en: "Glance" },
  strip: { tr: "Şerit", en: "Strip" },
  column: { tr: "Sütun", en: "Column" },
  block: { tr: "Tam", en: "Full" },
};

/* ── Resize handle (desktop) ─────────────────────────────────────────── */

function ResizeHandle({ cfg, dir }: { cfg: WidgetConfig; dir: "e" | "s" | "se" }) {
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

function SizePicker({ cfg, lang, open, setOpen }: { cfg: WidgetConfig; lang: Lang; open: boolean; setOpen: (v: boolean | ((p: boolean) => boolean)) => void }) {
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

/* ── Toolbar shown while editing ─────────────────────────────────────── */

function EditToolbar({ onReset }: { onReset: () => void }) {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const { configs, toggleVisible, compact } = useGrid();
  const { setEditing } = useShell();
  const [tray, setTray] = useState(false);
  const hidden = configs.filter((c) => !c.visible);

  return (
    <div className={cn("fixed inset-x-0 z-50 flex justify-center px-3 pointer-events-none", compact ? "bottom-[calc(env(safe-area-inset-bottom)+12px)]" : "bottom-10")}>
      <div className="pointer-events-auto surface-pop w-full max-w-2xl anim-pop">
        {tray && (
          <div className="border-b border-line p-2.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-medium text-ink-2">
                {l === "en" ? `Hidden cards (${hidden.length})` : `Gizli kartlar (${hidden.length})`}
              </span>
              <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => setTray(false)} aria-label={l === "en" ? "Close" : "Kapat"}>
                <X />
              </button>
            </div>
            {hidden.length === 0 ? (
              <p className="text-[12px] text-ink-3 py-2">{l === "en" ? "Every card is on the board." : "Tüm kartlar panoda."}</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-auto">
                {hidden.map((c) => (
                  <button key={c.id} type="button" className="btn btn-sm" onClick={() => toggleVisible(c.id)}>
                    <Plus /> {getWidgetLabel(c.id, l)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 p-2">
          <button type="button" className="btn btn-primary" onClick={() => setEditing(false)}>
            <Check /> {l === "en" ? "Done" : "Bitti"}
          </button>
          <span className="hidden sm:flex items-center gap-1.5 text-[12px] text-ink-3 min-w-0 truncate">
            {compact
              ? l === "en"
                ? "Pick S/M/L/XL, move with arrows"
                : "S/M/L/XL seç, oklarla taşı"
              : l === "en"
                ? "Drag to move · pull an edge to resize"
                : "Sürükle taşı · kenarı çek boyutlandır"}
            {!compact && (
              <>
                <Kbd>Esc</Kbd>
              </>
            )}
          </span>
          <button type="button" className="btn btn-sm ml-auto" onClick={() => setTray((v) => !v)} aria-expanded={tray}>
            <LayoutTemplate /> {l === "en" ? "Hidden" : "Gizli"}
            <span className="font-mono text-ink-3">{hidden.length}</span>
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onReset} title={l === "en" ? "Restore the default layout" : "Varsayılan düzene dön"}>
            <RotateCcw /> <span className="hidden sm:inline">{l === "en" ? "Reset" : "Sıfırla"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── GridLayout ──────────────────────────────────────────────────────── */

function useCompact(initial: boolean) {
  return useMediaQuery("(max-width: 1023px)", initial);
}

export default function GridLayout({
  children,
  widgetIds,
  initialCompact = false,
}: {
  children: React.ReactNode;
  widgetIds: WidgetId[];
  initialCompact?: boolean;
}) {
  const { prefs } = useUIPrefs();
  const { lang } = useLanguage();
  const { editing, setEditing, setEditable } = useShell();
  const compact = useCompact(initialCompact);
  const raw = useSyncExternalStore(subscribe, getRaw, () => null);
  const { configs, order } = useMemo(() => resolve(raw, widgetIds), [raw, widgetIds]);
  const [activeId, setActiveId] = useState<WidgetId | null>(null);
  const metrics = DENSITY_GRID[prefs.density];

  useEffect(() => {
    setEditable(true);
    return () => {
      setEditable(false);
      setEditing(false);
    };
  }, [setEditable, setEditing]);

  // Every mutation reads the latest snapshot, so rapid resizes never lose a step.
  const mutate = useCallback(
    (fn: (s: { configs: WidgetConfig[]; order: WidgetId[] }) => { configs: WidgetConfig[]; order: WidgetId[] }) => {
      const next = fn(resolve(getRaw(), widgetIds));
      writeRaw(serialize(next.configs, next.order));
    },
    [widgetIds],
  );
  const update = useCallback(
    (fn: (c: WidgetConfig) => WidgetConfig, id: WidgetId) => mutate((s) => ({ ...s, configs: s.configs.map((c) => (c.id === id ? fn(c) : c)) })),
    [mutate],
  );

  const setSize = useCallback((id: WidgetId, w: number, h: number) => update((c) => ({ ...c, colSpan: w, rowSpan: h }), id), [update]);
  const setMobile = useCallback((id: WidgetId, s: MobileSize) => update((c) => ({ ...c, mobile: s }), id), [update]);
  const toggleVisible = useCallback((id: WidgetId) => update((c) => ({ ...c, visible: !c.visible }), id), [update]);
  const move = useCallback(
    (id: WidgetId, dir: -1 | 1) =>
      mutate((s) => {
        const visible = s.order.filter((x) => s.configs.find((c) => c.id === x)?.visible);
        const target = visible[visible.indexOf(id) + dir];
        if (!target) return s;
        return { ...s, order: arrayMove(s.order, s.order.indexOf(id), s.order.indexOf(target)) };
      }),
    [mutate],
  );

  const reset = useCallback(() => writeRaw(null), []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragStart = (e: DragStartEvent) => setActiveId(e.active.id as WidgetId);
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    mutate((s) => ({ ...s, order: arrayMove(s.order, s.order.indexOf(active.id as WidgetId), s.order.indexOf(over.id as WidgetId)) }));
  };

  const byId = useMemo(() => {
    const map = new Map<string, React.ReactNode>();
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        const id = (child.props as { id?: string }).id;
        if (id) map.set(id, child);
      }
    });
    return map;
  }, [children]);

  const ctx: GridCtx = { editing, compact, configs, order, setSize, setMobile, toggleVisible, move, metrics };
  const activeCfg = activeId ? configs.find((c) => c.id === activeId) : null;

  return (
    <GridContext.Provider value={ctx}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <SortableContext items={order} strategy={rectSortingStrategy}>
          <div className={cn("@container relative", editing && "pb-28")}>
            {editing && !compact && <GridBackdrop />}
            <div
              className="dash-grid relative z-10"
              style={{ ["--cell" as string]: `${metrics.cell}px`, ["--gap" as string]: `${metrics.gap}px` }}
            >
              {order.map((id) => byId.get(id) ?? null)}
            </div>
          </div>
        </SortableContext>
        <DragOverlay dropAnimation={null}>
          {activeCfg ? (
            <div
              className="rounded-panel border-2 border-accent bg-[color-mix(in_oklab,var(--accent)_10%,var(--bg-1))] shadow-2xl grid place-items-center text-[13px] font-medium text-ink"
              style={{ height: metrics.cell }}
            >
              {getWidgetLabel(activeCfg.id, lang as Lang)}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      {editing && <EditToolbar onReset={reset} />}
    </GridContext.Provider>
  );
}

/* Cell guides behind the cards while editing (desktop). */
function GridBackdrop() {
  const { metrics } = useGrid();
  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden hidden lg:block" aria-hidden>
      <div className="grid grid-cols-4" style={{ gap: metrics.gap, gridAutoRows: metrics.cell }}>
        {Array.from({ length: 4 * 40 }).map((_, i) => (
          <div key={i} className="rounded-panel border border-dashed border-line" />
        ))}
      </div>
    </div>
  );
}
