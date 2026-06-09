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
  useRef,
  useState,
} from "react";
import {
  DEFAULT_WIDGET_CONFIGS,
  WidgetConfig,
  WidgetId,
} from "@/lib/widget-config";

/* ─── Context ─────────────────────────────────────────────── */

interface GridCtx {
  editing: boolean;
  configs: WidgetConfig[];
  updateColSpan: (id: WidgetId, colSpan: WidgetConfig["colSpan"]) => void;
  updateRowSpan: (id: WidgetId, rowSpan: WidgetConfig["rowSpan"]) => void;
  toggleVisible: (id: WidgetId) => void;
}

const GridContext = createContext<GridCtx>({
  editing: false,
  configs: DEFAULT_WIDGET_CONFIGS,
  updateColSpan: () => {},
  updateRowSpan: () => {},
  toggleVisible: () => {},
});

export function useGridContext() {
  return useContext(GridContext);
}

/* ─── Storage helpers ─────────────────────────────────────── */

const STORAGE_KEY = "dashboard_grid_v2";

function loadSaved(): { configs: WidgetConfig[]; order: WidgetId[] } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function persistSaved(configs: WidgetConfig[], order: WidgetId[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ configs, order }));
  } catch {}
}

/* ─── Resize handle ───────────────────────────────────────── */

interface ResizeHandleProps {
  id: WidgetId;
  axis: "col" | "row" | "both";
}

function ResizeHandle({ id, axis }: ResizeHandleProps) {
  const { configs, updateColSpan, updateRowSpan } = useGridContext();
  const cfg = configs.find((c) => c.id === id)!;
  const startRef = useRef<{ x: number; y: number; col: number; row: number } | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      startRef.current = {
        x: e.clientX,
        y: e.clientY,
        col: cfg.colSpan,
        row: cfg.rowSpan,
      };
    },
    [cfg]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!startRef.current) return;
      const CELL_W = Math.max(window.innerWidth / 4, 100);
      const CELL_H = 140;

      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;

      if (axis === "col" || axis === "both") {
        const newCol = Math.round(startRef.current.col + dx / CELL_W);
        const clamped = Math.max(cfg.minColSpan, Math.min(cfg.maxColSpan, newCol)) as WidgetConfig["colSpan"];
        if (clamped !== cfg.colSpan) updateColSpan(id, clamped);
      }
      if (axis === "row" || axis === "both") {
        const newRow = Math.round(startRef.current.row + dy / CELL_H);
        const clamped = Math.max(cfg.minRowSpan, Math.min(cfg.maxRowSpan, newRow)) as WidgetConfig["rowSpan"];
        if (clamped !== cfg.rowSpan) updateRowSpan(id, clamped);
      }
    },
    [axis, cfg, id, updateColSpan, updateRowSpan]
  );

  const onPointerUp = useCallback(() => {
    startRef.current = null;
  }, []);

  const cursorMap = { col: "ew-resize", row: "ns-resize", both: "se-resize" };
  const posMap = {
    col: "right-0 top-1/2 -translate-y-1/2 h-12 w-3 rounded-l-none rounded-r-xl",
    row: "bottom-0 left-1/2 -translate-x-1/2 w-12 h-3 rounded-t-none rounded-b-xl",
    both: "right-0 bottom-0 w-6 h-6 rounded-tl-xl rounded-br-2xl",
  };

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ cursor: cursorMap[axis] }}
      className={`absolute ${posMap[axis]} z-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-600/90 hover:bg-accent`}
      title="Boyutlandır"
    >
      {axis === "both" && (
        <svg className="w-3 h-3 text-white/80" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M7 3L3 7M5 3L3 5M7 5L5 7" strokeLinecap="round"/>
        </svg>
      )}
    </div>
  );
}

/* ─── Sortable widget wrapper ─────────────────────────────── */

interface SortableWidgetProps {
  id: WidgetId;
  children: React.ReactNode;
  "data-widget-id"?: string;
}

