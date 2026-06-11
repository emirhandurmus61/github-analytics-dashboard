"use client";

import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { useState, useEffect, useRef } from "react";
import { useThemeColors } from "@/components/theme-provider";
import {
  Flame, Zap, Moon, Swords, Eraser, Globe, Rocket, Trophy,
  Star, GitFork, MapPin, Calendar, Activity, Code2, Target,
  Sparkles, Award, ChevronRight, Download, ExternalLink,
  BookOpen, Timer, TrendingUp, Layers, Hash, ArrowRight,
  Link as LinkIcon, MessageCircle,
} from "lucide-react";
import type { Badge } from "@/lib/badges";

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
  recordView: (userId: string) => Promise<void>;
  isOwner?: boolean;
};

/* ─── Badge icon map (lucide icons instead of emojis) ─── */

const BADGE_ICONS: Record<string, typeof Rocket> = {
  first_sync: Rocket,
  streak_7: Flame,
  streak_30: Zap,
  night_owl: Moon,
  weekend_warrior: Swords,
  big_cleanup: Eraser,
  polyglot: Globe,
  open_source: Trophy,
};

const RARITY_STYLES: Record<string, { text: string; bg: string; border: string; glow: string; gradient: string }> = {
  common: {
    text: "#a1a1aa",
    bg: "rgba(161,161,170,0.04)",
    border: "rgba(161,161,170,0.12)",
    glow: "rgba(161,161,170,0.06)",
    gradient: "linear-gradient(135deg, rgba(161,161,170,0.08) 0%, rgba(161,161,170,0.02) 100%)",
  },
  rare: {
    text: "#60a5fa",
    bg: "rgba(96,165,250,0.04)",
    border: "rgba(96,165,250,0.15)",
    glow: "rgba(96,165,250,0.1)",
    gradient: "linear-gradient(135deg, rgba(96,165,250,0.1) 0%, rgba(96,165,250,0.02) 100%)",
  },
  epic: {
    text: "#c084fc",
    bg: "rgba(192,132,252,0.04)",
    border: "rgba(192,132,252,0.18)",
    glow: "rgba(192,132,252,0.12)",
    gradient: "linear-gradient(135deg, rgba(192,132,252,0.12) 0%, rgba(192,132,252,0.02) 100%)",
  },
};

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
  Rust: "#dea584", Go: "#00ADD8", CSS: "#563d7c", HTML: "#e34c26",
  Java: "#b07219", "C++": "#f34b7d", "C#": "#178600", C: "#555555",
  Ruby: "#701516", Swift: "#F05138", Kotlin: "#A97BFF", Dart: "#00B4AB",
  Shell: "#89e051", PHP: "#4F5D95", Lua: "#000080", Scala: "#c22d40",
};

/* ─── Animated number counter ─── */

function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const startTime = performance.now();
    let prev = 0;
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * value);
      if (current !== prev) {
        prev = current;
        setDisplay(current);
      }
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value, duration]);

  return <span>{display.toLocaleString("tr-TR")}</span>;
}

/* ─── Language donut chart ─── */

