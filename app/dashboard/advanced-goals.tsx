"use client";

import { useState, useTransition } from "react";
import { useThemeColors } from "@/components/theme-provider";
import {
  Target, CheckCircle2, Lock, Plus, Trash2, ChevronDown, ChevronUp, Zap, Link2
} from "lucide-react";
import { GOAL_META, calcGoalProgress, type UserGoal, type GoalType, type GoalProgress } from "@/lib/goals";
import { upsertGoal, deleteGoal } from "./advanced-goals/actions";

const TYPE_ORDER: GoalType[] = [
  "daily_commit",
  "weekly_pr",
  "monthly_active_days",
  "quarterly_new_repo",
];

function StatusIcon({ status }: { status: GoalProgress["status"] }) {
  if (status === "completed") return <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />;
  if (status === "locked") return <Lock size={14} className="text-zinc-600 shrink-0" />;
  return <Target size={14} className="text-zinc-500 shrink-0" />;
}

function GoalRow({
  progress,
  accentColor,
  onDelete,
}: {
  progress: GoalProgress;
  accentColor: string;
  onDelete: (id: string) => void;
}) {
  const { goal, current, status, pct, hint } = progress;
  const meta = GOAL_META[goal.type];
  const isLocked = status === "locked";
  const isDone = status === "completed";

  return (
    <div
      className="rounded-xl border px-4 py-3 space-y-2 transition-all"
      style={{
        borderColor: isDone ? accentColor + "40" : isLocked ? "#27272a" : "#3f3f46",
        backgroundColor: isDone ? accentColor + "08" : "transparent",
        opacity: isLocked ? 0.5 : 1,
      }}
    >
      <div className="flex items-center gap-2">
        {goal.chainOrder > 0 && <Link2 size={10} className="text-zinc-700 shrink-0" />}
        <StatusIcon status={status} />
        <span className="text-xs font-semibold text-zinc-200 flex-1 truncate">{meta.label}</span>
        <span
          className="text-xs font-bold tabular-nums shrink-0"
          style={{ color: isDone ? accentColor : "#a1a1aa" }}
        >
          {current}/{goal.target} {meta.unit}
        </span>
        {!isLocked && (
          <button
            onClick={() => onDelete(goal.id)}
            className="text-zinc-700 hover:text-zinc-400 transition-colors shrink-0"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {!isLocked && (
        <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              backgroundColor: isDone ? accentColor : pct >= 70 ? accentColor + "cc" : "#52525b",
            }}
          />
        </div>
      )}

      {hint && (
        <p
          className="text-[10px] flex items-center gap-1"
          style={{ color: isDone ? accentColor : "#71717a" }}
        >
          {isDone && <CheckCircle2 size={10} />}
          {hint}
        </p>
      )}
    </div>
  );
}

