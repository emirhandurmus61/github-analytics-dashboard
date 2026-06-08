"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { useThemeColors } from "@/components/theme-provider";

type DayData = {
  date: string;
  commit_count: number;
};

type Props = {
  data: DayData[]; // son 365 günlük daily_stats
};

type WeekPoint = {
  label: string;      // "Hft 1", "Hft 2" ...
  weekStart: string;  // YYYY-MM-DD
  commits: number;
  avg: number | null; // 3 haftalık hareketli ortalama
  isCurrent: boolean;
};

function buildWeeklyData(data: DayData[]): WeekPoint[] {
  const map = new Map(data.map((d) => [d.date, d.commit_count]));

  // Bugünden geriye 12 tam hafta
  const today = new Date();
  // Bu haftanın Pazartesi'si
  const dayOfWeek = (today.getDay() + 6) % 7; // Pzt=0
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - dayOfWeek);
  thisMonday.setHours(0, 0, 0, 0);

  const weeks: { start: Date; commits: number }[] = [];

  for (let w = 11; w >= 0; w--) {
    const start = new Date(thisMonday);
    start.setDate(thisMonday.getDate() - w * 7);
    let commits = 0;
    for (let d = 0; d < 7; d++) {
      const cur = new Date(start);
      cur.setDate(start.getDate() + d);
      const dateStr = cur.toISOString().slice(0, 10);
      commits += map.get(dateStr) ?? 0;
    }
    weeks.push({ start, commits });
  }

  // Hareketli ortalama (3 hafta)
  return weeks.map((w, i) => {
    const window = weeks.slice(Math.max(0, i - 2), i + 1);
    const avg = window.reduce((s, x) => s + x.commits, 0) / window.length;
    const isCurrent = i === weeks.length - 1;

    // Etiket: "Oca 6", "Oca 13" gibi
    const d = w.start;
    const MONTHS = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
    const label = isCurrent ? "Bu hafta" : `${MONTHS[d.getMonth()]} ${d.getDate()}`;

    return {
      label,
      weekStart: w.start.toISOString().slice(0, 10),
      commits: w.commits,
      avg: i >= 2 ? Math.round(avg * 10) / 10 : null,
      isCurrent,
    };
  });
}

function getTrendInfo(weeks: WeekPoint[]): {
  label: string;
  color: string;
  pct: number;
} {
  const recent = weeks.slice(-4); // son 4 hafta
  const older = weeks.slice(-8, -4); // önceki 4 hafta
  const recentAvg = recent.reduce((s, w) => s + w.commits, 0) / recent.length;
  const olderAvg = older.reduce((s, w) => s + w.commits, 0) / Math.max(older.length, 1);

  if (olderAvg === 0) return { label: "Veri yetersiz", color: "#71717a", pct: 0 };

  const pct = Math.round(((recentAvg - olderAvg) / olderAvg) * 100);

  if (pct >= 20) return { label: "Hızlanıyor 🚀", color: "#34d399", pct };
  if (pct >= 5) return { label: "Stabil artış ↗", color: "#60a5fa", pct };
  if (pct >= -5) return { label: "Stabil →", color: "#71717a", pct };
  if (pct >= -20) return { label: "Hafif yavaşlıyor ↘", color: "#fb923c", pct };
  return { label: "Yavaşlıyor ⚠", color: "#f87171", pct };
}

function getProjection(weeks: WeekPoint[]): number {
  // Bu ay kaç commit olacak projeksiyonu
  // Son 4 haftanın ortalaması × bu aydaki kalan hafta sayısı + şimdiye kadar olan
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const dayOfMonth = today.getDate();
  const remainingDays = daysInMonth - dayOfMonth;

  const recentAvgPerDay = weeks
    .slice(-4)
    .reduce((s, w) => s + w.commits, 0) / (4 * 7);

  // Bu ayki gerçek commitler
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  // weeks içinde bu ayın başından bugüne olan commitler
  const soFar = weeks
    .filter((w) => w.weekStart >= thisMonthStart)
    .reduce((s, w) => s + w.commits, 0);

  return Math.round(soFar + recentAvgPerDay * remainingDays);
}

