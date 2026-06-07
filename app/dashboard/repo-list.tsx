"use client";

type Repo = {
  name: string;
  full_name: string;
  language: string | null;
  stars: number;
  forks: number;
  commit_count: number;
};

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
  Rust: "#dea584", Go: "#00ADD8", CSS: "#563d7c", HTML: "#e34c26",
  Java: "#b07219", "C++": "#f34b7d", "C#": "#178600", C: "#555555",
};

export default function RepoList({ repos }: { repos: Repo[] }) {
  if (repos.length === 0) return <p className="text-sm text-zinc-600">Veri yok</p>;

  const maxCommits = Math.max(...repos.map((r) => r.commit_count), 1);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="mb-4 text-sm font-medium text-zinc-400">En Aktif Repolar</h2>
      <div className="space-y-3">
        {repos.map((repo) => {
          const pct = (repo.commit_count / maxCommits) * 100;
          const color = repo.language ? (LANG_COLORS[repo.language] ?? "#6b7280") : "#6b7280";
          return (
            <a
              key={repo.name}
              href={`https://github.com/${repo.full_name}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {repo.language && (
                    <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                  )}
                  <span className="truncate text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">
                    {repo.name}
                  </span>
                  {repo.language && (
                    <span className="text-xs text-zinc-600">{repo.language}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0 text-xs text-zinc-600">
                  <span>{repo.commit_count} commit</span>
                  <span>★ {repo.stars}</span>
                </div>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
