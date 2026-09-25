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
  current?: number;
  target?: number;
  unit?: string;
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
      current: hasSynced ? 1 : 0,
      target: 1,
      unit: "senkronizasyon",
    },
    {
      id: "streak_7",
      name: "Ateş",
      description: "7 günlük commit streak",
      emoji: "🔥",
      earned: longestStreak >= 7,
      rarity: "common",
      current: longestStreak,
      target: 7,
      unit: "gün",
    },
    {
      id: "streak_30",
      name: "Alev",
      description: "30 günlük commit streak",
      emoji: "⚡",
      earned: longestStreak >= 30,
      rarity: "epic",
      current: longestStreak,
      target: 30,
      unit: "gün",
    },
    {
      id: "night_owl",
      name: "Gece Kuşu",
      description: "Gece yarısından sonra 10+ commit",
      emoji: "🦉",
      earned: nightCommits >= 10,
      rarity: "common",
      current: nightCommits,
      target: 10,
      unit: "commit",
    },
    {
      id: "weekend_warrior",
      name: "Hafta Sonu Savaşçısı",
      description: "10+ hafta sonu commit",
      emoji: "⚔️",
      earned: weekendCommits >= 10,
      rarity: "rare",
      current: weekendCommits,
      target: 10,
      unit: "commit",
    },
    {
      id: "big_cleanup",
      name: "Büyük Temizlik",
      description: "Tek seferde 1000+ satır silindi",
      emoji: "🧹",
      earned: maxDeletion >= 1000,
      rarity: "rare",
      current: maxDeletion,
      target: 1000,
      unit: "satır",
    },
    {
      id: "polyglot",
      name: "Poliglot",
      description: "5+ farklı dil kullanıldı",
      emoji: "🌐",
      earned: languageCount >= 5,
      rarity: "rare",
      current: languageCount,
      target: 5,
      unit: "dil",
    },
    {
      id: "open_source",
      name: "Açık Kaynak",
      description: "Fork projelere 5+ commit",
      emoji: "🌍",
      earned: forkCommits >= 5,
      rarity: "epic",
      current: forkCommits,
      target: 5,
      unit: "commit",
    },
    {
      id: "streak_100",
      name: "Demir İrade",
      description: "100 günlük commit streak",
      emoji: "💎",
      earned: longestStreak >= 100,
      rarity: "epic",
      current: longestStreak,
      target: 100,
      unit: "gün",
    },
    {
      id: "early_bird",
      name: "Erkenci Kuş",
      description: "Sabah 05:00–09:00 arası 10+ commit",
      emoji: "🐦",
      earned: earlyCommits >= 10,
      rarity: "common",
      current: earlyCommits,
      target: 10,
      unit: "commit",
    },
    {
      id: "hexaglot",
      name: "Dil Ustası",
      description: "8+ farklı dil kullanıldı",
      emoji: "🗣️",
      earned: languageCount >= 8,
      rarity: "epic",
      current: languageCount,
      target: 8,
      unit: "dil",
    },
    {
      id: "century",
      name: "Yüzbaşı",
      description: "100+ commit yapıldı",
      emoji: "💯",
      earned: totalCommits >= 100,
      rarity: "common",
      current: totalCommits,
      target: 100,
      unit: "commit",
    },
    {
      id: "millennium",
      name: "Bininci",
      description: "1000+ commit yapıldı",
      emoji: "🏆",
      earned: totalCommits >= 1000,
      rarity: "epic",
      current: totalCommits,
      target: 1000,
      unit: "commit",
    },
    {
      id: "marathoner",
      name: "Maratoncu",
      description: "100+ aktif gün",
      emoji: "🏃",
      earned: totalActiveDays >= 100,
      rarity: "rare",
      current: totalActiveDays,
      target: 100,
      unit: "gün",
    },
    {
      id: "collector",
      name: "Koleksiyoner",
      description: "10+ repo'ya sahip ol",
      emoji: "📦",
      earned: repoCount >= 10,
      rarity: "common",
      current: repoCount,
      target: 10,
      unit: "repo",
    },
    {
      id: "architect",
      name: "Mimar",
      description: "100.000+ satır kod eklendi",
      emoji: "🏗️",
      earned: linesAdded >= 100000,
      rarity: "rare",
      current: linesAdded,
      target: 100000,
      unit: "satır",
    },
    {
      id: "merge_master",
      name: "Birleştirme Ustası",
      description: "20+ pull request birleştirildi",
      emoji: "🔀",
      earned: mergedPRs >= 20,
      rarity: "rare",
      current: mergedPRs,
      target: 20,
      unit: "PR",
    },
    {
      id: "bug_hunter",
      name: "Böcek Avcısı",
      description: "30+ issue kapatıldı",
      emoji: "🐛",
      earned: closedIssues >= 30,
      rarity: "common",
      current: closedIssues,
      target: 30,
      unit: "issue",
    },
    {
      id: "stargazer",
      name: "Yıldız Avcısı",
      description: "Repo'ların toplam 50+ yıldız aldı",
      emoji: "⭐",
      earned: totalStars >= 50,
      rarity: "rare",
      current: totalStars,
      target: 50,
      unit: "yıldız",
    },
    {
      id: "dedicated",
      name: "Adanmış",
      description: "365 günlük commit streak",
      emoji: "👑",
      earned: longestStreak >= 365,
      rarity: "epic",
      current: longestStreak,
      target: 365,
      unit: "gün",
    },
  ];

  return BADGES;
}

export const RARITY_COLORS: Record<
  Badge["rarity"],
  {
    text: string;
    bg: string;
    border: string;
    glow: string;
    badgeBg: string;
    badgeBorder: string;
  }
> = {
  common: {
    text: "#94a3b8",
    bg: "rgba(148, 163, 184, 0.08)",
    border: "rgba(148, 163, 184, 0.25)",
    glow: "rgba(148, 163, 184, 0.15)",
    badgeBg: "rgba(148, 163, 184, 0.12)",
    badgeBorder: "rgba(148, 163, 184, 0.3)",
  },
  rare: {
    text: "#38bdf8",
    bg: "rgba(56, 189, 248, 0.09)",
    border: "rgba(56, 189, 248, 0.3)",
    glow: "rgba(56, 189, 248, 0.22)",
    badgeBg: "rgba(56, 189, 248, 0.14)",
    badgeBorder: "rgba(56, 189, 248, 0.35)",
  },
  epic: {
    text: "#c084fc",
    bg: "rgba(192, 132, 252, 0.10)",
    border: "rgba(192, 132, 252, 0.32)",
    glow: "rgba(192, 132, 252, 0.25)",
    badgeBg: "rgba(192, 132, 252, 0.16)",
    badgeBorder: "rgba(192, 132, 252, 0.4)",
  },
};
