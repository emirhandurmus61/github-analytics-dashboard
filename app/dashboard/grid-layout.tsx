"use client";

import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import React, { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { getWidgetLabel, type MobileSize, type WidgetConfig, type WidgetId } from "@/lib/widget-config";
import { useLanguage } from "@/lib/i18n";
import { useUIPrefs } from "@/components/ui-prefs";
import { DENSITY_GRID } from "@/lib/ui/prefs";
import { useShell } from "@/components/shell/shell-context";
import { cn, type Lang } from "@/lib/ui/format";
import { useMediaQuery } from "@/lib/ui/hooks";
import { GridCtx, GridContext, useGrid, getRaw, writeRaw, subscribe, serialize, resolve } from "./grid/state";
import { EditToolbar } from "./grid/edit-toolbar";

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
