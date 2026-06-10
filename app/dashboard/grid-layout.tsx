"use client";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
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
} from "react";
import {
  DEFAULT_WIDGET_CONFIGS,
  CELL_SIZE,
  GRID_GAP,
  WidgetConfig,
  WidgetId,
} from "@/lib/widget-config";
import {
  GripVertical,
  Pencil,
  Check,
  RotateCcw,
  Eye,
  EyeOff,
  Maximize2,
} from "lucide-react";

/* ─── Context ─────────────────────────────────────────────── */

interface GridCtx {
  editing: boolean;
  configs: WidgetConfig[];
  setColSpan: (id: WidgetId, v: number) => void;
  setRowSpan: (id: WidgetId, v: number) => void;
  toggleVisible: (id: WidgetId) => void;
}

const GridContext = createContext<GridCtx>({
  editing: false,
  configs: DEFAULT_WIDGET_CONFIGS,
  setColSpan: () => {},
  setRowSpan: () => {},
  toggleVisible: () => {},
});

/* ─── Storage ─────────────────────────────────────────────── */

const KEY = "dashboard_grid_v14";

function load(): { configs: WidgetConfig[]; order: WidgetId[] } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function save(configs: WidgetConfig[], order: WidgetId[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ configs, order }));
  } catch {}
}

/* ─── Snap helper ─────────────────────────────────────────── */

function snap(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

/* ─── Resize Handle ───────────────────────────────────────── */

function ResizeHandle({ id, dir }: { id: WidgetId; dir: "e" | "s" | "se" }) {
  const { configs, setColSpan, setRowSpan } = useContext(GridContext);
  const cfg = configs.find((c) => c.id === id)!;
  const startRef = useRef<{
    x: number; y: number;
    col: number; row: number;
    cellW: number; cellH: number;
  } | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const grid = (e.currentTarget as HTMLElement).closest(".widget-grid") as HTMLElement | null;
    const cellW = grid ? (grid.getBoundingClientRect().width - GRID_GAP * 3) / 4 : 200;
    startRef.current = {
      x: e.clientX, y: e.clientY,
      col: cfg.colSpan, row: cfg.rowSpan,
      cellW: cellW + GRID_GAP, cellH: CELL_SIZE + GRID_GAP,
    };
  }, [cfg]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!startRef.current) return;
    const { x, y, col, row, cellW, cellH } = startRef.current;
    if (dir !== "s") {
      const newCol = snap(col + (e.clientX - x) / cellW, cfg.minCol, cfg.maxCol);
      if (newCol !== cfg.colSpan) setColSpan(id, newCol);
    }
    if (dir !== "e") {
      const newRow = snap(row + (e.clientY - y) / cellH, cfg.minRow, cfg.maxRow);
      if (newRow !== cfg.rowSpan) setRowSpan(id, newRow);
    }
  }, [dir, cfg, id, setColSpan, setRowSpan]);

  const onPointerUp = useCallback(() => { startRef.current = null; }, []);

  if (dir === "e") return (
    <div
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
      className="absolute z-30 right-0 top-0 bottom-0 w-4 flex items-center justify-center group/h cursor-ew-resize"
    >
      <div className="w-1 h-8 rounded-full bg-zinc-600 group-hover/h:bg-[var(--accent)] transition-colors" />
    </div>
  );

  if (dir === "s") return (
    <div
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
      className="absolute z-30 bottom-0 left-0 right-0 h-4 flex items-center justify-center group/h cursor-ns-resize"
    >
      <div className="h-1 w-8 rounded-full bg-zinc-600 group-hover/h:bg-[var(--accent)] transition-colors" />
    </div>
  );

  return (
    <div
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
      className="absolute z-30 right-0 bottom-0 w-7 h-7 flex items-center justify-center group/h cursor-nwse-resize"
    >
      <Maximize2 className="w-4 h-4 text-zinc-600 group-hover/h:text-[var(--accent)] transition-colors rotate-90" />
    </div>
  );
}

/* ─── SortableWidget ──────────────────────────────────────── */

interface SortableWidgetProps {
  id: WidgetId;
  children: React.ReactNode;
  "data-widget-id"?: string;
}

