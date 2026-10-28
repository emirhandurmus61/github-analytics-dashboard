import { notFound } from "next/navigation";
import ShellClient from "@/components/shell/shell-client";
import SettingsForm from "@/app/dashboard/settings/settings-form";

// Dev-only: settings with sample values.
export default function DevSettings() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <ShellClient user={{ username: "devboard-demo", name: "Demo Developer", avatarUrl: null }} status={{ streak: 18, weekCommits: 12, todayCommits: 1 }} lastSyncedAt={new Date().toISOString()} year={new Date().getFullYear()}>
      <SettingsForm
        bio="Building developer tools. Rust and TypeScript."
        pinnedRepo="devboard"
        pinnedRepos={["devboard", "tiny-kv"]}
        profileReadme={"## Hi\nI build things."}
        githubReadme={null}
        readmeSource="custom"
        widgets={{ heatmap: true, languages: true, repos: true, streak: true }}
        widgetOrder={["streak", "heatmap", "languages", "repos"]}
        repos={[{ name: "devboard" }, { name: "tiny-kv" }, { name: "gh-pulse" }]}
        username="devboard-demo"
        badgeUrl="http://localhost:3123/api/badge/devboard-demo"
        currentTheme="emerald"
        currentlyWorkingOn="A new overview grid"
        yearlyGoal="Ship 1,000 commits"
        techTags={["TypeScript", "Rust"]}
        socialTwitter="devboard"
        socialLinkedin={null}
        socialWebsite="https://example.com"
        socialDiscord={null}
        leaderboardOptIn={true}
      />
    </ShellClient>
  );
}
