"use client";

import { useThemeColors } from "@/components/theme-provider";
import { TrendingUp, Users, Flame, Code2, Calendar } from "lucide-react";
import type { PercentileData } from "@/lib/percentile";

function PercentileBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="relative h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${value}%`, backgroundColor: color }}
      />
      {/* Orta çizgi (medyan) */}
      <div
        className="absolute top-0 bottom-0 w-px bg-zinc-600"
        style={{ left: "50%" }}
      />
    </div>
  );
}

function MetricRow({
  icon,
  label,
  percentile,
  userValue,
  medianValue,
  suffix,
  color,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  percentile: number;
  userValue: number;
  medianValue: number;
  suffix: string;
  color: string;
  sub?: string;
}) {
  const tier =
    percentile >= 90 ? { label: "Top 10%", color: "#f59e0b" }
    : percentile >= 75 ? { label: "Top 25%", color: "#34d399" }
    : percentile >= 50 ? { label: "Üst Yarı", color: "#60a5fa" }
    : { label: "Alt Yarı", color: "#94a3b8" };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-zinc-500 shrink-0">{icon}</span>
          <div className="min-w-0">
            <span className="text-xs text-zinc-400 font-medium">{label}</span>
            {sub && <span className="ml-1.5 text-xs text-zinc-600">({sub})</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
            style={{ backgroundColor: tier.color + "18", color: tier.color }}
          >
            {tier.label}
          </span>
          <span className="text-xs font-bold tabular-nums" style={{ color }}>
            %{percentile}
          </span>
        </div>
      </div>
      <PercentileBar value={percentile} color={color} />
      <div className="flex justify-between text-[10px] text-zinc-600">
        <span>
          Sen:{" "}
          <span className="text-zinc-400 font-medium">
            {userValue.toLocaleString("tr-TR")} {suffix}
          </span>
        </span>
        <span>
          Medyan:{" "}
          <span className="text-zinc-500">
            {medianValue.toLocaleString("tr-TR")} {suffix}
          </span>
        </span>
      </div>
    </div>
  );
}

export default function PercentileRankCard({ data }: { data: PercentileData }) {
  const theme = useThemeColors();

  const overallScore = Math.round(
    (data.commitPercentile + data.streakPercentile + data.activeDayPercentile) / 3
  );

  const overallTier =
    overallScore >= 90 ? "Efsanevi"
    : overallScore >= 75 ? "Uzman"
    : overallScore >= 50 ? "Ortalama Üstü"
    : "Gelişmekte";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 h-full flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={15} className="text-zinc-500" />
            <h2 className="text-sm font-semibold text-zinc-200">Sıralaman</h2>
          </div>
          <p className="text-xs text-zinc-600">
            {data.totalUsers.toLocaleString("tr-TR")} geliştirici arasında
          </p>
        </div>

        {/* Genel skor */}
        <div className="text-right shrink-0">
          <div
            className="text-3xl font-black tabular-nums"
            style={{ color: theme.accent }}
          >
            %{overallScore}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5 font-medium">{overallTier}</div>
        </div>
      </div>

      {/* Genel skor bar */}
      <div className="space-y-1.5">
        <PercentileBar value={overallScore} color={theme.accent} />
        <div className="flex justify-between text-[10px] text-zinc-700">
          <span>Alt</span>
          <span>Medyan</span>
          <span>Üst</span>
        </div>
      </div>

      {/* Metrikler */}
      <div className="flex flex-col gap-4 flex-1">
        <MetricRow
          icon={<Code2 size={13} />}
          label="Yıllık Commit"
          percentile={data.commitPercentile}
          userValue={data.commitCount}
          medianValue={data.platformMedianCommits}
          suffix="commit"
          color={theme.accent}
        />

        <MetricRow
          icon={<Flame size={13} />}
          label="Streak"
          percentile={data.streakPercentile}
          userValue={data.streakDays}
          medianValue={data.platformMedianStreak}
          suffix="gün"
          color={theme.accent}
        />

        <MetricRow
          icon={<Calendar size={13} />}
          label="Aktif Gün"
          percentile={data.activeDayPercentile}
          userValue={data.activeDays}
          medianValue={data.platformMedianActiveDays}
          suffix="gün"
          color={theme.accent}
        />

        {data.langPercentile !== null && data.topLang && (
          <MetricRow
            icon={<Users size={13} />}
            label="Dil Sıralaması"
            sub={data.topLang}
            percentile={data.langPercentile}
            userValue={data.commitCount}
            medianValue={0}
            suffix="commit"
            color={theme.accent}
          />
        )}
      </div>

      <p className="text-[10px] text-zinc-700 text-center leading-relaxed">
        Veriler anonim · Sadece toplu istatistikler kullanılır
      </p>
    </div>
  );
}