export function SortableWidget({ id, children }: SortableWidgetProps) {
  const { editing, configs } = useContext(GridContext);
  const cfg = configs.find((c) => c.id === id);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled: !editing });

  if (!cfg || !cfg.visible) return null;

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        gridColumn: `span ${cfg.colSpan}`,
        gridRow: `span ${cfg.rowSpan}`,
      }}
      className={`
        relative rounded-2xl overflow-hidden
        ${isDragging ? "opacity-20 z-50 scale-[0.98]" : ""}
        transition-[opacity,transform] duration-150
      `}
    >
      {/* Edit overlay */}
      {editing && (
        <>
          {/* Drag zone */}
          <div
            {...attributes}
            {...listeners}
            className="absolute inset-0 z-20 cursor-grab active:cursor-grabbing rounded-2xl
              border-2 border-dashed border-zinc-600/40 hover:border-[var(--accent)]/50
              bg-zinc-900/60 backdrop-blur-[2px]
              flex items-center justify-center transition-colors"
          >
            <div className="flex items-center gap-2 rounded-xl bg-zinc-900/95 backdrop-blur-sm px-4 py-2 shadow-xl border border-zinc-700/60 select-none pointer-events-none">
              <GripVertical className="w-4 h-4 text-zinc-400" />
              <span className="text-sm font-medium text-zinc-200">{cfg.label}</span>
              <span className="text-xs font-mono text-zinc-500 bg-zinc-800 rounded-md px-2 py-0.5 ml-1">
                {cfg.colSpan}x{cfg.rowSpan}
              </span>
            </div>
          </div>

          {/* Resize handles */}
          <ResizeHandle id={id} dir="e" />
          <ResizeHandle id={id} dir="s" />
          <ResizeHandle id={id} dir="se" />
        </>
      )}

      {/* Content — fills the grid cell, scrolls on overflow */}
      <div className="h-full w-full overflow-auto custom-scroll">
        {children}
      </div>
    </div>
  );
}

/* ─── Grid Background (edit mode) ────────────────────────── */

