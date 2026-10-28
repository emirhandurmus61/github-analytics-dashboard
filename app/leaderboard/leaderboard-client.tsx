"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, X, Eye, EyeOff, GitCommitHorizontal, Flame, Award } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { PageHeader } from "@/components/ui/page-header";
import { Panel, Seg, Dot } from "@/components/ui/primitives";
import { langColor } from "@/lib/ui/lang-colors";
import { ACCENT_HUE, isValidTheme } from "@/lib/themes";
import { fmtInt, cn, type Lang } from "@/lib/ui/format";
import { toggleLeaderboardOptIn } from "./actions";
import type { LeaderboardEntry, LeaderboardCategory } from "./page";

function hueOf(e: LeaderboardEntry) {
  return isValidTheme(e.accent) ? `var(--hue-${ACCENT_HUE[e.accent]})` : "var(--accent)";
}

function Avatar({ e, size }: { e: LeaderboardEntry; size: number }) {
  return e.avatarUrl ? (
    <Image src={e.avatarUrl} alt="" width={size} height={size} unoptimized className="shrink-0 rounded-full ring-1 ring-line-strong" style={{ width: size, height: size }} />
  ) : (
    <span className="grid shrink-0 place-items-center rounded-full bg-raised text-[11px] font-semibold text-ink-3" style={{ width: size, height: size }}>
      {e.username[0]?.toUpperCase()}
    </span>
  );
}

const RANK_COLOR = ["var(--hue-yellow)", "var(--ink-2)", "var(--hue-orange)"];

