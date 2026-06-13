import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import TimelineClient from "./timeline-client";

export default async function TimelinePage() {
  const session = await auth();

  const { data: dbUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("username", session?.user?.username ?? "")
    .single();

  if (!dbUser) notFound();

  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

  // Tüm commit'leri repo bilgileriyle birlikte çek
  const { data: rawCommits } = await supabaseAdmin
    .from("commits")
    .select("sha, message, committed_at, additions, deletions, repo_id")
    .eq("user_id", dbUser.id)
    .gte("committed_at", oneYearAgo)
    .order("committed_at", { ascending: false })
    .limit(2000);

  const commits = rawCommits ?? [];

  // Repo listesini çek (dil filtresi için)
  const repoIds = [...new Set(commits.map((c) => c.repo_id).filter(Boolean))];

  const { data: rawRepos } = repoIds.length > 0
    ? await supabaseAdmin
        .from("repositories")
        .select("id, name, language")
        .in("id", repoIds)
    : { data: [] };

  const repoMap = new Map(
    (rawRepos ?? []).map((r) => [r.id, { name: r.name, language: r.language ?? null }])
  );

  // Commit'leri repo bilgisiyle zenginleştir
  const enrichedCommits = commits.map((c) => {
    const repo = c.repo_id ? repoMap.get(c.repo_id) : undefined;
    return {
      sha: c.sha,
      message: c.message,
      committed_at: c.committed_at,
      additions: c.additions ?? 0,
      deletions: c.deletions ?? 0,
      repo_name: repo?.name ?? null,
      repo_language: repo?.language ?? null,
    };
  });

  // Mevcut repo ve dil listelerini türet (filtreler için)
  const repos = [...new Map(
    enrichedCommits
      .filter((c) => c.repo_name)
      .map((c) => [c.repo_name, c.repo_name])
  ).values()].sort();

  const languages = [...new Set(
    enrichedCommits
      .filter((c) => c.repo_language)
      .map((c) => c.repo_language as string)
  )].sort();

  return (
    <TimelineClient
      commits={enrichedCommits}
      repos={repos}
      languages={languages}
      username={session?.user?.username ?? ""}
    />
  );
}
