export type WidgetKey = "streak" | "heatmap" | "languages" | "repos";

export const WIDGET_KEYS: WidgetKey[] = ["streak", "heatmap", "languages", "repos"];

export const WIDGET_LABELS: Record<WidgetKey, string> = {
  streak: "Streak Kartı",
  heatmap: "Katkı Heatmap",
  languages: "Dil Dağılımı",
  repos: "En Yıldızlı Repolar",
};

export type WidgetPreset = "developer" | "contributor" | "minimalist";

export const PRESETS: Record<WidgetPreset, { label: string; desc: string; order: WidgetKey[]; visible: WidgetKey[] }> = {
  developer: {
    label: "Developer",
    desc: "Kod odaklı — heatmap ve diller öne çıkar",
    order: ["heatmap", "languages", "streak", "repos"],
    visible: ["heatmap", "languages", "streak", "repos"],
  },
  contributor: {
    label: "Contributor",
    desc: "Aktivite odaklı — streak ve repolar öne çıkar",
    order: ["streak", "repos", "heatmap", "languages"],
    visible: ["streak", "repos", "heatmap", "languages"],
  },
  minimalist: {
    label: "Minimalist",
    desc: "Sade — sadece heatmap ve streak",
    order: ["heatmap", "streak", "languages", "repos"],
    visible: ["heatmap", "streak"],
  },
};
