import { ImageResponse } from "next/og";
import { supabaseAdmin } from "@/lib/supabase";
import { calculateStreaks } from "@/lib/streak";
import { THEMES, isValidTheme, DEFAULT_THEME } from "@/lib/themes";

export const runtime = "nodejs";
export const revalidate = 3600;

function hexAlpha(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function hexToRgb(hex: string) {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, name, avatar_url, theme_accent, bio, tech_tags")
    .eq("username", username)
    .single();

  if (!user) {
    return new Response("Not found", { status: 404 });
  }

  const accent = isValidTheme(user.theme_accent) ? user.theme_accent : DEFAULT_THEME;
  const theme = THEMES[accent];
  const accentColor = theme.accent;
  const { r: ar, g: ag, b: ab } = hexToRgb(accentColor);

  const repoIdsRes = await supabaseAdmin
    .from("repositories")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_fork", false);
  const ownIds = (repoIdsRes.data ?? []).map((r) => r.id);

  const [reposRes, heatmapRes, langsRes, commitsRes] = await Promise.all([
    supabaseAdmin
      .from("repositories")
      .select("count", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabaseAdmin
      .from("daily_stats")
      .select("date, commit_count")
      .eq("user_id", user.id)
      .gte("date", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
      .order("date", { ascending: true }),
    supabaseAdmin
      .from("repo_languages")
      .select("language, bytes")
      .in("repo_id", ownIds),
    supabaseAdmin
      .from("commits")
      .select("committed_at")
      .in("repo_id", ownIds)
      .gte("committed_at", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const heatmapData = heatmapRes.data ?? [];
  const activeDates = heatmapData.filter((d) => d.commit_count > 0).map((d) => d.date);
  const { currentStreak, longestStreak, totalActiveDays } = calculateStreaks(activeDates);
  const yearlyCommits = heatmapData.reduce((s, d) => s + d.commit_count, 0);

  // Languages
  const langMap = new Map<string, number>();
  for (const row of langsRes.data ?? []) {
    langMap.set(row.language, (langMap.get(row.language) ?? 0) + row.bytes);
  }
  const topLangs = Array.from(langMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const totalBytes = topLangs.reduce((s, [, b]) => s + b, 0);

  const LANG_COLORS: Record<string, string> = {
    TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
    Rust: "#dea584", Go: "#00ADD8", CSS: "#563d7c", HTML: "#e34c26",
    Java: "#b07219", "C++": "#f34b7d", "C#": "#178600", C: "#555555",
    Ruby: "#701516", Swift: "#F05138", Kotlin: "#A97BFF",
  };

  // Peak hour
  const hourCounts = new Array(24).fill(0);
  for (const { committed_at } of commitsRes.data ?? []) {
    hourCounts[new Date(committed_at).getHours()]++;
  }
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

  // Heatmap grid (last 30 weeks)
  const WEEKS = 30;
  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7;
  const gridStart = new Date(today);
  gridStart.setDate(today.getDate() - dayOfWeek - (WEEKS - 1) * 7);

  const dateCountMap = new Map(heatmapData.map((d) => [d.date, d.commit_count]));
  const maxCount = Math.max(...heatmapData.map((d) => d.commit_count), 1);

  const cells: { col: number; row: number; intensity: number }[] = [];
  for (let w = 0; w < WEEKS; w++) {
    for (let d = 0; d < 7; d++) {
      const cur = new Date(gridStart);
      cur.setDate(gridStart.getDate() + w * 7 + d);
      if (cur > today) continue;
      const dateStr = cur.toISOString().slice(0, 10);
      const count = dateCountMap.get(dateStr) ?? 0;
      cells.push({ col: w, row: d, intensity: count / maxCount });
    }
  }

  const CELL = 11;
  const GAP = 3;
  const gridW = WEEKS * (CELL + GAP) - GAP;
  const gridH = 7 * (CELL + GAP) - GAP;

  const displayName = user.name ?? username;
  const repoCount = reposRes.count ?? 0;
  const techTags: string[] = Array.isArray(user.tech_tags) ? user.tech_tags.slice(0, 5) : [];

  return new ImageResponse(
    (
      <div
        style={{
          background: "#09090b",
          width: 1200,
          height: 630,
          display: "flex",
          position: "relative",
          overflow: "hidden",
          fontFamily: "sans-serif",
        }}
      >
        {/* ── Background art ── */}

        {/* Top-right accent orb */}
        <div
          style={{
            position: "absolute",
            top: -180,
            right: -120,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${hexAlpha(accentColor, 0.12)} 0%, transparent 60%)`,
          }}
        />

        {/* Bottom-left accent orb */}
        <div
          style={{
            position: "absolute",
            bottom: -200,
            left: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${hexAlpha(accentColor, 0.06)} 0%, transparent 60%)`,
          }}
        />

        {/* Geometric lines */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 1200,
            height: 630,
            display: "flex",
          }}
        >
          {/* Diagonal accent line */}
          <svg width="1200" height="630" style={{ position: "absolute", top: 0, left: 0 }}>
            <line x1="900" y1="0" x2="1200" y2="300" stroke={hexAlpha(accentColor, 0.08)} strokeWidth="1" />
            <line x1="950" y1="0" x2="1200" y2="250" stroke={hexAlpha(accentColor, 0.04)} strokeWidth="1" />
            <line x1="0" y1="500" x2="300" y2="630" stroke={hexAlpha(accentColor, 0.05)} strokeWidth="1" />
            {/* Decorative circles */}
            <circle cx="1100" cy="80" r="40" fill="none" stroke={hexAlpha(accentColor, 0.06)} strokeWidth="1" />
            <circle cx="1100" cy="80" r="25" fill="none" stroke={hexAlpha(accentColor, 0.04)} strokeWidth="1" />
            <circle cx="80" cy="550" r="30" fill="none" stroke={hexAlpha(accentColor, 0.05)} strokeWidth="1" />
          </svg>
        </div>

        {/* Dot grid pattern */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.03,
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />

        {/* ── Content ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            padding: "48px 56px",
            position: "relative",
            zIndex: 10,
          }}
        >
          {/* Top: Logo + URL */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: hexAlpha(accentColor, 0.1),
                  border: `1px solid ${hexAlpha(accentColor, 0.15)}`,
                }}
              >
                <svg width="14" height="14" fill={accentColor} viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </div>
              <span style={{ color: "#52525b", fontSize: 14, fontWeight: 500 }}>Dev Analytics</span>
            </div>
            <span style={{ color: "#3f3f46", fontSize: 13 }}>devanalytics.app/@{username}</span>
          </div>

          {/* Center: Profile + Stats + Heatmap */}
          <div style={{ display: "flex", gap: 48, alignItems: "center" }}>

            {/* Left column: Avatar + Name + Tags */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 380 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                {user.avatar_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar_url}
                    width={88}
                    height={88}
                    style={{
                      borderRadius: 44,
                      border: `3px solid ${hexAlpha(accentColor, 0.3)}`,
                      boxShadow: `0 0 30px ${hexAlpha(accentColor, 0.15)}`,
                    }}
                    alt=""
                  />
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ color: "#fafafa", fontSize: 34, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.02em" }}>
                    {displayName}
                  </span>
                  <span style={{ color: "#52525b", fontSize: 16 }}>@{username}</span>
                </div>
              </div>

              {/* Tech tags */}
              {techTags.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {techTags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: 11,
                        color: hexAlpha(accentColor, 0.8),
                        background: hexAlpha(accentColor, 0.08),
                        border: `1px solid ${hexAlpha(accentColor, 0.15)}`,
                        borderRadius: 6,
                        padding: "3px 10px",
                        fontWeight: 500,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Key stats row */}
              <div style={{ display: "flex", gap: 8 }}>
                {[
                  { label: "Commit", value: yearlyCommits.toLocaleString("tr-TR") },
                  { label: "Streak", value: `${currentStreak}d` },
                  { label: "Repos", value: String(repoCount) },
                  { label: "Aktif", value: `${totalActiveDays}d` },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      background: "rgba(24,24,27,0.6)",
                      border: `1px solid rgba(39,39,42,0.4)`,
                      borderRadius: 10,
                      padding: "8px 14px",
                      flex: 1,
                    }}
                  >
                    <span style={{ color: "#52525b", fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>{label}</span>
                    <span style={{ color: accentColor, fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right column: Heatmap + Languages */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20, flex: 1, alignItems: "flex-end" }}>
              {/* Heatmap */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <svg width={gridW} height={gridH} style={{ display: "block" }}>
                  {cells.map(({ col, row, intensity }) => (
                    <rect
                      key={`${col}-${row}`}
                      x={col * (CELL + GAP)}
                      y={row * (CELL + GAP)}
                      width={CELL}
                      height={CELL}
                      rx={2}
                      fill={
                        intensity === 0
                          ? "rgba(255,255,255,0.03)"
                          : intensity < 0.25
                          ? hexAlpha(accentColor, 0.2)
                          : intensity < 0.5
                          ? hexAlpha(accentColor, 0.4)
                          : intensity < 0.75
                          ? hexAlpha(accentColor, 0.65)
                          : accentColor
                      }
                    />
                  ))}
                </svg>
              </div>

              {/* Language bars */}
              {topLangs.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%", maxWidth: gridW }}>
                  {/* Combined progress bar */}
                  <div style={{ display: "flex", height: 6, borderRadius: 3, overflow: "hidden", gap: 2 }}>
                    {topLangs.map(([lang, bytes]) => {
                      const pct = totalBytes > 0 ? (bytes / totalBytes) * 100 : 0;
                      return (
                        <div
                          key={lang}
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            borderRadius: 3,
                            backgroundColor: LANG_COLORS[lang] ?? "#6b7280",
                          }}
                        />
                      );
                    })}
                  </div>
                  {/* Labels */}
                  <div style={{ display: "flex", gap: 12 }}>
                    {topLangs.map(([lang, bytes]) => {
                      const pct = totalBytes > 0 ? ((bytes / totalBytes) * 100).toFixed(1) : "0";
                      return (
                        <div key={lang} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <div style={{ width: 6, height: 6, borderRadius: 2, backgroundColor: LANG_COLORS[lang] ?? "#6b7280" }} />
                          <span style={{ fontSize: 11, color: "#71717a" }}>{lang}</span>
                          <span style={{ fontSize: 10, color: "#3f3f46" }}>{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom: Extra stats + theme pill */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              {/* Longest streak */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span style={{ fontSize: 12, color: "#52525b" }}>En uzun: {longestStreak} gun</span>
              </div>
              {/* Peak hour */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <span style={{ fontSize: 12, color: "#52525b" }}>Pik: {String(peakHour).padStart(2, "0")}:00</span>
              </div>
              {/* Languages count */}
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
                <span style={{ fontSize: 12, color: "#52525b" }}>{langMap.size} dil</span>
              </div>
            </div>

            {/* Theme accent indicator */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: hexAlpha(accentColor, 0.06),
                border: `1px solid ${hexAlpha(accentColor, 0.12)}`,
                borderRadius: 999,
                padding: "5px 14px",
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: accentColor,
                  boxShadow: `0 0 8px ${hexAlpha(accentColor, 0.4)}`,
                }}
              />
              <span style={{ color: hexAlpha(accentColor, 0.7), fontSize: 11, fontWeight: 500 }}>{theme.label}</span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
