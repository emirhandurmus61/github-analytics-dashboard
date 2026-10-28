"use client";

import { useState, useTransition } from "react";
import { Target, Pencil, Check, X } from "lucide-react";
import { saveWeeklyGoal } from "@/app/dashboard/settings/actions";
import { useLanguage } from "@/lib/i18n";
import { Panel } from "@/components/ui/primitives";
import { useWidgetSize } from "@/components/ui/widget-size";
import { MONTHS_SHORT, WEEKDAYS_MIN, cn, type Lang } from "@/lib/ui/format";

const PRESETS = [5, 10, 20, 30, 50];
type WeekHistory = { week_start: string; goal: number; actual: number };

export function Ring({ value, max, size = 64, stroke = 6, children, color = "var(--accent)" }: { value: number; max: number; size?: number; stroke?: number; children?: React.ReactNode; color?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = Math.min(1, max > 0 ? value / max : 0);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-3)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${(c * p).toFixed(2)} ${c.toFixed(2)}`}
          style={{ transition: "stroke-dasharray .6s cubic-bezier(.2,.8,.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}

export default function GoalTracker({
  thisWeek,
  initialGoal,
  history,
  weekDays,
}: {
  thisWeek: number;
  initialGoal: number;
  history: WeekHistory[];
  weekDays: number[];
}) {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const { shape, w, h } = useWidgetSize();
  const [goal, setGoal] = useState(initialGoal);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(String(initialGoal));
  const [pending, start] = useTransition();

  const save = (v: number) => {
    const g = Math.max(1, Math.min(500, Math.round(v)));
    setGoal(g);
    setEditing(false);
    start(async () => {
      await saveWeeklyGoal(g);
    });
  };

  const pct = Math.min(100, Math.round((thisWeek / goal) * 100));
  const done = thisWeek >= goal;
  const todayIdx = (new Date().getDay() + 6) % 7;
  const daysLeft = 7 - todayIdx;
  const remaining = Math.max(0, goal - thisWeek);
  const perDay = Math.ceil(remaining / daysLeft);

  const hist = (() => {
    const mon = new Date();
    mon.setDate(mon.getDate() - todayIdx);
    const ws = mon.toISOString().slice(0, 10);
    const base = history.some((x) => x.week_start === ws)
      ? history.map((x) => (x.week_start === ws ? { ...x, actual: thisWeek, goal } : x))
      : [{ week_start: ws, actual: thisWeek, goal }, ...history];
    return base.slice(0, 12).reverse();
  })();
  const hit = hist.filter((x) => x.actual >= x.goal).length;

  const status = done
    ? l === "en"
      ? `Goal met${thisWeek > goal ? `, +${thisWeek - goal} over` : ""}`
      : `Hedef tamam${thisWeek > goal ? `, +${thisWeek - goal} fazla` : ""}`
    : l === "en"
      ? `~${perDay}/day for the next ${daysLeft} ${daysLeft === 1 ? "day" : "days"}`
      : `${daysLeft} gün boyunca günde ~${perDay}`;

  const editBtn = (
    <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => setEditing((v) => !v)} aria-label={l === "en" ? "Change goal" : "Hedefi değiştir"} aria-expanded={editing}>
      {editing ? <X /> : <Pencil />}
    </button>
  );

  const editor = (
    <div className="flex h-full flex-col justify-center gap-2.5">
      <div className="text-[12px] text-ink-3">{l === "en" ? "Commits per week" : "Haftalık commit hedefi"}</div>
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button key={p} type="button" className={cn("btn btn-sm font-mono", p === goal && "btn-primary")} onClick={() => save(p)}>
            {p}
          </button>
        ))}
      </div>
      <form
        className="flex gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          const v = parseInt(input, 10);
          if (v > 0) save(v);
        }}
      >
        <input className="input !h-[26px] !w-20 font-mono" inputMode="numeric" value={input} onChange={(e) => setInput(e.target.value.replace(/\D/g, ""))} aria-label={l === "en" ? "Custom goal" : "Özel hedef"} />
        <button type="submit" className="btn btn-sm" disabled={pending}>
          <Check /> {l === "en" ? "Save" : "Kaydet"}
        </button>
      </form>
    </div>
  );

  const center = (
    <div className="text-center leading-none">
      <div className="figure text-[15px]">{fmtPctShort(pct)}</div>
    </div>
  );

  const histMax = Math.max(...hist.map((x) => Math.max(x.actual, x.goal)), 1);
  const histChart = (height: number | "fill") => (
    <div className={cn(height === "fill" && "flex h-full flex-col")}>
      <div className={cn("flex items-end gap-[3px]", height === "fill" && "flex-1 min-h-0")} style={height === "fill" ? undefined : { height }}>
        {hist.map((x, i) => {
          const last = i === hist.length - 1;
          const ok = x.actual >= x.goal;
          return (
            <div key={x.week_start} className="relative flex h-full flex-1 items-end" title={`${x.week_start}: ${x.actual}/${x.goal}`}>
              <span className="absolute inset-x-0 border-t border-dashed border-ink-4" style={{ bottom: `${(x.goal / histMax) * 100}%` }} />
              <span
                className="w-full rounded-[2px]"
                style={{
                  height: `${x.actual ? Math.max(4, (x.actual / histMax) * 100) : 2}%`,
                  background: ok ? (last ? "var(--accent)" : "var(--accent-mid)") : last ? "var(--ink-3)" : "var(--line-2)",
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[10px] text-ink-4">
        <span>{labelWeek(hist[0]?.week_start, l)}</span>
        <span>{l === "en" ? `${hit}/${hist.length} weeks met` : `${hit}/${hist.length} hafta tuttu`}</span>
      </div>
    </div>
  );

  return (
    <Panel title={l === "en" ? "Weekly goal" : "Haftalık hedef"} icon={Target} meta={`${thisWeek}/${goal}`} actions={shape !== "glance" ? editBtn : undefined}>
      {editing && shape !== "glance" ? (
        editor
      ) : (
        <>
          {shape === "glance" && (
            <button type="button" className="flex h-full w-full items-center gap-3 text-left" onClick={() => setEditing((v) => !v)} title={l === "en" ? "Click to change the goal" : "Hedefi değiştirmek için tıkla"}>
              {editing ? (
                <div className="w-full">{editor}</div>
              ) : (
                <>
                  <Ring value={thisWeek} max={goal} size={62} stroke={6}>{center}</Ring>
                  <div className="min-w-0">
                    <div className="figure text-[24px] @min-[200px]:text-[28px]">
                      {thisWeek}
                      <span className="text-ink-4 text-[15px] font-normal"> /{goal}</span>
                    </div>
                    <div className={cn("mt-1.5 text-[11.5px] leading-snug", done ? "text-good" : "text-ink-3")}>{done ? (l === "en" ? "Goal met" : "Hedef tamam") : `${remaining} ${l === "en" ? "to go" : "kaldı"}`}</div>
                  </div>
                </>
              )}
            </button>
          )}

          {shape === "strip" && (
            <div className="flex h-full items-center gap-5">
              <Ring value={thisWeek} max={goal} size={88} stroke={8}>
                <div className="figure text-[20px]">{fmtPctShort(pct)}</div>
              </Ring>
              <div className="min-w-0 flex-1">
                <div className="figure text-[30px]">
                  {thisWeek}
                  <span className="text-ink-4 text-[17px] font-normal"> / {goal}</span>
                </div>
                <div className={cn("mt-2 text-[12.5px]", done ? "text-good" : "text-ink-3")}>{status}</div>
                
              </div>
              {w >= 2 && <div className="hidden @min-[520px]:block w-[38%]">{histChart(64)}</div>}
            </div>
          )}

          {(shape === "column" || shape === "block") && (
            <div className="flex h-full flex-col gap-3">
              <div className="flex items-center gap-4">
                <Ring value={thisWeek} max={goal} size={shape === "block" && h >= 2 ? 104 : 84} stroke={9}>
                  <div className="text-center">
                    <div className="figure text-[22px]">{thisWeek}</div>
                    <div className="font-mono text-[10.5px] text-ink-4 mt-0.5">/ {goal}</div>
                  </div>
                </Ring>
                <div className="min-w-0">
                  <div className={cn("text-[13px] font-medium", done ? "text-good" : "text-ink")}>{done ? (l === "en" ? "Goal met" : "Hedef tamam") : `${remaining} ${l === "en" ? "commits to go" : "commit kaldı"}`}</div>
                  <div className="mt-1 text-[12px] text-ink-3">{status}</div>
                </div>
              </div>
              {shape === "block" && <MiniWeek days={weekDays} today={todayIdx} labels={WEEKDAYS_MIN[l]} />}
              <div className="flex-1 min-h-[56px]">{histChart("fill")}</div>
            </div>
          )}
        </>
      )}
    </Panel>
  );
}

function MiniWeek({ days, today, labels }: { days: number[]; today: number; labels: string[] }) {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <span
            className={cn("grid h-7 w-full place-items-center rounded-[var(--r-control)] font-mono text-[11px] num", i === today && "ring-1 ring-accent")}
            style={{ background: i > today ? "transparent" : d ? `color-mix(in oklab, var(--accent) ${Math.min(80, 25 + d * 8)}%, var(--bg-3))` : "var(--bg-3)", color: i > today ? "var(--ink-4)" : d ? "var(--ink-1)" : "var(--ink-4)", border: i > today ? "1px dashed var(--line-2)" : undefined }}
          >
            {i > today ? "" : d}
          </span>
          <span className={cn("font-mono text-[10px]", i === today ? "text-accent" : "text-ink-4")}>{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

function fmtPctShort(p: number) {
  return `${p}%`;
}

function labelWeek(ws: string | undefined, l: Lang) {
  if (!ws) return "";
  const d = new Date(ws + "T00:00:00");
  return l === "en" ? `${MONTHS_SHORT.en[d.getMonth()]} ${d.getDate()}` : `${d.getDate()} ${MONTHS_SHORT.tr[d.getMonth()]}`;
}
