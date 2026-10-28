"use client";

import Image from "next/image";
import Link from "next/link";
import Markdown from "@/components/markdown";
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Star, GitFork, Check, Copy, Download, ExternalLink, Pencil, Users, UserPlus, UserCheck, Link2,
  FileText, Flame, Target, Hammer,
  FolderGit2, Pin, Clapperboard, BadgeCheck, Globe,
} from "lucide-react";
import { type Badge, getLocalizedBadge } from "@/lib/badges";
import type { DeveloperDNA } from "@/lib/developer-dna";
import { useLanguage } from "@/lib/i18n";
import { Panel, Dot } from "@/components/ui/primitives";
import { WidgetSlotProvider } from "@/components/ui/widget-size";
import ContributionHeatmap from "@/app/dashboard/contribution-heatmap";
import DeveloperDNACard from "@/app/dashboard/developer-dna";
import { Shield2 } from "@/app/dashboard/badge-collection";
import { langColor } from "@/lib/ui/lang-colors";
import { fmtCompact, fmtInt, fmtPct, cn, type Lang } from "@/lib/ui/format";
import { useOrigin } from "@/lib/ui/hooks";

/* ─── Types ─── */


type DayData = { date: string; commit_count: number };

type RepoData = {
  name: string;
  full_name: string;
  language: string | null;
  stars: number;
  forks: number;
  description?: string | null;
};

type LangData = { lang: string; bytes: number; pct: number; color: string };

type SocialLinks = {
  twitter: string | null;
  linkedin: string | null;
  website: string | null;
  discord: string | null;
};

type ProfileProps = {
  username: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  profileReadme: string | null;
  readmeSource?: "github" | "custom";
  currentlyWorkingOn: string | null;
  yearlyGoal: string | null;
  techTags: string[];
  stats: { repoCount: number; commitCount: number; languageCount: number; activeDays: number };
  currentStreak: number;
  longestStreak: number;
  earnedBadges: Badge[];
  pinnedRepos: RepoData[];
  topRepos: RepoData[];
  topLanguages: LangData[];
  heatmapData: DayData[];
  widgetOrder: string[];
  widgets: Record<string, boolean>;
  socialLinks?: SocialLinks;
  developerDna?: DeveloperDNA | null;
  recordView: (userId: string) => Promise<void>;
  isOwner?: boolean;
  isLoggedIn?: boolean;
};

/* ─── README ─── */

function ProfileReadme({ content, isOwner, source = "github" }: { content: string; username: string; isOwner?: boolean; source?: "github" | "custom" }) {
  const { lang } = useLanguage();
  const [copied, setCopied] = useState(false);

  const cleanContent = useMemo(() => {
    if (!content) return "";
    let text = content.replace(/\r\n/g, "\n");
    text = text.replace(/^[ \t]+$/gm, "");
    text = text.replace(/(src|href)=["\x27]([^"\x27]+)["\x27]/g, (_m, attr, val) => `${attr}="${val.replace(/\s+/g, "")}"`);
    text = text.replace(/^[ \t]+(<|#|---|-|\*|!\[)/gm, "$1");
    text = text.replace(/(<[a-z0-9]+[^>]*>)/gi, (tag) => tag.replace(/\s*\n\s*/g, " "));
    return text.trim();
  }, [content]);
  const words = useMemo(() => cleanContent.split(/\s+/).filter(Boolean).length, [cleanContent]);

  const copy = () =>
    navigator.clipboard.writeText(cleanContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });

  return (
    <Panel
      title="README.md"
      icon={FileText}
      meta={`${words} ${lang === "tr" ? "kelime" : "words"} · ${source === "github" ? "github" : lang === "tr" ? "özel" : "custom"}`}
      className="!h-auto"
      actions={
        <>
          {isOwner && (
            <Link href="/dashboard/settings#profil-sayfasi" className="btn btn-ghost btn-sm btn-icon" aria-label={lang === "tr" ? "README'yi düzenle" : "Edit README"}>
              <Pencil />
            </Link>
          )}
          <button type="button" onClick={copy} className="btn btn-ghost btn-sm btn-icon" aria-label={lang === "tr" ? "Markdown'u kopyala" : "Copy markdown"}>
            {copied ? <Check className="text-good" /> : <Copy />}
          </button>
        </>
      }
    >
      <div className="prose-profile px-1 py-1 sm:px-3 sm:py-2">
            <Markdown>{cleanContent}</Markdown>
      </div>
    </Panel>
  );
}

/* ─── Follow / share ─── */

function FollowButton({ username }: { username: string }) {
  const { lang } = useLanguage();
  const [following, setFollowing] = useState<boolean | null>(null);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/follow/${username}`)
      .then((r) => r.json())
      .then((d) => {
        setFollowing(d.following ?? false);
        setCount(d.followerCount ?? 0);
      })
      .catch(() => setFollowing(false));
  }, [username]);

  async function toggle() {
    if (following === null || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/follow/${username}`, { method: "POST" });
      if (res.status === 401) {
        window.location.href = "/api/auth/signin";
        return;
      }
      if (res.status === 429) {
        alert(lang === "tr" ? "Günlük takip limitine ulaştın (20)." : "You reached the daily follow limit (20).");
        return;
      }
      const data = await res.json();
      setFollowing(data.following);
      setCount(data.followerCount ?? count);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={toggle} disabled={loading || following === null} className={cn("btn flex-1", !following && "btn-primary")}>
        {following ? <UserCheck /> : <UserPlus />}
        {following ? (lang === "tr" ? "Takip ediliyor" : "Following") : lang === "tr" ? "Takip et" : "Follow"}
      </button>
      <span className="inline-flex items-center gap-1 font-mono text-[12px] text-ink-3" title={lang === "tr" ? "Takipçi" : "Followers"}>
        <Users size={13} />
        {fmtInt(count, lang)}
      </span>
    </div>
  );
}

