"use client";

import Link from "next/link";
import Markdown from "@/components/markdown";
import { useState, useEffect, useMemo } from "react";
import { Star, GitFork, Check, Copy, Download, ExternalLink, Pencil, Users, UserPlus, UserCheck, Link2, FileText, FolderGit2, Pin } from "lucide-react";
import { type Badge } from "@/lib/badges";
import type { DeveloperDNA } from "@/lib/developer-dna";
import { useLanguage } from "@/lib/i18n";
import { Panel, Dot } from "@/components/ui/primitives";
import { langColor } from "@/lib/ui/lang-colors";
import { fmtCompact, fmtInt, cn } from "@/lib/ui/format";
import { useOrigin } from "@/lib/ui/hooks";

/* ─── Types ─── */


export type DayData = { date: string; commit_count: number };

export type RepoData = {
  name: string;
  full_name: string;
  language: string | null;
  stars: number;
  forks: number;
  description?: string | null;
};

export type LangData = { lang: string; bytes: number; pct: number; color: string };

export type SocialLinks = {
  twitter: string | null;
  linkedin: string | null;
  website: string | null;
  discord: string | null;
};

export type ProfileProps = {
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

export function ProfileReadme({ content, isOwner, source = "github" }: { content: string; username: string; isOwner?: boolean; source?: "github" | "custom" }) {
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

export function FollowButton({ username }: { username: string }) {
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

export function ShareRow({ username }: { username: string }) {
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

export function RepoCard({ repo, pinned }: { repo: RepoData; pinned?: boolean }) {
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
