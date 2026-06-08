export type BadgeId =
  | "first_sync"
  | "streak_7"
  | "streak_30"
  | "night_owl"
  | "weekend_warrior"
  | "big_cleanup"
  | "polyglot"
  | "open_source";

export type Badge = {
  id: BadgeId;
  name: string;
  description: string;
  emoji: string;
  earned: boolean;
  rarity: "common" | "rare" | "epic";
};

export type BadgeInput = {
  hasSynced: boolean;
  longestStreak: number;
  // committed_at string listesi (tüm commitler)
  commitTimestamps: string[];
  // repo_id → is_fork
  repoForkMap: Map<string, boolean>;
  // commit'lerin repo_id'leri
  commitRepoIds: string[];
  // commit'lerin deletion sayıları
  commitDeletions: number[];
  // kaç farklı dil kullanıldı
  languageCount: number;
};

export function calcBadges(input: BadgeInput): Badge[] {
  const {
    hasSynced,
    longestStreak,
    commitTimestamps,
    repoForkMap,
    commitRepoIds,
    commitDeletions,
    languageCount,
  } = input;

  // Gece commit'leri (22:00–05:59)
  const nightCommits = commitTimestamps.filter((ts) => {
    const h = new Date(ts).getHours();
    return h >= 22 || h < 6;
  }).length;

  // Hafta sonu commit'leri
  const weekendCommits = commitTimestamps.filter((ts) => {
    const d = new Date(ts).getDay();
    return d === 0 || d === 6;
  }).length;

  // En büyük tek commit silinmesi
  const maxDeletion = commitDeletions.length > 0
    ? Math.max(...commitDeletions)
    : 0;

  // Fork repo'lara commit sayısı
  const forkCommits = commitRepoIds.filter((id) => repoForkMap.get(id) === true).length;

  const BADGES: Badge[] = [
    {
      id: "first_sync",
      name: "İlk Adım",
      description: "İlk senkronizasyonu tamamladın",
      emoji: "🚀",
      earned: hasSynced,
      rarity: "common",
    },
    {
      id: "streak_7",
      name: "Ateş",
      description: "7 günlük commit streak",
      emoji: "🔥",
      earned: longestStreak >= 7,
      rarity: "common",
    },
    {
      id: "streak_30",
      name: "Alev",
      description: "30 günlük commit streak",
      emoji: "⚡",
      earned: longestStreak >= 30,
      rarity: "epic",
    },
    {
      id: "night_owl",
      name: "Gece Kuşu",
      description: "Gece yarısından sonra 10+ commit",
      emoji: "🦉",
      earned: nightCommits >= 10,
      rarity: "common",
    },
    {
      id: "weekend_warrior",
      name: "Hafta Sonu Savaşçısı",
      description: "10+ hafta sonu commit",
      emoji: "⚔️",
      earned: weekendCommits >= 10,
      rarity: "rare",
    },
    {
      id: "big_cleanup",
      name: "Büyük Temizlik",
      description: "Tek seferde 1000+ satır silindi",
      emoji: "🧹",
      earned: maxDeletion >= 1000,
      rarity: "rare",
    },
    {
      id: "polyglot",
      name: "Poliglot",
      description: "5+ farklı dil kullanıldı",
      emoji: "🌐",
      earned: languageCount >= 5,
      rarity: "rare",
    },
    {
      id: "open_source",
      name: "Açık Kaynak",
      description: "Fork projelere 5+ commit",
      emoji: "🌍",
      earned: forkCommits >= 5,
      rarity: "epic",
    },
  ];

  return BADGES;
}

export const RARITY_COLORS: Record<Badge["rarity"], { text: string; bg: string; border: string }> = {
  common: { text: "#a1a1aa", bg: "rgba(161,161,170,0.08)", border: "rgba(161,161,170,0.2)" },
  rare:   { text: "#60a5fa", bg: "rgba(96,165,250,0.08)",  border: "rgba(96,165,250,0.2)" },
  epic:   { text: "#c084fc", bg: "rgba(192,132,252,0.08)", border: "rgba(192,132,252,0.2)" },
};