function ShareRow({ username }: { username: string }) {
  const { lang } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const origin = useOrigin();
  const url = `${origin}/u/${username}`;

  async function download() {
    setBusy(true);
    try {
      const res = await fetch(`/api/card/${username}?format=og`);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${username}-devboard.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-1.5">
      <button type="button" className="btn btn-sm flex-1" onClick={() => navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); })}>
        {copied ? <Check className="text-good" /> : <Link2 />}
        {copied ? (lang === "tr" ? "Kopyalandı" : "Copied") : lang === "tr" ? "Linki kopyala" : "Copy link"}
      </button>
      <button type="button" className="btn btn-sm btn-icon" onClick={download} disabled={busy} aria-label={lang === "tr" ? "Kartı indir" : "Download card"} title={lang === "tr" ? "Developer Card (PNG)" : "Developer Card (PNG)"}>
        <Download />
      </button>
      <a
        className="btn btn-sm btn-icon"
        href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(lang === "tr" ? "Devboard profilim" : "My Devboard profile")}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={lang === "tr" ? "X'te paylaş" : "Share on X"}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.726-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>
    </div>
  );
}

/* ─── Repo card (GitHub pinned style) ─── */

function RepoCard({ repo, pinned }: { repo: RepoData; pinned?: boolean }) {
  const { lang } = useLanguage();
  return (
    <a
      href={`https://github.com/${repo.full_name}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col gap-2 rounded-panel border border-line bg-surface p-3.5 transition-colors hover:border-line-strong"
    >
      <div className="flex items-center gap-2">
        {pinned ? <Pin size={13} className="text-accent" /> : <FolderGit2 size={13} className="text-ink-3" />}
        <span className="truncate font-mono text-[13px] font-semibold text-ink group-hover:text-accent">{repo.name}</span>
        <ExternalLink size={12} className="ml-auto shrink-0 text-ink-4 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <p className="line-clamp-2 min-h-[2.6em] text-[12.5px] leading-snug text-ink-3">{repo.description || (lang === "tr" ? "Açıklama yok." : "No description.")}</p>
      <div className="mt-auto flex items-center gap-3.5 font-mono text-[11.5px] text-ink-3">
        {repo.language && (
          <span className="inline-flex items-center gap-1.5">
            <Dot color={langColor(repo.language)} size={8} />
            {repo.language}
          </span>
        )}
        <span className="inline-flex items-center gap-1"><Star size={12} />{fmtCompact(repo.stars, lang)}</span>
        <span className="inline-flex items-center gap-1"><GitFork size={12} />{fmtCompact(repo.forks, lang)}</span>
      </div>
    </a>
  );
}

/* ─── Main ─── */

export default function ProfileClient(props: ProfileProps) {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const T = (tr: string, en: string) => (l === "en" ? en : tr);
  const {
    username, userId, name, avatarUrl, bio, profileReadme, readmeSource,
    currentlyWorkingOn, yearlyGoal, techTags, stats, currentStreak, longestStreak,
    earnedBadges, pinnedRepos, topRepos, topLanguages, heatmapData, widgets, widgetOrder,
    socialLinks, developerDna, recordView, isOwner,
  } = props;

  const recorded = useRef(false);
  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    recordView(userId).catch(() => {});
  }, [userId, recordView]);

  const year = new Date().getFullYear();
  const badges = earnedBadges.map((b) => getLocalizedBadge(b, l));
  const show = (k: string) => widgets?.[k] !== false;
  const order = (widgetOrder?.length ? widgetOrder : ["streak", "heatmap", "languages", "repos"]).filter((k) => ["heatmap", "languages", "repos"].includes(k));
  const totalBytes = Math.max(1, topLanguages.reduce((s, x) => s + x.bytes, 0));
  const lastActive = [...heatmapData].reverse().find((d) => d.commit_count > 0)?.date;

  const socials = [
    socialLinks?.website && { href: socialLinks.website.startsWith("http") ? socialLinks.website : `https://${socialLinks.website}`, label: socialLinks.website.replace(/^https?:\/\//, ""), icon: Globe },
    socialLinks?.twitter && { href: `https://x.com/${socialLinks.twitter}`, label: `@${socialLinks.twitter}`, icon: null },
    socialLinks?.linkedin && { href: socialLinks.linkedin.startsWith("http") ? socialLinks.linkedin : `https://linkedin.com/in/${socialLinks.linkedin}`, label: "LinkedIn", icon: null },
    socialLinks?.discord && { href: null, label: socialLinks.discord, icon: null },
  ].filter(Boolean) as { href: string | null; label: string; icon: typeof Globe | null }[];

  const sections: Record<string, React.ReactNode> = {
    heatmap: show("heatmap") ? (
      <div key="heatmap" className="h-[340px] sm:h-[300px]">
        <WidgetSlotProvider value={{ w: 4, h: 2, mobile: false }}>
          <ContributionHeatmap data={heatmapData} />
        </WidgetSlotProvider>
      </div>
    ) : null,
    repos:
      show("repos") && pinnedRepos.length + topRepos.length > 0 ? (
        <section key="repos">
          <h2 className="mb-2.5 flex items-center gap-2 text-[13px] font-semibold text-ink">
            <FolderGit2 size={14} className="text-ink-3" />
            {pinnedRepos.length ? T("Sabitlenenler", "Pinned") : T("Öne çıkan repolar", "Popular repositories")}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {pinnedRepos.map((r) => <RepoCard key={r.name} repo={r} pinned />)}
            {topRepos.slice(0, Math.max(0, 6 - pinnedRepos.length)).map((r) => <RepoCard key={r.name} repo={r} />)}
          </div>
        </section>
      ) : null,
    languages:
      show("languages") && topLanguages.length ? (
        <Panel key="languages" title={T("Diller", "Languages")} meta={`${topLanguages.length}`} className="!h-auto">
          <div className="flex h-2.5 w-full overflow-hidden rounded-full gap-px bg-inset">
            {topLanguages.map((x) => <span key={x.lang} style={{ width: `${(x.bytes / totalBytes) * 100}%`, background: langColor(x.lang) }} />)}
          </div>
          <ul className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {topLanguages.map((x) => (
              <li key={x.lang} className="flex items-center gap-2 text-[12.5px]">
                <Dot color={langColor(x.lang)} size={8} />
                <span className="text-ink-2">{x.lang}</span>
                <span className="ml-auto font-mono text-[11.5px] text-ink-3 num">{x.pct.toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        </Panel>
      ) : null,
  };

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-8">
        {/* Identity */}
        <aside className="flex flex-col gap-5 lg:sticky lg:top-20 lg:self-start">
          <div className="flex items-center gap-4 lg:flex-col lg:items-start">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="" width={240} height={240} unoptimized priority className="size-20 shrink-0 rounded-panel ring-1 ring-line-strong lg:size-[180px]" />
            ) : (
              <div className="grid size-20 shrink-0 place-items-center rounded-panel bg-raised text-[28px] font-semibold text-ink-3 lg:size-[180px]">{username[0]?.toUpperCase()}</div>
            )}
            <div className="min-w-0">
              <h1 className="truncate text-[22px] font-[700] leading-tight tracking-[-0.02em] text-ink lg:text-[26px]">{name}</h1>
              <p className="truncate font-mono text-[14px] text-ink-3">@{username}</p>
            </div>
          </div>
          {bio && <p className="text-[14px] leading-relaxed text-ink-2">{bio}</p>}

          <div className="flex flex-col gap-2">
            {!isOwner && <FollowButton username={username} />}
            {isOwner && (
              <Link href="/dashboard/settings#profil" className="btn">
                <Pencil /> {T("Profili düzenle", "Edit profile")}
              </Link>
            )}
            <ShareRow username={username} />
          </div>

          {(currentlyWorkingOn || yearlyGoal) && (
            <dl className="flex flex-col gap-2.5 text-[13px]">
              {currentlyWorkingOn && (
                <div className="flex gap-2.5">
                  <Hammer size={15} className="mt-0.5 shrink-0 text-accent" />
                  <div>
                    <dt className="text-[11.5px] text-ink-4">{T("Şu an üzerinde çalışıyor", "Currently working on")}</dt>
                    <dd className="text-ink-2">{currentlyWorkingOn}</dd>
                  </div>
                </div>
              )}
              {yearlyGoal && (
                <div className="flex gap-2.5">
                  <Target size={15} className="mt-0.5 shrink-0 text-accent" />
                  <div>
                    <dt className="text-[11.5px] text-ink-4">{T(`${year} hedefi`, `${year} goal`)}</dt>
                    <dd className="text-ink-2">{yearlyGoal}</dd>
                  </div>
                </div>
              )}
            </dl>
          )}

          {socials.length > 0 && (
            <ul className="flex flex-col gap-1.5 text-[13px]">
              {socials.map((s) => (
                <li key={s.label} className="flex items-center gap-2 text-ink-2">
                  {s.icon ? <s.icon size={14} className="text-ink-3" /> : <Link2 size={14} className="text-ink-3" />}
                  {s.href ? (
                    <a href={s.href} target="_blank" rel="noopener noreferrer" className="truncate hover:text-accent">
                      {s.label}
                    </a>
                  ) : (
                    <span className="truncate">{s.label}</span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {techTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {techTags.map((t) => (
                <span key={t} className="chip font-mono">{t}</span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-panel border border-line bg-line">
            {[
              [fmtInt(stats.commitCount, l), T("commit / yıl", "commits / yr")],
              [fmtInt(stats.repoCount, l), "repo"],
              [fmtInt(stats.activeDays, l), T("aktif gün", "active days")],
              [fmtInt(stats.languageCount, l), T("dil", "languages")],
            ].map(([v, k]) => (
              <div key={k} className="bg-surface p-3">
                <div className="figure text-[20px]">{v}</div>
                <div className="label mt-1">{k}</div>
              </div>
            ))}
          </div>

          {show("streak") && (
            <div className="flex items-center gap-3 rounded-panel border border-line bg-surface p-3">
              <Flame size={18} className={currentStreak > 0 ? "text-hue-orange" : "text-ink-4"} />
              <div className="flex flex-1 items-baseline gap-4">
                <div>
                  <span className="figure text-[20px]" style={currentStreak > 0 ? { color: "var(--accent)" } : undefined}>{currentStreak}</span>
                  <span className="ml-1 text-[11.5px] text-ink-3">{T("gün seri", "day streak")}</span>
                </div>
                <div className="text-[12px] text-ink-3">
                  {T("en iyi", "best")} <span className="font-mono text-ink-2">{longestStreak}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {[year, year - 1].map((y) => (
              <Link key={y} href={`/u/${username}/${y}`} className="btn btn-sm">
                <Clapperboard /> Wrapped {y}
              </Link>
            ))}
          </div>
          {lastActive && <p className="font-mono text-[11.5px] text-ink-4">{T("son commit", "last commit")} {lastActive}</p>}
        </aside>

        {/* Content */}
        <div className="flex min-w-0 flex-col gap-6">
          {order.map((k) => sections[k])}

          {profileReadme && <ProfileReadme content={profileReadme} username={username} isOwner={isOwner} source={readmeSource} />}

          {developerDna && (
            <div className="h-[460px]">
              <WidgetSlotProvider value={{ w: 2, h: 3, mobile: false }}>
                <DeveloperDNACard dna={developerDna} username={username} />
              </WidgetSlotProvider>
            </div>
          )}

          {badges.length > 0 && (
            <Panel title={T("Rozetler", "Badges")} icon={BadgeCheck} meta={`${badges.length}`} className="!h-auto">
              <div className="flex flex-wrap gap-1.5">
                {badges.map((b) => (
                  <span key={b.id} title={b.description}>
                    <Shield2 left={b.name} right={b.target ? fmtCompact(b.target, l) : "✓"} color={b.rarity === "epic" ? "var(--hue-purple)" : b.rarity === "rare" ? "var(--hue-blue)" : "var(--ink-2)"} earned size="sm" />
                  </span>
                ))}
              </div>
            </Panel>
          )}

          <footer className="pt-2 text-center font-mono text-[11.5px] text-ink-4">
            <Link href="/" className="hover:text-ink-2">devboard</Link> · {fmtPct(Math.round((stats.activeDays / 365) * 100), l)} {T("aktif yıl", "of the year active")}
          </footer>
        </div>
      </div>
    </div>
  );
}
