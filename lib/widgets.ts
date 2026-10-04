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

export const WIDGET_LABELS_EN: Record<WidgetKey, string> = {
  streak: "Streak Card",
  heatmap: "Contribution Heatmap",
  languages: "Language Distribution",
  repos: "Top Starred Repos",
};

export function getWidgetLabelByKey(key: WidgetKey, lang: string = "tr"): string {
  if (lang === "en") return WIDGET_LABELS_EN[key] ?? key;
  return WIDGET_LABELS[key] ?? key;
}

export const PRESETS_LOCALIZED: Record<WidgetPreset, { labelTr: string; labelEn: string; descTr: string; descEn: string }> = {
  developer: {
    labelTr: "Developer",
    labelEn: "Developer",
    descTr: "Kod odaklı — heatmap ve diller öne çıkar",
    descEn: "Code focused — heatmap and languages prioritized",
  },
  contributor: {
    labelTr: "Contributor",
    labelEn: "Contributor",
    descTr: "Aktivite odaklı — streak ve repolar öne çıkar",
    descEn: "Activity focused — streak and repos prioritized",
  },
  minimalist: {
    labelTr: "Minimalist",
    labelEn: "Minimalist",
    descTr: "Sade — sadece heatmap ve streak",
    descEn: "Minimal — only heatmap and streak",
  },
};

