export type HealthStatus = "active" | "slowing" | "idle" | "archived";

export type RepoHealth = {
  score: number; // 0–100
  status: HealthStatus;
  label: string;
  factors: {
    recency: number;   // Son commit ne kadar eski? (0–40 puan)
    activity: number;  // Son 90 günde commit sayısı (0–30 puan)
    community: number; // Star + fork oranı (0–20 puan)
    issues: number;    // Kapatılmamış issue oranı (0–10 puan)
  };
};

type Input = {
  lastCommitDate: string | null; // ISO string
  commitCount90d: number;
  stars: number;
  forks: number;
  openIssues: number;
  totalIssues: number;
  isArchived: boolean;
};

export function calcRepoHealth(repo: Input): RepoHealth {
  if (repo.isArchived) {
    return {
      score: 0,
      status: "archived",
      label: "Arşivlendi",
      factors: { recency: 0, activity: 0, community: 0, issues: 0 },
    };
  }

  // 1. Recency (0–40): Son commit ne kadar önce?
  let recency = 0;
  if (repo.lastCommitDate) {
    const daysSince = Math.floor(
      (Date.now() - new Date(repo.lastCommitDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSince <= 7) recency = 40;
    else if (daysSince <= 14) recency = 35;
    else if (daysSince <= 30) recency = 28;
    else if (daysSince <= 60) recency = 18;
    else if (daysSince <= 90) recency = 10;
    else if (daysSince <= 180) recency = 5;
    else recency = 0;
  }

  // 2. Activity (0–30): Son 90 gün commit sayısı
  let activity = 0;
  const c = repo.commitCount90d;
  if (c >= 30) activity = 30;
  else if (c >= 15) activity = 24;
  else if (c >= 7) activity = 18;
  else if (c >= 3) activity = 12;
  else if (c >= 1) activity = 6;
  else activity = 0;

  // 3. Community (0–20): Star + fork varlığı
  const engagement = repo.stars + repo.forks * 2;
  let community = 0;
  if (engagement >= 50) community = 20;
  else if (engagement >= 20) community = 15;
  else if (engagement >= 5) community = 10;
  else if (engagement >= 1) community = 5;
  else community = 0;

  // 4. Issues (0–10): Kapatılmamış issue oranı (az açık = iyi)
  let issues = 10;
  if (repo.totalIssues > 0) {
    const openRatio = repo.openIssues / repo.totalIssues;
    if (openRatio > 0.8) issues = 0;
    else if (openRatio > 0.5) issues = 3;
    else if (openRatio > 0.3) issues = 6;
    else issues = 10;
  }

  const score = recency + activity + community + issues;

  let status: HealthStatus;
  let label: string;
  if (score >= 65) { status = "active"; label = "Aktif"; }
  else if (score >= 35) { status = "slowing"; label = "Yavaşlıyor"; }
  else { status = "idle"; label = "Hareketsiz"; }

  return { score, status, label, factors: { recency, activity, community, issues } };
}

export const HEALTH_COLORS: Record<HealthStatus, string> = {
  active: "#34d399",
  slowing: "#fb923c",
  idle: "#71717a",
  archived: "#3f3f46",
};
