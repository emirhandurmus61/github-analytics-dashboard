"use client";

import type { ReactNode } from "react";
import type { ThemeAccent } from "@/lib/themes";

/**
 * Accent scope. Sets `data-accent` on a wrapper so everything inside resolves
 * `--accent` (and the derived tokens) to that hue of the active scheme. Used
 * for public profiles, where the owner's accent applies to their page.
 */
export function ThemeProvider({
  accent,
  children,
  className,
}: {
  accent: ThemeAccent;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div data-accent={accent} className={className ?? "contents"}>
      {children}
    </div>
  );
}
