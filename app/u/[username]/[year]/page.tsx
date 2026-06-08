import { supabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Image from "next/image";
import { calculateStreaks } from "@/lib/streak";
import { ThemeProvider } from "@/components/theme-provider";
import { THEMES, isValidTheme, DEFAULT_THEME } from "@/lib/themes";
import type { Metadata } from "next";
import WrappedClient from "./wrapped-client";

type Props = { params: Promise<{ username: string; year: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, year } = await params;
  return {
    title: `${username} — ${year} Wrapped · Dev Analytics`,
    description: `${username} kullanıcısının ${year} yılı GitHub özeti.`,
  };
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
  Rust: "#dea584", Go: "#00ADD8", CSS: "#563d7c", HTML: "#e34c26",
  Java: "#b07219", "C++": "#f34b7d", "C#": "#178600", C: "#555555",
  Swift: "#F05138", Kotlin: "#7F52FF", Ruby: "#701516",
};

const MONTH_NAMES = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran",
  "Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const DAY_NAMES = ["Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi","Pazar"];

export default async function WrappedPage({ params }: Props) {
  const { username, year } = await params;
  const yearNum = parseInt(year, 10);

  if (isNaN(yearNum) || yearNum < 2015 || yearNum > new Date().getFullYear()) {
    notFound();
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, name, avatar_url, theme_accent")
    .eq("username", username)
    .single();

  if (!user || !user.id) notFound();

  const accent = isValidTheme(user.theme_accent) ? user.theme_accent : DEFAULT_THEME;
  const theme = THEMES[accent];

  const yearStart = `${yearNum}-01-01`;
  const yearEnd   = `${yearNum}-12-31`;

  // Tüm repolar
  const { data: allRepos } = await supabaseAdmin
    .from("repositories")
    .select("id, name, full_name, language, stars, forks, is_fork, created_at")
    .eq("user_id", user.id);

  const ownRepoIds = (allRepos ?? []).filter((r) => !r.is_fork).map((r) => r.id);

  // Paralel veri çekme
  const [heatmapRes, commitsRes, langsRes, issuesRes] = await Promise.all([
    supabaseAdmin
      .from("daily_stats")
      .select("date, commit_count, lines_added, lines_deleted")
      .eq("user_id", user.id)
      .gte("date", yearStart)
      .lte("date", yearEnd)
      .order("date", { ascending: true }),
    supabaseAdmin
      .from("commits")
      .select("committed_at, repo_id, message, additions, deletions")
      .in("repo_id", ownRepoIds)
      .gte("committed_at", `${yearStart}T00:00:00Z`)
      .lte("committed_at", `${yearEnd}T23:59:59Z`),
    supabaseAdmin
      .from("repo_languages")
      .select("language, bytes, repo_id")
      .in("repo_id", ownRepoIds),
    supabaseAdmin
      .from("issues")
      .select("state, created_at")
      .in("repo_id", ownRepoIds)
      .gte("created_at", `${yearStart}T00:00:00Z`)
      .lte("created_at", `${yearEnd}T23:59:59Z`),
  ]);

  const heatmap = heatmapRes.data ?? [];
  const commits = commitsRes.data ?? [];
  const langs = langsRes.data ?? [];

  // ── Temel istatistikler ────────────────────────────────────────────
  const totalCommits = commits.length;
  const totalLinesAdded = heatmap.reduce((s, d) => s + (d.lines_added ?? 0), 0);
  const totalLinesDeleted = heatmap.reduce((s, d) => s + (d.lines_deleted ?? 0), 0);
  const activeDates = heatmap.filter((d) => d.commit_count > 0).map((d) => d.date);
  const { longestStreak, totalActiveDays } = calculateStreaks(activeDates);

  // ── En aktif ay ────────────────────────────────────────────────────
  const monthCounts = new Array(12).fill(0);
  for (const d of heatmap) {
    const m = parseInt(d.date.slice(5, 7), 10) - 1;
    monthCounts[m] += d.commit_count;
  }
  const peakMonthIdx = monthCounts.indexOf(Math.max(...monthCounts));
  const peakMonthCommits = monthCounts[peakMonthIdx];

  // ── En aktif gün (haftanın günü) ───────────────────────────────────
  const dayCounts = new Array(7).fill(0);
  for (const c of commits) {
    const d = (new Date(c.committed_at).getDay() + 6) % 7; // Pzt=0
    dayCounts[d]++;
  }
  const peakDayIdx = dayCounts.indexOf(Math.max(...dayCounts));

  // ── En aktif saat ──────────────────────────────────────────────────
  const hourCounts = new Array(24).fill(0);
  for (const c of commits) {
    hourCounts[new Date(c.committed_at).getHours()]++;
  }
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

  // ── Top diller ─────────────────────────────────────────────────────
  const langMap = new Map<string, number>();
  for (const row of langs) {
    langMap.set(row.language, (langMap.get(row.language) ?? 0) + row.bytes);
  }
  const topLangs = Array.from(langMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const totalBytes = topLangs.reduce((s, [, b]) => s + b, 0);

  // ── En büyük commit ────────────────────────────────────────────────
  const biggestCommit = [...commits]
    .filter((c) => (c.additions ?? 0) + (c.deletions ?? 0) > 0)
    .sort((a, b) => ((b.additions ?? 0) + (b.deletions ?? 0)) - ((a.additions ?? 0) + (a.deletions ?? 0)))[0] ?? null;

  // ── Repo istatistikleri ────────────────────────────────────────────
  const reposCreatedThisYear = (allRepos ?? []).filter(
    (r) => !r.is_fork && r.created_at?.startsWith(yearNum.toString())
  ).length;

  // Aktif kalan repo (bu yılda en az 1 commit olan)
  const activeRepoIds = new Set(commits.map((c) => c.repo_id));
  const activeRepoCount = activeRepoIds.size;

  // ── Aylık commit dağılımı (grafik için) ────────────────────────────
  const monthlyData = monthCounts.map((count, i) => ({
    month: MONTH_NAMES[i].slice(0, 3),
    commits: count,
  }));

  // ── Çalışma kimliği ────────────────────────────────────────────────
  const morningCommits   = commits.filter((c) => { const h = new Date(c.committed_at).getHours(); return h >= 6 && h < 12; }).length;
  const afternoonCommits = commits.filter((c) => { const h = new Date(c.committed_at).getHours(); return h >= 12 && h < 18; }).length;
  const eveningCommits   = commits.filter((c) => { const h = new Date(c.committed_at).getHours(); return h >= 18 && h < 22; }).length;
  const nightCommits     = commits.filter((c) => { const h = new Date(c.committed_at).getHours(); return h >= 22 || h < 6; }).length;
  const maxP = Math.max(morningCommits, afternoonCommits, eveningCommits, nightCommits);
  let identity = { label: "Öğleden Sonra Kodcusu", emoji: "☀️" };
  if (maxP === morningCommits && morningCommits > 0) identity = { label: "Sabah Kodcusu", emoji: "🌅" };
  else if (maxP === eveningCommits && eveningCommits > 0) identity = { label: "Akşam Kodcusu", emoji: "🌆" };
  else if (maxP === nightCommits && nightCommits > 0) identity = { label: "Gece Kodcusu", emoji: "🌙" };

  // ── Haftalık heatmap verisi ────────────────────────────────────────
  const dateCountMap = new Map(heatmap.map((d) => [d.date, d.commit_count]));
  const maxDayCount = Math.max(...heatmap.map((d) => d.commit_count), 1);

  const wrappedData = {
    username,
    year: yearNum,
    displayName: user.name ?? username,
    avatarUrl: user.avatar_url,
    totalCommits,
    totalLinesAdded,
    totalLinesDeleted,
    activeDays: totalActiveDays,
    longestStreak,
    peakMonth: MONTH_NAMES[peakMonthIdx],
    peakMonthCommits,
    peakDay: DAY_NAMES[peakDayIdx],
    peakHour,
    topLangs: topLangs.map(([lang, bytes]) => ({
      lang,
      bytes,
      pct: totalBytes > 0 ? Math.round((bytes / totalBytes) * 100) : 0,
      color: LANG_COLORS[lang] ?? "#6b7280",
    })),
    biggestCommit: biggestCommit
      ? {
          message: (biggestCommit.message ?? "").split("\n")[0].slice(0, 80),
          additions: biggestCommit.additions ?? 0,
          deletions: biggestCommit.deletions ?? 0,
          date: biggestCommit.committed_at.slice(0, 10),
        }
      : null,
    reposCreated: reposCreatedThisYear,
    activeRepos: activeRepoCount,
    identity,
    monthlyData,
    accentColor: theme.accent,
    accentBg: theme.accentBg,
    accentBorder: theme.accentBorder,
    accentShades: theme.shades,
    heatmapDates: Object.fromEntries(dateCountMap),
    maxDayCount,
    issuesOpened: (issuesRes.data ?? []).length,
    issuesClosed: (issuesRes.data ?? []).filter((i) => i.state === "closed").length,
  };

  return (
    <ThemeProvider accent={accent}>
      <WrappedClient data={wrappedData} />
    </ThemeProvider>
  );
}
