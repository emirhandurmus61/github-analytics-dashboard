export type ThemeAccent =
  | "emerald"
  | "violet"
  | "rose"
  | "amber"
  | "sky"
  | "cyan";

export const THEMES: Record<
  ThemeAccent,
  {
    label: string;
    // CSS custom property değerleri
    accent: string;       // ana vurgu rengi (heatmap, progress bar, aktif elementler)
    accentMid: string;    // orta ton
    accentDim: string;    // koyu/soluk ton (heatmap boş hücre gölgesi)
    accentBg: string;     // çok hafif arka plan tonu
    accentBorder: string; // border için rgba
    // Sabit preview rengi (tailwind class için)
    previewClass: string;
    // Hex değerler (inline style için)
    shades: [string, string, string, string]; // [koyu→açık] heatmap gradyanı
  }
> = {
  emerald: {
    label: "Emerald",
    accent: "#34d399",
    accentMid: "#10b981",
    accentDim: "#064e3b",
    accentBg: "rgba(52,211,153,0.08)",
    accentBorder: "rgba(52,211,153,0.2)",
    previewClass: "bg-emerald-400",
    shades: ["#166534", "#16a34a", "#22c55e", "#4ade80"],
  },
  violet: {
    label: "Violet",
    accent: "#a78bfa",
    accentMid: "#7c3aed",
    accentDim: "#2e1065",
    accentBg: "rgba(167,139,250,0.08)",
    accentBorder: "rgba(167,139,250,0.2)",
    previewClass: "bg-violet-400",
    shades: ["#3b0764", "#6d28d9", "#8b5cf6", "#c4b5fd"],
  },
  rose: {
    label: "Rose",
    accent: "#fb7185",
    accentMid: "#e11d48",
    accentDim: "#4c0519",
    accentBg: "rgba(251,113,133,0.08)",
    accentBorder: "rgba(251,113,133,0.2)",
    previewClass: "bg-rose-400",
    shades: ["#4c0519", "#9f1239", "#e11d48", "#fb7185"],
  },
  amber: {
    label: "Amber",
    accent: "#fbbf24",
    accentMid: "#d97706",
    accentDim: "#451a03",
    accentBg: "rgba(251,191,36,0.08)",
    accentBorder: "rgba(251,191,36,0.2)",
    previewClass: "bg-amber-400",
    shades: ["#451a03", "#92400e", "#d97706", "#fbbf24"],
  },
  sky: {
    label: "Sky",
    accent: "#38bdf8",
    accentMid: "#0284c7",
    accentDim: "#082f49",
    accentBg: "rgba(56,189,248,0.08)",
    accentBorder: "rgba(56,189,248,0.2)",
    previewClass: "bg-sky-400",
    shades: ["#082f49", "#075985", "#0284c7", "#38bdf8"],
  },
  cyan: {
    label: "Cyan",
    accent: "#22d3ee",
    accentMid: "#0891b2",
    accentDim: "#083344",
    accentBg: "rgba(34,211,238,0.08)",
    accentBorder: "rgba(34,211,238,0.2)",
    previewClass: "bg-cyan-400",
    shades: ["#083344", "#155e75", "#0891b2", "#22d3ee"],
  },
};

export const DEFAULT_THEME: ThemeAccent = "emerald";

export function isValidTheme(value: unknown): value is ThemeAccent {
  return typeof value === "string" && value in THEMES;
}
