"use client";

import { useThemeColors } from "@/components/theme-provider";

type HourEntry = { hour: number; day: number; count: number };

type Props = {
  hourData: HourEntry[];
  // Commit'lerin timestamp'leri — seans analizi için
  commitTimestamps: string[];
};

// Zaman dilimleri
type Period = { key: PeriodKey; label: string; emoji: string; hours: number[] };
type PeriodKey = "morning" | "afternoon" | "evening" | "night";

const PERIODS: Period[] = [
  { key: "morning",   label: "Sabah",         emoji: "🌅", hours: [6, 7, 8, 9, 10, 11] },
  { key: "afternoon", label: "Öğleden Sonra", emoji: "☀️", hours: [12, 13, 14, 15, 16, 17] },
  { key: "evening",   label: "Akşam",         emoji: "🌆", hours: [18, 19, 20, 21] },
  { key: "night",     label: "Gece",          emoji: "🌙", hours: [22, 23, 0, 1, 2, 3, 4, 5] },
];

function buildStats(hourData: HourEntry[], commitTimestamps: string[]) {
  // 7×24 grid
  const grid: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
  for (const { hour, day, count } of hourData) {
    if (day >= 0 && day < 7 && hour >= 0 && hour < 24) {
      grid[day][hour] = count;
    }
  }

  // Toplam commit
  const total = grid.flat().reduce((s, c) => s + c, 0);

  // Zaman dilimi dağılımı
  const periodCounts: Record<PeriodKey, number> = {
    morning: 0, afternoon: 0, evening: 0, night: 0,
  };
  for (const period of PERIODS) {
    for (const h of period.hours) {
      periodCounts[period.key] += grid.flat().reduce((s, _, i) => {
        // grid[day][hour] — hour eşleşiyor mu?
        return s;
      }, 0);
    }
  }
  // Daha temiz hesap: saat toplamları
  const hourTotals = Array.from({ length: 24 }, (_, h) =>
    grid.reduce((s, row) => s + row[h], 0)
  );
  for (const period of PERIODS) {
    periodCounts[period.key] = period.hours.reduce((s, h) => s + hourTotals[h], 0);
  }

  // Hafta içi vs hafta sonu
  // day: 0=Pzt, 1=Sal, 2=Çar, 3=Per, 4=Cum, 5=Cmt, 6=Paz
  const weekdayTotal = grid.slice(0, 5).flat().reduce((s, c) => s + c, 0);
  const weekendTotal = grid.slice(5).flat().reduce((s, c) => s + c, 0);

  // En verimli saat
  const peakHour = hourTotals.indexOf(Math.max(...hourTotals));

  // Kimlik etiketi
  const nightCount = periodCounts.night;
  const morningCount = periodCounts.morning;
  const afternoonCount = periodCounts.afternoon;
  const eveningCount = periodCounts.evening;
  const maxPeriod = Math.max(morningCount, afternoonCount, eveningCount, nightCount);

  let identity = { label: "Öğleden Sonra Kodcusu", emoji: "☀️" };
  if (maxPeriod === morningCount) identity = { label: "Sabah Kodcusu", emoji: "🌅" };
  else if (maxPeriod === eveningCount) identity = { label: "Akşam Kodcusu", emoji: "🌆" };
  else if (maxPeriod === nightCount) identity = { label: "Gece Kodcusu", emoji: "🌙" };

  // Hafta sonu oranı
  const weekendPct = total > 0 ? Math.round((weekendTotal / total) * 100) : 0;
  const weekdayPct = 100 - weekendPct;

  // En aktif gün
  const dayTotals = grid.map((row) => row.reduce((s, c) => s + c, 0));
  const DAY_NAMES = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
  const peakDay = DAY_NAMES[dayTotals.indexOf(Math.max(...dayTotals))];
  const leastDay = DAY_NAMES[dayTotals.indexOf(Math.min(...dayTotals.filter(d => d > 0)))];

  // En uzun kesintisiz seans (aynı gün, ≤2 saat arayla commit'ler)
  let longestSession = 0;
  if (commitTimestamps.length > 0) {
    const sorted = [...commitTimestamps].sort();
    let sessionStart = new Date(sorted[0]).getTime();
    let sessionEnd = sessionStart;
    let best = 0;

    for (let i = 1; i < sorted.length; i++) {
      const curr = new Date(sorted[i]).getTime();
      const diffHours = (curr - sessionEnd) / (1000 * 60 * 60);
      // Aynı gün içinde ve 3 saatten az arayla
      const sameDay = new Date(sorted[i]).toDateString() === new Date(sorted[i - 1]).toDateString();
      if (sameDay && diffHours <= 3) {
        sessionEnd = curr;
      } else {
        const sessionLen = Math.round((sessionEnd - sessionStart) / (1000 * 60 * 60));
        best = Math.max(best, sessionLen);
        sessionStart = curr;
        sessionEnd = curr;
      }
    }
    const lastLen = Math.round((sessionEnd - sessionStart) / (1000 * 60 * 60));
    best = Math.max(best, lastLen);
    longestSession = best;
  }

  // Focus günleri: tek repoya odaklanılan günler (hourData'da bunu hesaplayamayız, yaklaşım: total commit'i yüksek ama az repo)
  // Bu veri hourData'da yok, atlıyoruz.

  return {
    total,
    periodCounts,
    weekdayTotal,
    weekendTotal,
    weekdayPct,
    weekendPct,
    peakHour,
    peakDay,
    leastDay,
    identity,
    longestSession,
    hourTotals,
  };
}

