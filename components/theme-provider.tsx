"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { THEMES, DEFAULT_THEME, type ThemeAccent } from "@/lib/themes";

const ThemeContext = createContext<ThemeAccent>(DEFAULT_THEME);

export function useTheme() {
  return useContext(ThemeContext);
}

export function useThemeColors() {
  const accent = useTheme();
  return THEMES[accent];
}

export function ThemeProvider({
  accent,
  children,
}: {
  accent: ThemeAccent;
  children: ReactNode;
}) {
  const theme = THEMES[accent];

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--accent-mid", theme.accentMid);
    root.style.setProperty("--accent-dim", theme.accentDim);
    root.style.setProperty("--accent-bg", theme.accentBg);
    root.style.setProperty("--accent-border", theme.accentBorder);
  }, [theme]);

  return (
    <ThemeContext.Provider value={accent}>
      {children}
    </ThemeContext.Provider>
  );
}
