import { NextRequest, NextResponse } from "next/server";
import { ImageResponse } from "next/og";
import { supabaseAdmin } from "@/lib/supabase";
import { THEMES, isValidTheme, DEFAULT_THEME } from "@/lib/themes";
import { calculateStreaks } from "@/lib/streak";

export const runtime = "nodejs";
export const revalidate = 3600;

const W = 1080;
const H = 1080;

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
  Rust: "#dea584", Go: "#00ADD8", CSS: "#563d7c", HTML: "#e34c26",
  Java: "#b07219", "C++": "#f34b7d", "C#": "#178600", C: "#555555",
  Swift: "#F05138", Kotlin: "#7F52FF", Ruby: "#701516",
};

const MONTH_NAMES = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran",
  "Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

function Badge({ label, value, ac, ab }: { label: string; value: string; ac: string; ab: string }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 4,
      background: ab, border: `1px solid ${ac}33`,
      borderRadius: 16, padding: "16px 24px", minWidth: 180, alignItems: "center",
    }}>
      <span style={{ color: "#71717a", fontSize: 13, letterSpacing: 2, fontWeight: 700 }}>{label.toUpperCase()}</span>
      <span style={{ color: ac, fontSize: 36, fontWeight: 900, lineHeight: 1 }}>{value}</span>
    </div>
  );
}

