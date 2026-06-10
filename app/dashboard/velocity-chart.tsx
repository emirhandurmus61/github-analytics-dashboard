"use client";

import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid,
} from "recharts";
import { useThemeColors } from "@/components/theme-provider";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";

type DayData = { date: string; commit_count: number };
type Props = { data: DayData[] };

type WeekPoint = { label: string; weekStart: string; commits: number; avg: number | null; isCurrent: boolean };

function buildWeeklyData(data: DayData[]): WeekPoint[] {
  const map = new Map(data.map((d) => [d.date, d.commit_count]));
  const today = new Date();
  const dow = (today.getDay() + 6) % 7;
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - dow);
  thisMonday.setHours(0, 0, 0, 0);

  const weeks: { start: Date; commits: number }[] = [];
  for (let w = 11; w >= 0; w--) {
    const start = new Date(thisMonday);
    start.setDate(thisMonday.getDate() - w * 7);
    let commits = 0;
    for (let d = 0; d < 7; d++) {
      const cur = new Date(start);
      cur.setDate(start.getDate() + d);
      commits += map.get(cur.toISOString().slice(0, 10)) ?? 0;
    }
    weeks.push({ start, commits });
  }

  const M = ["Oca","Sub","Mar","Nis","May","Haz","Tem","Agu","Eyl","Eki","Kas","Ara"];
  return weeks.map((w, i) => {
    const window = weeks.slice(Math.max(0, i - 2), i + 1);
    const avg = window.reduce((s, x) => s + x.commits, 0) / window.length;
    const isCurrent = i === weeks.length - 1;
    const d = w.start;
    return {
      label: isCurrent ? "Bu hafta" : `${M[d.getMonth()]} ${d.getDate()}`,
      weekStart: w.start.toISOString().slice(0, 10),
      commits: w.commits,
      avg: i >= 2 ? Math.round(avg * 10) / 10 : null,
      isCurrent,
    };
  });
}

function getTrend(weeks: WeekPoint[]) {
  const recent = weeks.slice(-4);
  const older = weeks.slice(-8, -4);
  const rAvg = recent.reduce((s, w) => s + w.commits, 0) / recent.length;
  const oAvg = older.reduce((s, w) => s + w.commits, 0) / Math.max(older.length, 1);
  if (oAvg === 0) return { label: "Veri yetersiz", color: "#71717a", pct: 0, icon: Minus };
  const pct = Math.round(((rAvg - oAvg) / oAvg) * 100);
  if (pct >= 10) return { label: "Hizlaniyor", color: "#34d399", pct, icon: TrendingUp };
  if (pct >= -10) return { label: "Stabil", color: "#71717a", pct, icon: Minus };
  return { label: "Yavasliyor", color: "#f87171", pct, icon: TrendingDown };
}

function CustomTooltip({ active, payload, label, color }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string; color: string }) {
  if (!active || !payload?.length) return null;
  const commits = payload.find((p) => p.name === "commits")?.value;
  const avg = payload.find((p) => p.name === "avg")?.value;
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-lg">
      <p className="mb-0.5 font-medium text-zinc-300">{label}</p>
      {commits !== undefined && <p style={{ color }}>{commits} commit</p>}
      {avg !== undefined && avg !== null && <p className="text-zinc-500">Ort. {avg}</p>}
    </div>
  );
}

export default function VelocityChart({ data }: Props) {
  const theme = useThemeColors();
  const weeks = buildWeeklyData(data);
  const trend = getTrend(weeks);
  const maxVal = Math.max(...weeks.map((w) => w.commits), 1);
  const TrendIcon = trend.icon;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between shrink-0 mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-zinc-500" />
          <h2 className="text-sm font-medium text-zinc-400">Commit Velocity</h2>
        </div>
        <div
          className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1 self-start"
          style={{ borderColor: `${trend.color}30`, backgroundColor: `${trend.color}08` }}
        >
          <TrendIcon className="w-3.5 h-3.5" style={{ color: trend.color }} />
          <span className="text-xs font-medium" style={{ color: trend.color }}>
            {trend.label}
            {trend.pct !== 0 && ` (${trend.pct > 0 ? "+" : ""}${trend.pct}%)`}
          </span>
        </div>
      </div>

      {/* Chart — fills remaining space */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={weeks} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.accent} stopOpacity={0.2} />
                <stop offset="95%" stopColor={theme.accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#1f1f23" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#3f3f46", fontSize: 10 }} axisLine={false} tickLine={false} interval={1} />
            <YAxis tick={{ fill: "#3f3f46", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} domain={[0, maxVal + 2]} />
            <Tooltip content={<CustomTooltip color={theme.accent} />} />
            <ReferenceLine x={weeks[weeks.length - 1].label} stroke={theme.accentBorder} strokeDasharray="4 4" />
            <Area
              type="monotone" dataKey="commits" name="commits"
              stroke={theme.accent} strokeWidth={2} fill="url(#velocityGrad)"
              dot={(p) => {
                const { cx, cy, index } = p;
                if (index === weeks.length - 1) return <circle key={index} cx={cx} cy={cy} r={4} fill={theme.accent} stroke="#09090b" strokeWidth={2} />;
                return <circle key={index} cx={cx} cy={cy} r={0} fill="none" />;
              }}
              activeDot={{ r: 4, fill: theme.accent, stroke: "#09090b", strokeWidth: 2 }}
            />
            <Area
              type="monotone" dataKey="avg" name="avg"
              stroke={theme.accentMid} strokeWidth={1.5} strokeDasharray="5 3"
              fill="none" dot={false} activeDot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center gap-4 justify-end shrink-0">
        <div className="flex items-center gap-1">
          <div className="h-px w-4" style={{ backgroundColor: theme.accent }} />
          <span className="text-[10px] text-zinc-600">Haftalik</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-px w-4 border-t border-dashed" style={{ borderColor: theme.accentMid }} />
          <span className="text-[10px] text-zinc-600">3h ort.</span>
        </div>
      </div>
    </div>
  );
}