export default function LeaderboardClient({
  weekly,
  streaks,
  badges,
  currentUsername,
  isOptedIn: initialOptedIn,
}: {
  weekly: LeaderboardEntry[];
  streaks: LeaderboardEntry[];
  badges: LeaderboardEntry[];
  currentUsername: string | null;
  isOptedIn: boolean;
}) {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const T = (tr: string, en: string) => (l === "en" ? en : tr);
  const [cat, setCat] = useState<LeaderboardCategory>("weekly");
  const [q, setQ] = useState("");
  const [optedIn, setOptedIn] = useState(initialOptedIn);
  const [pending, start] = useTransition();

  const meta = {
    weekly: { key: "weeklyCommits" as const, unit: "commit", icon: GitCommitHorizontal, flag: "week", label: T("Bu hafta commit", "Commits this week") },
    streak: { key: "currentStreak" as const, unit: T("gün", "days"), icon: Flame, flag: "streak", label: T("Güncel seri", "Current streak") },
    badges: { key: "badgeCount" as const, unit: T("rozet", "badges"), icon: Award, flag: "badges", label: T("Kazanılan rozet", "Badges earned") },
  }[cat];

  const entries = cat === "weekly" ? weekly : cat === "streak" ? streaks : badges;
  const max = Math.max(...entries.map((e) => e[meta.key] as number), 1);
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? entries.filter((e) => e.username.toLowerCase().includes(s) || e.displayName.toLowerCase().includes(s)) : entries;
  }, [entries, q]);
  const me = currentUsername ? entries.find((e) => e.username === currentUsername) : null;
  const leader = entries[0];
  const gap = me && leader ? (leader[meta.key] as number) - (me[meta.key] as number) : 0;
  const ahead = me ? entries[me.rank - 2] : null;

  const toggle = () =>
    start(async () => {
      const r = await toggleLeaderboardOptIn(!optedIn);
      if (r.success) setOptedIn((v) => !v);
    });

  return (
    <div>
      <PageHeader
        title={T("Sıralama", "Leaderboard")}
        command={`rank --by=${meta.flag}`}
        subtitle={T(`${entries.length} geliştirici · her pazartesi sıfırlanır (haftalık)`, `${entries.length} developers · weekly board resets every Monday`)}
        actions={
          <Seg
            value={cat}
            onChange={setCat}
            options={[
              { value: "weekly", label: <><GitCommitHorizontal /> {T("Bu hafta", "This week")}</> },
              { value: "streak", label: <><Flame /> {T("Seri", "Streak")}</> },
              { value: "badges", label: <><Award /> {T("Rozet", "Badges")}</> },
            ]}
          />
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <div className="mb-3 flex items-center gap-2">
            <label className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-4" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={T("geliştirici ara", "find a developer")} className="input !h-8 !pl-8 font-mono !text-[12.5px]" aria-label={T("Geliştirici ara", "Find a developer")} />
              {q && (
                <button type="button" onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-4 hover:text-ink" aria-label={T("Temizle", "Clear")}>
                  <X size={13} />
                </button>
              )}
            </label>
            <span className="ml-auto font-mono text-[11.5px] text-ink-4">{meta.label}</span>
          </div>

          {entries.length === 0 ? (
            <div className="rounded-panel border border-dashed border-line-strong px-6 py-14 text-center">
              <p className="text-[14px] text-ink-2">{T("Henüz sıralamada kimse yok.", "Nobody is on the board yet.")}</p>
              <p className="mt-1 text-[12.5px] text-ink-3">{T("Senkron yapan geliştiriciler burada görünür.", "Developers who sync show up here.")}</p>
            </div>
          ) : (
            <ol className="overflow-hidden rounded-panel border border-line bg-surface">
              <li className="hidden grid-cols-[52px_minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,1.6fr)] gap-3 border-b border-line px-3 py-2 text-[11px] text-ink-4 sm:grid">
                <span>#</span>
                <span>{T("geliştirici", "developer")}</span>
                <span>{T("ana dil", "top language")}</span>
                <span>{meta.label.toLowerCase()}</span>
              </li>
              {shown.map((e) => {
                const v = e[meta.key] as number;
                const top = e.rank <= 3;
                const mine = e.username === currentUsername;
                return (
                  <li key={e.username} className={cn("relative border-b border-line last:border-0", mine && "bg-[var(--accent-soft)]")}>
                    {mine && <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-accent" aria-hidden />}
                    <Link
                      href={`/u/${e.username}`}
                      className={cn(
                        "grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 px-3 hover:bg-raised sm:grid-cols-[52px_minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,1.6fr)]",
                        top ? "py-3" : "py-2",
                      )}
                    >
                      <span className={cn("font-mono font-semibold num", top ? "text-[18px]" : "text-[13px] text-ink-3")} style={top ? { color: RANK_COLOR[e.rank - 1] } : undefined}>
                        {e.rank}
                      </span>
                      <span className="flex min-w-0 items-center gap-2.5">
                        <Avatar e={e} size={top ? 34 : 26} />
                        <span className="min-w-0">
                          <span className={cn("block truncate text-ink", top ? "text-[14px] font-semibold" : "text-[13px] font-medium")}>{e.displayName}</span>
                          <span className="block truncate font-mono text-[11.5px] text-ink-4">@{e.username}</span>
                        </span>
                      </span>
                      <span className="hidden min-w-0 items-center gap-1.5 text-[12.5px] text-ink-2 sm:flex">
                        {e.topLang ? (
                          <>
                            <Dot color={langColor(e.topLang)} size={7} />
                            <span className="truncate">{e.topLang}</span>
                          </>
                        ) : (
                          <span className="text-ink-4">–</span>
                        )}
                      </span>
                      <span className="flex items-center gap-3">
                        <span className="relative hidden h-2 flex-1 overflow-hidden rounded-full bg-inset sm:block">
                          <span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(v / max) * 100}%`, background: hueOf(e) }} />
                        </span>
                        <span className={cn("w-12 text-right font-mono num", top ? "text-[16px] font-semibold text-ink" : "text-[13px] text-ink-2")}>{fmtInt(v, l)}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
              {shown.length === 0 && <li className="px-4 py-8 text-center text-[13px] text-ink-3">{T("Bu isimle kimse yok.", "No one by that name.")}</li>}
            </ol>
          )}
        </div>

        <aside className="order-first flex flex-col gap-4 xl:order-none">
          {currentUsername ? (
            <Panel title={T("Senin konumun", "Your position")} icon={meta.icon} className="!h-auto" tone={me ? "accent" : undefined}>
              {me ? (
                <div>
                  <div className="flex items-end gap-4">
                    <div>
                      <div className="figure text-[40px]">#{me.rank}</div>
                      <div className="label mt-1.5">{T(`${entries.length} kişiden`, `of ${entries.length}`)}</div>
                    </div>
                    <div>
                      <div className="figure text-[24px]">{fmtInt(me[meta.key] as number, l)}</div>
                      <div className="label mt-1.5">{meta.unit}</div>
                    </div>
                  </div>
                  <p className="mt-3 text-[12.5px] text-ink-3">
                    {me.rank === 1
                      ? T("Zirvedesin. Bir sonraki satırla arandaki fark:", "You are on top. Lead over the next row:") + ` ${fmtInt((me[meta.key] as number) - ((entries[1]?.[meta.key] as number) ?? 0), l)} ${meta.unit}.`
                      : ahead
                        ? T(`@${ahead.username} ile arandaki fark ${fmtInt((ahead[meta.key] as number) - (me[meta.key] as number), l)} ${meta.unit}; lidere ${fmtInt(gap, l)}.`, `${fmtInt((ahead[meta.key] as number) - (me[meta.key] as number), l)} ${meta.unit} behind @${ahead.username}; ${fmtInt(gap, l)} behind the leader.`)
                        : null}
                  </p>
                </div>
              ) : (
                <p className="text-[12.5px] text-ink-3">{optedIn ? T("Bu listede henüz yoksun. Bir senkron sonrası görünürsün.", "You are not listed yet. You will appear after a sync.") : T("Şu an listede gizlisin.", "You are hidden from the board.")}</p>
              )}
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3">
                <span className="text-[12.5px] text-ink-2">{optedIn ? T("Sıralamada görünüyorsun", "You are visible") : T("Sıralamada gizlisin", "You are hidden")}</span>
                <button type="button" className="btn btn-sm" onClick={toggle} disabled={pending}>
                  {optedIn ? <EyeOff /> : <Eye />}
                  {optedIn ? T("Gizlen", "Hide me") : T("Görün", "Show me")}
                </button>
              </div>
            </Panel>
          ) : (
            <Panel title={T("Listeye katıl", "Join the board")} className="!h-auto">
              <p className="text-[12.5px] text-ink-3">{T("GitHub ile giriş yap; ilk senkrondan sonra haftalık sıralamada yer alırsın. İstediğin an gizlenebilirsin.", "Sign in with GitHub; after your first sync you appear on the weekly board. You can hide any time.")}</p>
            </Panel>
          )}
          <Panel title={T("Nasıl sıralanır", "How it ranks")} className="!h-auto hidden xl:flex">
            <ul className="flex flex-col gap-2 text-[12.5px] text-ink-3">
              <li><span className="font-mono text-ink-2">week</span> · {T("pazartesiden bu yana commit", "commits since Monday")}</li>
              <li><span className="font-mono text-ink-2">streak</span> · {T("bugüne kadar kesintisiz gün", "unbroken days up to today")}</li>
              <li><span className="font-mono text-ink-2">badges</span> · {T("açılmış rozet seviyesi", "unlocked badge tiers")}</li>
              <li className="pt-1 text-[11.5px] text-ink-4">{T("Çubuk rengi, o geliştiricinin kendi vurgu rengi.", "Bar color is each developer's own accent.")}</li>
            </ul>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
