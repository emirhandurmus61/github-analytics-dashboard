import { notFound } from "next/navigation";
import ShellClient from "@/components/shell/shell-client";
import { ThemeProvider } from "@/components/theme-provider";
import WrappedClient from "@/app/u/[username]/[year]/wrapped-client";
import { mockDashboard } from "@/lib/demo-data";

// Dev-only: Wrapped with sample data.
export default function DevWrapped() {
  if (process.env.NODE_ENV === "production") notFound();
  const d = mockDashboard("tr");
  const year = new Date().getFullYear();
  const monthly = Array.from({ length: 12 }, (_, i) => ({
    month: String(i),
    commits: d.heatmapData.filter((x) => new Date(x.date).getFullYear() === year && new Date(x.date).getMonth() === i).reduce((s, x) => s + x.commit_count, 0),
  }));
  const peak = monthly.reduce((a, m, i, arr) => (m.commits > arr[a].commits ? i : a), 0);
  const total = d.topLanguages.reduce((s, x) => s + x.bytes, 0);
  return (
    <ShellClient user={{ username: "devboard-demo", name: "Demo Developer", avatarUrl: null }} status={{ streak: 18, weekCommits: 12, todayCommits: 1 }} lastSyncedAt={new Date().toISOString()} year={year} bleed>
      <ThemeProvider accent="orange">
        <WrappedClient
          data={{
            username: "ada-dev",
            year,
            displayName: "Ada Yılmaz",
            avatarUrl: null,
            totalCommits: 1284,
            totalLinesAdded: 184320,
            totalLinesDeleted: 61904,
            activeDays: 212,
            longestStreak: 23,
            peakMonthIdx: peak,
            peakMonth: "",
            peakMonthCommits: monthly[peak].commits,
            peakDayIdx: 2,
            peakDay: "Çarşamba",
            peakHour: 23,
            topLangs: d.topLanguages.slice(0, 6).map((x) => ({ lang: x.language, bytes: x.bytes, pct: Math.round((x.bytes / total) * 100), color: "" })),
            biggestCommit: { message: "feat(grid): per-size layouts for every card", additions: 4812, deletions: 1930, date: `${year}-10-27` },
            reposCreated: 4,
            activeRepos: 9,
            topRepo: { name: "tiny-kv", fullName: "ada/tiny-kv", commits: 412, stars: 342, language: "Rust" },
            totalPRs: 41,
            mergedPRs: 37,
            totalStars: 689,
            archetype: { title: "Gece Mimarı", tagline: "Sistem tasarlıyor, gece yarısından sonra en iyi işini çıkarıyorsun.", badge: "NIGHT-ARCHITECT", desc: "", color: "#a78bfa", en: { title: "Night Architect", tagline: "You design systems and do your best work after midnight.", badge: "NIGHT-ARCHITECT", desc: "" } },
            identity: { label: "Gece kuşu", emoji: "" },
            monthlyData: monthly,
            accentColor: "#fb923c",
            accentBg: "",
            accentBorder: "",
            accentShades: ["", "", "", ""],
            heatmapDates: Object.fromEntries(d.heatmapData.map((x) => [x.date, x.commit_count])),
            maxDayCount: Math.max(...d.heatmapData.map((x) => x.commit_count)),
            issuesOpened: 12,
            issuesClosed: 9,
          }}
        />
      </ThemeProvider>
    </ShellClient>
  );
}
