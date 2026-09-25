export type BadgeId =
  // Special
  | "first_sync"
  // Commits
  | "commit_1"
  | "commit_25"
  | "century"
  | "commit_500"
  | "millennium"
  | "commit_2500"
  | "commit_5000"
  // Streak
  | "streak_3"
  | "streak_7"
  | "streak_14"
  | "streak_30"
  | "streak_60"
  | "streak_100"
  | "dedicated"
  // Active Days
  | "active_7"
  | "active_30"
  | "marathoner"
  | "active_200"
  | "active_300"
  // Repositories
  | "repo_3"
  | "collector"
  | "repo_25"
  | "repo_50"
  // Languages
  | "lang_2"
  | "polyglot"
  | "hexaglot"
  | "lang_12"
  // Code Volume
  | "lines_1k"
  | "lines_10k"
  | "lines_50k"
  | "architect"
  | "lines_500k"
  // Pull Requests
  | "pr_3"
  | "pr_10"
  | "merge_master"
  | "pr_50"
  // Issues
  | "issue_5"
  | "issue_15"
  | "bug_hunter"
  | "issue_75"
  // Stars
  | "stars_5"
  | "stars_20"
  | "stargazer"
  | "stars_100"
  // Habits
  | "night_owl"
  | "night_owl_2"
  | "early_bird"
  | "early_bird_2"
  | "weekend_warrior"
  | "weekend_warrior_2"
  | "open_source_1"
  | "open_source"
  | "cleanup_1"
  | "big_cleanup";

export type BadgeSeries =
  | "special"
  | "commits"
  | "streak"
  | "active_days"
  | "repos"
  | "languages"
  | "code_volume"
  | "pull_requests"
  | "issues"
  | "stars"
  | "night_owl"
  | "early_bird"
  | "weekend"
  | "open_source"
  | "cleanup";

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
  series?: BadgeSeries;
  tier?: number;
  maxTier?: number;
};

export const SERIES_INFO: Record<
  BadgeSeries,
  {
    title: string;
    icon: string;
    description: string;
  }
> = {
  special: { title: "Özel Başarılar", icon: "🚀", description: "Platforma katılım ve özel kilometre taşları" },
  commits: { title: "Commit Hacmi", icon: "💻", description: "Kod yazma ve commit gönderme serisi" },
  streak: { title: "Commit Serisi", icon: "🔥", description: "Günlük aralıksız aktiflik serisi" },
  active_days: { title: "Aktif Günler", icon: "🏃", description: "Toplam aktif kodlama günü hedefleri" },
  repos: { title: "Proje Fabrikası", icon: "📦", description: "Repository üretimi ve proje yönetimi" },
  languages: { title: "Dil Çeşitliliği", icon: "🌐", description: "Farklı programlama dilleri keşfi" },
  code_volume: { title: "Kod Hacmi", icon: "🏗️", description: "Eklenen toplam satır sayısı hedefleri" },
  pull_requests: { title: "Pull Request & İş Birliği", icon: "🔀", description: "Birleştirilen PR ve katkı serisi" },
  issues: { title: "Sorun Çözümü", icon: "🐛", description: "Kapatılan issue ve hata takibi serisi" },
  stars: { title: "Yıldızlar & Topluluk", icon: "⭐", description: "Repolarına gelen yıldız ve beğeni hedefleri" },
  night_owl: { title: "Gece Kuşu", icon: "🦉", description: "Gece saatlerinde kodlama alışkanlığı" },
  early_bird: { title: "Erkenci Kuş", icon: "🐦", description: "Sabahın erken saatlerinde kodlama alışkanlığı" },
  weekend: { title: "Hafta Sonu Savaşçısı", icon: "⚔️", description: "Cumartesi ve Pazar günleri aktiflik serisi" },
  open_source: { title: "Açık Kaynak", icon: "🌍", description: "Açık kaynak fork projelerine katkı serisi" },
  cleanup: { title: "Kod Temizliği", icon: "🧹", description: "Refactor ve silinen kod satırı serisi" },
};

