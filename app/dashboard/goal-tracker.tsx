"use client";

import { useState, useTransition } from "react";
import { useThemeColors } from "@/components/theme-provider";
import { saveWeeklyGoal } from "@/app/dashboard/settings/actions";
import { Target, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";

const GOALS = [5, 10, 20, 30, 50];

type WeekHistory = { week_start: string; goal: number; actual: number };
type Props = { thisWeek: number; initialGoal: number; history: WeekHistory[] };

const MS = ["Oca","Sub","Mar","Nis","May","Haz","Tem","Agu","Eyl","Eki","Kas","Ara"];

function formatWeek(s: string) {
  const d = new Date(s);
  return `${d.getDate()} ${MS[d.getMonth()]}`;
}

export default function GoalTracker({ thisWeek, initialGoal, history }: Props) {
  const theme = useThemeColors();
  const [goal, setGoal] = useState(initialGoal);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave(v: number) {
    const clamped = Math.max(1, Math.min(500, v));
    setGoal(clamped);
    setEditing(false);
    startTransition(async () => { await saveWeeklyGoal(clamped); });
  }

  const pct = Math.min(Math.round((thisWeek / goal) * 100), 100);
  const done = thisWeek >= goal;
  const barColor = done ? theme.accent : pct >= 70 ? theme.accentMid : "#3f3f46";

  const historyWithCurrent = (() => {
    const today = new Date();
    const dow = (today.getDay() + 6) % 7;
    const mon = new Date(today);
    mon.setDate(today.getDate() - dow);
    const ws = mon.toISOString().slice(0, 10);
    const hasThis = history.some((h) => h.week_start === ws);
    const base = hasThis
      ? history.map((h) => h.week_start === ws ? { ...h, actual: thisWeek, goal } : h)
      : [{ week_start: ws, actual: thisWeek, goal }, ...history];
    return base.slice(0, 12).reverse();
  })();

  const histMax = Math.max(...historyWithCurrent.map((h) => Math.max(h.actual, h.goal)), 1);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-zinc-500" />
          <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            Haftalik Hedef
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="flex items-center gap-0.5 text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showHistory ? "Gizle" : "Gecmis"}
            </button>
          )}
          <button
            onClick={() => { setEditing(!editing); setInput(String(goal)); }}
            className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            {editing ? "Iptal" : "Duzenle"}
          </button>
        </div>
      </div>

      {editing ? (
        <div className="space-y-3 flex-1 min-h-0">
          <div className="flex flex-wrap gap-1.5">
            {GOALS.map((g) => (
              <button
                key={g}
                onClick={() => handleSave(g)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
                style={g === goal ? { backgroundColor: theme.accent, color: "#09090b" } : { color: "#71717a" }}
              >
                {g}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            <input
              type="number"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ozel..."
              className="w-24 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 outline-none ring-1 ring-zinc-700 focus:ring-zinc-500"
            />
            <button
              onClick={() => { const v = parseInt(input); if (v > 0) handleSave(v); }}
              disabled={isPending}
              className="rounded-lg bg-zinc-700 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-600 disabled:opacity-50"
            >
              {isPending ? "..." : "Kaydet"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col justify-center gap-3">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-3xl font-bold tabular-nums" style={{ color: done ? theme.accent : "#f4f4f5" }}>
                {thisWeek}
              </span>
              <span className="ml-1.5 text-sm text-zinc-600">/ {goal}</span>
            </div>
            {done && (
              <span className="flex items-center gap-1 text-xs font-medium" style={{ color: theme.accent }}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Tamamlandi
              </span>
            )}
          </div>

          <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: barColor }}
            />
          </div>

          <p className="text-xs text-zinc-600">
            {done ? `${thisWeek - goal} fazla` : `${goal - thisWeek} commit kaldi`}
          </p>
        </div>
      )}

      {showHistory && historyWithCurrent.length > 1 && (
        <div className="border-t border-zinc-800 pt-3 mt-3 space-y-2 shrink-0">
          <p className="text-[10px] text-zinc-600">Son {historyWithCurrent.length} Hafta</p>
          <div className="flex items-end gap-0.5 h-14">
            {historyWithCurrent.map((h, i) => {
              const isLast = i === historyWithCurrent.length - 1;
              const pctH = (h.actual / histMax) * 100;
              const achieved = h.actual >= h.goal;
              return (
                <div key={h.week_start} className="flex-1" title={`${formatWeek(h.week_start)}: ${h.actual}/${h.goal}`}>
                  <div className="w-full flex flex-col justify-end h-14">
                    <div
                      className="w-full rounded-t-sm transition-all"
                      style={{
                        height: `${Math.max(pctH, h.actual > 0 ? 6 : 2)}%`,
                        backgroundColor: achieved
                          ? isLast ? theme.accent : theme.accentMid
                          : isLast ? "#52525b" : "#3f3f46",
                        opacity: isLast ? 1 : 0.7,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
