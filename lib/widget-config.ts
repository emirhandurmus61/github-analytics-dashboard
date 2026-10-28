// Overview grid configuration.
//
// Desktop: 4 columns; a card spans colSpan × rowSpan cells within its min/max.
// Compact grid (< 1024px): 2 columns; a card takes one of four sizes:
//   S = 1×1, M = 2×1, L = 2×2, XL = 2×3
// Every card ships a dedicated layout for each shape (see components/ui/widget-size).

export type WidgetId =
  | "stat-repos"
  | "stat-commits"
  | "stat-langs"
  | "insights"
  | "streak"
  | "goal"
  | "badges"
  | "code-stats"
  | "week-compare"
  | "month-compare"
  | "velocity"
  | "lang-evolution"
  | "heatmap"
  | "activity-bar"
  | "lang-dist"
  | "rhythm"
  | "commit-quality"
  | "hour-heatmap"
  | "repo-list"
  | "repo-health"
  | "profile-views"
  | "developer-card"
  | "developer-dna"
  | "percentile-rank"
  | "advanced-goals"
  | "follow-feed";

export type MobileSize = "S" | "M" | "L" | "XL";

export const MOBILE_DIMS: Record<MobileSize, { w: number; h: number }> = {
  S: { w: 1, h: 1 },
  M: { w: 2, h: 1 },
  L: { w: 2, h: 2 },
  XL: { w: 2, h: 3 },
};

export interface WidgetConfig {
  id: WidgetId;
  label: string;
  colSpan: number;
  rowSpan: number;
  minCol: number;
  maxCol: number;
  minRow: number;
  maxRow: number;
  visible: boolean;
  mobile: MobileSize;
  mobileSizes: MobileSize[];
}

/** Legacy pixel constants (overridden by the density setting at runtime). */
export const CELL_SIZE = 184;
export const GRID_GAP = 12;

const ALL: MobileSize[] = ["S", "M", "L", "XL"];
const NO_XL: MobileSize[] = ["S", "M", "L"];

type Def = Omit<WidgetConfig, "visible" | "mobileSizes"> & { mobileSizes?: MobileSize[] };

