"use client";

import React from "react";
import GridLayout, { SortableWidget } from "./grid-layout";
import { WidgetId } from "@/lib/widget-config";

// Re-export for use in page
export { SortableWidget };
export type { WidgetId };

interface DashboardGridProps {
  children: React.ReactNode;
  widgetIds: WidgetId[];
}

export default function DashboardGrid({ children, widgetIds }: DashboardGridProps) {
  return (
    <GridLayout widgetIds={widgetIds} children={children} />
  );
}
