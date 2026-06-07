"use client";

type Props = {
  thisWeek: number;
  lastWeek: number;
};

export default function WeekCompare({ thisWeek, lastWeek }: Props) {
  const diff = thisWeek - lastWeek;
  const pct = lastWeek > 0 ? Math.round((diff / lastWeek) * 100) : thisWeek > 0 ? 100 : 0;
  const isUp = diff >= 0;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-zinc-600">Bu hafta</p>
            <p className="text-2xl font-semibold text-zinc-100">{thisWeek}</p>
          </div>
          <div className="h-8 w-px bg-zinc-800" />
          <div>
            <p className="text-xs text-zinc-600">Geçen hafta</p>
            <p className="text-2xl font-semibold text-zinc-500">{lastWeek}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 text-sm font-medium ${isUp ? "text-emerald-400" : "text-red-400"}`}>
          <span>{isUp ? "▲" : "▼"}</span>
          <span>{Math.abs(pct)}%</span>
          <span className="text-xs font-normal text-zinc-600 ml-1">
            {isUp ? "daha fazla" : "daha az"} commit
          </span>
        </div>
      </div>
    </div>
  );
}
