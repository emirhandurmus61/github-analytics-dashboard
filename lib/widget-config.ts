// Widget grid configuration
// Grid: 4 columns on desktop, 2 on tablet, 1 on mobile
// colSpan: 1-4 (how many columns the widget spans)
// rowSpan: 1-4 (height multiplier)

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
  | "repo-health";

export interface WidgetConfig {
  id: WidgetId;
  label: string;
  colSpan: 1 | 2 | 3 | 4;
  rowSpan: 1 | 2 | 3 | 4;
  minColSpan: 1 | 2 | 3 | 4;
  maxColSpan: 1 | 2 | 3 | 4;
  minRowSpan: 1 | 2 | 3 | 4;
  maxRowSpan: 1 | 2 | 3 | 4;
  visible: boolean;
}

export const DEFAULT_WIDGET_CONFIGS: WidgetConfig[] = [
  {
    id: "stat-repos",
    label: "Toplam Repo",
    colSpan: 1,
    rowSpan: 1,
    minColSpan: 1,
    maxColSpan: 4,
    minRowSpan: 1,
    maxRowSpan: 2,
    visible: true,
  },
  {
    id: "stat-commits",
    label: "Commit Sayısı",
    colSpan: 1,
    rowSpan: 1,
    minColSpan: 1,
    maxColSpan: 4,
    minRowSpan: 1,
    maxRowSpan: 2,
    visible: true,
  },
  {
    id: "stat-langs",
    label: "Kullanılan Dil",
    colSpan: 1,
    rowSpan: 1,
    minColSpan: 1,
    maxColSpan: 4,
    minRowSpan: 1,
    maxRowSpan: 2,
    visible: true,
  },
  {
    id: "insights",
    label: "Aktivite İçgörüleri",
    colSpan: 4,
    rowSpan: 1,
    minColSpan: 2,
    maxColSpan: 4,
    minRowSpan: 1,
    maxRowSpan: 3,
    visible: true,
  },
  {
    id: "streak",
    label: "Streak & Aktivite",
    colSpan: 2,
    rowSpan: 1,
    minColSpan: 1,
    maxColSpan: 4,
    minRowSpan: 1,
    maxRowSpan: 3,
    visible: true,
  },
  {
    id: "goal",
    label: "Haftalık Hedef",
    colSpan: 2,
    rowSpan: 1,
    minColSpan: 1,
    maxColSpan: 4,
    minRowSpan: 1,
    maxRowSpan: 3,
    visible: true,
  },
  {
    id: "badges",
    label: "Rozetler",
    colSpan: 4,
    rowSpan: 1,
    minColSpan: 2,
    maxColSpan: 4,
    minRowSpan: 1,
    maxRowSpan: 2,
    visible: true,
  },
  {
    id: "code-stats",
    label: "Kod İstatistikleri",
    colSpan: 4,
    rowSpan: 1,
    minColSpan: 2,
    maxColSpan: 4,
    minRowSpan: 1,
    maxRowSpan: 2,
    visible: true,
  },
  {
    id: "week-compare",
    label: "Bu Hafta vs Geçen",
    colSpan: 2,
    rowSpan: 1,
    minColSpan: 1,
    maxColSpan: 4,
    minRowSpan: 1,
    maxRowSpan: 3,
    visible: true,
  },
  {
    id: "month-compare",
    label: "Bu Ay vs Geçen",
    colSpan: 2,
    rowSpan: 1,
    minColSpan: 1,
    maxColSpan: 4,
    minRowSpan: 1,
    maxRowSpan: 3,
    visible: true,
  },
  {
    id: "velocity",
    label: "Velocity Grafiği",
    colSpan: 4,
    rowSpan: 2,
    minColSpan: 2,
    maxColSpan: 4,
    minRowSpan: 1,
    maxRowSpan: 3,
    visible: true,
  },
  {
    id: "lang-evolution",
    label: "Dil Evrimi",
    colSpan: 4,
    rowSpan: 2,
    minColSpan: 2,
    maxColSpan: 4,
    minRowSpan: 1,
    maxRowSpan: 3,
    visible: true,
  },
  {
    id: "heatmap",
    label: "Katkı Heatmap",
    colSpan: 4,
    rowSpan: 1,
    minColSpan: 2,
    maxColSpan: 4,
    minRowSpan: 1,
    maxRowSpan: 2,
    visible: true,
  },
  {
    id: "activity-bar",
    label: "Commit Aktivitesi",
    colSpan: 2,
    rowSpan: 1,
    minColSpan: 1,
    maxColSpan: 4,
    minRowSpan: 1,
    maxRowSpan: 3,
    visible: true,
  },
  {
    id: "lang-dist",
    label: "Dil Dağılımı",
    colSpan: 2,
    rowSpan: 1,
    minColSpan: 1,
    maxColSpan: 4,
    minRowSpan: 1,
    maxRowSpan: 3,
    visible: true,
  },
  {
    id: "rhythm",
    label: "Çalışma Ritmi",
    colSpan: 4,
    rowSpan: 1,
    minColSpan: 2,
    maxColSpan: 4,
    minRowSpan: 1,
    maxRowSpan: 2,
    visible: true,
  },
  {
    id: "commit-quality",
    label: "Commit Kalitesi",
    colSpan: 4,
    rowSpan: 2,
    minColSpan: 2,
    maxColSpan: 4,
    minRowSpan: 1,
    maxRowSpan: 3,
    visible: true,
  },
  {
    id: "hour-heatmap",
    label: "Saat Heatmap",
    colSpan: 4,
    rowSpan: 2,
    minColSpan: 2,
    maxColSpan: 4,
    minRowSpan: 1,
    maxRowSpan: 3,
    visible: true,
  },
  {
    id: "repo-list",
    label: "En Aktif Repolar",
    colSpan: 4,
    rowSpan: 2,
    minColSpan: 2,
    maxColSpan: 4,
    minRowSpan: 1,
    maxRowSpan: 3,
    visible: true,
  },
  {
    id: "repo-health",
    label: "Repo Sağlık Skorları",
    colSpan: 4,
    rowSpan: 2,
    minColSpan: 2,
    maxColSpan: 4,
    minRowSpan: 1,
    maxRowSpan: 3,
    visible: true,
  },
];