export function SortableWidget({ id, children }: SortableWidgetProps) {
  const { editing, configs } = useGridContext();
  const cfg = configs.find((c) => c.id === id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: !editing });

  if (!cfg || !cfg.visible) return null;

  const colClass = COL_SPAN_CLASSES[cfg.colSpan] ?? "col-span-1";

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    minHeight: cfg.rowSpan > 1 ? `${cfg.rowSpan * 140}px` : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative ${colClass} ${isDragging ? "opacity-30 scale-95 z-50" : ""} transition-[opacity,transform]`}
    >
      {/* Drag handle overlay */}
      {editing && (
        <div
          {...attributes}
          {...listeners}
          className="absolute inset-0 z-20 cursor-grab active:cursor-grabbing rounded-2xl ring-2 ring-accent/60 bg-accent/5 hover:bg-accent/10 transition-colors"
        >
          <div className="absolute top-2 right-8 rounded-lg bg-zinc-800/90 px-2 py-1 flex items-center gap-1 pointer-events-none">
            <svg className="w-3 h-3 text-zinc-400" viewBox="0 0 16 16" fill="currentColor">
              <circle cx="5" cy="3" r="1.5"/>
              <circle cx="11" cy="3" r="1.5"/>
              <circle cx="5" cy="8" r="1.5"/>
              <circle cx="11" cy="8" r="1.5"/>
              <circle cx="5" cy="13" r="1.5"/>
              <circle cx="11" cy="13" r="1.5"/>
            </svg>
            <span className="text-[10px] text-zinc-500">{cfg.colSpan}×{cfg.rowSpan}</span>
          </div>
        </div>
      )}

      {/* Resize handles */}
      {editing && (
        <>
          <ResizeHandle id={id} axis="col" />
          <ResizeHandle id={id} axis="row" />
          <ResizeHandle id={id} axis="both" />
        </>
      )}

      <div className="h-full">{children}</div>
    </div>
  );
}

/* ─── Edit toggle button ──────────────────────────────────── */

interface EditToggleProps {
  editing: boolean;
  onToggle: () => void;
}

function EditToggle({ editing, onToggle }: EditToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium transition-all ${
        editing
          ? "bg-accent text-white shadow-lg shadow-accent/20"
          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
      }`}
    >
      {editing ? (
        <>
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
          </svg>
          Bitti
        </>
      ) : (
        <>
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
          </svg>
          Düzenle
        </>
      )}
    </button>
  );
}

/* ─── Visibility panel ────────────────────────────────────── */

interface VisibilityPanelProps {
  configs: WidgetConfig[];
  onToggle: (id: WidgetId) => void;
  onReset: () => void;
}

