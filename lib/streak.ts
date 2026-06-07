export function calculateStreaks(dates: string[]): {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
} {
  if (dates.length === 0) {
    return { currentStreak: 0, longestStreak: 0, totalActiveDays: 0 };
  }

  const dateSet = new Set(dates);
  const sorted = [...dateSet].sort();
  const totalActiveDays = sorted.length;

  // En uzun streak
  let longestStreak = 1;
  let tempStreak = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diffDays = Math.round(
      (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 1) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 1;
    }
  }

  // Mevcut streak (bugünden geriye say)
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  // Bugün veya dün commit varsa streak devam ediyor
  let currentStreak = 0;
  if (dateSet.has(today) || dateSet.has(yesterday)) {
    const startDate = dateSet.has(today) ? today : yesterday;
    let check = new Date(startDate);
    while (dateSet.has(check.toISOString().slice(0, 10))) {
      currentStreak++;
      check = new Date(check.getTime() - 86400000);
    }
  }

  return { currentStreak, longestStreak, totalActiveDays };
}