// Default overview, read top to bottom the way a developer checks in:
// now → the year → pace → rhythm → languages → repos → you.
// Every desktop band fills all four columns, so the dense grid never reorders
// cards to plug holes. Compact grid: S tiles come in pairs for the same reason.
const DEFS: Def[] = [
  // Now: is the streak alive, how is this week going, how far to the goal
  { id: "streak", label: "Seri", colSpan: 2, rowSpan: 1, minCol: 1, maxCol: 4, minRow: 1, maxRow: 3, mobile: "M" },
  { id: "week-compare", label: "Bu hafta", colSpan: 1, rowSpan: 1, minCol: 1, maxCol: 2, minRow: 1, maxRow: 2, mobile: "S", mobileSizes: NO_XL },
  { id: "goal", label: "Haftalık hedef", colSpan: 1, rowSpan: 1, minCol: 1, maxCol: 4, minRow: 1, maxRow: 3, mobile: "S" },

  // The year, then what stands out in it
  { id: "heatmap", label: "Katkı haritası", colSpan: 4, rowSpan: 2, minCol: 1, maxCol: 4, minRow: 1, maxRow: 3, mobile: "L" },
  { id: "insights", label: "İçgörüler", colSpan: 4, rowSpan: 1, minCol: 1, maxCol: 4, minRow: 1, maxRow: 3, mobile: "L" },

  // Pace: daily volume, the trend, and this month against the last
  { id: "activity-bar", label: "Son 30 gün", colSpan: 2, rowSpan: 2, minCol: 1, maxCol: 4, minRow: 1, maxRow: 3, mobile: "M" },
  { id: "velocity", label: "Hız", colSpan: 2, rowSpan: 2, minCol: 1, maxCol: 4, minRow: 1, maxRow: 3, mobile: "L" },
  { id: "month-compare", label: "Aylık karşılaştırma", colSpan: 2, rowSpan: 1, minCol: 1, maxCol: 4, minRow: 1, maxRow: 3, mobile: "M" },
  { id: "stat-commits", label: "Commit sayısı", colSpan: 1, rowSpan: 1, minCol: 1, maxCol: 2, minRow: 1, maxRow: 2, mobile: "S", mobileSizes: NO_XL },
  { id: "code-stats", label: "Kod istatistikleri", colSpan: 1, rowSpan: 1, minCol: 1, maxCol: 4, minRow: 1, maxRow: 2, mobile: "S", mobileSizes: NO_XL },

  // Rhythm: when you code
  { id: "rhythm", label: "Çalışma ritmi", colSpan: 2, rowSpan: 2, minCol: 1, maxCol: 4, minRow: 1, maxRow: 4, mobile: "L" },
  { id: "hour-heatmap", label: "Saat haritası", colSpan: 2, rowSpan: 2, minCol: 1, maxCol: 4, minRow: 1, maxRow: 3, mobile: "L" },

  // Languages: how the mix moved, where it stands, plus the two counts
  { id: "lang-evolution", label: "Dil evrimi", colSpan: 2, rowSpan: 2, minCol: 1, maxCol: 4, minRow: 1, maxRow: 4, mobile: "L" },
  { id: "lang-dist", label: "Dil dağılımı", colSpan: 1, rowSpan: 2, minCol: 1, maxCol: 4, minRow: 1, maxRow: 3, mobile: "M" },
  { id: "stat-langs", label: "Diller", colSpan: 1, rowSpan: 1, minCol: 1, maxCol: 2, minRow: 1, maxRow: 2, mobile: "S", mobileSizes: NO_XL },
  { id: "stat-repos", label: "Repolar", colSpan: 1, rowSpan: 1, minCol: 1, maxCol: 2, minRow: 1, maxRow: 2, mobile: "S", mobileSizes: NO_XL },

  // Repos: where the work goes, how it is written, what needs attention
  { id: "repo-list", label: "Aktif repolar", colSpan: 2, rowSpan: 2, minCol: 1, maxCol: 4, minRow: 1, maxRow: 4, mobile: "L" },
  { id: "commit-quality", label: "Commit kalitesi", colSpan: 2, rowSpan: 2, minCol: 1, maxCol: 4, minRow: 1, maxRow: 4, mobile: "L" },
  { id: "repo-health", label: "Repo sağlığı", colSpan: 4, rowSpan: 2, minCol: 1, maxCol: 4, minRow: 1, maxRow: 4, mobile: "XL" },

  // You: profile, standing, progress, sharing
  { id: "developer-dna", label: "Developer DNA", colSpan: 2, rowSpan: 2, minCol: 1, maxCol: 4, minRow: 1, maxRow: 4, mobile: "L" },
  { id: "percentile-rank", label: "Sıralaman", colSpan: 2, rowSpan: 2, minCol: 1, maxCol: 4, minRow: 1, maxRow: 4, mobile: "L" },
  { id: "badges", label: "Rozetler", colSpan: 2, rowSpan: 1, minCol: 1, maxCol: 4, minRow: 1, maxRow: 3, mobile: "M" },
  { id: "advanced-goals", label: "Hedef zinciri", colSpan: 2, rowSpan: 1, minCol: 1, maxCol: 4, minRow: 1, maxRow: 4, mobile: "M" },
  { id: "developer-card", label: "Developer Card", colSpan: 2, rowSpan: 2, minCol: 1, maxCol: 4, minRow: 1, maxRow: 4, mobile: "L" },
  { id: "profile-views", label: "Profil ziyaretleri", colSpan: 2, rowSpan: 1, minCol: 1, maxCol: 2, minRow: 1, maxRow: 2, mobile: "M", mobileSizes: NO_XL },
  { id: "follow-feed", label: "Takip akışı", colSpan: 2, rowSpan: 1, minCol: 1, maxCol: 4, minRow: 1, maxRow: 4, mobile: "M" },
];

export const DEFAULT_WIDGET_CONFIGS: WidgetConfig[] = DEFS.map((d) => ({
  ...d,
  visible: true,
  mobileSizes: d.mobileSizes ?? ALL,
}));

export const WIDGET_LABELS_EN: Record<WidgetId, string> = {
  "stat-repos": "Repositories",
  "stat-commits": "Commits",
  "stat-langs": "Languages",
  "week-compare": "This week",
  streak: "Streak",
  goal: "Weekly goal",
  insights: "Insights",
  badges: "Badges",
  "code-stats": "Code stats",
  "month-compare": "Month over month",
  velocity: "Velocity",
  "lang-evolution": "Language evolution",
  heatmap: "Contribution map",
  "activity-bar": "Last 30 days",
  "lang-dist": "Language mix",
  rhythm: "Work rhythm",
  "commit-quality": "Commit quality",
  "hour-heatmap": "Hour map",
  "repo-list": "Active repos",
  "repo-health": "Repo health",
  "profile-views": "Profile visits",
  "developer-card": "Developer Card",
  "developer-dna": "Developer DNA",
  "percentile-rank": "Your ranking",
  "advanced-goals": "Goal chain",
  "follow-feed": "Following",
};

export function getWidgetLabel(id: WidgetId, lang: "tr" | "en" = "tr"): string {
  if (lang === "en") return WIDGET_LABELS_EN[id] ?? id;
  return DEFAULT_WIDGET_CONFIGS.find((c) => c.id === id)?.label ?? id;
}