function VisibilityPanel({ configs, onToggle, onReset }: VisibilityPanelProps) {
  return (
    <div className="rounded-2xl border border-zinc-700 bg-zinc-900/80 backdrop-blur-sm p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-zinc-300">Widget&apos;ları Göster / Gizle</h3>
        <button
          onClick={onReset}
          className="text-xs text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1"
        >
          <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
          </svg>
          Sıfırla
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {configs.map((cfg) => (
          <button
            key={cfg.id}
            onClick={() => onToggle(cfg.id)}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all border ${
              cfg.visible
                ? "border-accent/50 bg-accent/10 text-accent"
                : "border-zinc-700 bg-zinc-800/50 text-zinc-500 hover:text-zinc-300 line-through"
            }`}
          >
            {cfg.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Responsive grid container ──────────────────────────── */

// Maps desktop colSpan (1-4) to responsive Tailwind classes
// On mobile (< sm): always 1 col
// On tablet (sm-lg): max 2 cols
// On desktop (lg+): up to 4 cols
const COL_SPAN_CLASSES: Record<number, string> = {
  1: "col-span-1",
  2: "col-span-1 sm:col-span-2",
  3: "col-span-1 sm:col-span-2 lg:col-span-3",
  4: "col-span-1 sm:col-span-2 lg:col-span-4",
};

function ResponsiveGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {children}
    </div>
  );
}

export { COL_SPAN_CLASSES };

/* ─── Main GridLayout ─────────────────────────────────────── */

interface GridLayoutProps {
  children: React.ReactNode;
  widgetIds: WidgetId[];
}

export default function GridLayout({ children, widgetIds }: GridLayoutProps) {
  const [configs, setConfigs] = useState<WidgetConfig[]>(DEFAULT_WIDGET_CONFIGS);
  const [editing, setEditing] = useState(false);
  const [activeId, setActiveId] = useState<WidgetId | null>(null);
  const [order, setOrder] = useState<WidgetId[]>(widgetIds);
  const [hydrated, setHydrated] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    const saved = loadSaved();
    if (saved) {
      // Merge saved configs with defaults (add new widgets)
      const savedMap = new Map(saved.configs.map((c) => [c.id, c]));
      const merged: WidgetConfig[] = [];
      for (const s of saved.configs) {
        const def = DEFAULT_WIDGET_CONFIGS.find((d) => d.id === s.id);
        if (def) merged.push({ ...def, ...s });
      }
      for (const def of DEFAULT_WIDGET_CONFIGS) {
        if (!savedMap.has(def.id)) merged.push(def);
      }
      setConfigs(merged);

      // Restore order
      const knownIds = new Set(widgetIds);
      const savedOrder = saved.order.filter((id) => knownIds.has(id));
      const newIds = widgetIds.filter((id) => !savedOrder.includes(id));
      setOrder([...savedOrder, ...newIds]);
    }
    setHydrated(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateColSpan = useCallback((id: WidgetId, colSpan: WidgetConfig["colSpan"]) => {
    setConfigs((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, colSpan } : c));
      persistSaved(next, order);
      return next;
    });
  }, [order]);

  const updateRowSpan = useCallback((id: WidgetId, rowSpan: WidgetConfig["rowSpan"]) => {
    setConfigs((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, rowSpan } : c));
      persistSaved(next, order);
      return next;
    });
  }, [order]);

  const toggleVisible = useCallback((id: WidgetId) => {
    setConfigs((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c));
      persistSaved(next, order);
      return next;
    });
  }, [order]);

  const handleReset = useCallback(() => {
    setConfigs(DEFAULT_WIDGET_CONFIGS);
    setOrder(widgetIds);
    localStorage.removeItem(STORAGE_KEY);
  }, [widgetIds]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as WidgetId);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    setOrder((prev) => {
      const oldIndex = prev.indexOf(active.id as WidgetId);
      const newIndex = prev.indexOf(over.id as WidgetId);
      const newOrder = arrayMove(prev, oldIndex, newIndex);
      persistSaved(configs, newOrder);
      return newOrder;
    });
  }

  const activeConfig = configs.find((c) => c.id === activeId);

  // Responsive: on mobile collapse to 1 col, tablet 2, desktop 4
  // We use CSS for this via grid template

  if (!hydrated) {
    // SSR/hydration: render static grid without dnd
    return (
      <ResponsiveGrid>
        {children}
      </ResponsiveGrid>
    );
  }

  return (
    <GridContext.Provider value={{ editing, configs, updateColSpan, updateRowSpan, toggleVisible }}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Edit toolbar */}
        <div className="mb-4 flex items-center gap-3">
          <EditToggle editing={editing} onToggle={() => setEditing((e) => !e)} />
          {editing && (
            <p className="text-xs text-zinc-500 hidden sm:block">
              Sürükle taşı · Kenara veya köşeye sürükle boyutlandır
            </p>
          )}
        </div>

        {/* Visibility panel */}
        {editing && (
          <VisibilityPanel configs={configs} onToggle={toggleVisible} onReset={handleReset} />
        )}

        {/* Sortable grid */}
        <SortableContext items={order} strategy={rectSortingStrategy}>
          <ResponsiveGrid>
            {order.map((id) => {
              let match: React.ReactNode = null;
              React.Children.forEach(children, (child) => {
                if (React.isValidElement(child) && (child.props as Record<string, unknown>).id === id) {
                  match = child;
                }
              });
              return match;
            })}
          </ResponsiveGrid>
        </SortableContext>

        {/* Drag overlay */}
        <DragOverlay>
          {activeId && activeConfig ? (
            <div
              className="rounded-2xl border-2 border-accent/70 bg-zinc-900/60 backdrop-blur-sm shadow-2xl"
              style={{ minHeight: `${activeConfig.rowSpan * 140}px` }}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </GridContext.Provider>
  );
}
