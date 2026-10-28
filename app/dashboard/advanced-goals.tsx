"use client";

import { useState, useTransition } from "react";
import { ListChecks, CircleCheck, Lock, Plus, Trash2, Link2, CircleDashed, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Panel, Track } from "@/components/ui/primitives";
import { useWidgetSize } from "@/components/ui/widget-size";
import { calcGoalProgress, type UserGoal, type GoalType, type GoalProgress } from "@/lib/goals";
import { upsertGoal, deleteGoal } from "./advanced-goals/actions";
import { cn, type Lang } from "@/lib/ui/format";

const TYPES: GoalType[] = ["daily_commit", "weekly_pr", "monthly_active_days", "quarterly_new_repo"];

const META: Record<GoalType, { tr: string; en: string; unitTr: string; unitEn: string; presets: number[] }> = {
  daily_commit: { tr: "Bugün commit", en: "Commits today", unitTr: "commit", unitEn: "commits", presets: [1, 3, 5, 10] },
  weekly_pr: { tr: "Bu hafta PR", en: "PRs this week", unitTr: "PR", unitEn: "PRs", presets: [1, 2, 5, 10] },
  monthly_active_days: { tr: "Bu ay aktif gün", en: "Active days this month", unitTr: "gün", unitEn: "days", presets: [5, 10, 15, 20] },
  quarterly_new_repo: { tr: "Bu çeyrek yeni repo", en: "New repos this quarter", unitTr: "repo", unitEn: "repos", presets: [1, 2, 3, 5] },
};

function recentDays(n: number, on: Set<string>) {
  const now = Date.now();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now - (n - 1 - i) * 86400000).toISOString().slice(0, 10);
    return { d, on: on.has(d) };
  });
}

function StatusIcon({ s }: { s: GoalProgress["status"] }) {
  if (s === "completed") return <CircleCheck size={14} className="shrink-0 text-good" />;
  if (s === "locked") return <Lock size={13} className="shrink-0 text-ink-4" />;
  return <CircleDashed size={14} className="shrink-0 text-accent" />;
}

