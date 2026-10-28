"use client";

import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_THEME, type ThemeAccent } from "@/lib/themes";

/**
 * Accent scope. Sets `data-accent` on a wrapper so everything inside resolves
 * `--accent` (and the derived tokens) to that hue of the active scheme. Used
 * for public profiles, where the owner's accent applies to their page.
 */
const ThemeContext = createContext<ThemeAccent>(DEFAULT_THEME);

export function useTheme() {
  return useContext(ThemeContext);
}

/** Color tokens as CSS variable references, usable in inline styles and SVG. */
export const tokens = {
  accent: "var(--accent)",
  accentMid: "var(--accent-mid)",
  accentDim: "var(--accent-dim)",
  accentBg: "var(--accent-soft)",
  accentBorder: "var(--accent-line)",
  accentText: "var(--accent-text)",
  shades: ["var(--heat-1)", "var(--heat-2)", "var(--heat-3)", "var(--heat-4)"] as [string, string, string, string],
  heat0: "var(--heat-0)",
  ink1: "var(--ink-1)",
  ink2: "var(--ink-2)",
  ink3: "var(--ink-3)",
  ink4: "var(--ink-4)",
  line: "var(--line)",
  line2: "var(--line-2)",
  bg0: "var(--bg-0)",
  bg1: "var(--bg-1)",
  bg2: "var(--bg-2)",
  bg3: "var(--bg-3)",
  good: "var(--hue-green)",
  bad: "var(--hue-red)",
  warn: "var(--hue-yellow)",
  info: "var(--hue-blue)",
  red: "var(--hue-red)",
  orange: "var(--hue-orange)",
  yellow: "var(--hue-yellow)",
  green: "var(--hue-green)",
  cyan: "var(--hue-cyan)",
  blue: "var(--hue-blue)",
  purple: "var(--hue-purple)",
  pink: "var(--hue-pink)",
} as const;

/** @deprecated use `tokens` — kept so older call sites keep compiling. */
export function useThemeColors() {
  return tokens;
}

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
    <ThemeContext.Provider value={accent}>
      <div data-accent={accent} className={className ?? "contents"}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}
