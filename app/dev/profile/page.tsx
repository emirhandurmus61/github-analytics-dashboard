import { notFound } from "next/navigation";
import ShellClient from "@/components/shell/shell-client";
import { ThemeProvider } from "@/components/theme-provider";
import ProfileClient from "@/app/u/[username]/profile-client";
import { mockDashboard } from "@/lib/demo-data";
import { langColor } from "@/lib/ui/lang-colors";

async function noopView() {
  "use server";
}

// Dev-only: a public profile with sample data (no view is recorded).
export default function DevProfile() {
  if (process.env.NODE_ENV === "production") notFound();
  const d = mockDashboard("tr");
  const total = d.topLanguages.reduce((s, x) => s + x.bytes, 0);
  return (
    <ShellClient user={{ username: "devboard-demo", name: "Demo Developer", avatarUrl: null }} status={{ streak: 18, weekCommits: 12, todayCommits: 1 }} lastSyncedAt={new Date().toISOString()} year={new Date().getFullYear()}>
      <ThemeProvider accent="violet">
        <ProfileClient
          username="ada-dev"
          userId="x"
          isOwner={false}
          isLoggedIn
          name="Ada Yılmaz"
          avatarUrl={null}
          bio="Systems and frontend. Writes Rust at night, TypeScript by day. Maintains tiny-kv."
          profileReadme={"## Hi, I'm Ada\n\nI build small, fast tools.\n\n> [!TIP]\n> Most of my work lives in `tiny-kv`.\n\n```rust\nfn main() {\n    println!(\"hello\");\n}\n```\n\n- [x] ship v1\n- [ ] write the docs"}
          readmeSource="custom"
          currentlyWorkingOn="A columnar storage engine for tiny-kv"
          yearlyGoal="1,000 commits and one conference talk"
          techTags={["Rust", "TypeScript", "Postgres", "WASM"]}
          stats={{ repoCount: 12, commitCount: 614, languageCount: 7, activeDays: 150 }}
          currentStreak={18}
          longestStreak={23}
          earnedBadges={d.badges.filter((b) => b.earned).slice(0, 12)}
          pinnedRepos={[{ name: "tiny-kv", full_name: "ada/tiny-kv", language: "Rust", stars: 342, forks: 41, description: "An embeddable key-value store with a columnar engine." }]}
          topRepos={[
            { name: "devboard", full_name: "ada/devboard", language: "TypeScript", stars: 128, forks: 14, description: "GitHub activity, as a workspace." },
            { name: "ray-tracer", full_name: "ada/ray-tracer", language: "Rust", stars: 89, forks: 9, description: "Weekend ray tracer, but it kept going." },
            { name: "gh-pulse", full_name: "ada/gh-pulse", language: "Go", stars: 57, forks: 6, description: null },
          ]}
          topLanguages={d.topLanguages.map((x) => ({ lang: x.language, bytes: x.bytes, pct: (x.bytes / total) * 100, color: langColor(x.language) }))}
          heatmapData={d.heatmapData}
          widgetOrder={["streak", "heatmap", "repos", "languages"]}
          widgets={{ heatmap: true, languages: true, repos: true, streak: true }}
          socialLinks={{ twitter: "ada_dev", linkedin: null, website: "ada.dev", discord: null }}
          developerDna={d.developerDna}
          recordView={noopView}
        />
      </ThemeProvider>
    </ShellClient>
  );
}
