"use client";

import type { ReactNode } from "react";
import { WidgetSlotProvider, shapeOf } from "@/components/ui/widget-size";
import { DEFAULT_WIDGET_CONFIGS, MOBILE_DIMS, getWidgetLabel, type WidgetId } from "@/lib/widget-config";
import { useUIPrefs } from "@/components/ui-prefs";
import { DENSITY_GRID } from "@/lib/ui/prefs";
import type { DashboardData } from "@/app/dashboard/types";
import { StatCommits, StatRepos, StatLangs, LangDist } from "@/app/dashboard/stat-cards";
import WeekCompare from "@/app/dashboard/week-compare";
import StreakCard from "@/app/dashboard/streak-card";
import GoalTracker from "@/app/dashboard/goal-tracker";
import InsightCards from "@/app/dashboard/insight-cards";
import BadgeCollection from "@/app/dashboard/badge-collection";
import CodeStats from "@/app/dashboard/code-stats";
import CompareView from "@/app/dashboard/compare-view";
import VelocityChart from "@/app/dashboard/velocity-chart";
import LangEvolution from "@/app/dashboard/lang-evolution";
import ContributionHeatmap from "@/app/dashboard/contribution-heatmap";
import ActivityChart from "@/app/dashboard/activity-chart";
import RhythmAnalysis from "@/app/dashboard/rhythm-analysis";
import CommitQuality from "@/app/dashboard/commit-quality";
import HourHeatmap from "@/app/dashboard/hour-heatmap";
import RepoList from "@/app/dashboard/repo-list";
import RepoHealthList from "@/app/dashboard/repo-health-list";
import ProfileViewsCard from "@/app/dashboard/profile-views-card";
import DeveloperCard from "@/app/dashboard/developer-card";
import DeveloperDNACard from "@/app/dashboard/developer-dna";
import PercentileRankCard from "@/app/dashboard/percentile-rank";
import AdvancedGoalsCard from "@/app/dashboard/advanced-goals";
import FollowFeed from "@/app/dashboard/follow-feed";

function render(id: WidgetId, d: DashboardData): ReactNode {
  switch (id) {
    case "stat-commits": return <StatCommits count={d.stats.commitCount} prev={d.stats.prevCommitCount} range={d.dateRange} daily={d.heatmapData} />;
    case "streak": return <StreakCard streak={d.streak} heatmap={d.heatmapData} status={d.streakStatus} todayCommits={d.todayCommits} />;
    case "week-compare": return <WeekCompare current={d.weekDays.current} previous={d.weekDays.previous} />;
    case "goal": return <GoalTracker thisWeek={d.thisWeek} initialGoal={d.weeklyGoal} history={d.goalHistory} weekDays={d.weekDays.current} />;
    case "heatmap": return <ContributionHeatmap data={d.heatmapData} streak={d.streak} />;
    case "activity-bar": return <ActivityChart data={d.recentActivity} />;
    case "lang-dist": return <LangDist languages={d.topLanguages} />;
    case "stat-repos": return <StatRepos stats={d.stats} />;
    case "stat-langs": return <StatLangs count={d.stats.languageCount} languages={d.topLanguages} />;
    case "insights": return <InsightCards insights={d.insights} />;
    case "velocity": return <VelocityChart data={d.heatmapData} />;
    case "rhythm": return <RhythmAnalysis hourData={d.hourData} commitTimestamps={d.commitTimestamps} />;
    case "hour-heatmap": return <HourHeatmap data={d.hourData} />;
    case "commit-quality": return <CommitQuality data={d.commitQuality} />;
    case "code-stats": return <CodeStats {...d.codeStats} />;
    case "lang-evolution": return <LangEvolution data={d.langEvolution.data} languages={d.langEvolution.keys} />;
    case "month-compare": return <CompareView thisMonth={d.thisMonth} lastMonth={d.lastMonth} />;
    case "repo-list": return <RepoList repos={d.repoList} />;
    case "repo-health": return <RepoHealthList repos={d.repoHealth} />;
    case "badges": return <BadgeCollection badges={d.badges} />;
    case "developer-dna": return <DeveloperDNACard dna={d.developerDna} username={d.username} />;
    case "percentile-rank": return <PercentileRankCard data={d.percentile} />;
    case "advanced-goals": return <AdvancedGoalsCard goals={d.userGoals} achievements={d.goalAchievements} metrics={d.goalMetrics} />;
    case "follow-feed": return <FollowFeed />;
    case "profile-views": return <ProfileViewsCard thisWeek={d.profileViews.thisWeek} total={d.profileViews.total} username={d.username} />;
    case "developer-card": return <DeveloperCard username={d.username} />;
  }
}

const SIZES: [number, number][] = [
  [1, 1],
  [2, 1],
  [4, 1],
  [1, 2],
  [2, 2],
  [4, 2],
  [1, 3],
  [2, 3],
  [3, 3],
];

/** Every card at every size it allows. ?only=heatmap,streak&mobile=1 */
export default function Gallery({ data, only, mobile }: { data: DashboardData; only?: string[]; mobile?: boolean }) {
  const { prefs } = useUIPrefs();
  const { cell, gap } = DENSITY_GRID[prefs.density];
  const col = 300;
  const mcol = 166;
  const cfgs = DEFAULT_WIDGET_CONFIGS.filter((c) => !only || only.includes(c.id));
  return (
    <div className="flex flex-col gap-10 p-6">
      {cfgs.map((c) => (
        <section key={c.id}>
          <h2 className="mb-3 font-mono text-[13px] text-ink-3">
            {c.id} <span className="text-ink-4">· {getWidgetLabel(c.id, "tr")}</span>
          </h2>
          <div className="flex flex-wrap items-start gap-4">
            {mobile
              ? c.mobileSizes.map((s) => {
                  const m = MOBILE_DIMS[s];
                  return (
                    <figure key={s} className="flex flex-col gap-1">
                      <figcaption className="font-mono text-[11px] text-ink-4">{s}</figcaption>
                      <div style={{ width: m.w * mcol + (m.w - 1) * gap, height: m.h * mcol + (m.h - 1) * gap }}>
                        <WidgetSlotProvider value={{ w: m.w, h: m.h, mobile: true }}>{render(c.id, data)}</WidgetSlotProvider>
                      </div>
                    </figure>
                  );
                })
              : SIZES.filter(([w, h]) => w >= c.minCol && w <= c.maxCol && h >= c.minRow && h <= c.maxRow).map(([w, h]) => (
                  <figure key={`${w}x${h}`} className="flex flex-col gap-1">
                    <figcaption className="font-mono text-[11px] text-ink-4">
                      {w}×{h} · {shapeOf(w, h)}
                    </figcaption>
                    <div style={{ width: w * col + (w - 1) * gap, height: h * cell + (h - 1) * gap }}>
                      <WidgetSlotProvider value={{ w, h, mobile: false }}>{render(c.id, data)}</WidgetSlotProvider>
                    </div>
                  </figure>
                ))}
          </div>
        </section>
      ))}
    </div>
  );
}
