export type GoalType =
  | "daily_commit"
  | "weekly_pr"
  | "monthly_active_days"
  | "quarterly_new_repo";

export type GoalStatus = "locked" | "active" | "completed" | "failed";

export interface UserGoal {
  id: string;
  type: GoalType;
  target: number;
  chainOrder: number;
  completedAt: string | null;
  isActive: boolean;
}

export interface GoalProgress {
  goal: UserGoal;
  current: number;
  status: GoalStatus;
  pct: number;
  // hint: rozet veya sonraki hedefe yönlendirme metni
  hint: string | null;
}

export const GOAL_META: Record<
  GoalType,
  { label: string; unit: string; description: string; presets: number[] }
> = {
  daily_commit: {
    label: "Günlük Commit",
    unit: "commit",
    description: "Bugün en az N commit at",
    presets: [1, 3, 5, 10],
  },
  weekly_pr: {
    label: "Haftalık PR",
    unit: "PR",
    description: "Bu hafta N PR aç veya birleştir",
    presets: [1, 2, 5, 10],
  },
  monthly_active_days: {
    label: "Aylık Aktif Gün",
    unit: "gün",
    description: "Bu ay en az N gün commit at",
    presets: [5, 10, 15, 20],
  },
  quarterly_new_repo: {
    label: "Quarterly Yeni Repo",
    unit: "repo",
    description: "Bu çeyrekte N yeni repo oluştur",
    presets: [1, 2, 3, 5],
  },
};

export function calcGoalProgress(
  goals: UserGoal[],
  metrics: {
    todayCommits: number;
    weeklyPRs: number;
    monthlyActiveDays: number;
    quarterlyNewRepos: number;
  },
): GoalProgress[] {
  const sorted = [...goals].sort((a, b) => a.chainOrder - b.chainOrder);

  let prevCompleted = true; // zincirleme için: önceki hedef tamamlandı mı

  return sorted.map((goal) => {
    const current =
      goal.type === "daily_commit" ? metrics.todayCommits
      : goal.type === "weekly_pr" ? metrics.weeklyPRs
      : goal.type === "monthly_active_days" ? metrics.monthlyActiveDays
      : metrics.quarterlyNewRepos;

    const pct = Math.min(Math.round((current / goal.target) * 100), 100);
    const done = current >= goal.target;

    let status: GoalStatus;
    if (goal.completedAt) {
      status = "completed";
    } else if (goal.chainOrder > 0 && !prevCompleted) {
      status = "locked";
    } else if (done) {
      status = "completed";
    } else {
      status = "active";
    }

    if (status === "completed") prevCompleted = true;
    else if (goal.chainOrder > 0) prevCompleted = false;

    const remaining = goal.target - current;
    const hint =
      status === "locked" ? "Önceki hedefi tamamla"
      : status === "completed" ? "Tamamlandı!"
      : remaining <= 2
        ? `${remaining} ${GOAL_META[goal.type].unit} daha — neredeyse bitti!`
        : null;

    return { goal, current, status, pct, hint };
  });
}
