"use client";

import { useThemeColors } from "@/components/theme-provider";
import { Clock } from "lucide-react";
import { useRef, useState, useEffect } from "react";

type Props = { data: { hour: number; day: number; count: number }[] };

const DAYS = ["Pzt","Sal","Car","Per","Cum","Cmt","Paz"];

export default function HourHeatmap({ data }: Props) {
  const theme = useThemeColors();
  const max = Math.max(...data.map((d) => d.count), 1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [rowH, setRowH] = useState(20);
  const gap = 2;

  const grid: number[][] = Array.from({ length: 7 }, () => new Array(24).fill(0));
  for (const { hour, day, count } of data) {
    if (day >= 0 && day < 7 && hour >= 0 && hour < 24) grid[day][hour] = count;
  }

  const hourTotals = Array.from({ length: 24 }, (_, h) => grid.reduce((s, r) => s + r[h], 0));
  const peakHour = hourTotals.indexOf(Math.max(...hourTotals));

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const { height } = entries[0]?.contentRect ?? {};
      // Kullanılabilir yükseklik: saat etiketleri (16px) + legend (20px) + boşluklar
      const avail = (height ?? 220) - 36 - gap * 6;
      const size = Math.floor(avail / 7);
      setRowH(Math.max(12, Math.min(size, 36)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  function getColor(count: number) {
    if (count === 0) return "#1a1a1e";
    const t = count / max;
    if (t < 0.25) return theme.shades[0];
    if (t < 0.5) return theme.shades[1];
    if (t < 0.75) return theme.shades[2];
    return theme.shades[3];
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0 mb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-zinc-500" />
          <h2 className="text-sm font-medium text-zinc-400">Saat Dağılımı</h2>
        </div>
        <span className="text-xs text-zinc-600">
          Pik: <span className="font-semibold" style={{ color: theme.accent }}>{String(peakHour).padStart(2, "0")}:00</span>
        </span>
      </div>

      {/* Container: scroll YOK, karta sığacak */}
      <div ref={containerRef} className="flex-1 min-h-0 flex flex-col">
        {/* Saat etiketleri */}
        <div className="flex shrink-0 mb-1" style={{ paddingLeft: 36 }}>
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} className="flex-1 text-[10px] text-zinc-700 leading-none">
              {i % 6 === 0 ? String(i).padStart(2, "0") : ""}
            </div>
          ))}
        </div>

        {/* Grid satırları */}
        <div className="flex flex-col shrink-0" style={{ gap }}>
          {DAYS.map((day, di) => (
            <div key={day} className="flex items-center" style={{ gap: 4 }}>
              <span className="shrink-0 text-right text-[10px] text-zinc-600" style={{ width: 28 }}>{day}</span>
              <div className="flex flex-1" style={{ gap: 1 }}>
                {grid[di].map((count, hi) => (
                  <div
                    key={hi}
                    title={`${day} ${String(hi).padStart(2, "0")}:00 — ${count} commit`}
                    className="flex-1 rounded-[2px] hover:opacity-80 transition-opacity"
                    style={{ height: rowH, backgroundColor: getColor(count) }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-2 flex items-center justify-end gap-1 shrink-0">
          <span className="text-[10px] text-zinc-600">Az</span>
          {["#1a1a1e", ...theme.shades].map((c) => (
            <div
              key={c}
              className="rounded-[2px]"
              style={{ width: Math.min(rowH, 14), height: Math.min(rowH, 14), backgroundColor: c }}
            />
          ))}
          <span className="text-[10px] text-zinc-600">Çok</span>
        </div>
      </div>
    </div>
  );
}