function Watermark({ username, year }: { username: string; year: number }) {
  return (
    <div style={{
      position: "absolute", bottom: 32, right: 40,
      color: "#3f3f46", fontSize: 16, display: "flex",
    }}>
      devanalytics.app/u/{username}/{year}
    </div>
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string; year: string; slide: string }> }
) {
  const { username, year, slide } = await params;
  const yearNum = parseInt(year, 10);
  const slideNum = parseInt(slide, 10);

  if (isNaN(yearNum) || isNaN(slideNum)) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, name, avatar_url, theme_accent")
    .eq("username", username)
    .single();

  if (!user) return new NextResponse("Not found", { status: 404 });

  const accent = isValidTheme(user.theme_accent) ? user.theme_accent : DEFAULT_THEME;
  const theme = THEMES[accent];
  const ac = theme.accent;
  const ab = theme.accentBg.replace("0.08", "0.15");
  const displayName = user.name ?? username;

  const yearStart = `${yearNum}-01-01`;
  const yearEnd   = `${yearNum}-12-31`;

  const { data: allRepos } = await supabaseAdmin
    .from("repositories")
    .select("id, is_fork, created_at, language")
    .eq("user_id", user.id);
  const ownRepoIds = (allRepos ?? []).filter((r) => !r.is_fork).map((r) => r.id);

  const [heatmapRes, commitsRes, langsRes] = await Promise.all([
    supabaseAdmin.from("daily_stats")
      .select("date, commit_count, lines_added, lines_deleted")
      .eq("user_id", user.id).gte("date", yearStart).lte("date", yearEnd),
    supabaseAdmin.from("commits")
      .select("committed_at, repo_id, message, additions, deletions")
      .in("repo_id", ownRepoIds)
      .gte("committed_at", `${yearStart}T00:00:00Z`)
      .lte("committed_at", `${yearEnd}T23:59:59Z`),
    supabaseAdmin.from("repo_languages")
      .select("language, bytes").in("repo_id", ownRepoIds),
  ]);

  const heatmap = heatmapRes.data ?? [];
  const commits = commitsRes.data ?? [];
  const langs = langsRes.data ?? [];

  const totalCommits = commits.length;
  const totalLinesAdded = heatmap.reduce((s, d) => s + (d.lines_added ?? 0), 0);
  const totalLinesDeleted = heatmap.reduce((s, d) => s + (d.lines_deleted ?? 0), 0);
  const activeDates = heatmap.filter((d) => d.commit_count > 0).map((d) => d.date);
  const { longestStreak, totalActiveDays } = calculateStreaks(activeDates);

  const monthCounts = new Array(12).fill(0);
  for (const d of heatmap) {
    const m = parseInt(d.date.slice(5, 7), 10) - 1;
    monthCounts[m] += d.commit_count;
  }
  const peakMonthIdx = monthCounts.indexOf(Math.max(...monthCounts));
  const peakMonthCommits = monthCounts[peakMonthIdx];

  const langMap = new Map<string, number>();
  for (const row of langs) langMap.set(row.language, (langMap.get(row.language) ?? 0) + row.bytes);
  const topLangs = Array.from(langMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const totalBytes = topLangs.reduce((s, [, b]) => s + b, 0);

  const biggestCommit = [...commits]
    .filter((c) => (c.additions ?? 0) + (c.deletions ?? 0) > 0)
    .sort((a, b) => ((b.additions ?? 0) + (b.deletions ?? 0)) - ((a.additions ?? 0) + (a.deletions ?? 0)))[0] ?? null;

  const bg = "#09090b";

  const slides: Record<number, React.ReactNode> = {
    // 0 — Cover
    0: (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 48, textAlign: "center" }}>
        {user.avatar_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatar_url} width={160} height={160} style={{ borderRadius: "50%", border: `6px solid ${ac}` }} alt={username} />
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ color: "#71717a", fontSize: 22 }}>Dev Analytics Sunuyor</span>
          <span style={{ color: "#f4f4f5", fontSize: 96, fontWeight: 900, lineHeight: 1 }}>{yearNum}</span>
          <span style={{ color: ac, fontSize: 80, fontWeight: 900, lineHeight: 1 }}>Wrapped</span>
        </div>
        <span style={{ color: "#a1a1aa", fontSize: 24 }}>
          <span style={{ color: "#f4f4f5", fontWeight: 700 }}>{displayName}</span> için
        </span>
      </div>
    ),
    // 1 — Total commits
    1: (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32, textAlign: "center" }}>
        <span style={{ color: "#71717a", fontSize: 20, letterSpacing: 4, fontWeight: 700 }}>BU YIL TOPLAM</span>
        <span style={{ color: ac, fontSize: 160, fontWeight: 900, lineHeight: 1 }}>{totalCommits.toLocaleString("tr-TR")}</span>
        <span style={{ color: "#f4f4f5", fontSize: 48, fontWeight: 700 }}>commit yaptın</span>
        <span style={{ color: "#71717a", fontSize: 22 }}>
          {totalActiveDays} aktif gün · {(totalCommits / Math.max(totalActiveDays, 1)).toFixed(1)} commit/gün
        </span>
      </div>
    ),
    // 2 — Lines
    2: (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 48, textAlign: "center" }}>
        <span style={{ color: "#71717a", fontSize: 20, letterSpacing: 4, fontWeight: 700 }}>KOD SATIRLARI</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ color: "#34d399", fontSize: 100, fontWeight: 900, lineHeight: 1 }}>+{totalLinesAdded.toLocaleString("tr-TR")}</span>
            <span style={{ color: "#71717a", fontSize: 24 }}>satır eklendi</span>
          </div>
          <div style={{ width: "100%", height: 2, background: "#27272a" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ color: "#f87171", fontSize: 100, fontWeight: 900, lineHeight: 1 }}>−{totalLinesDeleted.toLocaleString("tr-TR")}</span>
            <span style={{ color: "#71717a", fontSize: 24 }}>satır silindi</span>
          </div>
        </div>
      </div>
    ),
    // 3 — Peak month
    3: (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32, textAlign: "center" }}>
        <span style={{ color: "#71717a", fontSize: 20, letterSpacing: 4, fontWeight: 700 }}>EN AKTİF AYIN</span>
        <span style={{ color: ac, fontSize: 96, fontWeight: 900, lineHeight: 1 }}>{MONTH_NAMES[peakMonthIdx]}</span>
        <span style={{ color: "#a1a1aa", fontSize: 28 }}>
          <span style={{ color: "#f4f4f5", fontWeight: 700, fontSize: 40 }}>{peakMonthCommits}</span> commit ile
        </span>
        {/* Mini bar chart */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120, width: 600 }}>
          {monthCounts.map((c, i) => {
            const max = Math.max(...monthCounts, 1);
            const h = Math.max((c / max) * 100, c > 0 ? 4 : 2);
            const isPeak = i === peakMonthIdx;
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, gap: 4 }}>
                <div style={{ width: "100%", height: `${h}%`, background: isPeak ? ac : ab, borderRadius: 4, opacity: isPeak ? 1 : 0.6 }} />
                <span style={{ color: isPeak ? ac : "#52525b", fontSize: 12 }}>{MONTH_NAMES[i].slice(0, 3)}</span>
              </div>
            );
          })}
        </div>
      </div>
    ),
    // 5 — Languages
    5: (
      <div style={{ display: "flex", flexDirection: "column", gap: 40, width: 640 }}>
        <span style={{ color: "#71717a", fontSize: 20, letterSpacing: 4, fontWeight: 700, textAlign: "center" }}>BU YILIN DİLLERİ</span>
        {topLangs.map(([lang, bytes], i) => {
          const pct = totalBytes > 0 ? Math.round((bytes / totalBytes) * 100) : 0;
          const color = LANG_COLORS[lang] ?? "#6b7280";
          return (
            <div key={lang} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ color: i === 0 ? ac : "#71717a", fontSize: 20, fontWeight: 700 }}>#{i + 1}</span>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", background: color }} />
                  <span style={{ color: i === 0 ? "#f4f4f5" : "#a1a1aa", fontSize: 24, fontWeight: i === 0 ? 700 : 400 }}>{lang}</span>
                </div>
                <span style={{ color: "#52525b", fontSize: 20 }}>{pct}%</span>
              </div>
              <div style={{ height: 8, background: "#27272a", borderRadius: 4, display: "flex" }}>
                <div style={{ width: `${pct}%`, background: color, borderRadius: 4, opacity: 0.85 }} />
              </div>
            </div>
          );
        })}
      </div>
    ),
    // 9 — End
    9: (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 48, textAlign: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={{ color: "#71717a", fontSize: 22 }}>Harika bir yıldı</span>
          <span style={{ color: ac, fontSize: 80, fontWeight: 900 }}>{displayName}!</span>
        </div>
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" as const, justifyContent: "center" }}>
          <Badge label="Commit" value={totalCommits.toLocaleString("tr-TR")} ac={ac} ab={ab} />
          <Badge label="Aktif Gün" value={String(totalActiveDays)} ac={ac} ab={ab} />
          <Badge label="En Uzun Streak" value={`${longestStreak}g`} ac={ac} ab={ab} />
          <Badge label="En Aktif Ay" value={MONTH_NAMES[peakMonthIdx].slice(0, 3)} ac={ac} ab={ab} />
          {topLangs[0] && <Badge label="Ana Dil" value={topLangs[0][0]} ac={ac} ab={ab} />}
        </div>
        <span style={{ color: "#3f3f46", fontSize: 20 }}>devanalytics.app/u/{username}/{yearNum}</span>
      </div>
    ),
  };

  // Generic fallback for slides without custom design
  const genericSlides: Record<number, { label: string; value: string; sub?: string }> = {
    4: { label: "EN UZUN STREAK", value: `${longestStreak} gün`, sub: `${totalActiveDays} aktif gün` },
    6: { label: "REPOLAR", value: `${(allRepos ?? []).filter(r => !r.is_fork && r.created_at?.startsWith(yearNum.toString())).length} yeni`, sub: "bu yıl açıldı" },
    7: biggestCommit
      ? { label: "EN BÜYÜK COMMİT", value: `${((biggestCommit.additions ?? 0) + (biggestCommit.deletions ?? 0)).toLocaleString("tr-TR")} satır`, sub: (biggestCommit.message ?? "").slice(0, 60) }
      : { label: "EN BÜYÜK COMMİT", value: "—" },
    8: { label: "KONTRIBÜSYON HARİTASI", value: `${totalActiveDays} gün`, sub: `${totalCommits} commit` },
  };

  let content: React.ReactNode = slides[slideNum];

  if (!content && genericSlides[slideNum]) {
    const g = genericSlides[slideNum];
    content = (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32, textAlign: "center" }}>
        <span style={{ color: "#71717a", fontSize: 20, letterSpacing: 4, fontWeight: 700 }}>{g.label}</span>
        <span style={{ color: ac, fontSize: 120, fontWeight: 900, lineHeight: 1 }}>{g.value}</span>
        {g.sub && <span style={{ color: "#a1a1aa", fontSize: 26 }}>{g.sub}</span>}
      </div>
    );
  }

  if (!content) {
    return new NextResponse("Slide not found", { status: 404 });
  }

  const imageResponse = new ImageResponse(
    (
      <div
        style={{
          width: W, height: H,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          background: bg,
          position: "relative",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Glow background */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: `radial-gradient(ellipse 70% 50% at 50% 0%, ${ac}18 0%, transparent 70%)`,
          display: "flex",
        }} />
        {/* Top accent bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: ac, display: "flex" }} />
        {/* Slide number */}
        <div style={{ position: "absolute", top: 28, left: 40, color: "#3f3f46", fontSize: 18, display: "flex" }}>
          {slideNum + 1} / 10
        </div>
        {/* Content */}
        <div style={{ display: "flex", position: "relative", zIndex: 1 }}>
          {content}
        </div>
        {/* Watermark */}
        <div style={{ position: "absolute", bottom: 32, right: 40, color: "#3f3f46", fontSize: 18, display: "flex" }}>
          devanalytics.app/u/{username}/{yearNum}
        </div>
      </div>
    ),
    { width: W, height: H }
  );

  return new NextResponse(imageResponse.body, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