function GridBackground({ totalRows }: { totalRows: number }) {
  const cells = 4 * Math.max(totalRows, 10);
  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      <div
        className="h-full w-full"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gridAutoRows: CELL_SIZE,
          gap: GRID_GAP,
        }}
      >
        {Array.from({ length: cells }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-dashed border-zinc-800/50"
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Visibility Panel ───────────────────────────────────── */

function VisibilityPanel({
  configs,
  onToggle,
}: {
  configs: WidgetConfig[];
  onToggle: (id: WidgetId) => void;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 backdrop-blur-sm p-4 mb-4">
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-widest mb-3">
        Widget Gorunurlugu
      </p>
      <div className="flex flex-wrap gap-2">
        {configs.map((cfg) => (
          <button
            key={cfg.id}
            onClick={() => onToggle(cfg.id)}
            className={`
              flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium
              transition-all border
              ${cfg.visible
                ? "border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent)]"
                : "border-zinc-800 bg-zinc-900 text-zinc-600 hover:text-zinc-400"
              }
            `}
          >
            {cfg.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {cfg.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── GridLayout (main) ───────────────────────────────────── */

interface GridLayoutProps {
  children: React.ReactNode;
  widgetIds: WidgetId[];
}

export default function GridLayout({ children, widgetIds }: GridLayoutProps) {
  const [configs, setConfigs] = useState(DEFAULT_WIDGET_CONFIGS);
  const [editing, setEditing] = useState(false);
  const [activeId, setActiveId] = useState<WidgetId | null>(null);
  const [order, setOrder] = useState(widgetIds);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = load();
    if (saved) {
      const savedMap = new Map(saved.configs.map((c: WidgetConfig) => [c.id, c]));
      const merged: WidgetConfig[] = [];
      for (const s of saved.configs) {
        const def = DEFAULT_WIDGET_CONFIGS.find((d) => d.id === s.id);
        if (def) merged.push({
          ...def,
          colSpan: s.colSpan,
          rowSpan: s.rowSpan,
          visible: s.visible,
        });
      }
      for (const def of DEFAULT_WIDGET_CONFIGS) {
        if (!savedMap.has(def.id)) merged.push(def);
      }
      setConfigs(merged);

      const known = new Set(widgetIds);
      const savedOrder = saved.order.filter((id: WidgetId) => known.has(id));
      const newIds = widgetIds.filter((id) => !savedOrder.includes(id));
      setOrder([...savedOrder, ...newIds]);
    }
    setHydrated(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const orderRef = useRef(order);
  orderRef.current = order;

  const setColSpan = useCallback((id: WidgetId, v: number) => {
    setConfigs((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, colSpan: v } : c));
      save(next, orderRef.current);
      return next;
    });
  }, []);

  const setRowSpan = useCallback((id: WidgetId, v: number) => {
    setConfigs((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, rowSpan: v } : c));
      save(next, orderRef.current);
      return next;
    });
  }, []);

  const toggleVisible = useCallback((id: WidgetId) => {
    setConfigs((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c));
      save(next, orderRef.current);
      return next;
    });
  }, []);

  const handleReset = useCallback(() => {
    setConfigs(DEFAULT_WIDGET_CONFIGS);
    setOrder(widgetIds);
    try { localStorage.removeItem(KEY); } catch {}
  }, [widgetIds]);

  // Estimate total rows for background grid
  const totalRows = useMemo(() => {
    let rows = 0;
    let colUsed = 0;
    for (const id of order) {
      const cfg = configs.find((c) => c.id === id);
      if (!cfg || !cfg.visible) continue;
      if (colUsed + cfg.colSpan > 4) {
        rows += 1;
        colUsed = 0;
      }
      colUsed += cfg.colSpan;
      rows = Math.max(rows, cfg.rowSpan);
    }
    return rows + 4;
  }, [configs, order]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } })
  );

  function handleDragStart(e: DragStartEvent) {
    setActiveId(e.active.id as WidgetId);
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    setOrder((prev) => {
      const next = arrayMove(prev, prev.indexOf(active.id as WidgetId), prev.indexOf(over.id as WidgetId));
      save(configs, next);
      return next;
    });
  }

  if (!hydrated) {
    return (
      <div
        className="widget-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
        style={{ gap: GRID_GAP, gridAutoRows: CELL_SIZE }}
      >
        {children}
      </div>
    );
  }

  return (
    <GridContext.Provider value={{ editing, configs, setColSpan, setRowSpan, toggleVisible }}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => setEditing((e) => !e)}
          className={`
            flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium
            transition-all duration-200 select-none
            ${editing
              ? "bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/25"
              : "bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            }
          `}
        >
          {editing ? <Check className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
          {editing ? "Bitti" : "Duzenle"}
        </button>

        {editing && (
          <>
            <span className="text-xs text-zinc-600 hidden sm:block">
              Kartlari surukle, kenar ve koselerden boyutlandir
            </span>
            <button
              onClick={handleReset}
              className="ml-auto flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 transition-colors rounded-lg px-3 py-1.5 hover:bg-zinc-800/50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Sifirla
            </button>
          </>
        )}
      </div>

      {editing && <VisibilityPanel configs={configs} onToggle={toggleVisible} />}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={order} strategy={rectSortingStrategy}>
          <div className="relative">
            {editing && <GridBackground totalRows={totalRows} />}

            <div
              className="widget-grid relative z-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
              style={{ gap: GRID_GAP, gridAutoRows: CELL_SIZE }}
            >
              {order.map((id) => {
                let match: React.ReactNode = null;
                React.Children.forEach(children, (child) => {
                  if (React.isValidElement(child) && (child.props as Record<string, unknown>).id === id) {
                    match = child;
                  }
                });
                return match;
              })}
            </div>
          </div>
        </SortableContext>

        <DragOverlay dropAnimation={null}>
          {activeId ? (
            <div
              className="rounded-2xl border-2 border-[var(--accent)]/50 bg-zinc-900/60 backdrop-blur-sm shadow-2xl"
              style={{ height: CELL_SIZE }}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </GridContext.Provider>
  );
}
