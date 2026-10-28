"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Pencil, GitFork, RefreshCw, Check, CircleDashed, Link2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useShell } from "@/components/shell/shell-context";
import { PageHeader } from "@/components/ui/page-header";
import { Kbd, Seg } from "@/components/ui/primitives";
import { cn, fmtInt, timeAgo, type Lang } from "@/lib/ui/format";
import { DEFAULT_WIDGET_CONFIGS } from "@/lib/widget-config";
import GridLayout, { SortableWidget } from "./grid-layout";
import StreakGuard from "./streak-guard";
import type { DashboardData, DateRange } from "./types";

import { StatCommits, StatRepos, StatLangs, LangDist } from "./stat-cards";
import WeekCompare from "./week-compare";
import StreakCard from "./streak-card";
import GoalTracker from "./goal-tracker";
import InsightCards from "./insight-cards";
import BadgeCollection from "./badge-collection";
import CodeStats from "./code-stats";
import CompareView from "./compare-view";
import VelocityChart from "./velocity-chart";
import LangEvolution from "./lang-evolution";
import ContributionHeatmap from "./contribution-heatmap";
import ActivityChart from "./activity-chart";
import RhythmAnalysis from "./rhythm-analysis";
import CommitQuality from "./commit-quality";
import HourHeatmap from "./hour-heatmap";
import RepoList from "./repo-list";
import RepoHealthList from "./repo-health-list";
import ProfileViewsCard from "./profile-views-card";
import DeveloperCard from "./developer-card";
import DeveloperDNACard from "./developer-dna";
import PercentileRankCard from "./percentile-rank";
import AdvancedGoalsCard from "./advanced-goals";
import FollowFeed from "./follow-feed";

const RANGE_LABEL: Record<DateRange, { tr: string; en: string; flag: string }> = {
  "30": { tr: "30g", en: "30d", flag: "30d" },
  "90": { tr: "90g", en: "90d", flag: "90d" },
  "365": { tr: "1y", en: "1y", flag: "1y" },
};

function useQueryNav() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const set = (key: string, value: string) => {
    const p = new URLSearchParams(params.toString());
    p.set(key, value);
    start(() => router.push(`${pathname}?${p.toString()}`, { scroll: false }));
  };
  return { set, pending };
}

