import { notFound } from "next/navigation";
import { cookies, headers } from "next/headers";
import ShellClient from "@/components/shell/shell-client";
import DashboardView from "@/app/dashboard/dashboard-view";
import type { Language } from "@/lib/i18n";
import { mockDashboard } from "@/lib/demo-data";

// Dev-only: the overview with sample data, for design review without a GitHub login.
export default async function PreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const store = await cookies();
  const lang: Language = store.get("devboard_lang")?.value === "en" ? "en" : "tr";
  const ua = (await headers()).get("user-agent") ?? "";
  const data = mockDashboard(lang);
  return (
    <ShellClient
      user={{ username: "devboard-demo", name: "Demo Developer", avatarUrl: null }}
      status={{ streak: data.streak.currentStreak, weekCommits: data.thisWeek, todayCommits: data.todayCommits }}
      lastSyncedAt={data.lastSyncedAt}
      year={new Date().getFullYear()}
    >
      <DashboardView data={data} initialCompact={/Mobi|Android|iPhone|iPod/i.test(ua)} />
    </ShellClient>
  );
}
