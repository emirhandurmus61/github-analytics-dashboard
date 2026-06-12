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

function getMonthLabels(weeks: { date: string; count: number }[][], cellSize: number, gap: number) {
  const labels: { label: string; left: number }[] = [];
  let last = -1;
  weeks.forEach((w, col) => {
    const m = new Date(w[0].date).getMonth();
    if (m !== last) {
      labels.push({ label: MONTHS[m], left: col * (cellSize + gap) });
      last = m;
    }
  });
  return labels;
}

function HeatmapInner({ data, shades }: { data: DayData[]; shades: [string, string, string, string] }) {
  const weeks = buildGrid(data);
  const max = Math.max(...data.map((d) => d.commit_count), 1);
  const total = data.reduce((s, d) => s + d.commit_count, 0);

  const containerRef = useRef<HTMLDivElement>(null);
  // cellSize: container genişliğinden hesaplanır, scroll olmaz
  const [cellSize, setCellSize] = useState(11);
  const gap = 2;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 300;
      // Toplam genişlik = dayLabel(28px) + gap(4px) + weeks * (cell + gap) - gap
      // weeks.length haftayı sığdır
      const available = w - 28 - 4 - gap * (weeks.length - 1);
      const size = Math.floor(available / weeks.length);
      setCellSize(Math.max(8, Math.min(size, 18)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [weeks.length]);

  const monthLabels = getMonthLabels(weeks, cellSize, gap);

  function getColor(count: number) {
    if (count === 0) return "#1a1a1e";
    const t = count / max;
    if (t < 0.25) return shades[0];
    if (t < 0.5) return shades[1];
    if (t < 0.75) return shades[2];
    return shades[3];
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0 mb-3">
        <div className="flex items-center gap-2">
          <Grid3X3 className="w-4 h-4 text-zinc-500" />
          <h2 className="text-sm font-medium text-zinc-400">Contributions</h2>
        </div>
        <span className="text-xs text-zinc-600 tabular-nums">{total.toLocaleString("tr-TR")} commit</span>
      </div>

      {/* Container: genişliği ölç, scroll YOK */}
      <div ref={containerRef} className="flex-1 min-h-0 flex flex-col">
        {/* Month labels */}
        <div className="relative shrink-0 mb-1" style={{ height: 14, paddingLeft: 32 }}>
          {monthLabels.map(({ label, left }) => (
            <span
              key={`${label}-${left}`}
              className="absolute text-[10px] text-zinc-600"
              style={{ left: 32 + left }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Grid */}
        <div className="flex shrink-0" style={{ gap: 4 }}>
          {/* Day labels */}
          <div className="flex flex-col" style={{ gap, width: 28, paddingTop: 0 }}>
            {DAYS.map((day, i) => (
              <div
                key={i}
                className="flex items-center justify-end text-[10px] text-zinc-600"
                style={{ height: cellSize }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div className="flex flex-1" style={{ gap }}>
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-1 flex-col" style={{ gap }}>
                {week.map((day) => (
                  <div
                    key={day.date}
                    title={`${day.date}: ${day.count} commit`}
                    className="rounded-[2px] hover:opacity-80 transition-opacity w-full"
                    style={{ height: cellSize, backgroundColor: getColor(day.count) }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-2 flex items-center justify-end gap-1 shrink-0">
          <span className="text-[10px] text-zinc-600">Az</span>
          {["#1a1a1e", ...shades].map((c) => (
            <div
              key={c}
              className="rounded-[2px]"
              style={{ width: cellSize, height: cellSize, backgroundColor: c }}
            />
          ))}
          <span className="text-[10px] text-zinc-600">Çok</span>
        </div>
      </div>
    </div>
  );
}

export default function ContributionHeatmap({ data, accentShades }: Props) {
  const theme = useThemeColors();
  return <HeatmapInner data={data} shades={accentShades ?? theme.shades} />;
}
