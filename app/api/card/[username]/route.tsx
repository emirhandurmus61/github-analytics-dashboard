import { ImageResponse } from "next/og";
import { supabaseAdmin } from "@/lib/supabase";
import { calculateStreaks } from "@/lib/streak";
import { THEMES, isValidTheme, DEFAULT_THEME } from "@/lib/themes";

export const runtime = "nodejs";
export const revalidate = 3600;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, name, avatar_url, theme_accent")
    .eq("username", username)
    .single();

  if (!user) {
    return new Response("Not found", { status: 404 });
  }

  const accent = isValidTheme(user.theme_accent) ? user.theme_accent : DEFAULT_THEME;
  const theme = THEMES[accent];

  const [reposRes, heatmapRes, langsRes, commitsRes] = await Promise.all([
    supabaseAdmin
      .from("repositories")
      .select("id, language, is_fork")
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
      .in(
        "repo_id",
        (await supabaseAdmin.from("repositories").select("id").eq("user_id", user.id).eq("is_fork", false)).data?.map((r) => r.id) ?? []
      ),
    supabaseAdmin
      .from("commits")
      .select("committed_at")
      .in(
        "repo_id",
        (await supabaseAdmin.from("repositories").select("id").eq("user_id", user.id).eq("is_fork", false)).data?.map((r) => r.id) ?? []
      )
      .gte("committed_at", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const heatmapData = heatmapRes.data ?? [];
  const activeDates = heatmapData.filter((d) => d.commit_count > 0).map((d) => d.date);
  const { currentStreak, longestStreak } = calculateStreaks(activeDates);
  const yearlyCommits = heatmapData.reduce((s, d) => s + d.commit_count, 0);

  // Top dil
  const langMap = new Map<string, number>();
  for (const row of langsRes.data ?? []) {
    langMap.set(row.language, (langMap.get(row.language) ?? 0) + row.bytes);
  }
  const topLang = Array.from(langMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // En aktif saat
  const hourCounts = new Array(24).fill(0);
  for (const { committed_at } of commitsRes.data ?? []) {
    const h = new Date(committed_at).getHours();
    hourCounts[h]++;
  }
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

  const displayName = user.name ?? username;
  const accentColor = theme.accent;
  const accentBg = theme.accentBg;

  // Heatmap mini görsel — son 26 hafta × 7 gün grid
  const WEEKS = 26;
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

  const CELL = 14;
  const GAP = 3;
  const gridW = WEEKS * (CELL + GAP) - GAP;
  const gridH = 7 * (CELL + GAP) - GAP;

  // hex → rgba helper
  function hexAlpha(hex: string, alpha: number) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: "#09090b",
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "52px 64px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Accent glow arka plan */}
        <div
          style={{
            position: "absolute",
            top: -100,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: hexAlpha(accentColor, 0.06),
            filter: "blur(80px)",
          }}
        />

        {/* Üst: Logo + username */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                background: "#27272a",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="18" height="18" fill="#f4f4f5" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </div>
            <span style={{ color: "#52525b", fontSize: 16 }}>Dev Analytics</span>
          </div>
          <span style={{ color: "#3f3f46", fontSize: 16 }}>devanalytics.app/@{username}</span>
        </div>

        {/* Orta: Avatar + İsim + Stats */}
        <div style={{ display: "flex", alignItems: "center", gap: 56 }}>
          {/* Sol: Profil */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {user.avatar_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar_url}
                  width={80}
                  height={80}
                  style={{ borderRadius: 40, border: `2px solid ${hexAlpha(accentColor, 0.3)}` }}
                  alt=""
                />
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ color: "#f4f4f5", fontSize: 38, fontWeight: 700, lineHeight: 1.1 }}>
                  {displayName}
                </span>
                <span style={{ color: "#52525b", fontSize: 20 }}>@{username}</span>
              </div>
            </div>

            {/* Stat grid */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[
                { label: "Yıllık Commit", value: yearlyCommits.toLocaleString("tr-TR") },
                { label: "Mevcut Streak", value: `${currentStreak} gün` },
                { label: "En Uzun Streak", value: `${longestStreak} gün` },
                ...(topLang ? [{ label: "Ana Dil", value: topLang }] : []),
                { label: "Pik Saat", value: `${String(peakHour).padStart(2, "0")}:00` },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 3,
                    background: "#18181b",
                    border: `1px solid #27272a`,
                    borderRadius: 12,
                    padding: "10px 16px",
                    minWidth: 110,
                  }}
                >
                  <span style={{ color: "#52525b", fontSize: 12 }}>{label}</span>
                  <span style={{ color: accentColor, fontSize: 22, fontWeight: 700 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sağ: Mini heatmap */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              flexShrink: 0,
            }}
          >
            <svg
              width={gridW}
              height={gridH}
              style={{ display: "block" }}
            >
              {cells.map(({ col, row, intensity }) => (
                <rect
                  key={`${col}-${row}`}
                  x={col * (CELL + GAP)}
                  y={row * (CELL + GAP)}
                  width={CELL}
                  height={CELL}
                  rx={3}
                  fill={
                    intensity === 0
                      ? "#18181b"
                      : intensity < 0.25
                      ? hexAlpha(accentColor, 0.25)
                      : intensity < 0.5
                      ? hexAlpha(accentColor, 0.5)
                      : intensity < 0.75
                      ? hexAlpha(accentColor, 0.75)
                      : accentColor
                  }
                />
              ))}
            </svg>
            <span style={{ color: "#3f3f46", fontSize: 12, marginTop: 8 }}>
              son 6 ay
            </span>
          </div>
        </div>

        {/* Alt: Tema pill */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: accentBg,
              border: `1px solid ${hexAlpha(accentColor, 0.2)}`,
              borderRadius: 999,
              padding: "6px 16px",
            }}
          >
            <div
              style={{ width: 8, height: 8, borderRadius: "50%", background: accentColor }}
            />
            <span style={{ color: accentColor, fontSize: 14 }}>{theme.label}</span>
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
