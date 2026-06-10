"use client";

import { useThemeColors } from "@/components/theme-provider";
import { Grid3X3 } from "lucide-react";
import { useRef, useState, useEffect } from "react";

type DayData = { date: string; commit_count: number };
type Props = { data: DayData[]; accentShades?: [string, string, string, string] };

const MONTHS = ["Oca","Sub","Mar","Nis","May","Haz","Tem","Agu","Eyl","Eki","Kas","Ara"];
const DAYS = ["Pzt","","Car","","Cum","","Paz"];

function buildGrid(data: DayData[]) {
  const map = new Map(data.map((d) => [d.date, d.commit_count]));
  const today = new Date();
  const endDate = new Date(today);
  const dow = (today.getDay() + 6) % 7;
  endDate.setDate(endDate.getDate() + (6 - dow));
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 52 * 7 + 1);
  const sd = (startDate.getDay() + 6) % 7;
  startDate.setDate(startDate.getDate() - sd);

  const weeks: { date: string; count: number }[][] = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    const week: { date: string; count: number }[] = [];
    for (let d = 0; d < 7; d++) {
      week.push({ date: cursor.toISOString().slice(0, 10), count: map.get(cursor.toISOString().slice(0, 10)) ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

function getMonthLabels(weeks: { date: string; count: number }[][]) {
  const labels: { label: string; col: number }[] = [];
  let last = -1;
  weeks.forEach((w, col) => {
    const m = new Date(w[0].date).getMonth();
    if (m !== last) { labels.push({ label: MONTHS[m], col }); last = m; }
  });
  return labels;
}

function HeatmapInner({ data, shades }: { data: DayData[]; shades: [string, string, string, string] }) {
  const weeks = buildGrid(data);
  const max = Math.max(...data.map((d) => d.commit_count), 1);
  const monthLabels = getMonthLabels(weeks);
  const total = data.reduce((s, d) => s + d.commit_count, 0);

  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(18);
  const gap = 3;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect.height ?? 0;
      // Available height for cells: total minus month labels (18px) minus legend (24px)
      const availH = height - 42;
      // 7 rows with 6 gaps
      const size = Math.floor((availH - gap * 6) / 7);
      setCellSize(Math.max(12, Math.min(size, 36)));
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function getColor(count: number) {
    if (count === 0) return "#1a1a1e";
    const t = count / max;
    if (t < 0.25) return shades[0];
    if (t < 0.5) return shades[1];
    if (t < 0.75) return shades[2];
    return shades[3];
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0 mb-3">
        <div className="flex items-center gap-2">
          <Grid3X3 className="w-4 h-4 text-zinc-500" />
          <h2 className="text-sm font-medium text-zinc-400">Contributions</h2>
        </div>
        <span className="text-xs text-zinc-600 tabular-nums">{total.toLocaleString("tr-TR")} commit</span>
      </div>

      <div ref={containerRef} className="overflow-x-auto flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0" style={{ minWidth: weeks.length * (cellSize + gap) + 36 }}>
          {/* Month labels */}
          <div className="relative mb-1 ml-9 flex" style={{ height: 16 }}>
            {monthLabels.map(({ label, col }) => (
              <span key={`${label}-${col}`} className="absolute text-xs text-zinc-600" style={{ left: col * (cellSize + gap) }}>
                {label}
              </span>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-0">
            <div className="mr-2 flex flex-col justify-between py-0" style={{ gap }}>
              {DAYS.map((day, i) => (
                <span key={i} className="text-xs text-zinc-600 flex items-center" style={{ height: cellSize }}>
                  {day}
                </span>
              ))}
            </div>
            <div className="flex" style={{ gap }}>
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col" style={{ gap }}>
                  {week.map((day) => (
                    <div
                      key={day.date}
                      title={`${day.date}: ${day.count} commit`}
                      className="rounded-[3px] hover:opacity-80 transition-opacity"
                      style={{ width: cellSize, height: cellSize, backgroundColor: getColor(day.count) }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-3 flex items-center justify-end gap-1.5">
            <span className="text-xs text-zinc-600">Az</span>
            {["#1a1a1e", ...shades].map((c) => (
              <div key={c} className="rounded-[3px]" style={{ width: cellSize, height: cellSize, backgroundColor: c }} />
            ))}
            <span className="text-xs text-zinc-600">Cok</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContributionHeatmap({ data, accentShades }: Props) {
  const theme = useThemeColors();
  return <HeatmapInner data={data} shades={accentShades ?? theme.shades} />;
}
