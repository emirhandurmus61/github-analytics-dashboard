import { supabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { calculateStreaks } from "@/lib/streak";
import { ThemeProvider } from "@/components/theme-provider";
import { THEMES, isValidTheme, DEFAULT_THEME } from "@/lib/themes";
import type { Metadata } from "next";
import WrappedClient from "./wrapped-client";
import { auth } from "@/lib/auth";
import Navbar from "@/components/navbar";

type Props = { params: Promise<{ username: string; year: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username, year } = await params;
  return {
    title: `${username} — ${year} Wrapped · Devboard`,
    description: `${username} kullanıcısının ${year} yılı GitHub özeti.`,
  };
}

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
  Rust: "#dea584", Go: "#00ADD8", CSS: "#563d7c", HTML: "#e34c26",
  Java: "#b07219", "C++": "#f34b7d", "C#": "#178600", C: "#555555",
  Swift: "#F05138", Kotlin: "#7F52FF", Ruby: "#701516",
};

const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
];
const DAY_NAMES = [
  "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"
];

export default async function WrappedPage({ params }: Props) {
  const { username, year } = await params;
  const yearNum = parseInt(year, 10);

  const session = await auth();
  const isOwner = session?.user?.username === username;

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
  const [heatmapRes, commitsRes, langsRes, issuesRes, prsRes] = await Promise.all([
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
    supabaseAdmin
      .from("pull_requests")
      .select("merged, state, created_at, repo_id")
      .in("repo_id", ownRepoIds)
      .gte("created_at", `${yearStart}T00:00:00Z`)
      .lte("created_at", `${yearEnd}T23:59:59Z`),
  ]);

  const heatmap = heatmapRes.data ?? [];
  const commits = commitsRes.data ?? [];
  const langs = langsRes.data ?? [];
  const prs = prsRes.data ?? [];

  // ── Temel istatistikler ────────────────────────────────────────────
  const totalCommits = commits.length;
  const totalLinesAdded = heatmap.reduce((s, d) => s + (d.lines_added ?? 0), 0);
  const totalLinesDeleted = heatmap.reduce((s, d) => s + (d.lines_deleted ?? 0), 0);
  const activeDates = heatmap.filter((d) => d.commit_count > 0).map((d) => d.date);
  const { longestStreak, totalActiveDays } = calculateStreaks(activeDates);

  // PR ve Yıldız istatistikleri
  const totalPRs = prs.length;
  const mergedPRs = prs.filter((p) => p.merged || p.state === "merged" || p.state === "closed").length;
  const totalStars = (allRepos ?? []).filter((r) => !r.is_fork).reduce((acc, r) => acc + (r.stars ?? 0), 0);

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

  // En çok commit yapılan favori repo
  const repoCommitMap = new Map<number, number>();
  for (const c of commits) {
    repoCommitMap.set(c.repo_id, (repoCommitMap.get(c.repo_id) ?? 0) + 1);
  }
  let topRepo: { name: string; fullName: string; commits: number; stars: number; language: string } | null = null;
  if (repoCommitMap.size > 0) {
    const sorted = Array.from(repoCommitMap.entries()).sort((a, b) => b[1] - a[1]);
    const topId = sorted[0][0];
    const match = (allRepos ?? []).find((r) => r.id === topId);
    if (match) {
      topRepo = {
        name: match.name,
        fullName: match.full_name,
        commits: sorted[0][1],
        stars: match.stars ?? 0,
        language: match.language ?? "Code",
      };
    }
  }

  // ── Aylık commit dağılımı (grafik için) ────────────────────────────
  const monthlyData = monthCounts.map((count, i) => ({
    month: MONTH_NAMES[i].slice(0, 3),
    commits: count,
  }));

  // ── Çalışma kimliği & Arketip ───────────────────────────────────────
  const morningCommits   = commits.filter((c) => { const h = new Date(c.committed_at).getHours(); return h >= 6 && h < 12; }).length;
  const afternoonCommits = commits.filter((c) => { const h = new Date(c.committed_at).getHours(); return h >= 12 && h < 18; }).length;
  const eveningCommits   = commits.filter((c) => { const h = new Date(c.committed_at).getHours(); return h >= 18 && h < 22; }).length;
  const nightCommits     = commits.filter((c) => { const h = new Date(c.committed_at).getHours(); return h >= 22 || h < 6; }).length;
  const maxP = Math.max(morningCommits, afternoonCommits, eveningCommits, nightCommits);

  let identity = {
    label: "Öğleden Sonra Kodcusu",
    emoji: "☀️",
    en: { label: "Afternoon Coder" },
  };
  if (maxP === morningCommits && morningCommits > 0) {
    identity = { label: "Sabah Kodcusu", emoji: "🌅", en: { label: "Morning Coder" } };
  } else if (maxP === eveningCommits && eveningCommits > 0) {
    identity = { label: "Akşam Kodcusu", emoji: "🌆", en: { label: "Evening Coder" } };
  } else if (maxP === nightCommits && nightCommits > 0) {
    identity = { label: "Gece Kodcusu", emoji: "🌙", en: { label: "Night Coder" } };
  }

  // Eğlenceli ve heyecan verici geliştirici arketipi
  let archetype = {
    title: "Açık Kaynak Kaşifi",
    tagline: "Kodla dünyayı şekillendiren vizyoner geliştirici",
    badge: "🚀 EXPLORER",
    desc: `${totalCommits} commit ve ${activeRepoCount} aktif repo ile yılını dolu dolu üreterek geçirdin.`,
    color: "#38bdf8",
    en: {
      title: "Open Source Explorer",
      tagline: "A visionary developer shaping the world through code",
      badge: "🚀 EXPLORER",
      desc: `You spent the year producing intensely with ${totalCommits} commits across ${activeRepoCount} active repositories.`,
    },
  };
  if (nightCommits > 0 && nightCommits >= maxP && (nightCommits / Math.max(totalCommits, 1)) > 0.25) {
    archetype = {
      title: "Gece Savaşçısı (Night Crawler)",
      tagline: "Ay ışığında kod yazan bir efsane",
      badge: "🌙 NOCTURNAL",
      desc: "Herkes uyurken sen en çetrefilli bug'ları avladın. Gece sessizliği senin gizli süper gücün.",
      color: "#a855f7",
      en: {
        title: "Night Crawler",
        tagline: "A legend coding under the moonlight",
        badge: "🌙 NOCTURNAL",
        desc: "Hunting the trickiest bugs while the world sleeps. Midnight quiet is your secret superpower.",
      },
    };
  } else if (morningCommits > 0 && morningCommits >= maxP && (morningCommits / Math.max(totalCommits, 1)) > 0.25) {
    archetype = {
      title: "Şafak Kodcusu (Early Bird)",
      tagline: "Güneş doğmadan ilk commit'i atan sabah insanı",
      badge: "🌅 EARLY BIRD",
      desc: "Güne erken başlayıp kahvenle birlikte ilk PR'ını açtın. Disiplinin ve odaklanma gücün benzersiz.",
      color: "#f59e0b",
      en: {
        title: "Early Bird",
        tagline: "The morning person pushing commits before sunrise",
        badge: "🌅 EARLY BIRD",
        desc: "Starting your day early and opening your first PR over coffee. Your discipline and focus are unmatched.",
      },
    };
  } else if (longestStreak >= 10) {
    archetype = {
      title: "Ateş Koruyucu (Streak Master)",
      tagline: "Zinciri kırmayan istikrar abidesi",
      badge: "🔥 UNSTOPPABLE",
      desc: `${longestStreak} günlük kesintisiz kodlama serisi! Yıl boyunca kararlılığınla harikalar yarattın.`,
      color: "#ef4444",
      en: {
        title: "Streak Master",
        tagline: "A paragon of consistency who never breaks the chain",
        badge: "🔥 UNSTOPPABLE",
        desc: `An unbroken ${longestStreak}-day coding streak! Your determination created wonders throughout the year.`,
      },
    };
  } else if (totalCommits >= 250) {
    archetype = {
      title: "Kod Fabrikası (The Code Machine)",
      tagline: "Terminalin sıcaklığı hiç düşmeyen üretici güç",
      badge: "⚡ POWERHOUSE",
      desc: "Yıl boyunca durmaksızın ürettin, klavyen neredeyse hiç soğumadı.",
      color: "#10b981",
      en: {
        title: "The Code Machine",
        tagline: "An unstoppable productive powerhouse whose terminal never cools down",
        badge: "⚡ POWERHOUSE",
        desc: "Producing non-stop all year round, your keyboard barely had a moment to cool off.",
      },
    };
  } else if (totalLinesDeleted > totalLinesAdded * 0.35 && totalLinesDeleted > 500) {
    archetype = {
      title: "Refactor Mimarı (The Zen Cleaner)",
      tagline: "Az kod, çok iş felsefesinin ustası",
      badge: "🧹 ELEGANT",
      desc: "Gereksiz karmaşıklığı temizleyip kod tabanını hafif ve sürdürülebilir kıldın.",
      color: "#06b6d4",
      en: {
        title: "The Zen Cleaner",
        tagline: "Master of the 'less code, more impact' philosophy",
        badge: "🧹 ELEGANT",
        desc: "Eliminating unnecessary complexity, keeping the codebase lean and sustainable.",
      },
    };
  }

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
    peakMonthIdx,
    peakMonth: MONTH_NAMES[peakMonthIdx],
    peakMonthCommits,
    peakDayIdx,
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
    topRepo,
    totalPRs,
    mergedPRs,
    totalStars,
    archetype,
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
      <Navbar />
      <WrappedClient data={wrappedData} isOwner={isOwner} />
    </ThemeProvider>
  );
}
