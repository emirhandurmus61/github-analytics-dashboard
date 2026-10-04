export function calculateStreaks(dates: string[]): {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  brokenStreak: number;
  isRecordBrokenToday: boolean;
  previousRecord: number;
  daysSinceLastCommit: number;
} {
  if (dates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalActiveDays: 0,
      brokenStreak: 0,
      isRecordBrokenToday: false,
      previousRecord: 0,
      daysSinceLastCommit: 999,
    };
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

  // Kırılan streak hesabı:
  // Eğer bugün ve dün commit yoksa, en son aktif günün serisini hesapla.
  let brokenStreak = 0;
  let daysSinceLastCommit = 999;
  if (!dateSet.has(today) && !dateSet.has(yesterday)) {
    const pastDates = sorted.filter((d) => d < yesterday);
    if (pastDates.length > 0) {
      const lastActiveDate = pastDates[pastDates.length - 1];
      const diffMs = new Date(today).getTime() - new Date(lastActiveDate).getTime();
      daysSinceLastCommit = Math.round(diffMs / 86400000);

      let check = new Date(lastActiveDate);
      while (dateSet.has(check.toISOString().slice(0, 10))) {
        brokenStreak++;
        check = new Date(check.getTime() - 86400000);
      }
    }
  }

  // Rekor kırma hesabı:
  // Kullanıcı bugün commit atmışsa ve bugünkü streak'i, bugünden önceki tüm zamanların rekorunu geçmişse
  let isRecordBrokenToday = false;
  let previousRecord = 0;
  if (dateSet.has(today) && currentStreak > 1) {
    const pastDates = sorted.filter((d) => d < today);
    if (pastDates.length > 0) {
      let pastLongest = 1;
      let pastTemp = 1;
      for (let i = 1; i < pastDates.length; i++) {
        const prev = new Date(pastDates[i - 1]);
        const curr = new Date(pastDates[i]);
        const diffDays = Math.round(
          (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays === 1) {
          pastTemp++;
          pastLongest = Math.max(pastLongest, pastTemp);
        } else {
          pastTemp = 1;
        }
      }
      previousRecord = pastLongest;
      if (currentStreak > pastLongest) {
        isRecordBrokenToday = true;
      }
    }
  }

  return {
    currentStreak,
    longestStreak,
    totalActiveDays,
    brokenStreak,
    isRecordBrokenToday,
    previousRecord,
    daysSinceLastCommit,
  };
}