function LanguageDonut({ languages, size = 160 }: { languages: LangData[]; size?: number }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const theme = useThemeColors();
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 14;
  const strokeWidth = 16;

  let cumulative = 0;
  const arcs = languages.map((lang, i) => {
    const startAngle = cumulative * 360;
    cumulative += lang.pct / 100;
    const endAngle = cumulative * 360;
    const gap = 2;
    const actualStart = startAngle + gap / 2;
    const actualEnd = endAngle - gap / 2;
    const largeArc = actualEnd - actualStart > 180 ? 1 : 0;
    const startRad = ((actualStart - 90) * Math.PI) / 180;
    const endRad = ((actualEnd - 90) * Math.PI) / 180;
    return {
      ...lang,
      index: i,
      d: `M ${cx + r * Math.cos(startRad)} ${cy + r * Math.sin(startRad)} A ${r} ${r} 0 ${largeArc} 1 ${cx + r * Math.cos(endRad)} ${cy + r * Math.sin(endRad)}`,
    };
  });

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} className="shrink-0">
        {arcs.map((arc) => (
          <path
            key={arc.lang}
            d={arc.d}
            fill="none"
            stroke={arc.color}
            strokeWidth={hovered === arc.index ? strokeWidth + 4 : strokeWidth}
            strokeLinecap="round"
            opacity={hovered !== null && hovered !== arc.index ? 0.25 : 1}
            className="transition-all duration-300 cursor-pointer"
            onMouseEnter={() => setHovered(arc.index)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
        <Code2
          className="transition-colors duration-200"
          x={cx - 10}
          y={cy - 16}
          width={20}
          height={20}
          stroke={hovered !== null ? languages[hovered].color : "#52525b"}
        />
        <text x={cx} y={cy + 10} textAnchor="middle" className="text-[11px] font-medium" fill={hovered !== null ? languages[hovered].color : "#71717a"}>
          {hovered !== null ? `${languages[hovered].pct.toFixed(1)}%` : `${languages.length} dil`}
        </text>
      </svg>
      <div className="flex flex-col gap-1.5 min-w-0">
        {languages.map((lang, i) => (
          <button
            key={lang.lang}
            className="flex items-center gap-2 text-xs transition-all group text-left"
            style={{ opacity: hovered !== null && hovered !== i ? 0.3 : 1 }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="h-2.5 w-2.5 rounded-sm shrink-0 transition-transform group-hover:scale-125" style={{ backgroundColor: lang.color }} />
            <span className="text-zinc-300 truncate">{lang.lang}</span>
            <span className="text-zinc-600 tabular-nums ml-auto">{lang.pct.toFixed(1)}%</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Mini contribution grid ─── */

function MiniHeatmap({ data }: { data: DayData[] }) {
  const theme = useThemeColors();
  const map = new Map(data.map((d) => [d.date, d.commit_count]));
  const max = Math.max(...data.map((d) => d.commit_count), 1);

  const today = new Date();
  const endDate = new Date(today);
  const dow = (today.getDay() + 6) % 7;
  endDate.setDate(endDate.getDate() + (6 - dow));
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 22 * 7 + 1);
  const sd = (startDate.getDay() + 6) % 7;
  startDate.setDate(startDate.getDate() - sd);

  const weeks: { date: string; count: number }[][] = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    const week: { date: string; count: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const key = cursor.toISOString().slice(0, 10);
      week.push({ date: key, count: map.get(key) ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  function getColor(count: number) {
    if (count === 0) return "rgba(255,255,255,0.03)";
    const t = count / max;
    if (t < 0.25) return theme.shades[0];
    if (t < 0.5) return theme.shades[1];
    if (t < 0.75) return theme.shades[2];
    return theme.shades[3];
  }

  return (
    <div className="flex gap-[3px]">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-[3px]">
          {week.map((day) => (
            <div
              key={day.date}
              className="rounded-[2px] transition-all hover:scale-150 hover:z-10 relative"
              style={{ width: 10, height: 10, backgroundColor: getColor(day.count) }}
              title={`${day.date}: ${day.count} commit`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ─── Stat card ─── */

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  delay = 0,
}: {
  icon: typeof Activity;
  label: string;
  value: number;
  sub?: string;
  accent?: string;
  delay?: number;
}) {
  return (
    <div
      className="animate-profile-slide-up group rounded-2xl border border-zinc-800/40 p-5 flex flex-col gap-3 relative overflow-hidden transition-all hover:border-zinc-700/60"
      style={{
        animationDelay: `${delay}ms`,
        background: "linear-gradient(145deg, rgba(24,24,27,0.8) 0%, rgba(9,9,11,0.9) 100%)",
      }}
    >
      {/* Subtle glow on hover */}
      {accent && (
        <div
          className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"
          style={{ backgroundColor: accent }}
        />
      )}
      <div className="flex items-center gap-2 relative z-10">
        <Icon className="w-3.5 h-3.5 text-zinc-600" />
        <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-medium">{label}</p>
      </div>
      <div className="relative z-10">
        <p className="text-3xl sm:text-4xl font-black tabular-nums tracking-tight" style={{ color: accent ?? "#fafafa" }}>
          <AnimatedNumber value={value} />
        </p>
        {sub && <p className="text-[10px] text-zinc-600 mt-0.5 uppercase tracking-wider">{sub}</p>}
      </div>
    </div>
  );
}

/* ─── Badge card ─── */

function BadgeCard({ badge, index }: { badge: Badge; index: number }) {
  const style = RARITY_STYLES[badge.rarity] ?? RARITY_STYLES.common;
  const Icon = BADGE_ICONS[badge.id] ?? Award;

  return (
    <div
      className="animate-profile-badge-pop group relative rounded-xl border p-4 flex items-start gap-3.5 cursor-default transition-all hover:scale-[1.02]"
      style={{
        animationDelay: `${index * 80 + 400}ms`,
        borderColor: style.border,
        background: style.gradient,
      }}
    >
      {/* Icon container */}
      <div
        className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${style.text}12`, border: `1px solid ${style.text}20` }}
      >
        <Icon className="w-5 h-5" style={{ color: style.text }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold truncate" style={{ color: style.text }}>{badge.name}</p>
          <span
            className="shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider"
            style={{ color: style.text, backgroundColor: `${style.text}12`, border: `1px solid ${style.text}15` }}
          >
            {badge.rarity === "common" ? "C" : badge.rarity === "rare" ? "R" : "E"}
          </span>
        </div>
        <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{badge.description}</p>
      </div>
    </div>
  );
}

/* ─── Repo card (premium) ─── */

function RepoCard({ repo, pinned, index = 0 }: { repo: RepoData; pinned?: boolean; index?: number }) {
  const theme = useThemeColors();
  const langColor = repo.language ? (LANG_COLORS[repo.language] ?? "#6b7280") : null;

  return (
    <a
      href={`https://github.com/${repo.full_name}`}
      target="_blank"
      rel="noopener noreferrer"
      className="animate-profile-slide-up group rounded-xl border p-4 flex flex-col gap-3 transition-all hover:scale-[1.02] relative overflow-hidden"
      style={{
        animationDelay: `${index * 60 + 200}ms`,
        borderColor: pinned ? `${theme.accent}30` : "rgba(39,39,42,0.4)",
        background: pinned
          ? `linear-gradient(145deg, ${theme.accentBg} 0%, rgba(9,9,11,0.95) 100%)`
          : "linear-gradient(145deg, rgba(24,24,27,0.6) 0%, rgba(9,9,11,0.8) 100%)",
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl"
        style={{ backgroundColor: langColor ?? theme.accent }}
      />

      <div className="flex items-center gap-2 min-w-0 relative z-10">
        {pinned && <MapPin className="w-3 h-3 shrink-0" style={{ color: theme.accent }} />}
        {langColor && <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: langColor }} />}
        <span className="text-sm font-semibold text-zinc-200 truncate group-hover:text-white transition-colors">{repo.name}</span>
        <ExternalLink className="w-3 h-3 text-zinc-700 group-hover:text-zinc-400 transition-colors ml-auto shrink-0" />
      </div>
      {repo.description && (
        <p className="text-[11px] text-zinc-500 leading-relaxed line-clamp-2 relative z-10">{repo.description}</p>
      )}
      <div className="flex items-center gap-4 text-xs text-zinc-600 relative z-10">
        <span className="flex items-center gap-1">
          <Star className="w-3 h-3" />
          {repo.stars}
        </span>
        <span className="flex items-center gap-1">
          <GitFork className="w-3 h-3" />
          {repo.forks}
        </span>
        {repo.language && <span className="text-zinc-500">{repo.language}</span>}
      </div>
    </a>
  );
}

/* ─── Markdown README renderer ─── */

function ProfileReadme({ content }: { content: string }) {
  const theme = useThemeColors();

  return (
    <div className="animate-profile-slide-up rounded-2xl border border-zinc-800/40 relative overflow-hidden"
      style={{ background: "linear-gradient(145deg, rgba(24,24,27,0.6) 0%, rgba(9,9,11,0.8) 100%)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3 border-b border-zinc-800/40">
        <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
        <span className="text-xs font-medium text-zinc-500 uppercase tracking-widest">README</span>
      </div>

      {/* Markdown content */}
      <div className="px-5 py-4 prose-profile">
        <ReactMarkdown
          components={{
            h1: ({ children }) => <h1 className="text-xl font-bold text-zinc-100 mb-3 mt-4 first:mt-0">{children}</h1>,
            h2: ({ children }) => <h2 className="text-lg font-bold text-zinc-200 mb-2 mt-4">{children}</h2>,
            h3: ({ children }) => <h3 className="text-base font-semibold text-zinc-300 mb-2 mt-3">{children}</h3>,
            p: ({ children }) => <p className="text-sm text-zinc-400 leading-relaxed mb-3">{children}</p>,
            ul: ({ children }) => <ul className="text-sm text-zinc-400 space-y-1.5 mb-3 list-none pl-0">{children}</ul>,
            ol: ({ children }) => <ol className="text-sm text-zinc-400 space-y-1.5 mb-3 list-decimal pl-5">{children}</ol>,
            li: ({ children }) => (
              <li className="flex items-start gap-2">
                <ChevronRight className="w-3 h-3 shrink-0 mt-1" style={{ color: theme.accent }} />
                <span>{children}</span>
              </li>
            ),
            strong: ({ children }) => <strong className="font-semibold text-zinc-200">{children}</strong>,
            em: ({ children }) => <em className="text-zinc-300 italic">{children}</em>,
            code: ({ children, className }) => {
              const isBlock = className?.includes("language-");
              if (isBlock) {
                return (
                  <code className="block rounded-lg bg-zinc-900 border border-zinc-800/60 px-4 py-3 text-xs text-zinc-300 font-mono overflow-x-auto mb-3">
                    {children}
                  </code>
                );
              }
              return (
                <code
                  className="rounded-md px-1.5 py-0.5 text-xs font-mono"
                  style={{ backgroundColor: `${theme.accent}12`, color: theme.accent }}
                >
                  {children}
                </code>
              );
            },
            pre: ({ children }) => <div className="mb-3">{children}</div>,
            a: ({ children, href }) => (
              <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 transition-colors" style={{ color: theme.accent }}>
                {children}
              </a>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 pl-4 my-3 italic" style={{ borderColor: theme.accent, color: "#a1a1aa" }}>
                {children}
              </blockquote>
            ),
            img: ({ src, alt }) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src ?? ""}
                alt={alt ?? ""}
                loading="lazy"
                className="rounded-lg max-w-full h-auto my-3 border border-zinc-800/30"
                style={{ maxHeight: 400 }}
              />
            ),
            hr: () => <hr className="border-zinc-800/40 my-4" />,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}

/* ─── Activity sparkline ─── */

function ActivitySparkline({ data }: { data: DayData[] }) {
  const theme = useThemeColors();
  const last90 = data.slice(-90);
  if (last90.length === 0) return null;

  const max = Math.max(...last90.map((d) => d.commit_count), 1);
  const w = 100;
  const h = 36;
  const step = w / (last90.length - 1 || 1);

  const points = last90.map((d, i) => ({
    x: i * step,
    y: h - (d.commit_count / max) * (h - 4) - 2,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${h} L 0 ${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={theme.accent} stopOpacity="0.25" />
          <stop offset="100%" stopColor={theme.accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkGrad)" />
      <path d={linePath} fill="none" stroke={theme.accent} strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PROFILE COMPONENT
   ═══════════════════════════════════════════════════ */

export default function ProfileClient(props: ProfileProps) {
  const theme = useThemeColors();
  const {
    username, userId, name, avatarUrl, bio, profileReadme,
    currentlyWorkingOn, yearlyGoal, techTags,
    stats, currentStreak, longestStreak,
    earnedBadges, pinnedRepos, topRepos,
    topLanguages, heatmapData,
    widgets,
    socialLinks,
    recordView,
    isOwner,
  } = props;

  // Ziyareti bir kez kaydet
  const recorded = useRef(false);
  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    recordView(userId).catch(() => {/* sessiz hata */});
  }, [userId, recordView]);

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-zinc-950 overflow-hidden">
      {/* ═══ HERO ═══ */}
      <div className="relative">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-1/2 -left-1/4 w-[150%] h-[200%] animate-profile-gradient opacity-20"
            style={{
              background: `radial-gradient(ellipse at 20% 30%, ${theme.accent}25 0%, transparent 50%),
                           radial-gradient(ellipse at 80% 60%, ${theme.accentMid}15 0%, transparent 45%),
                           radial-gradient(ellipse at 40% 80%, ${theme.accentDim}30 0%, transparent 50%)`,
            }}
          />
          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)`,
              backgroundSize: "24px 24px",
            }}
          />
        </div>

        {/* Header bar — Navbar server component olarak page.tsx'den render ediliyor */}

        {/* Hero content */}
        <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 pt-12 sm:pt-16 pb-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
            {/* Avatar */}
            <div className="relative animate-profile-slide-up shrink-0">
              <div
                className="absolute -inset-1 rounded-full animate-profile-pulse-ring opacity-40"
                style={{ background: `radial-gradient(circle, ${theme.accent}30 0%, transparent 70%)` }}
              />
              {avatarUrl && (
                <Image
                  src={avatarUrl}
                  alt={username}
                  width={110}
                  height={110}
                  className="relative rounded-full"
                  style={{ boxShadow: `0 0 0 2px rgba(9,9,11,1), 0 0 0 4px ${theme.accent}40` }}
                />
              )}
              {/* Activity indicator */}
              <div className="absolute bottom-1 right-1 flex items-center justify-center">
                <div className="absolute h-5 w-5 rounded-full border-[3px] border-zinc-950" style={{ backgroundColor: theme.accent }} />
                <Activity className="relative h-2.5 w-2.5 text-zinc-950" strokeWidth={3} />
              </div>
            </div>

            {/* Identity */}
            <div className="text-center sm:text-left flex-1 min-w-0 animate-profile-slide-up" style={{ animationDelay: "80ms" }}>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">{name}</h1>
              <p className="text-sm text-zinc-500 mt-1.5 flex items-center justify-center sm:justify-start gap-1">
                <Hash className="w-3 h-3" />
                {username}
              </p>
              {bio && <p className="text-sm text-zinc-400 mt-3 max-w-lg leading-relaxed">{bio}</p>}
              {techTags.length > 0 && (
                <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 mt-3">
                  {techTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md px-2 py-0.5 text-[10px] font-medium border transition-all hover:scale-105"
                      style={{ borderColor: `${theme.accent}20`, color: `${theme.accent}cc`, backgroundColor: `${theme.accent}08` }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {/* Sosyal linkler */}
              {socialLinks && (socialLinks.twitter || socialLinks.linkedin || socialLinks.website || socialLinks.discord) && (
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                  {socialLinks.twitter && (
                    <a
                      href={`https://x.com/${socialLinks.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-all hover:scale-105 hover:border-zinc-600"
                      style={{ borderColor: "#27272a", color: "#71717a" }}
                      title={`@${socialLinks.twitter}`}
                    >
                      {/* X / Twitter icon */}
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      <span className="hidden sm:inline">@{socialLinks.twitter}</span>
                    </a>
                  )}
                  {socialLinks.linkedin && (
                    <a
                      href={`https://linkedin.com/in/${socialLinks.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-all hover:scale-105 hover:border-zinc-600"
                      style={{ borderColor: "#27272a", color: "#71717a" }}
                      title={socialLinks.linkedin}
                    >
                      {/* LinkedIn icon */}
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      <span className="hidden sm:inline">{socialLinks.linkedin}</span>
                    </a>
                  )}
                  {socialLinks.website && (
                    <a
                      href={socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-all hover:scale-105 hover:border-zinc-600"
                      style={{ borderColor: "#27272a", color: "#71717a" }}
                      title={socialLinks.website}
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span className="hidden sm:inline">{socialLinks.website.replace(/^https?:\/\//, "")}</span>
                    </a>
                  )}
                  {socialLinks.discord && (
                    <div
                      className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs cursor-default"
                      style={{ borderColor: "#27272a", color: "#71717a" }}
                      title={socialLinks.discord}
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span className="hidden sm:inline">{socialLinks.discord}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sparkline (desktop) */}
            <div className="hidden lg:block w-48 animate-profile-slide-up shrink-0" style={{ animationDelay: "160ms" }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <TrendingUp className="w-3 h-3 text-zinc-600" />
                <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-600 font-medium">Son 90 gun</p>
              </div>
              <ActivitySparkline data={heatmapData} />
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 pb-16 space-y-6 -mt-1">

        {/* ── Bento stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Layers} label="Repolar" value={stats.repoCount} delay={200} />
          <StatCard icon={Activity} label="Commitler" value={stats.commitCount} sub="son 1 yil" accent={theme.accent} delay={280} />
          <StatCard icon={Calendar} label="Aktif Gun" value={stats.activeDays} sub="son 1 yil" delay={360} />
          <StatCard icon={Code2} label="Diller" value={stats.languageCount} delay={440} />
        </div>

        {/* ── Streaks ── */}
        {widgets.streak && (currentStreak > 0 || longestStreak > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              className="animate-profile-slide-up group rounded-2xl border border-zinc-800/40 p-5 relative overflow-hidden transition-all hover:border-zinc-700/50"
              style={{ animationDelay: "400ms", background: "linear-gradient(145deg, rgba(24,24,27,0.8) 0%, rgba(9,9,11,0.9) 100%)" }}
            >
              <div className="absolute -top-6 -right-6 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity">
                <Flame className="w-28 h-28" style={{ color: theme.accent }} />
              </div>
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <Flame className="w-4 h-4" style={{ color: theme.accent }} />
                <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-medium">Mevcut Streak</p>
              </div>
              <p className="text-4xl sm:text-5xl font-black tabular-nums relative z-10" style={{ color: theme.accent }}>
                <AnimatedNumber value={currentStreak} />
                <span className="text-base font-normal text-zinc-600 ml-1">gun</span>
              </p>
            </div>
            <div
              className="animate-profile-slide-up group rounded-2xl border border-zinc-800/40 p-5 relative overflow-hidden transition-all hover:border-zinc-700/50"
              style={{ animationDelay: "460ms", background: "linear-gradient(145deg, rgba(24,24,27,0.8) 0%, rgba(9,9,11,0.9) 100%)" }}
            >
              <div className="absolute -top-6 -right-6 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity">
                <Zap className="w-28 h-28 text-zinc-400" />
              </div>
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <Timer className="w-4 h-4 text-zinc-500" />
                <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-medium">En Uzun Streak</p>
              </div>
              <p className="text-4xl sm:text-5xl font-black tabular-nums text-zinc-100 relative z-10">
                <AnimatedNumber value={longestStreak} />
                <span className="text-base font-normal text-zinc-600 ml-1">gun</span>
              </p>
            </div>
          </div>
        )}

        {/* ── Currently working on & Yearly goal ── */}
        {(currentlyWorkingOn || yearlyGoal) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentlyWorkingOn && (
              <div
                className="animate-profile-slide-up rounded-2xl border p-5 relative overflow-hidden"
                style={{
                  animationDelay: "500ms",
                  borderColor: `${theme.accent}25`,
                  background: `linear-gradient(145deg, ${theme.accentBg} 0%, rgba(9,9,11,0.95) 100%)`,
                }}
              >
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="relative">
                    <Sparkles className="w-3.5 h-3.5" style={{ color: theme.accent }} />
                    <div className="absolute inset-0 animate-pulse rounded-full" style={{ boxShadow: `0 0 8px ${theme.accent}40` }} />
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.15em] font-medium" style={{ color: theme.accent }}>Su an uzerinde</p>
                </div>
                <p className="text-sm text-zinc-200 leading-relaxed">{currentlyWorkingOn}</p>
              </div>
            )}
            {yearlyGoal && (
              <div
                className="animate-profile-slide-up rounded-2xl border border-zinc-800/40 p-5"
                style={{
                  animationDelay: "540ms",
                  background: "linear-gradient(145deg, rgba(24,24,27,0.6) 0%, rgba(9,9,11,0.8) 100%)",
                }}
              >
                <div className="flex items-center gap-2 mb-2.5">
                  <Target className="w-3.5 h-3.5 text-zinc-500" />
                  <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-medium">{currentYear} Hedefi</p>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed">{yearlyGoal}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Profile README ── */}
        {profileReadme && (
          <ProfileReadme content={profileReadme} />
        )}

        {/* ── Badges ── */}
        {earnedBadges.length > 0 && (
          <div className="animate-profile-slide-up" style={{ animationDelay: "550ms" }}>
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-zinc-500" />
              <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-500">Rozetler</h2>
              <span className="text-[10px] text-zinc-700 tabular-nums">{earnedBadges.length} kazanildi</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {earnedBadges.map((badge, i) => (
                <BadgeCard key={badge.id} badge={badge} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* ── Pinned repos (up to 3) ── */}
        {pinnedRepos.length > 0 && (
          <div className="animate-profile-slide-up" style={{ animationDelay: "600ms" }}>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-zinc-500" />
              <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-500">One Cikan Repolar</h2>
            </div>
            <div className={`grid gap-3 ${pinnedRepos.length === 1 ? "grid-cols-1" : pinnedRepos.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
              {pinnedRepos.map((repo, i) => (
                <RepoCard key={repo.name} repo={repo} pinned index={i} />
              ))}
            </div>
          </div>
        )}

        {/* ── Languages + Heatmap ── */}
        {(widgets.languages || widgets.heatmap) && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 animate-profile-slide-up" style={{ animationDelay: "700ms" }}>
            {widgets.languages && topLanguages.length > 0 && (
              <div
                className="lg:col-span-2 rounded-2xl border border-zinc-800/40 p-5"
                style={{ background: "linear-gradient(145deg, rgba(24,24,27,0.6) 0%, rgba(9,9,11,0.8) 100%)" }}
              >
                <div className="flex items-center gap-2 mb-5">
                  <Code2 className="w-3.5 h-3.5 text-zinc-500" />
                  <h2 className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-medium">Dil Dagilimi</h2>
                </div>
                <LanguageDonut languages={topLanguages} />
              </div>
            )}
            {widgets.heatmap && (
              <div
                className={`${widgets.languages && topLanguages.length > 0 ? "lg:col-span-3" : "lg:col-span-5"} rounded-2xl border border-zinc-800/40 p-5`}
                style={{ background: "linear-gradient(145deg, rgba(24,24,27,0.6) 0%, rgba(9,9,11,0.8) 100%)" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-zinc-500" />
                    <h2 className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-medium">Contributions</h2>
                  </div>
                  <span className="text-xs text-zinc-600 tabular-nums">{stats.commitCount.toLocaleString("tr-TR")} commit</span>
                </div>
                <div className="overflow-x-auto custom-scroll pb-1">
                  <MiniHeatmap data={heatmapData} />
                </div>
                <div className="mt-3 flex items-center justify-end gap-1.5">
                  <span className="text-[10px] text-zinc-600">Az</span>
                  {["rgba(255,255,255,0.03)", ...theme.shades].map((c, i) => (
                    <div key={i} className="rounded-[2px]" style={{ width: 10, height: 10, backgroundColor: c }} />
                  ))}
                  <span className="text-[10px] text-zinc-600">Cok</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Top repos ── */}
        {widgets.repos && topRepos.length > 0 && (
          <div className="animate-profile-slide-up" style={{ animationDelay: "800ms" }}>
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-zinc-500" />
              <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-500">En Yildizli Repolar</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {topRepos.map((repo, i) => (
                <RepoCard key={repo.name} repo={repo} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* ── Wrapped links ── */}
        <div className="flex flex-wrap justify-center gap-2 pt-4 animate-profile-slide-up" style={{ animationDelay: "900ms" }}>
          {[currentYear, currentYear - 1].map((yr) => (
            <Link
              key={yr}
              href={`/u/${username}/${yr}`}
              className="group flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-all hover:scale-105 active:scale-95"
              style={{ borderColor: `${theme.accent}25`, backgroundColor: `${theme.accent}06`, color: theme.accent }}
            >
              <Sparkles className="w-3 h-3" />
              {yr} Wrapped
              <ArrowRight className="w-3 h-3 text-zinc-600 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ))}
        </div>

        {/* ── Footer ── */}
        <footer className="text-center pt-6 pb-2 animate-profile-slide-up" style={{ animationDelay: "1000ms" }}>
          <div className="inline-flex items-center gap-2.5 rounded-full border border-zinc-800/30 bg-zinc-900/20 px-4 py-2">
            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: theme.accent }} />
            <p className="text-xs text-zinc-600">
              <Link href="/" className="text-zinc-500 hover:text-zinc-300 transition-colors">
                Dev Analytics
              </Link>{" "}
              ile olusturuldu
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
