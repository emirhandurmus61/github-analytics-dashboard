/**
 * Appearance preferences.
 *
 * Stored in the `devboard_ui` cookie so the server renders the right interface
 * and colors on the first byte (no flash). Everything here is a viewer
 * preference; the accent is also mirrored to the database because it themes
 * the public profile.
 */
import { SCHEMES, isSchemeId, schemeDeclarations, type SchemeId } from "./schemes";
import { isValidTheme, DEFAULT_THEME, type ThemeAccent } from "@/lib/themes";

export type InterfaceId = "editor" | "terminal" | "studio";
export type ColorMode = "dark" | "light" | "system";
export type Density = "compact" | "regular" | "roomy";
export type UiFont = "recursive" | "geist" | "plex" | "system";
export type MonoFont = "recursive" | "jetbrains" | "fira" | "plex" | "geist";
export type MotionPref = "system" | "full" | "reduced";

export interface UIPrefs {
  ui: InterfaceId;
  mode: ColorMode;
  dark: SchemeId;
  light: SchemeId;
  accent: ThemeAccent;
  density: Density;
  fontUi: UiFont;
  fontMono: MonoFont;
  casual: boolean;
  motion: MotionPref;
}

export const UI_COOKIE = "devboard_ui";

export const DEFAULT_PREFS: UIPrefs = {
  ui: "editor",
  mode: "dark",
  dark: "devboard-night",
  light: "devboard-day",
  accent: DEFAULT_THEME,
  density: "regular",
  fontUi: "recursive",
  fontMono: "recursive",
  casual: false,
  motion: "system",
};

const INTERFACES: InterfaceId[] = ["editor", "terminal", "studio"];
const MODES: ColorMode[] = ["dark", "light", "system"];
const DENSITIES: Density[] = ["compact", "regular", "roomy"];
const UI_FONTS: UiFont[] = ["recursive", "geist", "plex", "system"];
const MONO_FONTS: MonoFont[] = ["recursive", "jetbrains", "fira", "plex", "geist"];
const MOTIONS: MotionPref[] = ["system", "full", "reduced"];

function pick<T extends string>(list: readonly T[], v: unknown, fallback: T): T {
  return typeof v === "string" && (list as readonly string[]).includes(v) ? (v as T) : fallback;
}

export function parsePrefs(raw: string | undefined | null): UIPrefs {
  if (!raw) return DEFAULT_PREFS;
  let obj: Record<string, unknown> = {};
  try {
    obj = JSON.parse(decodeURIComponent(raw));
  } catch {
    return DEFAULT_PREFS;
  }
  const dark = isSchemeId(obj.dark) && SCHEMES[obj.dark].kind === "dark" ? obj.dark : DEFAULT_PREFS.dark;
  const light = isSchemeId(obj.light) && SCHEMES[obj.light].kind === "light" ? obj.light : DEFAULT_PREFS.light;
  return {
    ui: pick(INTERFACES, obj.ui, DEFAULT_PREFS.ui),
    mode: pick(MODES, obj.mode, DEFAULT_PREFS.mode),
    dark,
    light,
    accent: isValidTheme(obj.accent) ? obj.accent : DEFAULT_PREFS.accent,
    density: pick(DENSITIES, obj.density, DEFAULT_PREFS.density),
    fontUi: pick(UI_FONTS, obj.fontUi, DEFAULT_PREFS.fontUi),
    fontMono: pick(MONO_FONTS, obj.fontMono, DEFAULT_PREFS.fontMono),
    casual: obj.casual === true,
    motion: pick(MOTIONS, obj.motion, DEFAULT_PREFS.motion),
  };
}

export function serializePrefs(p: UIPrefs): string {
  return encodeURIComponent(JSON.stringify(p));
}

/** The scheme CSS for <style id="ui-scheme">. System mode follows the OS. */
export function buildSchemeCss(p: UIPrefs): string {
  const dark = schemeDeclarations(SCHEMES[p.dark]);
  const light = schemeDeclarations(SCHEMES[p.light]);
  if (p.mode === "dark") return `:root{${dark}}`;
  if (p.mode === "light") return `:root{${light}}`;
  return `:root{${dark}}@media (prefers-color-scheme: light){:root{${light}}}`;
}

/** Attributes applied to <html>. Keep in sync with globals.css selectors. */
export function htmlAttributes(p: UIPrefs): Record<string, string> {
  return {
    "data-ui": p.ui,
    "data-mode": p.mode,
    "data-accent": p.accent,
    "data-density": p.density,
    "data-font-ui": p.fontUi,
    "data-font-mono": p.fontMono,
    "data-casual": p.casual ? "on" : "off",
    "data-motion": p.motion,
  };
}

/** Grid metrics for the overview per density. */
export const DENSITY_GRID: Record<Density, { cell: number; gap: number }> = {
  compact: { cell: 164, gap: 8 },
  regular: { cell: 184, gap: 12 },
  roomy: { cell: 204, gap: 16 },
};
