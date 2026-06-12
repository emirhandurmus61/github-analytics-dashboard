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

const FORMATS = {
  og:      { width: 1200, height: 630 },
  square:  { width: 600,  height: 600 },
  twitter: { width: 1500, height: 500 },
} as const;
type CardFormat = keyof typeof FORMATS;

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
  Rust: "#dea584", Go: "#00ADD8", CSS: "#563d7c", HTML: "#e34c26",
  Java: "#b07219", "C++": "#f34b7d", "C#": "#178600", C: "#555555",
  Ruby: "#701516", Swift: "#F05138", Kotlin: "#A97BFF",
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const url = new URL(req.url);
  const formatParam = url.searchParams.get("format") ?? "og";
  const format: CardFormat = (formatParam in FORMATS ? formatParam : "og") as CardFormat;
  const { width, height } = FORMATS[format];

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, name, avatar_url, theme_accent, bio, tech_tags")
    .eq("username", username)
    .single();

  if (!user) return new Response("Not found", { status: 404 });

  const accent = isValidTheme(user.theme_accent) ? user.theme_accent : DEFAULT_THEME;
  const theme = THEMES[accent];
  const ac = theme.accent; // accent color shorthand

  const repoIdsRes = await supabaseAdmin
    .from("repositories")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_fork", false);
  const ownIds = (repoIdsRes.data ?? []).map((r) => r.id);

  const [reposRes, heatmapRes, langsRes, commitsRes] = await Promise.all([
    supabaseAdmin.from("repositories").select("count", { count: "exact", head: true }).eq("user_id", user.id),
    supabaseAdmin.from("daily_stats").select("date, commit_count").eq("user_id", user.id)
      .gte("date", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
      .order("date", { ascending: true }),
    supabaseAdmin.from("repo_languages").select("language, bytes").in("repo_id", ownIds),
    supabaseAdmin.from("commits").select("committed_at").in("repo_id", ownIds)
      .gte("committed_at", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const heatmapData = heatmapRes.data ?? [];
  const activeDates = heatmapData.filter((d) => d.commit_count > 0).map((d) => d.date);
  const { currentStreak, longestStreak, totalActiveDays } = calculateStreaks(activeDates);
  const yearlyCommits = heatmapData.reduce((s, d) => s + d.commit_count, 0);

  const langMap = new Map<string, number>();
  for (const row of langsRes.data ?? []) langMap.set(row.language, (langMap.get(row.language) ?? 0) + row.bytes);
  const topLangs = Array.from(langMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const totalBytes = topLangs.reduce((s, [, b]) => s + b, 0);

  const hourCounts = new Array(24).fill(0);
  for (const { committed_at } of commitsRes.data ?? []) hourCounts[new Date(committed_at).getHours()]++;
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

  const displayName = user.name ?? username;
  const repoCount = reposRes.count ?? 0;
  const techTags: string[] = Array.isArray(user.tech_tags) ? user.tech_tags.slice(0, 5) : [];

  // ── Heatmap cells builder ──────────────────────────────────────
  function buildCells(weeks: number, cellSize: number, gap: number) {
    const today = new Date();
    const dow = (today.getDay() + 6) % 7;
    const start = new Date(today);
    start.setDate(today.getDate() - dow - (weeks - 1) * 7);
    const dateCountMap = new Map(heatmapData.map((d) => [d.date, d.commit_count]));
    const maxC = Math.max(...heatmapData.map((d) => d.commit_count), 1);
    const cells: { col: number; row: number; intensity: number }[] = [];
    for (let w = 0; w < weeks; w++) {
      for (let d = 0; d < 7; d++) {
        const cur = new Date(start);
        cur.setDate(start.getDate() + w * 7 + d);
        if (cur > today) continue;
        const count = dateCountMap.get(cur.toISOString().slice(0, 10)) ?? 0;
        cells.push({ col: w, row: d, intensity: count / maxC });
      }
    }
    return { cells, gridW: weeks * (cellSize + gap) - gap, gridH: 7 * (cellSize + gap) - gap };
  }

  function cellColor(intensity: number) {
    if (intensity === 0) return "rgba(255,255,255,0.04)";
    if (intensity < 0.25) return hexAlpha(ac, 0.2);
    if (intensity < 0.5)  return hexAlpha(ac, 0.4);
    if (intensity < 0.75) return hexAlpha(ac, 0.65);
    return ac;
  }

  // ── Shared sub-components ──────────────────────────────────────

  function StatBox({ label, value, small = false }: { label: string; value: string; small?: boolean }) {
    return (
      <div style={{
        display: "flex", flexDirection: "column", gap: 2,
        background: "rgba(24,24,27,0.7)",
        border: `1px solid rgba(39,39,42,0.5)`,
        borderRadius: 10, padding: small ? "6px 12px" : "8px 16px", flex: 1,
      }}>
        <span style={{ color: "#52525b", fontSize: small ? 9 : 10, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>{label}</span>
        <span style={{ color: ac, fontSize: small ? 18 : 22, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</span>
      </div>
    );
  }

  function HeatmapSvg({ cells, gridW, gridH, cellSize, gap }: { cells: { col: number; row: number; intensity: number }[]; gridW: number; gridH: number; cellSize: number; gap: number }) {
    return (
      <svg width={gridW} height={gridH} style={{ display: "block" }}>
        {cells.map(({ col, row, intensity }) => (
          <rect
            key={`${col}-${row}`}
            x={col * (cellSize + gap)} y={row * (cellSize + gap)}
            width={cellSize} height={cellSize} rx={2}
            fill={cellColor(intensity)}
          />
        ))}
      </svg>
    );
  }

  function LangBar({ langs, totalB }: { langs: [string, number][]; totalB: number }) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 5, width: "100%" }}>
        <div style={{ display: "flex", height: 5, borderRadius: 3, overflow: "hidden", gap: 2 }}>
          {langs.map(([lang, bytes]) => (
            <div key={lang} style={{ width: `${(bytes / totalB) * 100}%`, height: "100%", borderRadius: 3, backgroundColor: LANG_COLORS[lang] ?? "#6b7280" }} />
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
          {langs.map(([lang, bytes]) => (
            <div key={lang} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: 2, backgroundColor: LANG_COLORS[lang] ?? "#6b7280" }} />
              <span style={{ fontSize: 10, color: "#71717a" }}>{lang}</span>
              <span style={{ fontSize: 9, color: "#3f3f46" }}>{((bytes / totalB) * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function LogoPill() {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7, display: "flex",
          alignItems: "center", justifyContent: "center",
          background: hexAlpha(ac, 0.1), border: `1px solid ${hexAlpha(ac, 0.2)}`,
        }}>
          <svg width="13" height="13" fill={ac} viewBox="0 0 24 24">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </div>
        <span style={{ color: "#52525b", fontSize: 13, fontWeight: 600 }}>Dev Analytics</span>
      </div>
    );
  }

  function ThemePill() {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        background: hexAlpha(ac, 0.06), border: `1px solid ${hexAlpha(ac, 0.12)}`,
        borderRadius: 999, padding: "4px 12px",
      }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: ac, boxShadow: `0 0 8px ${hexAlpha(ac, 0.5)}` }} />
        <span style={{ color: hexAlpha(ac, 0.7), fontSize: 11, fontWeight: 500 }}>{theme.label}</span>
      </div>
    );
  }

  // ── Background (shared) ────────────────────────────────────────

  function Background({ w, h }: { w: number; h: number }) {
    return (
      <>
        {/* Orbs */}
        <div style={{ position: "absolute", top: -h * 0.3, right: -w * 0.1, width: w * 0.5, height: w * 0.5, borderRadius: "50%", background: `radial-gradient(circle, ${hexAlpha(ac, 0.14)} 0%, transparent 60%)` }} />
        <div style={{ position: "absolute", bottom: -h * 0.35, left: -w * 0.1, width: w * 0.45, height: w * 0.45, borderRadius: "50%", background: `radial-gradient(circle, ${hexAlpha(ac, 0.07)} 0%, transparent 60%)` }} />
        {/* Dot grid */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.03, backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
        {/* Decorative lines */}
        <svg width={w} height={h} style={{ position: "absolute", top: 0, left: 0 }}>
          <line x1={w * 0.75} y1="0" x2={w} y2={h * 0.5} stroke={hexAlpha(ac, 0.07)} strokeWidth="1" />
          <line x1={w * 0.8} y1="0" x2={w} y2={h * 0.4} stroke={hexAlpha(ac, 0.04)} strokeWidth="1" />
          <circle cx={w * 0.93} cy={h * 0.13} r={h * 0.07} fill="none" stroke={hexAlpha(ac, 0.06)} strokeWidth="1" />
        </svg>
      </>
    );
  }

  // ══════════════════════════════════════════════
  // FORMAT: SQUARE (600×600) — dikey, sabit bölümler
  // Her bölümün px yüksekliği sabit — hiçbiri üst üste binemez
  // ══════════════════════════════════════════════
  if (format === "square") {
    // Heatmap: içerik genişliği = 600 - 2×36 = 528px
    // WEEKS × (CELL+GAP) - GAP = 528  →  CELL=10 GAP=3  →  WEEKS = (528+3)/13 = 40.8 → 40
    const PAD = 36;
    const innerW = 600 - PAD * 2; // 528px
    const CELL = 8; const GAP = 2;
    const WEEKS = Math.floor((innerW + GAP) / (CELL + GAP)); // ~52 hafta sığar, 26 yeterli
    const SQ_WEEKS = Math.min(WEEKS, 26);
    const { cells, gridW, gridH } = buildCells(SQ_WEEKS, CELL, GAP);

    return new ImageResponse(
      (
        <div style={{
          background: "#09090b", width: 600, height: 600,
          display: "flex", flexDirection: "column",
          position: "relative", overflow: "hidden", fontFamily: "sans-serif",
        }}>
          <Background w={600} h={600} />

          {/* Tüm içerik tek dikey flex sütunu — padding sabit */}
          <div style={{
            display: "flex", flexDirection: "column",
            width: "100%", height: "100%",
            padding: `${PAD}px ${PAD}px`,
            position: "relative", zIndex: 10,
            boxSizing: "border-box" as const,
          }}>

            {/* ① Logo + Tema — 26px yükseklik */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 26, flexShrink: 0 }}>
              <LogoPill />
              <ThemePill />
            </div>

            {/* ② Avatar + İsim — 20px margin top, 80px avatar + 38px metin = ~118px */}
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 24, flexShrink: 0 }}>
              {user.avatar_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar_url} width={80} height={80} alt=""
                  style={{ borderRadius: 40, border: `2px solid ${hexAlpha(ac, 0.35)}`, boxShadow: `0 0 28px ${hexAlpha(ac, 0.2)}`, flexShrink: 0 }}
                />
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
                <span style={{ color: "#fafafa", fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1, whiteSpace: "nowrap" as const }}>{displayName}</span>
                <span style={{ color: "#52525b", fontSize: 13, whiteSpace: "nowrap" as const }}>@{username}</span>
                {/* Tech tags yanında avatar ile aynı hizada */}
                {techTags.length > 0 && (
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" as const, marginTop: 6 }}>
                    {techTags.slice(0, 4).map((tag) => (
                      <span key={tag} style={{ fontSize: 9, color: hexAlpha(ac, 0.85), background: hexAlpha(ac, 0.08), border: `1px solid ${hexAlpha(ac, 0.18)}`, borderRadius: 4, padding: "2px 7px", fontWeight: 500, whiteSpace: "nowrap" as const }}>{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ③ Stats — 4 kutu, 16px margin top */}
            <div style={{ display: "flex", gap: 7, marginTop: 18, flexShrink: 0 }}>
              {[
                { label: "Commit", value: yearlyCommits.toLocaleString("tr-TR") },
                { label: "Streak", value: `${currentStreak}g` },
                { label: "Repos",  value: String(repoCount) },
                { label: "Aktif",  value: `${totalActiveDays}g` },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  display: "flex", flexDirection: "column", gap: 2, flex: 1,
                  background: "rgba(24,24,27,0.7)", border: "1px solid rgba(39,39,42,0.5)",
                  borderRadius: 8, padding: "7px 10px",
                }}>
                  <span style={{ color: "#52525b", fontSize: 8, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>{label}</span>
                  <span style={{ color: ac, fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</span>
                </div>
              ))}
            </div>

            {/* ④ Heatmap — tam genişlik, 16px margin top */}
            <div style={{ display: "flex", flexDirection: "column", gap: 0, marginTop: 18, flexShrink: 0 }}>
              <span style={{ color: "#3f3f46", fontSize: 9, fontWeight: 500, letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 6 }}>Contributions — Son 6 Ay</span>
              <svg width={gridW} height={gridH} style={{ display: "block" }}>
                {cells.map(({ col, row, intensity }) => (
                  <rect
                    key={`${col}-${row}`}
                    x={col * (CELL + GAP)} y={row * (CELL + GAP)}
                    width={CELL} height={CELL} rx={2}
                    fill={cellColor(intensity)}
                  />
                ))}
              </svg>
            </div>

            {/* ⑤ Dil bar — 14px margin top */}
            {topLangs.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 14, flexShrink: 0 }}>
                <div style={{ display: "flex", height: 5, borderRadius: 3, overflow: "hidden", gap: 2 }}>
                  {topLangs.map(([lang, bytes]) => (
                    <div key={lang} style={{ width: `${(bytes / totalBytes) * 100}%`, height: "100%", borderRadius: 3, backgroundColor: LANG_COLORS[lang] ?? "#6b7280" }} />
                  ))}
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
                  {topLangs.map(([lang, bytes]) => (
                    <div key={lang} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 5, height: 5, borderRadius: 2, backgroundColor: LANG_COLORS[lang] ?? "#6b7280" }} />
                      <span style={{ fontSize: 9, color: "#71717a" }}>{lang}</span>
                      <span style={{ fontSize: 8, color: "#3f3f46" }}>{((bytes / totalBytes) * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ⑥ Alt URL */}
            <div style={{ flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
              <span style={{ color: "#3f3f46", fontSize: 10 }}>devanalytics.app/@{username}</span>
            </div>
          </div>
        </div>
      ),
      { width: 600, height: 600, headers: { "Cache-Control": "public, max-age=3600", "Content-Disposition": `inline; filename="${username}-devcard-square.png"` } }
    );
  }

  // ══════════════════════════════════════════════
  // FORMAT: TWITTER (1500×500) — geniş, kompakt
  // ══════════════════════════════════════════════
  if (format === "twitter") {
    const CELL = 10; const GAP = 3;
    const WEEKS = 40;
    const { cells, gridW, gridH } = buildCells(WEEKS, CELL, GAP);

    return new ImageResponse(
      (
        <div style={{ background: "#09090b", width: 1500, height: 500, display: "flex", position: "relative", overflow: "hidden", fontFamily: "sans-serif" }}>
          <Background w={1500} h={500} />

          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", padding: "40px 60px", position: "relative", zIndex: 10 }}>
            {/* Top */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <LogoPill />
              <span style={{ color: "#3f3f46", fontSize: 13 }}>devanalytics.app/@{username}</span>
            </div>

            {/* Center */}
            <div style={{ display: "flex", gap: 60, alignItems: "center" }}>
              {/* Left: Avatar + name + tags */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 320 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
                  {user.avatar_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatar_url} width={76} height={76} alt=""
                      style={{ borderRadius: 38, border: `3px solid ${hexAlpha(ac, 0.3)}`, boxShadow: `0 0 30px ${hexAlpha(ac, 0.15)}` }}
                    />
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={{ color: "#fafafa", fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1 }}>{displayName}</span>
                    <span style={{ color: "#52525b", fontSize: 14 }}>@{username}</span>
                  </div>
                </div>
                {techTags.length > 0 && (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                    {techTags.map((tag) => (
                      <span key={tag} style={{ fontSize: 10, color: hexAlpha(ac, 0.8), background: hexAlpha(ac, 0.08), border: `1px solid ${hexAlpha(ac, 0.15)}`, borderRadius: 5, padding: "3px 9px", fontWeight: 500 }}>{tag}</span>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8 }}>
                  <StatBox label="Commit" value={yearlyCommits.toLocaleString("tr-TR")} small />
                  <StatBox label="Streak" value={`${currentStreak}g`} small />
                  <StatBox label="Repos" value={String(repoCount)} small />
                  <StatBox label="Aktif" value={`${totalActiveDays}g`} small />
                </div>
              </div>

              {/* Right: Heatmap + lang */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1, alignItems: "flex-end" }}>
                <HeatmapSvg cells={cells} gridW={gridW} gridH={gridH} cellSize={CELL} gap={GAP} />
                {topLangs.length > 0 && <LangBar langs={topLangs} totalB={totalBytes} />}
              </div>
            </div>

            {/* Bottom */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 20 }}>
                <span style={{ fontSize: 12, color: "#52525b" }}>⚡ En uzun: {longestStreak} gün</span>
                <span style={{ fontSize: 12, color: "#52525b" }}>🕐 Pik: {String(peakHour).padStart(2, "0")}:00</span>
                <span style={{ fontSize: 12, color: "#52525b" }}>{"<>"} {langMap.size} dil</span>
              </div>
              <ThemePill />
            </div>
          </div>
        </div>
      ),
      { width: 1500, height: 500, headers: { "Cache-Control": "public, max-age=3600", "Content-Disposition": `inline; filename="${username}-devcard-twitter.png"` } }
    );
  }

  // ══════════════════════════════════════════════
  // FORMAT: OG / LinkedIn (1200×630) — default
  // ══════════════════════════════════════════════
  const CELL = 11; const GAP = 3;
  const WEEKS = 30;
  const { cells, gridW, gridH } = buildCells(WEEKS, CELL, GAP);

  return new ImageResponse(
    (
      <div style={{ background: "#09090b", width: 1200, height: 630, display: "flex", position: "relative", overflow: "hidden", fontFamily: "sans-serif" }}>
        <Background w={1200} h={630} />

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", padding: "48px 56px", position: "relative", zIndex: 10 }}>
          {/* Top */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <LogoPill />
            <span style={{ color: "#3f3f46", fontSize: 13 }}>devanalytics.app/@{username}</span>
          </div>

          {/* Center */}
          <div style={{ display: "flex", gap: 48, alignItems: "center" }}>
            {/* Left */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 400 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                {user.avatar_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatar_url} width={88} height={88} alt=""
                    style={{ borderRadius: 44, border: `3px solid ${hexAlpha(ac, 0.3)}`, boxShadow: `0 0 30px ${hexAlpha(ac, 0.15)}` }}
                  />
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ color: "#fafafa", fontSize: 34, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.02em" }}>{displayName}</span>
                  <span style={{ color: "#52525b", fontSize: 15 }}>@{username}</span>
                </div>
              </div>

              {techTags.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
                  {techTags.map((tag) => (
                    <span key={tag} style={{ fontSize: 11, color: hexAlpha(ac, 0.8), background: hexAlpha(ac, 0.08), border: `1px solid ${hexAlpha(ac, 0.15)}`, borderRadius: 6, padding: "3px 10px", fontWeight: 500 }}>{tag}</span>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: 8 }}>
                <StatBox label="Commit" value={yearlyCommits.toLocaleString("tr-TR")} />
                <StatBox label="Streak" value={`${currentStreak}g`} />
                <StatBox label="Repos" value={String(repoCount)} />
                <StatBox label="Aktif" value={`${totalActiveDays}g`} />
              </div>
            </div>

            {/* Right */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20, flex: 1, alignItems: "flex-end" }}>
              <HeatmapSvg cells={cells} gridW={gridW} gridH={gridH} cellSize={CELL} gap={GAP} />
              {topLangs.length > 0 && <LangBar langs={topLangs} totalB={totalBytes} />}
            </div>
          </div>

          {/* Bottom */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 20 }}>
              <span style={{ fontSize: 12, color: "#52525b" }}>⚡ En uzun: {longestStreak} gün</span>
              <span style={{ fontSize: 12, color: "#52525b" }}>🕐 Pik: {String(peakHour).padStart(2, "0")}:00</span>
              <span style={{ fontSize: 12, color: "#52525b" }}>{"<>"} {langMap.size} dil</span>
            </div>
            <ThemePill />
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { "Cache-Control": "public, max-age=3600", "Content-Disposition": `inline; filename="${username}-devcard.png"` } }
  );
}