function AchievementCalendar({ achievements }: { achievements: string[] }) {
  const achievedSet = new Set(achievements);
  // Son 4 hafta (28 gün)
  const days: { date: string; achieved: boolean }[] = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const str = d.toISOString().slice(0, 10);
    days.push({ date: str, achieved: achievedSet.has(str) });
  }

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider">Son 28 Gün</p>
      <div className="grid grid-cols-7 gap-1">
        {["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"].map((d) => (
          <div key={d} className="text-[9px] text-zinc-700 text-center">{d}</div>
        ))}
        {/* Haftanın başına kadar boş hücre */}
        {(() => {
          const firstDay = new Date(days[0].date);
          const offset = (firstDay.getDay() + 6) % 7; // Pzt=0
          return Array.from({ length: offset }).map((_, i) => (
            <div key={`empty-${i}`} />
          ));
        })()}
        {days.map(({ date, achieved }) => (
          <div
            key={date}
            title={date}
            className="aspect-square rounded-sm transition-colors"
            style={{
              backgroundColor: achieved ? "#34d399" : "#27272a",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function AddGoalForm({
  onAdd,
  existingTypes,
}: {
  onAdd: (type: GoalType, target: number, chain: boolean) => void;
  existingTypes: GoalType[];
}) {
  const theme = useThemeColors();
  const [type, setType] = useState<GoalType>("daily_commit");
  const [target, setTarget] = useState<number>(GOAL_META["daily_commit"].presets[0]);
  const [chain, setChain] = useState(false);

  const available = TYPE_ORDER.filter((t) => !existingTypes.includes(t));
  if (available.length === 0) return <p className="text-[11px] text-zinc-600">Tüm hedef tipleri eklendi.</p>;

  return (
    <div className="space-y-3 pt-2 border-t border-zinc-800">
      <p className="text-xs font-semibold text-zinc-400">Yeni Hedef</p>
      <div className="flex flex-wrap gap-2">
        {available.map((t) => (
          <button
            key={t}
            onClick={() => { setType(t); setTarget(GOAL_META[t].presets[0]); }}
            className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all border"
            style={{
              borderColor: type === t ? theme.accent + "80" : "#3f3f46",
              backgroundColor: type === t ? theme.accent + "12" : "transparent",
              color: type === t ? theme.accent : "#71717a",
            }}
          >
            {GOAL_META[t].label}
          </button>
        ))}
      </div>

      {/* Hedef değeri */}
      <div className="flex flex-wrap gap-2 items-center">
        {GOAL_META[type].presets.map((p) => (
          <button
            key={p}
            onClick={() => setTarget(p)}
            className="rounded-lg px-3 py-1 text-xs font-medium transition-all border"
            style={{
              borderColor: target === p ? theme.accent + "80" : "#3f3f46",
              backgroundColor: target === p ? theme.accent + "12" : "transparent",
              color: target === p ? theme.accent : "#71717a",
            }}
          >
            {p} {GOAL_META[type].unit}
          </button>
        ))}
        <input
          type="number"
          min={1}
          max={999}
          value={target}
          onChange={(e) => setTarget(Math.max(1, parseInt(e.target.value) || 1))}
          className="w-20 rounded-lg bg-zinc-800 px-2 py-1 text-xs text-zinc-200 outline-none ring-1 ring-zinc-700 focus:ring-zinc-600"
        />
      </div>

      {/* Zincirleme seçeneği */}
      {existingTypes.length > 0 && (
        <label className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={() => setChain((v) => !v)}
            className="w-8 h-4 rounded-full transition-colors relative shrink-0"
            style={{ backgroundColor: chain ? theme.accent : "#3f3f46" }}
          >
            <div
              className="absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform"
              style={{ left: chain ? "calc(100% - 14px)" : "2px" }}
            />
          </div>
          <span className="text-[11px] text-zinc-500">
            Önceki hedef tamamlanınca aç (zincirleme)
          </span>
        </label>
      )}

      <button
        onClick={() => onAdd(type, target, chain)}
        className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all"
        style={{ backgroundColor: theme.accent + "20", color: theme.accent }}
      >
        <Plus size={13} />
        Hedef Ekle
      </button>
    </div>
  );
}

export default function AdvancedGoalsCard({
  goals: initialGoals,
  achievements: initialAchievements,
  metrics,
}: {
  goals: UserGoal[];
  achievements: string[];
  metrics: {
    todayCommits: number;
    weeklyPRs: number;
    monthlyActiveDays: number;
    quarterlyNewRepos: number;
  };
}) {
  const theme = useThemeColors();
  const [goals, setGoals] = useState(initialGoals);
  const [showAdd, setShowAdd] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isPending, startTransition] = useTransition();

  const progressList = calcGoalProgress(goals, metrics);
  const completedToday = progressList.filter((p) => p.status === "completed").length;
  const nearDone = progressList.filter(
    (p) => p.status === "active" && p.pct >= 80 && p.pct < 100
  );

  function handleAdd(type: GoalType, target: number, chain: boolean) {
    const chainOrder = chain ? goals.length : 0;
    startTransition(async () => {
      const res = await upsertGoal(type, target, chainOrder);
      if (res.success) {
        setGoals((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            type,
            target,
            chainOrder,
            completedAt: null,
            isActive: true,
          },
        ]);
        setShowAdd(false);
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteGoal(id);
      setGoals((prev) => prev.filter((g) => g.id !== id));
    });
  }

  const existingTypes = goals.map((g) => g.type);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 h-full flex flex-col gap-4 overflow-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Target size={15} className="text-zinc-500" />
            <h2 className="text-sm font-semibold text-zinc-200">Gelişmiş Hedefler</h2>
          </div>
          <p className="text-xs text-zinc-600">
            {completedToday > 0
              ? `${completedToday} hedef tamamlandı`
              : "Hedeflerini takip et"}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {initialAchievements.length > 0 && (
            <button
              onClick={() => setShowCalendar((v) => !v)}
              className="flex items-center gap-1 text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              {showCalendar ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              Takvim
            </button>
          )}
          <button
            onClick={() => setShowAdd((v) => !v)}
            className="flex items-center gap-1 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-[11px] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-all"
          >
            <Plus size={11} />
            Ekle
          </button>
        </div>
      </div>

      {/* Yakın Biten Hedef Bildirimi */}
      {nearDone.length > 0 && (
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-medium shrink-0"
          style={{ backgroundColor: theme.accent + "12", color: theme.accent }}
        >
          <Zap size={13} className="shrink-0" />
          <span>
            {nearDone[0].goal.type === "daily_commit"
              ? `Günlük hedefine ${nearDone[0].goal.target - nearDone[0].current} commit kaldı!`
              : nearDone[0].hint ?? "Hedefe yakınsın!"}
          </span>
        </div>
      )}

      {/* Hedef listesi */}
      {goals.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-6">
          <Target size={32} className="text-zinc-700" />
          <p className="text-sm text-zinc-500">Henüz hedef yok</p>
          <p className="text-xs text-zinc-700">Hedef ekleyerek gelişimini takip et</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 flex-1">
          {progressList.map((p) => (
            <GoalRow
              key={p.goal.id}
              progress={p}
              accentColor={theme.accent}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Başarı Takvimi */}
      {showCalendar && initialAchievements.length > 0 && (
        <div className="border-t border-zinc-800 pt-4 shrink-0">
          <AchievementCalendar achievements={initialAchievements} />
        </div>
      )}

      {/* Hedef Ekle Formu */}
      {showAdd && (
        <AddGoalForm
          onAdd={handleAdd}
          existingTypes={existingTypes}
        />
      )}

      {isPending && (
        <div className="flex justify-center shrink-0">
          <span className="w-4 h-4 rounded-full border-2 border-zinc-600 border-t-transparent animate-spin" />
        </div>
      )}
    </div>
  );
}
