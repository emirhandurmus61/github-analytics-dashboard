import { createContext, useContext } from "react";
import { DEFAULT_WIDGET_CONFIGS, type MobileSize, type WidgetConfig, type WidgetId } from "@/lib/widget-config";
import { type WidgetShape } from "@/components/ui/widget-size";

/* ── Context ──────────────────────────────────────────────────────────── */

export interface GridCtx {
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

export const GridContext = createContext<GridCtx | null>(null);
export const useGrid = () => useContext(GridContext)!;

/* ── Persistence ─────────────────────────────────────────────────────── */

// Bumped when the default layout changes, so everyone starts from the new one.
export const KEY = "dashboard_grid_v16";
export type Saved = {
  configs: Pick<WidgetConfig, "id" | "colSpan" | "rowSpan" | "visible" | "mobile">[];
  order: WidgetId[];
};

// Layout lives in localStorage, read through useSyncExternalStore so the
// server render (defaults) and the client (saved layout) never fight.
export const listeners = new Set<() => void>();
let memRaw: string | null | undefined;

export function getRaw(): string | null {
  if (memRaw === undefined) {
    try {
      memRaw = localStorage.getItem(KEY);
    } catch {
      memRaw = null;
    }
  }
  return memRaw;
}

export function writeRaw(v: string | null) {
  memRaw = v;
  try {
    if (v === null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, v);
  } catch {
    /* storage unavailable: the layout lasts for this visit */
  }
  listeners.forEach((l) => l());
}

export function subscribe(cb: () => void) {
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

export function serialize(configs: WidgetConfig[], order: WidgetId[]) {
  const data: Saved = {
    configs: configs.map(({ id, colSpan, rowSpan, visible, mobile }) => ({ id, colSpan, rowSpan, visible, mobile })),
    order,
  };
  return JSON.stringify(data);
}

export function resolve(raw: string | null, widgetIds: WidgetId[]): { configs: WidgetConfig[]; order: WidgetId[] } {
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

export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(v)));

export const SHAPE_NAME: Record<WidgetShape, { tr: string; en: string }> = {
  glance: { tr: "Bakış", en: "Glance" },
  strip: { tr: "Şerit", en: "Strip" },
  column: { tr: "Sütun", en: "Column" },
  block: { tr: "Tam", en: "Full" },
};
