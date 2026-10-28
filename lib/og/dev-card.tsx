import { ImageResponse } from "next/og";
import { supabaseAdmin } from "@/lib/supabase";
import { calculateStreaks } from "@/lib/streak";
import { daysAgoISO } from "@/lib/ui/format";
import { imagePalette } from "@/lib/og/palette";
import { ogFonts, OG_MONO, OG_SANS } from "@/lib/og/fonts";
import { Brand, Stat, Heat, LangBar, Tag, Avatar } from "@/lib/og/parts";

const FORMATS = {
  og: { width: 1200, height: 630 },
  square: { width: 600, height: 600 },
  twitter: { width: 1500, height: 500 },
} as const;
type CardFormat = keyof typeof FORMATS;

/** The Developer Card image; also used as the profile's Open Graph image. */
export async function devCardImage({ username, format: fp, searchParams, lang }: { username: string; format?: string | null; searchParams?: URLSearchParams; lang: "tr" | "en" }) {
  const url = { searchParams: searchParams ?? new URLSearchParams() };
  const format: CardFormat = ((fp ?? "og") in FORMATS ? fp ?? "og" : "og") as CardFormat;
  const { width, height } = FORMATS[format];
  const en = lang === "en";
  const loc = en ? "en-US" : "tr-TR";

  const { data: user } = await supabaseAdmin.from("users").select("id, name, avatar_url, theme_accent, bio, tech_tags").eq("username", username).single();
  if (!user) return null;
  const p = imagePalette(user.theme_accent, url.searchParams);

  const { data: own } = await supabaseAdmin.from("repositories").select("id").eq("user_id", user.id).eq("is_fork", false);
  const ownIds = (own ?? []).map((r) => r.id);
  const [reposRes, daysRes, langsRes, commitsRes, fonts] = await Promise.all([
    supabaseAdmin.from("repositories").select("count", { count: "exact", head: true }).eq("user_id", user.id),
    supabaseAdmin.from("daily_stats").select("date, commit_count").eq("user_id", user.id).gte("date", daysAgoISO(365).slice(0, 10)).order("date", { ascending: true }),
    supabaseAdmin.from("repo_languages").select("language, bytes").in("repo_id", ownIds),
    supabaseAdmin.from("commits").select("committed_at").in("repo_id", ownIds).gte("committed_at", daysAgoISO(365)),
    ogFonts(),
  ]);

  const days = daysRes.data ?? [];
  const { currentStreak, longestStreak, totalActiveDays } = calculateStreaks(days.filter((d) => d.commit_count > 0).map((d) => d.date));
  const commits = days.reduce((s, d) => s + d.commit_count, 0);
  const langMap = new Map<string, number>();
  for (const r of langsRes.data ?? []) langMap.set(r.language, (langMap.get(r.language) ?? 0) + r.bytes);
  const langs = [...langMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const hours = new Array(24).fill(0);
  for (const { committed_at } of commitsRes.data ?? []) hours[new Date(committed_at).getHours()]++;
  const peak = hours.indexOf(Math.max(...hours));
  const name = user.name ?? username;
  const tags: string[] = Array.isArray(user.tech_tags) ? user.tech_tags.slice(0, 4) : [];
  const repoCount = reposRes.count ?? 0;
  const foot = `${en ? "peak" : "zirve"} ${String(peak).padStart(2, "0")}:00 · ${repoCount} repo${langs[0] ? ` · ${langs[0][0]}` : ""}`;

  const stats = [
    { v: commits.toLocaleString(loc), k: en ? "commits / yr" : "commit / yıl", a: true },
    { v: `${currentStreak}`, k: en ? "day streak" : "günlük seri" },
    { v: `${longestStreak}`, k: en ? "best streak" : "en uzun seri" },
    { v: `${totalActiveDays}`, k: en ? "active days" : "aktif gün" },
  ];

  const frame = { display: "flex", width, height, background: p.bg0, fontFamily: OG_SANS, color: p.ink1 } as const;
  const opts = { width, height, fonts: fonts.length ? fonts : undefined };

  if (format === "square") {
    return new ImageResponse(
      (
        <div style={{ ...frame, flexDirection: "column", padding: 40, gap: 26 }}>
          <Brand p={p} right={`@${username}`} />
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <Avatar p={p} src={user.avatar_url} size={84} name={name} />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 34, fontWeight: 800, letterSpacing: -1, lineHeight: 1.05 }}>{name}</span>
              <span style={{ fontFamily: OG_MONO, fontSize: 17, color: p.ink3 }}>@{username}</span>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 28, rowGap: 22 }}>
            {stats.map((s) => (
              <div key={s.k} style={{ display: "flex", width: 236 }}>
                <Stat p={p} value={s.v} label={s.k} accent={s.a} size={38} />
              </div>
            ))}
          </div>
          <Heat p={p} days={days} weeks={29} cell={14} gap={4} />
          <LangBar p={p} langs={langs.slice(0, 4)} width={520} size={14} />
        </div>
      ),
      opts,
    );
  }

  if (format === "twitter") {
    return new ImageResponse(
      (
        <div style={{ ...frame, padding: "44px 56px", gap: 56 }}>
          <div style={{ display: "flex", flexDirection: "column", width: 440, gap: 18 }}>
            <Brand p={p} />
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 16 }}>
              <Avatar p={p} src={user.avatar_url} size={92} name={name} />
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1.2, lineHeight: 1.05 }}>{name}</span>
                <span style={{ fontFamily: OG_MONO, fontSize: 19, color: p.ink3 }}>@{username}</span>
              </div>
            </div>
            {user.bio && <span style={{ fontSize: 19, lineHeight: 1.45, color: p.ink2 }}>{String(user.bio).slice(0, 110)}</span>}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{tags.map((t) => <Tag key={t} p={p}>{t}</Tag>)}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 26, justifyContent: "center" }}>
            <div style={{ display: "flex", gap: 52 }}>
              {stats.map((s) => <Stat key={s.k} p={p} value={s.v} label={s.k} accent={s.a} size={46} />)}
            </div>
            <Heat p={p} days={days} weeks={53} cell={13} gap={3} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <LangBar p={p} langs={langs.slice(0, 4)} width={560} size={15} />
              <span style={{ fontFamily: OG_MONO, fontSize: 15, color: p.ink4 }}>{foot}</span>
            </div>
          </div>
        </div>
      ),
      opts,
    );
  }

  return new ImageResponse(
    (
      <div style={{ ...frame, flexDirection: "column", padding: "48px 56px", gap: 34 }}>
        <Brand p={p} right={`devboard.app/u/${username}`} />
        <div style={{ display: "flex", gap: 48, flex: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", width: 380, gap: 16 }}>
            <Avatar p={p} src={user.avatar_url} size={112} name={name} />
            <span style={{ fontSize: 46, fontWeight: 800, letterSpacing: -1.5, lineHeight: 1.02, marginTop: 6 }}>{name}</span>
            <span style={{ fontFamily: OG_MONO, fontSize: 20, color: p.ink3 }}>@{username}</span>
            {user.bio && <span style={{ fontSize: 18, lineHeight: 1.45, color: p.ink2 }}>{String(user.bio).slice(0, 120)}</span>}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>{tags.map((t) => <Tag key={t} p={p}>{t}</Tag>)}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 30 }}>
            <div style={{ display: "flex", gap: 44 }}>
              {stats.map((s) => <Stat key={s.k} p={p} value={s.v} label={s.k} accent={s.a} size={44} />)}
            </div>
            <Heat p={p} days={days} weeks={44} cell={11} gap={3} />
            <LangBar p={p} langs={langs.slice(0, 4)} width={620} size={15} />
            <span style={{ fontFamily: OG_MONO, fontSize: 15, color: p.ink4, marginTop: "auto" }}>{foot}</span>
          </div>
        </div>
      </div>
    ),
    opts,
  );
}
