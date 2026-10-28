import { ImageResponse } from "next/og";
import type { ReactNode } from "react";
import { supabaseAdmin } from "@/lib/supabase";
import { calculateStreaks } from "@/lib/streak";
import { yearPersona } from "@/lib/wrapped";
import { imagePalette, langHex, quartileLevel, type ImagePalette } from "@/lib/og/palette";
import { ogFonts, OG_MONO, OG_SANS } from "@/lib/og/fonts";
import { Mark } from "@/lib/og/parts";
import { langOf } from "@/lib/og/widget-data";
import { MONTHS_LONG, MONTHS_SHORT } from "@/lib/ui/format";

export const runtime = "nodejs";
export const revalidate = 3600;

const W = 1080;
const H = 1080;
const DAYS_TR = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
const DAYS_EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function Squares({ p, add, del, n, size }: { p: ImagePalette; add: number; del: number; n: number; size: number }) {
  const t = add + del;
  const g = t ? Math.round((add / t) * n) : 0;
  return (
    <div style={{ display: "flex", gap: size / 5 }}>
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} style={{ width: size, height: size, borderRadius: size / 5, background: t === 0 ? p.bg3 : i < g ? p.good : p.bad }} />
      ))}
    </div>
  );
}

export async function GET(req: Request, { params }: { params: Promise<{ username: string; year: string; slide: string }> }) {
  const { username, year, slide } = await params;
  const yearNum = parseInt(year, 10);
  const n = parseInt(slide, 10);
  if (isNaN(yearNum) || isNaN(n) || n < 0 || n > 9) return new Response("Bad request", { status: 400 });
  const l = langOf(req);
  const en = l === "en";
  const loc = en ? "en-US" : "tr-TR";
  const T = (tr: string, e: string) => (en ? e : tr);

  const { data: user } = await supabaseAdmin.from("users").select("id, name, theme_accent").eq("username", username).single();
  if (!user) return new Response("Not found", { status: 404 });
  const p = imagePalette(user.theme_accent, new URL(req.url).searchParams);
  const name = user.name ?? username;
  const ys = `${yearNum}-01-01`;
  const ye = `${yearNum}-12-31`;

  const { data: repos } = await supabaseAdmin.from("repositories").select("id, name, is_fork, created_at, stars").eq("user_id", user.id);
  const own = (repos ?? []).filter((r) => !r.is_fork);
  const ownIds = own.map((r) => r.id);
  const [daysRes, commitsRes, langsRes, prsRes, fonts] = await Promise.all([
    supabaseAdmin.from("daily_stats").select("date, commit_count, lines_added, lines_deleted").eq("user_id", user.id).gte("date", ys).lte("date", ye),
    supabaseAdmin.from("commits").select("committed_at, repo_id, message, additions, deletions").in("repo_id", ownIds).gte("committed_at", `${ys}T00:00:00Z`).lte("committed_at", `${ye}T23:59:59Z`),
    supabaseAdmin.from("repo_languages").select("language, bytes").in("repo_id", ownIds),
    supabaseAdmin.from("pull_requests").select("merged").in("repo_id", ownIds).gte("created_at", ys).lte("created_at", `${ye}T23:59:59Z`),
    ogFonts(),
  ]);
  const days = daysRes.data ?? [];
  const commits = commitsRes.data ?? [];
  const total = commits.length;
  const added = days.reduce((s, d) => s + (d.lines_added ?? 0), 0);
  const deleted = days.reduce((s, d) => s + (d.lines_deleted ?? 0), 0);
  const { longestStreak, totalActiveDays } = calculateStreaks(days.filter((d) => d.commit_count > 0).map((d) => d.date));
  const months = new Array(12).fill(0);
  for (const d of days) months[parseInt(d.date.slice(5, 7), 10) - 1] += d.commit_count;
  const peakM = months.indexOf(Math.max(...months));
  const dayCounts = new Array(7).fill(0);
  const hourCounts = new Array(24).fill(0);
  for (const c of commits) {
    const dt = new Date(c.committed_at);
    dayCounts[(dt.getDay() + 6) % 7]++;
    hourCounts[dt.getHours()]++;
  }
  const peakD = dayCounts.indexOf(Math.max(...dayCounts));
  const peakH = hourCounts.indexOf(Math.max(...hourCounts));
  const langMap = new Map<string, number>();
  for (const r of langsRes.data ?? []) langMap.set(r.language, (langMap.get(r.language) ?? 0) + r.bytes);
  const langs = [...langMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  const langTotal = Math.max(1, langs.reduce((s, [, b]) => s + b, 0));
  const big = [...commits].sort((a, b) => (b.additions ?? 0) + (b.deletions ?? 0) - ((a.additions ?? 0) + (a.deletions ?? 0)))[0];
  const activeRepoIds = new Set(commits.map((c) => c.repo_id));
  const repoCommits = new Map<string, number>();
  for (const c of commits) repoCommits.set(c.repo_id, (repoCommits.get(c.repo_id) ?? 0) + 1);
  const topRepoEntry = [...repoCommits.entries()].sort((a, b) => b[1] - a[1])[0];
  const topRepo = topRepoEntry ? own.find((r) => r.id === topRepoEntry[0]) : null;
  const created = own.filter((r) => r.created_at?.startsWith(String(yearNum))).length;
  const merged = (prsRes.data ?? []).filter((x) => x.merged).length;
  const stars = own.reduce((s, r) => s + (r.stars ?? 0), 0);
  const { archetype } = yearPersona({ commitDates: commits.map((c) => c.committed_at), totalCommits: total, longestStreak, activeRepos: activeRepoIds.size, linesAdded: added, linesDeleted: deleted });
  const arch = en ? archetype.en : archetype;

  const huge = (size: number, color = p.ink1, mono = true) => ({ fontFamily: mono ? OG_MONO : OG_SANS, fontSize: size, fontWeight: 800, letterSpacing: -size * 0.05, lineHeight: 0.9, color }) as const;
  const lead = { fontSize: 38, fontWeight: 600, lineHeight: 1.25, color: p.ink1 } as const;
  const kickers = [
    `devboard wrapped --year ${yearNum}`,
    T("toplam commit", "total commits"),
    "git diff --shortstat",
    T("en yoğun ay", "busiest month"),
    T("çalışma kimliğin", "how you work"),
    T("dillerin", "your languages"),
    T("repolar ve işbirliği", "repos and collaboration"),
    "git show --stat",
    T(`${yearNum} katkı haritası`, `${yearNum} contributions`),
    T("özet", "summary"),
  ];

  const mMax = Math.max(...months, 1);
  const level = quartileLevel(days.map((d) => d.commit_count));
  const dmap = new Map(days.map((d) => [d.date, d.commit_count]));
  const yearGrid = () => {
    const start = new Date(yearNum, 0, 1, 12);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    const cols: (number | null)[][] = [];
    const cur = new Date(start);
    while (cur.getFullYear() <= yearNum && cols.length < 54) {
      const col: (number | null)[] = [];
      for (let i = 0; i < 7; i++) {
        const k = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
        col.push(cur.getFullYear() === yearNum ? level(dmap.get(k) ?? 0) : null);
        cur.setDate(cur.getDate() + 1);
      }
      cols.push(col);
    }
    return cols;
  };

  const bodies: ReactNode[] = [
    <div key={0} style={{ display: "flex", flexDirection: "column" }}>
      <span style={{ fontFamily: OG_MONO, fontSize: 26, color: p.ink3 }}>
        <span style={{ color: p.ac }}>$&nbsp;</span>git log --author={username}
      </span>
      <span style={{ ...huge(330), marginTop: 30 }}>{yearNum}</span>
      <span style={{ ...lead, marginTop: 40, maxWidth: 820 }}>{T(`${name} için bir yıl, commit commit.`, `${name}'s year, one commit at a time.`)}</span>
    </div>,
    <div key={1} style={{ display: "flex", flexDirection: "column" }}>
      <span style={huge(Math.min(300, 1600 / Math.max(3, String(total).length)), p.ac)}>{total.toLocaleString(loc)}</span>
      <span style={{ ...lead, marginTop: 40 }}>{T(`commit, ${totalActiveDays} farklı günde.`, `commits, across ${totalActiveDays} different days.`)}</span>
      <span style={{ fontSize: 26, color: p.ink3, marginTop: 18 }}>{T(`Aktif bir günde ortalama ${(total / Math.max(1, totalActiveDays)).toFixed(1)} commit.`, `About ${(total / Math.max(1, totalActiveDays)).toFixed(1)} commits on an active day.`)}</span>
    </div>,
    <div key={2} style={{ display: "flex", flexDirection: "column" }}>
      <span style={huge(Math.min(190, 1500 / Math.max(4, `+${added.toLocaleString(loc)}`.length)), p.good)}>+{added.toLocaleString(loc)}</span>
      <span style={{ ...huge(Math.min(130, 1100 / Math.max(4, `-${deleted.toLocaleString(loc)}`.length)), p.bad), marginTop: 16 }}>−{deleted.toLocaleString(loc)}</span>
      <div style={{ display: "flex", marginTop: 48 }}>
        <Squares p={p} add={added} del={deleted} n={20} size={34} />
      </div>
      <span style={{ fontSize: 30, color: p.ink2, marginTop: 36 }}>{T("Net", "Net")} {added >= deleted ? "+" : "−"}{Math.abs(added - deleted).toLocaleString(loc)} {T("satır", "lines")}</span>
    </div>,
    <div key={3} style={{ display: "flex", flexDirection: "column" }}>
      <span style={huge(150, p.ink1, false)}>{MONTHS_LONG[l][peakM]}</span>
      <span style={{ fontSize: 32, color: p.ink2, marginTop: 20 }}>{T(`${months[peakM].toLocaleString(loc)} commit ile yılın zirvesi.`, `The peak of the year with ${months[peakM].toLocaleString(loc)} commits.`)}</span>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 14, height: 380, marginTop: 60 }}>
        {months.map((v, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", gap: 12, width: 62, height: 380 }}>
            <div style={{ width: 62, height: Math.max(6, (v / mMax) * 320), borderRadius: 6, background: i === peakM ? p.ac : p.heat[2] }} />
            <span style={{ fontFamily: OG_MONO, fontSize: 18, color: i === peakM ? p.ac : p.ink4 }}>{MONTHS_SHORT[l][i]}</span>
          </div>
        ))}
      </div>
    </div>,
    <div key={4} style={{ display: "flex", flexDirection: "column" }}>
      <span style={{ fontFamily: OG_MONO, fontSize: 26, color: p.ac }}>{arch.badge}</span>
      <span style={{ ...huge(124, p.ink1, false), marginTop: 22, maxWidth: 900 }}>{arch.title}</span>
      <span style={{ fontSize: 32, lineHeight: 1.4, color: p.ink2, marginTop: 32, maxWidth: 860 }}>{arch.tagline}</span>
      <div style={{ display: "flex", gap: 70, marginTop: 70 }}>
        {[
          [T("en yoğun gün", "busiest day"), (en ? DAYS_EN : DAYS_TR)[peakD]],
          [T("en yoğun saat", "busiest hour"), `${String(peakH).padStart(2, "0")}:00`],
          [T("en uzun seri", "longest streak"), `${longestStreak} ${T("gün", "days")}`],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{ fontSize: 22, color: p.ink3 }}>{k}</span>
            <span style={{ fontFamily: OG_MONO, fontSize: 38, fontWeight: 800, color: p.ink1 }}>{v}</span>
          </div>
        ))}
      </div>
    </div>,
    <div key={5} style={{ display: "flex", flexDirection: "column" }}>
      {langs[0] ? (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontFamily: OG_MONO, fontSize: 28, color: p.ink3 }}>#1</span>
          <span style={huge(Math.min(190, 1500 / Math.max(5, langs[0][0].length)), langHex(langs[0][0], p), false)}>{langs[0][0]}</span>
          <div style={{ display: "flex", width: 920, height: 22, borderRadius: 11, overflow: "hidden", background: p.bg3, marginTop: 56 }}>
            {langs.map(([x, b]) => (
              <div key={x} style={{ width: (b / langTotal) * 920, height: 22, background: langHex(x, p), marginRight: 3 }} />
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", width: 920, marginTop: 36, rowGap: 18 }}>
            {langs.map(([x, b], i) => (
              <div key={x} style={{ display: "flex", alignItems: "baseline", width: 460, gap: 16 }}>
                <span style={{ fontFamily: OG_MONO, fontSize: 22, color: p.ink4, width: 30 }}>{i + 1}</span>
                <span style={{ fontSize: 30, color: p.ink1 }}>{x}</span>
                <span style={{ fontFamily: OG_MONO, fontSize: 26, color: p.ink3 }}>{Math.round((b / langTotal) * 100)}%</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <span style={lead}>{T("Bu yıl dil verisi yok.", "No language data this year.")}</span>
      )}
    </div>,
    <div key={6} style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", flexWrap: "wrap", width: 920, rowGap: 64 }}>
        {[
          [created, T("yeni repo", "new repos")],
          [activeRepoIds.size, T("aktif repo", "active repos")],
          [merged, T("birleşen PR", "merged PRs")],
          [stars, T("yıldız", "stars")],
        ].map(([v, k]) => (
          <div key={k as string} style={{ display: "flex", flexDirection: "column", width: 460, gap: 14 }}>
            <span style={huge(150)}>{(v as number).toLocaleString(loc)}</span>
            <span style={{ fontSize: 28, color: p.ink3 }}>{k}</span>
          </div>
        ))}
      </div>
      {topRepo && (
        <span style={{ fontSize: 28, color: p.ink2, marginTop: 64, borderTop: `1px solid ${p.line}`, paddingTop: 30 }}>
          {T("En çok commit:", "Most commits:")}&nbsp;<span style={{ fontFamily: OG_MONO, color: p.ink1 }}>{topRepo.name}</span>&nbsp;·&nbsp;<span style={{ fontFamily: OG_MONO }}>{topRepoEntry![1]}</span>
        </span>
      )}
    </div>,
    <div key={7} style={{ display: "flex", flexDirection: "column", background: p.bg1, border: `1px solid ${p.line}`, borderRadius: 16, padding: 52 }}>
      {big ? (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontFamily: OG_MONO, fontSize: 22, color: p.ink3 }}>commit · {new Date(big.committed_at).toLocaleDateString(loc, { day: "numeric", month: "long" })}</span>
          <span style={{ fontFamily: OG_MONO, fontSize: 44, fontWeight: 600, lineHeight: 1.25, color: p.ink1, marginTop: 30 }}>{(big.message ?? "").split("\n")[0].slice(0, 70) || T("(mesaj yok)", "(no message)")}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 36, marginTop: 56 }}>
            <span style={huge(84, p.good)}>+{(big.additions ?? 0).toLocaleString(loc)}</span>
            <span style={huge(84, p.bad)}>−{(big.deletions ?? 0).toLocaleString(loc)}</span>
          </div>
          <div style={{ display: "flex", marginTop: 36 }}>
            <Squares p={p} add={big.additions ?? 0} del={big.deletions ?? 0} n={10} size={30} />
          </div>
        </div>
      ) : (
        <span style={lead}>{T("Bu yıl satır bilgisi olan commit yok.", "No commits with line stats this year.")}</span>
      )}
    </div>,
    <div key={8} style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", gap: 3 }}>
        {yearGrid().map((col, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {col.map((lv, j) => (
              <div key={j} style={{ width: 14.5, height: 14.5, borderRadius: 3, background: lv === null ? "transparent" : p.heat[lv] }} />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 60, marginTop: 56 }}>
        <span style={{ fontSize: 30, color: p.ink2 }}>
          <span style={{ fontFamily: OG_MONO, fontSize: 56, fontWeight: 800, color: p.ink1 }}>{totalActiveDays}</span>&nbsp;{T("aktif gün", "active days")}
        </span>
        <span style={{ fontSize: 30, color: p.ink2 }}>
          <span style={{ fontFamily: OG_MONO, fontSize: 56, fontWeight: 800, color: p.ink1 }}>{Math.round((totalActiveDays / 365) * 100)}%</span>&nbsp;{T("yılın", "of the year")}
        </span>
      </div>
    </div>,
    <div key={9} style={{ display: "flex", flexDirection: "column" }}>
      <span style={{ fontFamily: OG_MONO, fontSize: 26, color: p.ink3 }}>@{username} · {yearNum}</span>
      <span style={{ ...huge(110, p.ink1, false), marginTop: 18 }}>{arch.title}</span>
      <div style={{ display: "flex", flexWrap: "wrap", width: 920, marginTop: 60, border: `1px solid ${p.line}`, borderRadius: 16, overflow: "hidden" }}>
        {[
          [total.toLocaleString(loc), "commit"],
          [`${longestStreak} ${T("gün", "d")}`, T("en uzun seri", "longest streak")],
          [`+${added.toLocaleString(loc)}`, T("eklenen satır", "lines added")],
          [langs[0]?.[0] ?? "–", T("ana dil", "top language")],
          [MONTHS_SHORT[l][peakM], T("zirve ayı", "peak month")],
          [`${String(peakH).padStart(2, "0")}:00`, T("zirve saati", "peak hour")],
        ].map(([v, k], i) => (
          <div key={k} style={{ display: "flex", flexDirection: "column", gap: 8, width: 459, padding: 30, background: p.bg1, borderTop: i > 1 ? `1px solid ${p.line}` : "none", borderLeft: i % 2 ? `1px solid ${p.line}` : "none" }}>
            <span style={{ fontSize: 22, color: p.ink3 }}>{k}</span>
            <span style={{ fontFamily: OG_MONO, fontSize: 44, fontWeight: 800, color: p.ink1 }}>{v}</span>
          </div>
        ))}
      </div>
    </div>,
  ];

  return new ImageResponse(
    (
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: W, height: H, padding: 80, background: p.bg0, color: p.ink1, fontFamily: OG_SANS }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Mark p={p} size={26} />
            <span style={{ fontFamily: OG_MONO, fontSize: 24, color: p.ink3 }}>{kickers[n]}</span>
          </div>
          <span style={{ fontFamily: OG_MONO, fontSize: 24, color: p.ink4 }}>
            {String(n + 1).padStart(2, "0")}/10
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>{bodies[n]}</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: OG_MONO, fontSize: 22, color: p.ink4 }}>
          <span>devboard.app/u/{username}/{yearNum}</span>
          <span>@{username}</span>
        </div>
      </div>
    ),
    { width: W, height: H, fonts: fonts.length ? fonts : undefined },
  );
}