export default function DashboardView({ data, initialCompact }: { data: DashboardData; initialCompact: boolean }) {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const { editing, setEditing, sync, startSync } = useShell();
  const q = useQueryNav();

  const subtitle = data.hasSynced
    ? l === "en"
      ? `${fmtInt(data.stats.commitCount, l)} commits in range · ${data.streak.currentStreak}-day streak · synced ${timeAgo(sync.lastSyncedAt ?? data.lastSyncedAt, l)}`
      : `Aralıkta ${fmtInt(data.stats.commitCount, l)} commit · ${data.streak.currentStreak} günlük seri · ${timeAgo(sync.lastSyncedAt ?? data.lastSyncedAt, l)} senkronlandı`
    : l === "en"
      ? "Connect your GitHub history to fill the board"
      : "Panoyu doldurmak için GitHub geçmişini çek";

  const actions = data.hasSynced ? (
    <>
      <Seg
        label={l === "en" ? "Date range" : "Tarih aralığı"}
        value={data.dateRange}
        onChange={(v) => q.set("range", v)}
        options={(["30", "90", "365"] as DateRange[]).map((r) => ({ value: r, label: <span className="font-mono">{RANGE_LABEL[r][l]}</span> }))}
      />
      <button
        type="button"
        className={cn("btn btn-sm", data.hideForks && "!border-accent !text-accent")}
        aria-pressed={data.hideForks}
        onClick={() => q.set("hideForks", data.hideForks ? "0" : "1")}
        title={l === "en" ? "Exclude forked repositories" : "Fork repoları hariç tut"}
      >
        <GitFork />
        {l === "en" ? "Hide forks" : "Fork'ları gizle"}
      </button>
      <button
        type="button"
        className={cn("btn btn-sm hidden min-[360px]:inline-flex", editing && "btn-primary")}
        onClick={() => setEditing((v) => !v)}
        aria-pressed={editing}
      >
        {editing ? <Check /> : <Pencil />}
        {editing ? (l === "en" ? "Done" : "Bitti") : l === "en" ? "Customize" : "Düzenle"}
        {!editing && <Kbd className="hidden lg:inline-flex ml-0.5">E</Kbd>}
      </button>
    </>
  ) : null;

  return (
    <div className={cn(q.pending && "opacity-70 transition-opacity")}>
      <PageHeader
        title={l === "en" ? "Overview" : "Genel bakış"}
        command={`overview --range=${RANGE_LABEL[data.dateRange].flag}${data.hideForks ? " --no-forks" : ""}`}
        subtitle={subtitle}
        actions={actions}
      />

      {!data.hasSynced ? (
        <FirstSync lang={l} syncing={sync.status === "syncing"} message={sync.message} current={sync.current} total={sync.total} onStart={() => startSync()} />
      ) : (
        <>
          <StreakGuard
            status={data.streakStatus}
            currentStreak={data.streak.currentStreak}
            brokenStreak={data.streak.brokenStreak}
            previousRecord={data.streak.previousRecord}
            todayBadges={data.todayBadges}
          />
          <GridLayout widgetIds={DEFAULT_WIDGET_CONFIGS.map((c) => c.id)} initialCompact={initialCompact}>
            <SortableWidget id="stat-commits">
              <StatCommits count={data.stats.commitCount} prev={data.stats.prevCommitCount} range={data.dateRange} daily={data.heatmapData} />
            </SortableWidget>
            <SortableWidget id="streak">
              <StreakCard streak={data.streak} heatmap={data.heatmapData} status={data.streakStatus} todayCommits={data.todayCommits} />
            </SortableWidget>
            <SortableWidget id="week-compare">
              <WeekCompare current={data.weekDays.current} previous={data.weekDays.previous} />
            </SortableWidget>
            <SortableWidget id="goal">
              <GoalTracker thisWeek={data.thisWeek} initialGoal={data.weeklyGoal} history={data.goalHistory} weekDays={data.weekDays.current} />
            </SortableWidget>
            <SortableWidget id="heatmap">
              <ContributionHeatmap data={data.heatmapData} streak={data.streak} />
            </SortableWidget>
            <SortableWidget id="activity-bar">
              <ActivityChart data={data.recentActivity} />
            </SortableWidget>
            <SortableWidget id="lang-dist">
              <LangDist languages={data.topLanguages} />
            </SortableWidget>
            <SortableWidget id="stat-repos">
              <StatRepos stats={data.stats} />
            </SortableWidget>
            <SortableWidget id="stat-langs">
              <StatLangs count={data.stats.languageCount} languages={data.topLanguages} />
            </SortableWidget>
            <SortableWidget id="insights">
              <InsightCards insights={data.insights} />
            </SortableWidget>
            <SortableWidget id="velocity">
              <VelocityChart data={data.heatmapData} />
            </SortableWidget>
            <SortableWidget id="rhythm">
              <RhythmAnalysis hourData={data.hourData} commitTimestamps={data.commitTimestamps} />
            </SortableWidget>
            <SortableWidget id="hour-heatmap">
              <HourHeatmap data={data.hourData} />
            </SortableWidget>
            <SortableWidget id="commit-quality">
              <CommitQuality data={data.commitQuality} />
            </SortableWidget>
            <SortableWidget id="code-stats">
              <CodeStats {...data.codeStats} />
            </SortableWidget>
            <SortableWidget id="lang-evolution">
              <LangEvolution data={data.langEvolution.data} languages={data.langEvolution.keys} />
            </SortableWidget>
            <SortableWidget id="month-compare">
              <CompareView thisMonth={data.thisMonth} lastMonth={data.lastMonth} />
            </SortableWidget>
            <SortableWidget id="repo-list">
              <RepoList repos={data.repoList} />
            </SortableWidget>
            <SortableWidget id="repo-health">
              <RepoHealthList repos={data.repoHealth} />
            </SortableWidget>
            <SortableWidget id="badges">
              <BadgeCollection badges={data.badges} />
            </SortableWidget>
            <SortableWidget id="developer-dna">
              <DeveloperDNACard dna={data.developerDna} username={data.username} />
            </SortableWidget>
            <SortableWidget id="percentile-rank">
              <PercentileRankCard data={data.percentile} />
            </SortableWidget>
            <SortableWidget id="advanced-goals">
              <AdvancedGoalsCard goals={data.userGoals} achievements={data.goalAchievements} metrics={data.goalMetrics} />
            </SortableWidget>
            <SortableWidget id="follow-feed">
              <FollowFeed />
            </SortableWidget>
            <SortableWidget id="profile-views">
              <ProfileViewsCard thisWeek={data.profileViews.thisWeek} total={data.profileViews.total} username={data.username} />
            </SortableWidget>
            <SortableWidget id="developer-card">
              <DeveloperCard username={data.username} />
            </SortableWidget>
          </GridLayout>
        </>
      )}
    </div>
  );
}

