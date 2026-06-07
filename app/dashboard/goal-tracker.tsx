"use client";

import { useState, useEffect } from "react";

const GOALS = [5, 10, 20, 30, 50];

export default function GoalTracker({ thisWeek }: { thisWeek: number }) {
  const [goal, setGoal] = useState<number>(20);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("weekly-commit-goal");
    if (saved) setGoal(Number(saved));
  }, []);

  function saveGoal(value: number) {
    setGoal(value);
    localStorage.setItem("weekly-commit-goal", String(value));
    setEditing(false);
  }

  const pct = Math.min(Math.round((thisWeek / goal) * 100), 100);
  const done = thisWeek >= goal;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-400">Haftalık Hedef</h2>
        <button
          onClick={() => { setEditing(!editing); setInput(String(goal)); }}
          className="text-xs text-zinc-600 transition-colors hover:text-zinc-400"
        >
          Düzenle
        </button>
      </div>

      {editing ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <button
                key={g}
                onClick={() => saveGoal(g)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  g === goal
                    ? "bg-zinc-100 text-zinc-900"
                    : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {g} commit
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Özel hedef..."
              className="w-32 rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200 outline-none ring-1 ring-zinc-700 focus:ring-zinc-500"
            />
            <button
              onClick={() => { const v = parseInt(input); if (v > 0) saveGoal(v); }}
              className="rounded-lg bg-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-600"
            >
              Kaydet
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <span className={`text-4xl font-bold ${done ? "text-emerald-400" : "text-zinc-100"}`}>
                {thisWeek}
              </span>
              <span className="ml-1 text-zinc-600">/ {goal} commit</span>
            </div>
            {done && (
              <span className="text-sm font-medium text-emerald-400">
                Hedef tamamlandı! 🎉
              </span>
            )}
          </div>

          <div className="relative h-3 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                done ? "bg-emerald-400" : pct >= 70 ? "bg-blue-400" : "bg-zinc-500"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>

          <p className="text-xs text-zinc-600">
            {done
              ? `${thisWeek - goal} commit hedefin üzerinde`
              : `Hedefe ulaşmak için ${goal - thisWeek} commit daha`}
          </p>
        </div>
      )}
    </div>
  );
}
