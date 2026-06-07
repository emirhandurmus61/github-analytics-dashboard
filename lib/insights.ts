export type Insight = {
  type: "positive" | "negative" | "neutral" | "warning";
  message: string;
};

type DailyStat = {
  date: string;
  commit_count: number;
};

type HourData = {
  hour: number;
  day: number;
  count: number;
};

const DAY_NAMES = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const MONTH_NAMES = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

export function generateInsights(
  heatmapData: DailyStat[],
  hourData: HourData[],
  topRepo: string | null,
  topRepoCommits: number,
  currentStreak: number,
  longestStreak: number,
  linesAdded: number,
  linesDeleted: number,
  topLanguage: string | null,
): Insight[] {
  const insights: Insight[] = [];

  if (heatmapData.length === 0) return insights;

  // Bu ay vs geçen ay
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);

  const thisMonthCommits = heatmapData
    .filter((d) => d.date >= thisMonthStart)
    .reduce((s, d) => s + d.commit_count, 0);
  const lastMonthCommits = heatmapData
    .filter((d) => d.date >= lastMonthStart && d.date <= lastMonthEnd)
    .reduce((s, d) => s + d.commit_count, 0);

  if (lastMonthCommits > 0 && thisMonthCommits > 0) {
    const pct = Math.round(((thisMonthCommits - lastMonthCommits) / lastMonthCommits) * 100);
    const monthName = MONTH_NAMES[now.getMonth()];
    if (pct >= 20) {
      insights.push({
        type: "positive",
        message: `${monthName} ayında geçen aya göre %${pct} daha fazla commit attın 🚀`,
      });
    } else if (pct <= -20) {
      insights.push({
        type: "warning",
        message: `${monthName} ayında geçen aya göre %${Math.abs(pct)} daha az commit attın`,
      });
    }
  }

  // En verimli gün
  if (hourData.length > 0) {
    const dayTotals = Array.from({ length: 7 }, (_, i) =>
      hourData.filter((h) => h.day === i).reduce((s, h) => s + h.count, 0)
    );
    const peakDay = dayTotals.indexOf(Math.max(...dayTotals));
    const worstDay = dayTotals.indexOf(Math.min(...dayTotals.filter((v) => v > 0)));

    insights.push({
      type: "neutral",
      message: `En verimli günün ${DAY_NAMES[peakDay]}, en az aktif günün ${DAY_NAMES[worstDay]}`,
    });

    // En verimli saat
    const hourTotals = Array.from({ length: 24 }, (_, h) =>
      hourData.filter((d) => d.hour === h).reduce((s, d) => s + d.count, 0)
    );
    const peakHour = hourTotals.indexOf(Math.max(...hourTotals));
    const period = peakHour < 12 ? "sabah" : peakHour < 17 ? "öğleden sonra" : peakHour < 21 ? "akşam" : "gece";
    insights.push({
      type: "neutral",
      message: `En çok ${period} kodluyorsun — pik saatin ${String(peakHour).padStart(2, "0")}:00–${String(peakHour + 1).padStart(2, "0")}:00 ⏰`,
    });
  }

  // En aktif repo
  if (topRepo && topRepoCommits > 0) {
    insights.push({
      type: "positive",
      message: `Bu yıl en çok "${topRepo}" reposuna commit attın (${topRepoCommits} commit) 🏆`,
    });
  }

  // Streak durumu
  if (currentStreak >= 7) {
    insights.push({
      type: "positive",
      message: `${currentStreak} günlük streak devam ediyor — muhteşem! 🔥`,
    });
  } else if (currentStreak === 0 && longestStreak > 0) {
    insights.push({
      type: "warning",
      message: `Streak kırıldı. En uzun strekin ${longestStreak} gündü, tekrar başlayabilirsin!`,
    });
  }

  // Net satır değişimi
  if (linesAdded > 0 || linesDeleted > 0) {
    const ratio = linesDeleted / (linesAdded || 1);
    if (ratio > 0.6) {
      insights.push({
        type: "positive",
        message: `Eklediğinin %${Math.round(ratio * 100)}'ini silen birisin — kod temizliğine önem veriyorsun 🧹`,
      });
    }
  }

  // Hafta sonu vs hafta içi
  const weekendCommits = heatmapData
    .filter((d) => {
      const day = (new Date(d.date).getDay() + 6) % 7;
      return day >= 5;
    })
    .reduce((s, d) => s + d.commit_count, 0);
  const totalCommits = heatmapData.reduce((s, d) => s + d.commit_count, 0);
  if (totalCommits > 0) {
    const weekendPct = Math.round((weekendCommits / totalCommits) * 100);
    if (weekendPct >= 30) {
      insights.push({
        type: "neutral",
        message: `Commitlerin %${weekendPct}'i hafta sonunda — hafta sonları da aktifsin 💪`,
      });
    }
  }

  // Top dil
  if (topLanguage) {
    insights.push({
      type: "neutral",
      message: `Birincil dilin ${topLanguage} — kod tabanının büyük çoğunluğu bu dilde`,
    });
  }

  return insights.slice(0, 5);
}
