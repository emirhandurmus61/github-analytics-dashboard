"use client";

import { createContext, useContext } from "react";

/**
 * Size of the grid slot a widget currently occupies.
 *
 * Desktop: 4 columns, w/h are column/row spans (1–4).
 * Compact grid (phones, tablets): 2 columns; S = 1×1, M = 2×1, L = 2×2, XL = 2×3.
 *
 * Widgets render a dedicated layout per shape instead of just shrinking:
 *   glance  1×1        one number and a micro visual
 *   strip   w≥2, h=1   a horizontal summary
 *   column  w=1, h≥2   a vertical summary
 *   block   w≥2, h≥2   the full widget (wide = w≥3, tall = h≥3)
 */
export type WidgetSlot = { w: number; h: number; mobile: boolean };

export type WidgetShape = "glance" | "strip" | "column" | "block";

const SlotContext = createContext<WidgetSlot>({ w: 2, h: 2, mobile: false });

export const WidgetSlotProvider = SlotContext.Provider;

export function shapeOf(w: number, h: number): WidgetShape {
  if (w === 1 && h === 1) return "glance";
  if (h === 1) return "strip";
  if (w === 1) return "column";
  return "block";
}

export function useWidgetSize() {
  const s = useContext(SlotContext);
  const shape = shapeOf(s.w, s.h);
  return {
    ...s,
    shape,
    area: s.w * s.h,
    wide: !s.mobile && s.w >= 3,
    full: !s.mobile && s.w === 4,
    tall: s.h >= 3,
  };
}
