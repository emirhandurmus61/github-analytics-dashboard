// Grid system: 4 columns, each cell CELL_SIZE px tall
// Cards span colSpan (1-4) x rowSpan (1-4) cells
// Content fills the cell; overflows scroll

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
  | "developer-card";

export interface WidgetConfig {
  id: WidgetId;
  label: string;
  colSpan: number;   // 1-4
  rowSpan: number;   // 1-4
  minCol: number;
  maxCol: number;
  minRow: number;
  maxRow: number;
  visible: boolean;
}

export const CELL_SIZE = 180;
export const GRID_GAP = 10;

// Pixel heights for reference:
// 1 row = 180px
// 2 rows = 370px (180+10+180)
// 3 rows = 560px (180+10+180+10+180)
// 4 rows = 750px

export const DEFAULT_WIDGET_CONFIGS: WidgetConfig[] = [
  // Row 1: 4 stat cards (1x1 each = 180px square)
  { id: "stat-repos",    label: "Toplam Repo",         colSpan: 1, rowSpan: 1, minCol: 1, maxCol: 2, minRow: 1, maxRow: 2, visible: true },
  { id: "stat-commits",  label: "Commit Sayisi",       colSpan: 1, rowSpan: 1, minCol: 1, maxCol: 2, minRow: 1, maxRow: 2, visible: true },
  { id: "stat-langs",    label: "Kullanilan Dil",      colSpan: 1, rowSpan: 1, minCol: 1, maxCol: 2, minRow: 1, maxRow: 2, visible: true },
  { id: "week-compare",  label: "Haftalik Karsilastir", colSpan: 1, rowSpan: 1, minCol: 1, maxCol: 2, minRow: 1, maxRow: 2, visible: true },

  // Row 2: streak 2x1, goal 2x1
  { id: "streak",        label: "Streak",              colSpan: 2, rowSpan: 1, minCol: 1, maxCol: 4, minRow: 1, maxRow: 3, visible: true },
  { id: "goal",          label: "Haftalik Hedef",      colSpan: 2, rowSpan: 1, minCol: 1, maxCol: 4, minRow: 1, maxRow: 3, visible: true },

  // Row 3: insights 4x1
  { id: "insights",      label: "Icgoruler",           colSpan: 4, rowSpan: 1, minCol: 2, maxCol: 4, minRow: 1, maxRow: 2, visible: true },

  // Badges 4x2
  { id: "badges",        label: "Rozetler",            colSpan: 4, rowSpan: 2, minCol: 2, maxCol: 4, minRow: 1, maxRow: 3, visible: true },

  // Code stats 4x1
  { id: "code-stats",    label: "Kod Istatistikleri",  colSpan: 4, rowSpan: 1, minCol: 2, maxCol: 4, minRow: 1, maxRow: 2, visible: true },

  // Month compare 4x2
  { id: "month-compare", label: "Aylik Karsilastir",   colSpan: 4, rowSpan: 2, minCol: 2, maxCol: 4, minRow: 1, maxRow: 3, visible: true },

  // Velocity chart 4x2
  { id: "velocity",      label: "Velocity",            colSpan: 4, rowSpan: 2, minCol: 2, maxCol: 4, minRow: 1, maxRow: 3, visible: true },

  // Lang evolution 4x2
  { id: "lang-evolution",label: "Dil Evrimi",          colSpan: 4, rowSpan: 2, minCol: 2, maxCol: 4, minRow: 1, maxRow: 4, visible: true },

  // Contribution heatmap 4x2
  { id: "heatmap",       label: "Katki Haritasi",      colSpan: 4, rowSpan: 2, minCol: 2, maxCol: 4, minRow: 1, maxRow: 3, visible: true },

  // Activity 2x2, Lang dist 2x2
  { id: "activity-bar",  label: "Aktivite",            colSpan: 2, rowSpan: 2, minCol: 1, maxCol: 4, minRow: 1, maxRow: 3, visible: true },
  { id: "lang-dist",     label: "Dil Dagilimi",        colSpan: 2, rowSpan: 2, minCol: 1, maxCol: 4, minRow: 1, maxRow: 3, visible: true },

  // Rhythm 4x2
  { id: "rhythm",        label: "Calisma Ritmi",       colSpan: 4, rowSpan: 2, minCol: 2, maxCol: 4, minRow: 1, maxRow: 4, visible: true },

  // Commit quality 4x2
  { id: "commit-quality",label: "Commit Kalitesi",     colSpan: 4, rowSpan: 2, minCol: 2, maxCol: 4, minRow: 1, maxRow: 4, visible: true },

  // Hour heatmap 4x2
  { id: "hour-heatmap",  label: "Saat Haritasi",       colSpan: 4, rowSpan: 2, minCol: 2, maxCol: 4, minRow: 1, maxRow: 3, visible: true },

  // Repo list 4x2
  { id: "repo-list",     label: "Aktif Repolar",       colSpan: 4, rowSpan: 2, minCol: 2, maxCol: 4, minRow: 1, maxRow: 4, visible: true },

  // Repo health 4x3
  { id: "repo-health",   label: "Repo Saglik",         colSpan: 4, rowSpan: 3, minCol: 2, maxCol: 4, minRow: 1, maxRow: 4, visible: true },

  // Profil görüntülenme 2x2
  { id: "profile-views",   label: "Profil Görüntülenme", colSpan: 2, rowSpan: 2, minCol: 1, maxCol: 4, minRow: 1, maxRow: 3, visible: true },

  // Developer Card 2x3
  { id: "developer-card", label: "Developer Card",      colSpan: 2, rowSpan: 3, minCol: 1, maxCol: 4, minRow: 1, maxRow: 4, visible: true },
];
