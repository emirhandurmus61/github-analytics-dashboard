"use client";

type DayData = {
  date: string;
  commit_count: number;
};

type Props = {
  data: DayData[];
};

const MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const DAYS = ["Pzt", "", "Çar", "", "Cum", "", "Paz"];

function getColor(count: number, max: number): string {
  if (count === 0) return "#1c1c1c";
  const intensity = count / max;
  if (intensity < 0.25) return "#166534";
  if (intensity < 0.5) return "#16a34a";
  if (intensity < 0.75) return "#22c55e";
  return "#4ade80";
}

function buildGrid(data: DayData[]): { date: string; count: number }[][] {
  const map = new Map(data.map((d) => [d.date, d.commit_count]));

  // Son 52 hafta + bu haftanın başına kadar
  const today = new Date();
  const endDate = new Date(today);
  // Haftanın sonuna (Pazar) kadar git
  const dayOfWeek = (today.getDay() + 6) % 7; // Pazartesi=0
  endDate.setDate(endDate.getDate() + (6 - dayOfWeek));

  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 52 * 7 + 1);

  // Haftanın başına (Pazartesi) ayarla
  const startDay = (startDate.getDay() + 6) % 7;
  startDate.setDate(startDate.getDate() - startDay);

  const weeks: { date: string; count: number }[][] = [];
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    const week: { date: string; count: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = cursor.toISOString().slice(0, 10);
      week.push({ date: dateStr, count: map.get(dateStr) ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  return weeks;
}

function getMonthLabels(weeks: { date: string; count: number }[][]): { label: string; col: number }[] {
  const labels: { label: string; col: number }[] = [];
  let lastMonth = -1;

  weeks.forEach((week, col) => {
    const month = new Date(week[0].date).getMonth();
    if (month !== lastMonth) {
      labels.push({ label: MONTHS[month], col });
      lastMonth = month;
    }
  });

  return labels;
}

export default function ContributionHeatmap({ data }: Props) {
  const weeks = buildGrid(data);
  const max = Math.max(...data.map((d) => d.commit_count), 1);
  const monthLabels = getMonthLabels(weeks);
  const totalCommits = data.reduce((sum, d) => sum + d.commit_count, 0);

  const cellSize = 13;
  const gap = 3;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-400">Contribution Grafiği</h2>
        <span className="text-xs text-zinc-600">{totalCommits.toLocaleString("tr-TR")} commit (son 1 yıl)</span>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: weeks.length * (cellSize + gap) + 32 }}>
          {/* Ay etiketleri */}
          <div className="relative mb-1 ml-8 flex" style={{ height: 16 }}>
            {monthLabels.map(({ label, col }) => (
              <span
                key={`${label}-${col}`}
                className="absolute text-xs text-zinc-600"
                style={{ left: col * (cellSize + gap) }}
              >
                {label}
              </span>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-0">
            {/* Gün etiketleri */}
            <div className="mr-2 flex flex-col justify-between py-0.5" style={{ gap: gap }}>
              {DAYS.map((day, i) => (
                <span
                  key={i}
                  className="text-xs text-zinc-600"
                  style={{ height: cellSize, lineHeight: `${cellSize}px` }}
                >
                  {day}
                </span>
              ))}
            </div>

            {/* Hücreler */}
            <div className="flex" style={{ gap: gap }}>
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col" style={{ gap: gap }}>
                  {week.map((day) => (
                    <div
                      key={day.date}
                      title={`${day.date}: ${day.count} commit`}
                      className="rounded-sm transition-opacity hover:opacity-80"
                      style={{
                        width: cellSize,
                        height: cellSize,
                        backgroundColor: getColor(day.count, max),
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center justify-end gap-1.5">
            <span className="text-xs text-zinc-600">Az</span>
            {["#1c1c1c", "#166534", "#16a34a", "#22c55e", "#4ade80"].map((color) => (
              <div
                key={color}
                className="rounded-sm"
                style={{ width: cellSize, height: cellSize, backgroundColor: color }}
              />
            ))}
            <span className="text-xs text-zinc-600">Çok</span>
          </div>
        </div>
      </div>
    </div>
  );
}