export type BadgeInput = {
  hasSynced: boolean;
  longestStreak: number;
  commitTimestamps: string[];
  repoForkMap: Map<string, boolean>;
  commitRepoIds: string[];
  commitDeletions: number[];
  languageCount: number;
  totalCommits: number;
  repoCount: number;
  mergedPRs: number;
  closedIssues: number;
  linesAdded: number;
  totalActiveDays: number;
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
    // ─── Özel ───
    {
      id: "first_sync",
      name: "İlk Adım",
      description: "İlk senkronizasyonu tamamladın",
      emoji: "🚀",
      earned: hasSynced,
      rarity: "common",
      current: hasSynced ? 1 : 0,
      target: 1,
      unit: "senkron",
      series: "special",
      tier: 1,
      maxTier: 1,
    },

    // ─── Commit Hacmi Serisi (7 Seviye) ───
    {
      id: "commit_1",
      name: "İlk Kıvılcım",
      description: "İlk commit'ini gönder",
      emoji: "💡",
      earned: totalCommits >= 1,
      rarity: "common",
      current: totalCommits,
      target: 1,
      unit: "commit",
      series: "commits",
      tier: 1,
      maxTier: 7,
    },
    {
      id: "commit_25",
      name: "Çırak Geliştirici",
      description: "25 commit barajına ulaş",
      emoji: "🔨",
      earned: totalCommits >= 25,
      rarity: "common",
      current: totalCommits,
      target: 25,
      unit: "commit",
      series: "commits",
      tier: 2,
      maxTier: 7,
    },
    {
      id: "century",
      name: "Yüzbaşı",
      description: "100+ commit tamamla",
      emoji: "💯",
      earned: totalCommits >= 100,
      rarity: "common",
      current: totalCommits,
      target: 100,
      unit: "commit",
      series: "commits",
      tier: 3,
      maxTier: 7,
    },
    {
      id: "commit_500",
      name: "Kod Makinesi",
      description: "500+ commit gönder",
      emoji: "⚙️",
      earned: totalCommits >= 500,
      rarity: "rare",
      current: totalCommits,
      target: 500,
      unit: "commit",
      series: "commits",
      tier: 4,
      maxTier: 7,
    },
    {
      id: "millennium",
      name: "Bininci",
      description: "1.000+ commit tamamla",
      emoji: "🏆",
      earned: totalCommits >= 1000,
      rarity: "rare",
      current: totalCommits,
      target: 1000,
      unit: "commit",
      series: "commits",
      tier: 5,
      maxTier: 7,
    },
    {
      id: "commit_2500",
      name: "Usta Yazıcı",
      description: "2.500+ commit barajını aş",
      emoji: "📜",
      earned: totalCommits >= 2500,
      rarity: "epic",
      current: totalCommits,
      target: 2500,
      unit: "commit",
      series: "commits",
      tier: 6,
      maxTier: 7,
    },
    {
      id: "commit_5000",
      name: "Kod Efsanesi",
      description: "5.000+ commit ile efsaneleş",
      emoji: "👑",
      earned: totalCommits >= 5000,
      rarity: "epic",
      current: totalCommits,
      target: 5000,
      unit: "commit",
      series: "commits",
      tier: 7,
      maxTier: 7,
    },

    // ─── Streak Serisi (7 Seviye) ───
    {
      id: "streak_3",
      name: "Kıvılcım",
      description: "3 günlük commit streak yakala",
      emoji: "⚡",
      earned: longestStreak >= 3,
      rarity: "common",
      current: longestStreak,
      target: 3,
      unit: "gün",
      series: "streak",
      tier: 1,
      maxTier: 7,
    },
    {
      id: "streak_7",
      name: "Ateş",
      description: "7 günlük commit streak yakala",
      emoji: "🔥",
      earned: longestStreak >= 7,
      rarity: "common",
      current: longestStreak,
      target: 7,
      unit: "gün",
      series: "streak",
      tier: 2,
      maxTier: 7,
    },
    {
      id: "streak_14",
      name: "İki Hafta",
      description: "14 günlük commit streak tamamla",
      emoji: "🎯",
      earned: longestStreak >= 14,
      rarity: "rare",
      current: longestStreak,
      target: 14,
      unit: "gün",
      series: "streak",
      tier: 3,
      maxTier: 7,
    },
    {
      id: "streak_30",
      name: "Alev",
      description: "30 günlük commit streak tamamla",
      emoji: "💥",
      earned: longestStreak >= 30,
      rarity: "rare",
      current: longestStreak,
      target: 30,
      unit: "gün",
      series: "streak",
      tier: 4,
      maxTier: 7,
    },
    {
      id: "streak_60",
      name: "Sönmeyen Ateş",
      description: "60 günlük commit streak sürdür",
      emoji: "🌋",
      earned: longestStreak >= 60,
      rarity: "epic",
      current: longestStreak,
      target: 60,
      unit: "gün",
      series: "streak",
      tier: 5,
      maxTier: 7,
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
      series: "streak",
      tier: 6,
      maxTier: 7,
    },
    {
      id: "dedicated",
      name: "Adanmış",
      description: "365 günlük yıllık streak",
      emoji: "👑",
      earned: longestStreak >= 365,
      rarity: "epic",
      current: longestStreak,
      target: 365,
      unit: "gün",
      series: "streak",
      tier: 7,
      maxTier: 7,
    },

    // ─── Aktif Günler Serisi (5 Seviye) ───
    {
      id: "active_7",
      name: "İlk Hafta",
      description: "Toplam 7 aktif gün kaydet",
      emoji: "🗓️",
      earned: totalActiveDays >= 7,
      rarity: "common",
      current: totalActiveDays,
      target: 7,
      unit: "gün",
      series: "active_days",
      tier: 1,
      maxTier: 5,
    },
    {
      id: "active_30",
      name: "Alışkanlık",
      description: "Toplam 30 aktif gün kaydet",
      emoji: "📅",
      earned: totalActiveDays >= 30,
      rarity: "common",
      current: totalActiveDays,
      target: 30,
      unit: "gün",
      series: "active_days",
      tier: 2,
      maxTier: 5,
    },
    {
      id: "marathoner",
      name: "Maratoncu",
      description: "Toplam 100 aktif güne ulaş",
      emoji: "🏃",
      earned: totalActiveDays >= 100,
      rarity: "rare",
      current: totalActiveDays,
      target: 100,
      unit: "gün",
      series: "active_days",
      tier: 3,
      maxTier: 5,
    },
    {
      id: "active_200",
      name: "Yorulmak Bilmez",
      description: "Toplam 200 aktif gün kaydet",
      emoji: "🚀",
      earned: totalActiveDays >= 200,
      rarity: "rare",
      current: totalActiveDays,
      target: 200,
      unit: "gün",
      series: "active_days",
      tier: 4,
      maxTier: 5,
    },
    {
      id: "active_300",
      name: "GitHub Emektarı",
      description: "Toplam 300 aktif güne ulaş",
      emoji: "🎖️",
      earned: totalActiveDays >= 300,
      rarity: "epic",
      current: totalActiveDays,
      target: 300,
      unit: "gün",
      series: "active_days",
      tier: 5,
      maxTier: 5,
    },

    // ─── Repository Serisi (4 Seviye) ───
    {
      id: "repo_3",
      name: "Üretken",
      description: "3+ repository sahibi ol",
      emoji: "📁",
      earned: repoCount >= 3,
      rarity: "common",
      current: repoCount,
      target: 3,
      unit: "repo",
      series: "repos",
      tier: 1,
      maxTier: 4,
    },
    {
      id: "collector",
      name: "Koleksiyoner",
      description: "10+ repository sahibi ol",
      emoji: "📦",
      earned: repoCount >= 10,
      rarity: "common",
      current: repoCount,
      target: 10,
      unit: "repo",
      series: "repos",
      tier: 2,
      maxTier: 4,
    },
    {
      id: "repo_25",
      name: "Proje Fabrikası",
      description: "25+ repository yönet",
      emoji: "🏭",
      earned: repoCount >= 25,
      rarity: "rare",
      current: repoCount,
      target: 25,
      unit: "repo",
      series: "repos",
      tier: 3,
      maxTier: 4,
    },
    {
      id: "repo_50",
      name: "Açık Kaynak Devi",
      description: "50+ repository ile dev arşive sahip ol",
      emoji: "🏛️",
      earned: repoCount >= 50,
      rarity: "epic",
      current: repoCount,
      target: 50,
      unit: "repo",
      series: "repos",
      tier: 4,
      maxTier: 4,
    },

    // ─── Dil Çeşitliliği Serisi (4 Seviye) ───
    {
      id: "lang_2",
      name: "İki Dilli",
      description: "2 farklı programlama dili kullan",
      emoji: "💬",
      earned: languageCount >= 2,
      rarity: "common",
      current: languageCount,
      target: 2,
      unit: "dil",
      series: "languages",
      tier: 1,
      maxTier: 4,
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
      series: "languages",
      tier: 2,
      maxTier: 4,
    },
    {
      id: "hexaglot",
      name: "Dil Ustası",
      description: "8+ farklı dil kullanıldı",
      emoji: "🗣️",
      earned: languageCount >= 8,
      rarity: "rare",
      current: languageCount,
      target: 8,
      unit: "dil",
      series: "languages",
      tier: 3,
      maxTier: 4,
    },
    {
      id: "lang_12",
      name: "Evrensel Geliştirici",
      description: "12+ farklı dil kullanarak sınırları aş",
      emoji: "🌌",
      earned: languageCount >= 12,
      rarity: "epic",
      current: languageCount,
      target: 12,
      unit: "dil",
      series: "languages",
      tier: 4,
      maxTier: 4,
    },

    // ─── Kod Hacmi Serisi (5 Seviye) ───
    {
      id: "lines_1k",
      name: "İlk Harç",
      description: "1.000+ satır kod ekle",
      emoji: "🧱",
      earned: linesAdded >= 1000,
      rarity: "common",
      current: linesAdded,
      target: 1000,
      unit: "satır",
      series: "code_volume",
      tier: 1,
      maxTier: 5,
    },
    {
      id: "lines_10k",
      name: "İnşaatçı",
      description: "10.000+ satır kod ekle",
      emoji: "🔨",
      earned: linesAdded >= 10000,
      rarity: "common",
      current: linesAdded,
      target: 10000,
      unit: "satır",
      series: "code_volume",
      tier: 2,
      maxTier: 5,
    },
    {
      id: "lines_50k",
      name: "Usta Geliştirici",
      description: "50.000+ satır kod ekle",
      emoji: "📐",
      earned: linesAdded >= 50000,
      rarity: "rare",
      current: linesAdded,
      target: 50000,
      unit: "satır",
      series: "code_volume",
      tier: 3,
      maxTier: 5,
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
      series: "code_volume",
      tier: 4,
      maxTier: 5,
    },
    {
      id: "lines_500k",
      name: "Kod Dağı",
      description: "500.000+ satır kod ile dev sistemler kur",
      emoji: "🏔️",
      earned: linesAdded >= 500000,
      rarity: "epic",
      current: linesAdded,
      target: 500000,
      unit: "satır",
      series: "code_volume",
      tier: 5,
      maxTier: 5,
    },

    // ─── Pull Request Serisi (4 Seviye) ───
    {
      id: "pr_3",
      name: "İlk Birleşim",
      description: "3 pull request birleştir",
      emoji: "🔀",
      earned: mergedPRs >= 3,
      rarity: "common",
      current: mergedPRs,
      target: 3,
      unit: "PR",
      series: "pull_requests",
      tier: 1,
      maxTier: 4,
    },
    {
      id: "pr_10",
      name: "Takım Oyuncusu",
      description: "10 pull request birleştir",
      emoji: "🤝",
      earned: mergedPRs >= 10,
      rarity: "common",
      current: mergedPRs,
      target: 10,
      unit: "PR",
      series: "pull_requests",
      tier: 2,
      maxTier: 4,
    },
    {
      id: "merge_master",
      name: "Birleştirme Ustası",
      description: "20 pull request birleştir",
      emoji: "⚔️",
      earned: mergedPRs >= 20,
      rarity: "rare",
      current: mergedPRs,
      target: 20,
      unit: "PR",
      series: "pull_requests",
      tier: 3,
      maxTier: 4,
    },
    {
      id: "pr_50",
      name: "PR Şampiyonu",
      description: "50 pull request birleştir",
      emoji: "🏆",
      earned: mergedPRs >= 50,
      rarity: "epic",
      current: mergedPRs,
      target: 50,
      unit: "PR",
      series: "pull_requests",
      tier: 4,
      maxTier: 4,
    },

    // ─── Issue Çözümü Serisi (4 Seviye) ───
    {
      id: "issue_5",
      name: "Hata Avcısı Çırağı",
      description: "5 issue kapat",
      emoji: "🔍",
      earned: closedIssues >= 5,
      rarity: "common",
      current: closedIssues,
      target: 5,
      unit: "issue",
      series: "issues",
      tier: 1,
      maxTier: 4,
    },
    {
      id: "issue_15",
      name: "Çözüm Üretici",
      description: "15 issue kapat",
      emoji: "🛠️",
      earned: closedIssues >= 15,
      rarity: "common",
      current: closedIssues,
      target: 15,
      unit: "issue",
      series: "issues",
      tier: 2,
      maxTier: 4,
    },
    {
      id: "bug_hunter",
      name: "Böcek Avcısı",
      description: "30 issue kapat",
      emoji: "🐛",
      earned: closedIssues >= 30,
      rarity: "rare",
      current: closedIssues,
      target: 30,
      unit: "issue",
      series: "issues",
      tier: 3,
      maxTier: 4,
    },
    {
      id: "issue_75",
      name: "Sorun Yok Edici",
      description: "75 issue kapat",
      emoji: "🛡️",
      earned: closedIssues >= 75,
      rarity: "epic",
      current: closedIssues,
      target: 75,
      unit: "issue",
      series: "issues",
      tier: 4,
      maxTier: 4,
    },

    // ─── Yıldız Serisi (4 Seviye) ───
    {
      id: "stars_5",
      name: "Kıvılcım Yıldız",
      description: "Repoların toplam 5+ yıldız alsın",
      emoji: "✨",
      earned: totalStars >= 5,
      rarity: "common",
      current: totalStars,
      target: 5,
      unit: "yıldız",
      series: "stars",
      tier: 1,
      maxTier: 4,
    },
    {
      id: "stars_20",
      name: "Takımyıldız",
      description: "Repoların toplam 20+ yıldız alsın",
      emoji: "🌠",
      earned: totalStars >= 20,
      rarity: "rare",
      current: totalStars,
      target: 20,
      unit: "yıldız",
      series: "stars",
      tier: 2,
      maxTier: 4,
    },
    {
      id: "stargazer",
      name: "Yıldız Avcısı",
      description: "Repoların toplam 50+ yıldız alsın",
      emoji: "⭐",
      earned: totalStars >= 50,
      rarity: "rare",
      current: totalStars,
      target: 50,
      unit: "yıldız",
      series: "stars",
      tier: 3,
      maxTier: 4,
    },
    {
      id: "stars_100",
      name: "Süpernova",
      description: "Repoların toplam 100+ yıldız alsın",
      emoji: "🌟",
      earned: totalStars >= 100,
      rarity: "epic",
      current: totalStars,
      target: 100,
      unit: "yıldız",
      series: "stars",
      tier: 4,
      maxTier: 4,
    },

    // ─── Alışkanlıklar: Gece Kuşu (2 Seviye) ───
    {
      id: "night_owl",
      name: "Gece Kuşu I",
      description: "Gece 22:00-06:00 arası 10 commit",
      emoji: "🦉",
      earned: nightCommits >= 10,
      rarity: "common",
      current: nightCommits,
      target: 10,
      unit: "commit",
      series: "night_owl",
      tier: 1,
      maxTier: 2,
    },
    {
      id: "night_owl_2",
      name: "Karanlık Şövalye",
      description: "Gece 22:00-06:00 arası 30 commit",
      emoji: "🦇",
      earned: nightCommits >= 30,
      rarity: "epic",
      current: nightCommits,
      target: 30,
      unit: "commit",
      series: "night_owl",
      tier: 2,
      maxTier: 2,
    },

    // ─── Alışkanlıklar: Erkenci Kuş (2 Seviye) ───
    {
      id: "early_bird",
      name: "Erkenci Kuş I",
      description: "Sabah 05:00-09:00 arası 10 commit",
      emoji: "🐦",
      earned: earlyCommits >= 10,
      rarity: "common",
      current: earlyCommits,
      target: 10,
      unit: "commit",
      series: "early_bird",
      tier: 1,
      maxTier: 2,
    },
    {
      id: "early_bird_2",
      name: "Şafak Bekçisi",
      description: "Sabah 05:00-09:00 arası 30 commit",
      emoji: "🌅",
      earned: earlyCommits >= 30,
      rarity: "rare",
      current: earlyCommits,
      target: 30,
      unit: "commit",
      series: "early_bird",
      tier: 2,
      maxTier: 2,
    },

    // ─── Alışkanlıklar: Hafta Sonu (2 Seviye) ───
    {
      id: "weekend_warrior",
      name: "Hafta Sonu Savaşçısı I",
      description: "10+ hafta sonu commit",
      emoji: "⚔️",
      earned: weekendCommits >= 10,
      rarity: "rare",
      current: weekendCommits,
      target: 10,
      unit: "commit",
      series: "weekend",
      tier: 1,
      maxTier: 2,
    },
    {
      id: "weekend_warrior_2",
      name: "Pazar Komutanı",
      description: "30+ hafta sonu commit",
      emoji: "🛡️",
      earned: weekendCommits >= 30,
      rarity: "epic",
      current: weekendCommits,
      target: 30,
      unit: "commit",
      series: "weekend",
      tier: 2,
      maxTier: 2,
    },

    // ─── Alışkanlıklar: Açık Kaynak (2 Seviye) ───
    {
      id: "open_source_1",
      name: "İlk Katkı",
      description: "Fork projelere 2 commit",
      emoji: "🌍",
      earned: forkCommits >= 2,
      rarity: "common",
      current: forkCommits,
      target: 2,
      unit: "commit",
      series: "open_source",
      tier: 1,
      maxTier: 2,
    },
    {
      id: "open_source",
      name: "Açık Kaynak Elçisi",
      description: "Fork projelere 5+ commit",
      emoji: "🌐",
      earned: forkCommits >= 5,
      rarity: "epic",
      current: forkCommits,
      target: 5,
      unit: "commit",
      series: "open_source",
      tier: 2,
      maxTier: 2,
    },

    // ─── Alışkanlıklar: Kod Temizliği (2 Seviye) ───
    {
      id: "cleanup_1",
      name: "Küçük Temizlik",
      description: "Tek seferde 250+ satır silindi",
      emoji: "🧹",
      earned: maxDeletion >= 250,
      rarity: "common",
      current: maxDeletion,
      target: 250,
      unit: "satır",
      series: "cleanup",
      tier: 1,
      maxTier: 2,
    },
    {
      id: "big_cleanup",
      name: "Büyük Temizlik",
      description: "Tek seferde 1000+ satır silindi",
      emoji: "🧼",
      earned: maxDeletion >= 1000,
      rarity: "rare",
      current: maxDeletion,
      target: 1000,
      unit: "satır",
      series: "cleanup",
      tier: 2,
      maxTier: 2,
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