/* First run: a three-step checklist instead of an empty board. */
function FirstSync({
  lang,
  syncing,
  message,
  current,
  total,
  onStart,
}: {
  lang: Lang;
  syncing: boolean;
  message: string | null;
  current?: number;
  total?: number;
  onStart: () => void;
}) {
  const en = lang === "en";
  const steps = [
    { done: true, title: en ? "GitHub account connected" : "GitHub hesabı bağlandı", hint: en ? "Read-only access to your public activity." : "Herkese açık aktiviten için salt okunur erişim." },
    {
      done: false,
      active: true,
      title: en ? "Pull repositories, commits and languages" : "Repoları, commitleri ve dilleri çek",
      hint: en ? "Usually under a minute. Large accounts take longer." : "Genelde bir dakikadan kısa sürer. Büyük hesaplarda biraz uzar.",
    },
    { done: false, title: en ? "Arrange your board" : "Panonu düzenle", hint: en ? "Drag, resize and hide cards. Press E any time." : "Kartları sürükle, boyutlandır, gizle. İstediğin an E'ye bas." },
  ];
  const pct = total ? Math.round(((current ?? 0) / total) * 100) : null;
  return (
    <div className="panel max-w-2xl !h-auto" data-headless>
      <div className="panel-body !p-6 sm:!p-8">
        <div className="flex items-center gap-2 text-ink-3 text-[12.5px] font-mono">
          <Link2 size={14} /> {en ? "first run" : "ilk kurulum"}
        </div>
        <h2 className="mt-2 text-[20px] font-[680] tracking-[-0.02em] text-ink">
          {en ? "Your board is empty until the first sync" : "İlk senkrona kadar panon boş"}
        </h2>
        <ol className="mt-5 flex flex-col gap-3">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span
                className={cn(
                  "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border text-[11px] font-mono",
                  s.done ? "border-good bg-good text-on-accent" : s.active ? "border-accent text-accent" : "border-line-strong text-ink-4",
                )}
              >
                {s.done ? <Check size={12} strokeWidth={3} /> : s.active && syncing ? <CircleDashed size={12} className="animate-spin" /> : i + 1}
              </span>
              <div>
                <p className={cn("text-[14px] font-medium", s.done || s.active ? "text-ink" : "text-ink-3")}>{s.title}</p>
                <p className="text-[12.5px] text-ink-3">{s.hint}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-primary btn-lg" onClick={onStart} disabled={syncing}>
            <RefreshCw className={cn(syncing && "animate-spin")} />
            {syncing ? (en ? "Syncing…" : "Senkronize ediliyor…") : en ? "Start first sync" : "İlk senkronu başlat"}
          </button>
          {syncing && (
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[12px] text-ink-3 truncate">{message}</p>
              {pct !== null && (
                <div className="track mt-1.5">
                  <i style={{ width: `${pct}%` }} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