export default function RhythmAnalysis({ hourData, commitTimestamps }: Props) {
  const theme = useThemeColors();

  if (hourData.length === 0) return null;

  const stats = buildStats(hourData, commitTimestamps);
  const { total, periodCounts, weekdayPct, weekendPct, peakHour, peakDay, identity, longestSession, hourTotals } = stats;

  // Saat dağılımı mini bar chart için
  const hourMax = Math.max(...hourTotals, 1);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-medium text-zinc-400">Çalışma Ritmi Analizi</h2>
          <p className="mt-0.5 text-xs text-zinc-600">Commit alışkanlıklarına göre çalışma profilin</p>
        </div>
        {/* Kimlik etiketi */}
        <div
          className="flex items-center gap-2 rounded-xl border px-3 py-2"
          style={{ borderColor: theme.accentBorder, backgroundColor: theme.accentBg }}
        >
          <span className="text-base">{identity.emoji}</span>
          <span className="text-xs font-medium" style={{ color: theme.accent }}>
            {identity.label}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        {/* Sol: Zaman dilimi dağılımı */}
        <div className="space-y-3">
          <p className="text-xs text-zinc-500">Zaman Dilimi Dağılımı</p>
          {PERIODS.map((period) => {
            const count = periodCounts[period.key];
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const isTop = count === Math.max(...Object.values(periodCounts));
            return (
              <div key={period.key}>
                <div className="mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{period.emoji}</span>
                    <span className={`text-xs ${isTop ? "text-zinc-200 font-medium" : "text-zinc-500"}`}>
                      {period.label}
                    </span>
                    {isTop && (
                      <span className="rounded-full px-1.5 py-0.5 text-xs" style={{ backgroundColor: theme.accentBg, color: theme.accent }}>
                        En aktif
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-zinc-600">{pct}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: isTop ? theme.accent : theme.shades[1],
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Sağ: Metrik kartlar */}
        <div className="space-y-3">
          {/* Hafta içi vs hafta sonu */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-800/40 p-4 space-y-2">
            <p className="text-xs text-zinc-500">Hafta İçi vs Hafta Sonu</p>
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-zinc-700">
              <div
                className="h-full rounded-l-full transition-all"
                style={{ width: `${weekdayPct}%`, backgroundColor: theme.accent }}
              />
              <div
                className="h-full rounded-r-full"
                style={{ width: `${weekendPct}%`, backgroundColor: theme.shades[1] }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">
                <span style={{ color: theme.accent }}>%{weekdayPct}</span> hafta içi
              </span>
              <span className="text-zinc-600">%{weekendPct} hafta sonu</span>
            </div>
          </div>

          {/* En verimli saat */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-800/40 p-4">
            <p className="text-xs text-zinc-500 mb-1">En Verimli Saat</p>
            <p className="text-xl font-bold" style={{ color: theme.accent }}>
              {String(peakHour).padStart(2, "0")}:00
              <span className="text-sm font-normal text-zinc-500 ml-1">–{String(peakHour + 1).padStart(2, "0")}:00</span>
            </p>
          </div>

          {/* En aktif gün + seans */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-zinc-800 bg-zinc-800/40 p-3">
              <p className="text-xs text-zinc-600">En Aktif Gün</p>
              <p className="mt-1 text-sm font-semibold text-zinc-200">{peakDay}</p>
            </div>
            {longestSession > 0 && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-800/40 p-3">
                <p className="text-xs text-zinc-600">En Uzun Seans</p>
                <p className="mt-1 text-sm font-semibold text-zinc-200">
                  {longestSession}s
                  <span className="text-xs font-normal text-zinc-600 ml-1">kesintisiz</span>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Saat dağılımı mini bar chart — 24 saat */}
      <div>
        <p className="text-xs text-zinc-500 mb-2">24 Saatlik Commit Dağılımı</p>
        <div className="flex items-end gap-px h-10">
          {hourTotals.map((count, h) => {
            const heightPct = hourMax > 0 ? (count / hourMax) * 100 : 0;
            const isPeak = h === peakHour;
            return (
              <div
                key={h}
                className="flex-1 rounded-t-sm transition-opacity hover:opacity-80"
                title={`${String(h).padStart(2, "0")}:00 — ${count} commit`}
                style={{
                  height: `${Math.max(heightPct, count > 0 ? 8 : 2)}%`,
                  backgroundColor: isPeak ? theme.accent : count > 0 ? theme.shades[1] : "#1c1c1c",
                }}
              />
            );
          })}
        </div>
        {/* Saat etiketleri */}
        <div className="flex mt-1">
          {hourTotals.map((_, h) => (
            <div key={h} className="flex-1 text-center">
              {h % 6 === 0 && (
                <span className="text-xs text-zinc-700">{String(h).padStart(2, "0")}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
