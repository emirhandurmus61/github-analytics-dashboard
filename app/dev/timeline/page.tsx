import { notFound } from "next/navigation";
import ShellClient from "@/components/shell/shell-client";
import TimelineClient from "@/app/dashboard/timeline/timeline-client";
import { mockCommits } from "@/lib/demo-data";

// Dev-only: timeline with sample commits.
export default function DevTimeline() {
  if (process.env.NODE_ENV === "production") notFound();
  const commits = mockCommits();
  return (
    <ShellClient user={{ username: "devboard-demo", name: "Demo Developer", avatarUrl: null }} status={{ streak: 18, weekCommits: 12, todayCommits: 1 }} lastSyncedAt={new Date().toISOString()} year={new Date().getFullYear()}>
      <TimelineClient commits={commits} repos={[...new Set(commits.map((c) => c.repo_name!))].sort()} languages={[...new Set(commits.map((c) => c.repo_language!))].sort()} username="devboard-demo" />
    </ShellClient>
  );
}
