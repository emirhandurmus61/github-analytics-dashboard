"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useRef } from "react";
import { Pencil, Link2, Flame, Target, Hammer, FolderGit2, Clapperboard, BadgeCheck, Globe } from "lucide-react";
import { getLocalizedBadge } from "@/lib/badges";
import { useLanguage } from "@/lib/i18n";
import { Panel, Dot } from "@/components/ui/primitives";
import { WidgetSlotProvider } from "@/components/ui/widget-size";
import ContributionHeatmap from "@/app/dashboard/contribution-heatmap";
import DeveloperDNACard from "@/app/dashboard/developer-dna";
import { Shield2 } from "@/app/dashboard/badge-collection";
import { langColor } from "@/lib/ui/lang-colors";
import { fmtCompact, fmtInt, fmtPct, type Lang } from "@/lib/ui/format";
import { ProfileProps, ProfileReadme, FollowButton, ShareRow, RepoCard } from "./profile-parts";

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