export default function AdvancedGoalsCard({
  goals: initial,
  achievements,
  metrics,
}: {
  goals: UserGoal[];
  achievements: string[];
  metrics: { todayCommits: number; weeklyPRs: number; monthlyActiveDays: number; quarterlyNewRepos: number };
}) {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const { shape, h } = useWidgetSize();
  const [goals, setGoals] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [type, setType] = useState<GoalType>("daily_commit");
  const [target, setTarget] = useState(1);
  const [chain, setChain] = useState(false);
  const [pending, start] = useTransition();
  const progress = calcGoalProgress(goals, metrics);
  const done = progress.filter((p) => p.status === "completed").length;
  const available = TYPES.filter((t) => !goals.some((g) => g.type === t));
  const title = l === "en" ? "Goal chain" : "Hedef zinciri";

  const add = () => {
    const chainOrder = chain ? goals.length : 0;
    start(async () => {
      const res = await upsertGoal(type, target, chainOrder);
      if (res.success) {
        setGoals((g) => [...g, { id: crypto.randomUUID(), type, target, chainOrder, completedAt: null, isActive: true }]);
        setAdding(false);
        setChain(false);
      }
    });
  };
  const remove = (id: string) =>
    start(async () => {
      await deleteGoal(id);
      setGoals((g) => g.filter((x) => x.id !== id));
    });

  const unit = (t: GoalType) => (l === "en" ? META[t].unitEn : META[t].unitTr);

  const form = (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-ink-2">{l === "en" ? "New goal" : "Yeni hedef"}</span>
        <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => setAdding(false)} aria-label={l === "en" ? "Cancel" : "Vazgeç"}>
          <X />
        </button>
      </div>
      {available.length === 0 ? (
        <p className="text-[12px] text-ink-3">{l === "en" ? "Every goal type is in use." : "Tüm hedef türleri kullanımda."}</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5">
            {available.map((t) => (
              <button key={t} type="button" aria-pressed={type === t} className={cn("btn btn-sm", type === t && "!border-accent !text-accent")} onClick={() => { setType(t); setTarget(META[t].presets[0]); }}>
                {META[t][l]}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {META[type].presets.map((p) => (
              <button key={p} type="button" className={cn("btn btn-sm font-mono", target === p && "btn-primary")} onClick={() => setTarget(p)}>
                {p}
              </button>
            ))}
            <input className="input !h-[26px] !w-16 font-mono" inputMode="numeric" value={target} onChange={(e) => setTarget(Math.max(1, parseInt(e.target.value.replace(/\D/g, "")) || 1))} aria-label={l === "en" ? "Target" : "Hedef"} />
            <span className="text-[12px] text-ink-3">{unit(type)}</span>
          </div>
          {goals.length > 0 && (
            <label className="flex items-center gap-2 text-[12px] text-ink-3 cursor-pointer select-none">
              <input type="checkbox" checked={chain} onChange={(e) => setChain(e.target.checked)} className="accent-[var(--accent)]" />
              {l === "en" ? "Unlock after the previous goal (chain)" : "Önceki hedef bitince aç (zincir)"}
            </label>
          )}
          <button type="button" className="btn btn-primary btn-sm self-start" disabled={pending} onClick={add}>
            <Plus /> {l === "en" ? "Add goal" : "Hedef ekle"}
          </button>
        </>
      )}
    </div>
  );

  const list = (compact?: boolean) => (
    <ul className="flex flex-col">
      {progress.map((p, i) => {
        const locked = p.status === "locked";
        return (
          <li key={p.goal.id} className={cn("group relative py-2", i > 0 && "border-t border-line", locked && "opacity-55")}>
            {p.goal.chainOrder > 0 && i > 0 && <span className="absolute left-[6.5px] -top-2 h-3 w-px bg-line-strong" aria-hidden />}
            <div className="flex items-center gap-2">
              <StatusIcon s={p.status} />
              <span className="truncate text-[12.5px] text-ink">{META[p.goal.type][l]}</span>
              {p.goal.chainOrder > 0 && <Link2 size={11} className="shrink-0 text-ink-4" />}
              <span className="ml-auto font-mono text-[12px] text-ink num">
                {p.current}/{p.goal.target}
              </span>
              {!locked && !compact && (
                <button type="button" onClick={() => remove(p.goal.id)} className="btn btn-ghost btn-sm btn-icon opacity-0 group-hover:opacity-100 focus:opacity-100" aria-label={l === "en" ? "Delete goal" : "Hedefi sil"}>
                  <Trash2 />
                </button>
              )}
            </div>
            {!locked && <Track value={p.pct} color={p.status === "completed" ? "var(--hue-green)" : "var(--accent)"} height={4} className="mt-1.5 ml-[22px] !w-[calc(100%-22px)]" />}
          </li>
        );
      })}
    </ul>
  );

  const empty = (
    <div className="flex h-full flex-col items-start justify-center gap-2">
      <p className="text-[13px] text-ink-2">{l === "en" ? "No goals yet." : "Henüz hedef yok."}</p>
      <p className="text-[12px] text-ink-3">{l === "en" ? "Chain daily, weekly and monthly targets; each unlocks the next." : "Günlük, haftalık, aylık hedefleri zincirle; her biri sonrakini açar."}</p>
      <button type="button" className="btn btn-sm mt-1" onClick={() => setAdding(true)}>
        <Plus /> {l === "en" ? "Add the first goal" : "İlk hedefi ekle"}
      </button>
    </div>
  );

  // Last 28 days of completed goals.
  const days = recentDays(28, new Set(achievements));

  return (
    <Panel
      title={title}
      icon={ListChecks}
      meta={goals.length ? `${done}/${goals.length}` : undefined}
      actions={shape !== "glance" && goals.length > 0 && !adding ? (
        <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => setAdding(true)} aria-label={l === "en" ? "Add goal" : "Hedef ekle"}>
          <Plus />
        </button>
      ) : undefined}
    >
      {shape === "glance" ? (
        goals.length === 0 ? (
          <button type="button" className="flex h-full w-full flex-col items-start justify-center gap-1 text-left" onClick={() => setAdding(true)}>
            <span className="text-[13px] text-ink-2">{l === "en" ? "No goals" : "Hedef yok"}</span>
            <span className="inline-flex items-center gap-1 text-[12px] text-accent"><Plus size={12} />{l === "en" ? "Add one" : "Ekle"}</span>
          </button>
        ) : (
          <div className="flex h-full flex-col">
            <div className="figure text-[28px]">
              {done}
              <span className="text-[15px] font-normal text-ink-4">/{goals.length}</span>
            </div>
            <div className="mt-1.5 text-[11.5px] text-ink-3">{l === "en" ? "goals complete" : "hedef tamam"}</div>
            {progress.find((p) => p.status === "active") && (
              <div className="mt-auto">
                <div className="mb-1 truncate text-[11.5px] text-ink-2">{META[progress.find((p) => p.status === "active")!.goal.type][l]}</div>
                <Track value={progress.find((p) => p.status === "active")!.pct} height={4} />
              </div>
            )}
          </div>
        )
      ) : adding ? (
        form
      ) : goals.length === 0 ? (
        empty
      ) : shape === "strip" ? (
        <div className="grid h-full items-center gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(progress.length, 4)}, minmax(0,1fr))` }}>
          {progress.slice(0, 4).map((p) => (
            <div key={p.goal.id} className={cn("min-w-0", p.status === "locked" && "opacity-55")}>
              <div className="flex items-center gap-1.5 text-[12px]">
                <StatusIcon s={p.status} />
                <span className="truncate text-ink-2">{META[p.goal.type][l]}</span>
              </div>
              <div className="mt-1 font-mono text-[18px] font-semibold text-ink num">
                {p.current}
                <span className="text-[12px] font-normal text-ink-4">/{p.goal.target}</span>
              </div>
              <Track value={p.pct} color={p.status === "completed" ? "var(--hue-green)" : "var(--accent)"} height={4} className="mt-1" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex h-full flex-col gap-3">
          <div className="flex-1 min-h-0 overflow-y-auto">{list(shape === "column")}</div>
          {(shape === "block" && h >= 2) && achievements.length > 0 && (
            <div>
              <div className="mb-1.5 text-[11px] text-ink-4">{l === "en" ? "Goal days, last 4 weeks" : "Hedef tutulan günler, son 4 hafta"}</div>
              <div className="grid grid-cols-[repeat(28,minmax(0,1fr))] gap-[3px]">
                {days.map((x) => (
                  <span key={x.d} title={x.d} className="h-3 rounded-[2px]" style={{ background: x.on ? "var(--hue-green)" : "var(--bg-3)" }} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
