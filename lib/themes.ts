/**
 * Accent palette.
 *
 * The UI never paints these hex values directly anymore: every accent maps to a
 * hue of the active color scheme (see lib/ui/schemes.ts), so "violet" looks right
 * in Gruvbox, Nord, Solarized Light and so on. The hex values below are kept for
 * server-rendered images (OG cards, SVG widgets, wrapped slides) where there is
 * no CSS cascade.
 */
export type ThemeAccent =
  | "emerald"
  | "cyan"
  | "sky"
  | "violet"
  | "pink"
  | "rose"
  | "orange"
  | "amber";

export type AccentHue =
  | "green"
  | "cyan"
  | "blue"
  | "purple"
  | "pink"
  | "red"
  | "orange"
  | "yellow";

export const ACCENT_HUE: Record<ThemeAccent, AccentHue> = {
  emerald: "green",
  cyan: "cyan",
  sky: "blue",
  violet: "purple",
  pink: "pink",
  rose: "red",
  orange: "orange",
  amber: "yellow",
};

export const THEMES: Record<
  ThemeAccent,
  {
    label: string;
    labelTr: string;
    accent: string;
    accentMid: string;
    accentDim: string;
    accentBg: string;
    accentBorder: string;
    previewClass: string;
    shades: [string, string, string, string];
  }
> = {
  emerald: {
    label: "Green",
    labelTr: "Yeşil",
    accent: "#34d399",
    accentMid: "#10b981",
    accentDim: "#064e3b",
    accentBg: "rgba(52,211,153,0.08)",
    accentBorder: "rgba(52,211,153,0.2)",
    previewClass: "bg-emerald-400",
    shades: ["#166534", "#16a34a", "#22c55e", "#4ade80"],
  },
  cyan: {
    label: "Cyan",
    labelTr: "Camgöbeği",
    accent: "#22d3ee",
    accentMid: "#0891b2",
    accentDim: "#083344",
    accentBg: "rgba(34,211,238,0.08)",
    accentBorder: "rgba(34,211,238,0.2)",
    previewClass: "bg-cyan-400",
    shades: ["#083344", "#155e75", "#0891b2", "#22d3ee"],
  },
  sky: {
    label: "Blue",
    labelTr: "Mavi",
    accent: "#38bdf8",
    accentMid: "#0284c7",
    accentDim: "#082f49",
    accentBg: "rgba(56,189,248,0.08)",
    accentBorder: "rgba(56,189,248,0.2)",
    previewClass: "bg-sky-400",
    shades: ["#082f49", "#075985", "#0284c7", "#38bdf8"],
  },
  violet: {
    label: "Purple",
    labelTr: "Mor",
    accent: "#a78bfa",
    accentMid: "#7c3aed",
    accentDim: "#2e1065",
    accentBg: "rgba(167,139,250,0.08)",
    accentBorder: "rgba(167,139,250,0.2)",
    previewClass: "bg-violet-400",
    shades: ["#3b0764", "#6d28d9", "#8b5cf6", "#c4b5fd"],
  },
  pink: {
    label: "Pink",
    labelTr: "Pembe",
    accent: "#f472b6",
    accentMid: "#db2777",
    accentDim: "#500724",
    accentBg: "rgba(244,114,182,0.08)",
    accentBorder: "rgba(244,114,182,0.2)",
    previewClass: "bg-pink-400",
    shades: ["#500724", "#9d174d", "#db2777", "#f472b6"],
  },
  rose: {
    label: "Red",
    labelTr: "Kırmızı",
    accent: "#fb7185",
    accentMid: "#e11d48",
    accentDim: "#4c0519",
    accentBg: "rgba(251,113,133,0.08)",
    accentBorder: "rgba(251,113,133,0.2)",
    previewClass: "bg-rose-400",
    shades: ["#4c0519", "#9f1239", "#e11d48", "#fb7185"],
  },
  orange: {
    label: "Orange",
    labelTr: "Turuncu",
    accent: "#fb923c",
    accentMid: "#ea580c",
    accentDim: "#431407",
    accentBg: "rgba(251,146,60,0.08)",
    accentBorder: "rgba(251,146,60,0.2)",
    previewClass: "bg-orange-400",
    shades: ["#431407", "#9a3412", "#ea580c", "#fb923c"],
  },
  amber: {
    label: "Yellow",
    labelTr: "Sarı",
    accent: "#fbbf24",
    accentMid: "#d97706",
    accentDim: "#451a03",
    accentBg: "rgba(251,191,36,0.08)",
    accentBorder: "rgba(251,191,36,0.2)",
    previewClass: "bg-amber-400",
    shades: ["#451a03", "#92400e", "#d97706", "#fbbf24"],
  },
};

export const ACCENT_ORDER: ThemeAccent[] = [
  "emerald",
  "cyan",
  "sky",
  "violet",
  "pink",
  "rose",
  "orange",
  "amber",
];

export const DEFAULT_THEME: ThemeAccent = "emerald";

export function isValidTheme(value: unknown): value is ThemeAccent {
  return typeof value === "string" && value in THEMES;
}
