"use client";

type Props = {
  data: { hour: number; day: number; count: number }[];
};

const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const HOURS = Array.from({ length: 24 }, (_, i) =>
  i % 6 === 0 ? `${String(i).padStart(2, "0")}:00` : ""
);

function getColor(count: number, max: number): string {
  if (count === 0) return "#1c1c1c";
  const t = count / max;
  if (t < 0.25) return "#1e3a5f";
  if (t < 0.5) return "#1d4ed8";
  if (t < 0.75) return "#3b82f6";
  return "#93c5fd";
}

export default function HourHeatmap({ data }: Props) {
  const max = Math.max(...data.map((d) => d.count), 1);

  // day=0 Pzt, hour=0..23
  const grid: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
  for (const { hour, day, count } of data) {
    if (day >= 0 && day < 7 && hour >= 0 && hour < 24) {
      grid[day][hour] = count;
    }
  }

  // En verimli saat
  const hourTotals = Array.from({ length: 24 }, (_, h) =>
    grid.reduce((sum, row) => sum + row[h], 0)
  );
  const peakHour = hourTotals.indexOf(Math.max(...hourTotals));

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-400">Saate Göre Commit Dağılımı</h2>
        <span className="text-xs text-zinc-600">
          En verimli saat:{" "}
          <span className="text-blue-400">{String(peakHour).padStart(2, "0")}:00–{String(peakHour + 1).padStart(2, "0")}:00</span>
        </span>
      </div>

      <div className="overflow-x-auto">
        <div style={{ minWidth: 560 }}>
          {/* Saat etiketleri */}
          <div className="mb-1 flex pl-10">
            {HOURS.map((label, i) => (
              <div key={i} className="flex-1 text-xs text-zinc-600">{label}</div>
            ))}
          </div>

          {/* Grid */}
          <div className="space-y-1">
            {DAYS.map((day, di) => (
              <div key={day} className="flex items-center gap-1">
                <span className="w-9 shrink-0 text-right text-xs text-zinc-600">{day}</span>
                <div className="flex flex-1 gap-0.5">
                  {grid[di].map((count, hi) => (
                    <div
                      key={hi}
                      title={`${day} ${String(hi).padStart(2, "0")}:00 — ${count} commit`}
                      className="h-5 flex-1 rounded-sm transition-opacity hover:opacity-80"
                      style={{ backgroundColor: getColor(count, max) }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center justify-end gap-1.5">
            <span className="text-xs text-zinc-600">Az</span>
            {["#1c1c1c", "#1e3a5f", "#1d4ed8", "#3b82f6", "#93c5fd"].map((c) => (
              <div key={c} className="h-3.5 w-3.5 rounded-sm" style={{ backgroundColor: c }} />
            ))}
            <span className="text-xs text-zinc-600">Çok</span>
          </div>
        </div>
      </div>
    </div>
  );
}
