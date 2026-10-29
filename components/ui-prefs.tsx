"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  buildSchemeCss,
  htmlAttributes,
  serializePrefs,
  UI_COOKIE,
  DEFAULT_PREFS,
  type UIPrefs,
} from "@/lib/ui/prefs";
import { SCHEMES, type Scheme } from "@/lib/ui/schemes";
import { useMediaQuery } from "@/lib/ui/hooks";

type Ctx = {
  prefs: UIPrefs;
  setPrefs: (patch: Partial<UIPrefs>) => void;
  /** The scheme that is painted right now (system mode resolved). */
  scheme: Scheme;
};

const UIPrefsContext = createContext<Ctx>({
  prefs: DEFAULT_PREFS,
  setPrefs: () => {},
  scheme: SCHEMES[DEFAULT_PREFS.dark],
});

function applyToDocument(p: UIPrefs) {
  const root = document.documentElement;
  for (const [k, v] of Object.entries(htmlAttributes(p))) root.setAttribute(k, v);
  let style = document.getElementById("ui-scheme") as HTMLStyleElement | null;
  if (!style) {
    style = document.createElement("style");
    style.id = "ui-scheme";
    document.head.appendChild(style);
  }
  style.textContent = buildSchemeCss(p);
  const meta = document.querySelector('meta[name="theme-color"]');
  const scheme = SCHEMES[resolveKind(p) === "light" ? p.light : p.dark];
  if (meta) meta.setAttribute("content", scheme.bg[0]);
  try {
    document.cookie = `${UI_COOKIE}=${serializePrefs(p)}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {
    /* cookies blocked: preferences still apply for this tab */
  }
}

function resolveKind(p: UIPrefs): "dark" | "light" {
  if (p.mode !== "system") return p.mode;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function UIPrefsProvider({ initial, children }: { initial: UIPrefs; children: ReactNode }) {
  const [prefs, setState] = useState<UIPrefs>(initial);
  const systemLight = useMediaQuery("(prefers-color-scheme: light)");
  const ref = useRef(prefs);

  const setPrefs = useCallback((patch: Partial<UIPrefs>) => {
    const next = { ...ref.current, ...patch };
    ref.current = next;
    applyToDocument(next);
    setState(next);
  }, []);

  const scheme = useMemo(() => {
    const light = prefs.mode === "light" || (prefs.mode === "system" && systemLight);
    return SCHEMES[light ? prefs.light : prefs.dark];
  }, [prefs, systemLight]);

  const value = useMemo(() => ({ prefs, setPrefs, scheme }), [prefs, setPrefs, scheme]);

  return <UIPrefsContext.Provider value={value}>{children}</UIPrefsContext.Provider>;
}

export function useUIPrefs() {
  return useContext(UIPrefsContext);
}
