export type BadgeId =
  | "first_sync"
  | "streak_7"
  | "streak_30"
  | "streak_100"
  | "night_owl"
  | "early_bird"
  | "weekend_warrior"
  | "big_cleanup"
  | "polyglot"
  | "hexaglot"
  | "open_source"
  | "century"
  | "millennium"
  | "marathoner"
  | "collector"
  | "architect"
  | "merge_master"
  | "bug_hunter"
  | "stargazer"
  | "dedicated";

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
  // toplam commit sayısı
  totalCommits: number;
  // toplam repo sayısı (fork dahil)
  repoCount: number;
  // birleştirilmiş PR sayısı
  mergedPRs: number;
  // kapatılan issue sayısı
  closedIssues: number;
  // toplam eklenen satır sayısı
  linesAdded: number;
  // toplam aktif gün sayısı
  totalActiveDays: number;
  // tüm repolardaki toplam yıldız sayısı
  totalStars: number;
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
    totalCommits,
    repoCount,
    mergedPRs,
    closedIssues,
    linesAdded,
    totalActiveDays,
    totalStars,
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

  // Sabah commit'leri (05:00–08:59)
  const earlyCommits = commitTimestamps.filter((ts) => {
    const h = new Date(ts).getHours();
    return h >= 5 && h < 9;
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
    {
      id: "streak_100",
      name: "Demir İrade",
      description: "100 günlük commit streak",
      emoji: "💎",
      earned: longestStreak >= 100,
      rarity: "epic",
    },
    {
      id: "early_bird",
      name: "Erkenci Kuş",
      description: "Sabah 05:00–09:00 arası 10+ commit",
      emoji: "🐦",
      earned: earlyCommits >= 10,
      rarity: "common",
    },
    {
      id: "hexaglot",
      name: "Dil Ustası",
      description: "8+ farklı dil kullanıldı",
      emoji: "🗣️",
      earned: languageCount >= 8,
      rarity: "epic",
    },
    {
      id: "century",
      name: "Yüzbaşı",
      description: "100+ commit yapıldı",
      emoji: "💯",
      earned: totalCommits >= 100,
      rarity: "common",
    },
    {
      id: "millennium",
      name: "Bininci",
      description: "1000+ commit yapıldı",
      emoji: "🏆",
      earned: totalCommits >= 1000,
      rarity: "epic",
    },
    {
      id: "marathoner",
      name: "Maratoncu",
      description: "100+ aktif gün",
      emoji: "🏃",
      earned: totalActiveDays >= 100,
      rarity: "rare",
    },
    {
      id: "collector",
      name: "Koleksiyoner",
      description: "10+ repo'ya sahip ol",
      emoji: "📦",
      earned: repoCount >= 10,
      rarity: "common",
    },
    {
      id: "architect",
      name: "Mimar",
      description: "100.000+ satır kod eklendi",
      emoji: "🏗️",
      earned: linesAdded >= 100000,
      rarity: "rare",
    },
    {
      id: "merge_master",
      name: "Birleştirme Ustası",
      description: "20+ pull request birleştirildi",
      emoji: "🔀",
      earned: mergedPRs >= 20,
      rarity: "rare",
    },
    {
      id: "bug_hunter",
      name: "Böcek Avcısı",
      description: "30+ issue kapatıldı",
      emoji: "🐛",
      earned: closedIssues >= 30,
      rarity: "common",
    },
    {
      id: "stargazer",
      name: "Yıldız Avcısı",
      description: "Repo'ların toplam 50+ yıldız aldı",
      emoji: "⭐",
      earned: totalStars >= 50,
      rarity: "rare",
    },
    {
      id: "dedicated",
      name: "Adanmış",
      description: "365 günlük commit streak",
      emoji: "👑",
      earned: longestStreak >= 365,
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
