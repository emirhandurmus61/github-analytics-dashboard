"use client";

import { useState, useTransition } from "react";
import { useThemeColors } from "@/components/theme-provider";
import { saveWeeklyGoal } from "@/app/dashboard/settings/actions";

const GOALS = [5, 10, 20, 30, 50];

type WeekHistory = {
  week_start: string;
  goal: number;
  actual: number;
};

type Props = {
  thisWeek: number;
  initialGoal: number;
  history: WeekHistory[];
};

const MONTH_SHORT = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];

function formatWeek(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
}

export default function GoalTracker({ thisWeek, initialGoal, history }: Props) {
  const theme = useThemeColors();
  const [goal, setGoal] = useState(initialGoal);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave(value: number) {
    const v = Math.max(1, Math.min(500, value));
    setGoal(v);
    setEditing(false);
    startTransition(async () => {
      await saveWeeklyGoal(v);
    });
  }

  const pct = Math.min(Math.round((thisWeek / goal) * 100), 100);
  const done = thisWeek >= goal;
  const nearDone = pct >= 70;
  const barColor = done ? theme.accent : nearDone ? theme.accentMid : "#52525b";

  // Geçmiş: bu haftanın datasını history'den güncelle (henüz DB'ye yazılmadıysa)
  const historyWithCurrent = (() => {
    const today = new Date();
    const dayOfWeek = (today.getDay() + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek);
    const thisWeekStart = monday.toISOString().slice(0, 10);

    const hasThisWeek = history.some((h) => h.week_start === thisWeekStart);
    const base = hasThisWeek
      ? history.map((h) =>
          h.week_start === thisWeekStart ? { ...h, actual: thisWeek, goal } : h
        )
      : [{ week_start: thisWeekStart, actual: thisWeek, goal }, ...history];

    return base.slice(0, 12).reverse(); // eskiden yeniye
  })();

  const histMax = Math.max(...historyWithCurrent.map((h) => Math.max(h.actual, h.goal)), 1);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-400">Haftalık Hedef</h2>
        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={() => setShowHistory((v) => !v)}
              className="text-xs text-zinc-600 transition-colors hover:text-zinc-400"
            >
              {showHistory ? "Gizle" : "Geçmiş"}
            </button>
          )}
          <button
            onClick={() => { setEditing(!editing); setInput(String(goal)); }}
            className="text-xs text-zinc-600 transition-colors hover:text-zinc-400"
          >
            {editing ? "İptal" : "Düzenle"}
          </button>
        </div>
      </div>

      {/* Düzenleme modu */}
      {editing ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {GOALS.map((g) => (
              <button
                key={g}
                onClick={() => handleSave(g)}
                className="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                style={
                  g === goal
                    ? { backgroundColor: theme.accent, color: "#09090b" }
                    : { color: "#a1a1aa" }
                }
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
              onClick={() => { const v = parseInt(input); if (v > 0) handleSave(v); }}
              disabled={isPending}
              className="rounded-lg bg-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-600 disabled:opacity-50"
            >
              {isPending ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <span
                className="text-4xl font-bold"
                style={{ color: done ? theme.accent : "#f4f4f5" }}
              >
                {thisWeek}
              </span>
              <span className="ml-1 text-zinc-600">/ {goal} commit</span>
            </div>
            {done && (
              <span className="text-sm font-medium" style={{ color: theme.accent }}>
                Hedef tamamlandı! 🎉
              </span>
            )}
          </div>

          <div className="relative h-3 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, backgroundColor: barColor }}
            />
          </div>

          <p className="text-xs text-zinc-600">
            {done
              ? `${thisWeek - goal} commit hedefin üzerinde`
              : `Hedefe ulaşmak için ${goal - thisWeek} commit daha`}
          </p>
        </div>
      )}

      {/* Geçmiş grafik */}
      {showHistory && historyWithCurrent.length > 1 && (
        <div className="border-t border-zinc-800 pt-4 space-y-2">
          <p className="text-xs text-zinc-500">Son {historyWithCurrent.length} Hafta</p>

          {/* Bar chart */}
          <div className="flex items-end gap-1 h-16">
            {historyWithCurrent.map((h, i) => {
              const isLast = i === historyWithCurrent.length - 1;
              const actualPct = (h.actual / histMax) * 100;
              const goalPct = (h.goal / histMax) * 100;
              const achieved = h.actual >= h.goal;

              return (
                <div
                  key={h.week_start}
                  className="flex-1 flex flex-col items-center gap-0.5"
                  title={`${formatWeek(h.week_start)}: ${h.actual}/${h.goal} commit`}
                >
                  {/* Actual bar */}
                  <div className="w-full flex flex-col justify-end" style={{ height: "100%" }}>
                    <div
                      className="w-full rounded-t-sm transition-all"
                      style={{
                        height: `${Math.max(actualPct, h.actual > 0 ? 4 : 1)}%`,
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

          {/* Tarih etiketleri */}
          <div className="flex">
            {historyWithCurrent.map((h, i) => {
              const isLast = i === historyWithCurrent.length - 1;
              return (
                <div key={h.week_start} className="flex-1 text-center">
                  {(i === 0 || i === historyWithCurrent.length - 1) && (
                    <span
                      className="text-xs"
                      style={{ color: isLast ? theme.accent : "#52525b", fontSize: 9 }}
                    >
                      {isLast ? "Bu hafta" : formatWeek(h.week_start)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Özet: kaçı tamamlandı */}
          {(() => {
            const past = historyWithCurrent.slice(0, -1); // bu haftayı sayma
            const achieved = past.filter((h) => h.actual >= h.goal).length;
            return past.length > 0 ? (
              <p className="text-xs text-zinc-600">
                Son {past.length} haftanın{" "}
                <span style={{ color: theme.accent }} className="font-medium">{achieved}</span>'inde
                hedefe ulaştın
              </p>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
}
