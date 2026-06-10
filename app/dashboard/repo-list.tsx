"use client";

import Link from "next/link";
import { Star } from "lucide-react";

type Repo = { name: string; full_name: string; language: string | null; stars: number; forks: number; commit_count: number };

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
  Rust: "#dea584", Go: "#00ADD8", CSS: "#563d7c", HTML: "#e34c26",
  Java: "#b07219", "C++": "#f34b7d", "C#": "#178600", C: "#555555",
};

export default function RepoList({ repos }: { repos: Repo[] }) {
  if (repos.length === 0) return <p className="text-xs text-zinc-600">Veri yok</p>;
  const maxC = Math.max(...repos.map((r) => r.commit_count), 1);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 h-full flex flex-col">
      <h2 className="mb-3 text-sm font-medium text-zinc-400 shrink-0">En Aktif Repolar</h2>
      <div className="space-y-3 flex-1 min-h-0 overflow-auto custom-scroll">
        {repos.map((repo) => {
          const pct = (repo.commit_count / maxC) * 100;
          const color = repo.language ? (LANG_COLORS[repo.language] ?? "#6b7280") : "#6b7280";
          return (
            <Link key={repo.name} href={`/dashboard/repos/${repo.name}`} className="block group">
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  {repo.language && <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />}
                  <span className="truncate text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">{repo.name}</span>
                  {repo.language && <span className="text-[10px] text-zinc-600">{repo.language}</span>}
                </div>
                <div className="flex items-center gap-2.5 shrink-0 text-xs text-zinc-600">
                  <span className="tabular-nums">{repo.commit_count}</span>
                  <span className="flex items-center gap-0.5"><Star className="w-3 h-3" />{repo.stars}</span>
                </div>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