// Custom tooltip
function CustomTooltip({
  active,
  payload,
  label,
  accentColor,
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
  accentColor: string;
}) {
  if (!active || !payload?.length) return null;
  const commits = payload.find((p) => p.name === "commits")?.value;
  const avg = payload.find((p) => p.name === "avg")?.value;

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-xs shadow-xl">
      <p className="mb-1 font-medium text-zinc-300">{label}</p>
      {commits !== undefined && (
        <p style={{ color: accentColor }}>{commits} commit</p>
      )}
      {avg !== undefined && avg !== null && (
        <p className="text-zinc-500">Ort. {avg}</p>
      )}
    </div>
  );
}

export default function VelocityChart({ data }: Props) {
  const theme = useThemeColors();
  const weeks = buildWeeklyData(data);
  const trend = getTrendInfo(weeks);
  const projection = getProjection(weeks);
  const maxVal = Math.max(...weeks.map((w) => w.commits), 1);

  // Mevcut haftanın reference line'ı için label
  const currentWeekIndex = weeks.length - 1;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      {/* Başlık */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-medium text-zinc-400">Commit Velocity</h2>
          <p className="mt-0.5 text-xs text-zinc-600">Son 12 haftalık commit hızı ve trendi</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Trend badge */}
          <div
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5"
            style={{ borderColor: `${trend.color}33`, backgroundColor: `${trend.color}11` }}
          >
            <span className="text-xs font-medium" style={{ color: trend.color }}>
              {trend.label}
            </span>
            {trend.pct !== 0 && (
              <span className="text-xs" style={{ color: trend.color }}>
                {trend.pct > 0 ? "+" : ""}{trend.pct}%
              </span>
            )}
          </div>
          {/* Projeksiyon badge */}
          <div
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5"
            style={{ borderColor: theme.accentBorder, backgroundColor: theme.accentBg }}
          >
            <span className="text-xs text-zinc-500">Bu ay tahmini</span>
            <span className="text-xs font-semibold" style={{ color: theme.accent }}>
              ~{projection} commit
            </span>
          </div>
        </div>
      </div>

      {/* Grafik */}
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={weeks} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme.accent} stopOpacity={0.25} />
              <stop offset="95%" stopColor={theme.accent} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />

          <XAxis
            dataKey="label"
            tick={{ fill: "#52525b", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            interval={1}
          />
          <YAxis
            tick={{ fill: "#52525b", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            domain={[0, maxVal + 2]}
          />

          <Tooltip
            content={
              <CustomTooltip accentColor={theme.accent} />
            }
          />

          {/* Bu haftayı işaretle */}
          <ReferenceLine
            x={weeks[currentWeekIndex].label}
            stroke={theme.accentBorder}
            strokeDasharray="4 4"
          />

          {/* Ana alan */}
          <Area
            type="monotone"
            dataKey="commits"
            name="commits"
            stroke={theme.accent}
            strokeWidth={2}
            fill="url(#velocityGrad)"
            dot={(props) => {
              const { cx, cy, index } = props;
              if (index === currentWeekIndex) {
                return (
                  <circle
                    key={`dot-${index}`}
                    cx={cx}
                    cy={cy}
                    r={5}
                    fill={theme.accent}
                    stroke="#09090b"
                    strokeWidth={2}
                  />
                );
              }
              return <circle key={`dot-${index}`} cx={cx} cy={cy} r={0} fill="none" />;
            }}
            activeDot={{ r: 5, fill: theme.accent, stroke: "#09090b", strokeWidth: 2 }}
          />

          {/* Hareketli ortalama çizgisi */}
          <Area
            type="monotone"
            dataKey="avg"
            name="avg"
            stroke={theme.accentMid}
            strokeWidth={1.5}
            strokeDasharray="5 3"
            fill="none"
            dot={false}
            activeDot={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-3 flex items-center gap-4 justify-end">
        <div className="flex items-center gap-1.5">
          <div className="h-px w-5" style={{ backgroundColor: theme.accent }} />
          <span className="text-xs text-zinc-600">Haftalık commit</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="h-px w-5 border-t border-dashed"
            style={{ borderColor: theme.accentMid }}
          />
          <span className="text-xs text-zinc-600">3 haftalık ortalama</span>
        </div>
      </div>
    </div>
  );
}
