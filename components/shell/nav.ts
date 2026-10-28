import {
  LayoutGrid,
  GitCommitHorizontal,
  Trophy,
  Clapperboard,
  UserRound,
  SlidersHorizontal,
  type LucideIcon,
} from "lucide-react";

export type NavKey = "overview" | "timeline" | "leaderboard" | "wrapped" | "profile" | "settings";

export type NavItem = {
  key: NavKey;
  href: string;
  icon: LucideIcon;
  label: { tr: string; en: string };
  short: { tr: string; en: string };
  /** slug used in terminal windows and breadcrumbs */
  slug: string;
  /** second key after `g` */
  go: string;
  requiresUser?: boolean;
};

export function buildNav(username: string | null, year: number): NavItem[] {
  const items: NavItem[] = [
    {
      key: "overview",
      href: "/dashboard",
      icon: LayoutGrid,
      label: { tr: "Genel bakış", en: "Overview" },
      short: { tr: "Bakış", en: "Overview" },
      slug: "overview",
      go: "o",
      requiresUser: true,
    },
    {
      key: "timeline",
      href: "/dashboard/timeline",
      icon: GitCommitHorizontal,
      label: { tr: "Zaman çizelgesi", en: "Timeline" },
      short: { tr: "Zaman", en: "Timeline" },
      slug: "timeline",
      go: "t",
      requiresUser: true,
    },
    {
      key: "leaderboard",
      href: "/leaderboard",
      icon: Trophy,
      label: { tr: "Sıralama", en: "Leaderboard" },
      short: { tr: "Sıralama", en: "Ranking" },
      slug: "ranking",
      go: "l",
    },
    {
      key: "wrapped",
      href: username ? `/u/${username}/${year}` : "/",
      icon: Clapperboard,
      label: { tr: `Wrapped ${year}`, en: `Wrapped ${year}` },
      short: { tr: "Wrapped", en: "Wrapped" },
      slug: "wrapped",
      go: "w",
      requiresUser: true,
    },
    {
      key: "profile",
      href: username ? `/u/${username}` : "/",
      icon: UserRound,
      label: { tr: "Profilim", en: "My profile" },
      short: { tr: "Profil", en: "Profile" },
      slug: "profile",
      go: "p",
      requiresUser: true,
    },
    {
      key: "settings",
      href: "/dashboard/settings",
      icon: SlidersHorizontal,
      label: { tr: "Ayarlar", en: "Settings" },
      short: { tr: "Ayarlar", en: "Settings" },
      slug: "settings",
      go: "s",
      requiresUser: true,
    },
  ];
  return username ? items : items.filter((i) => !i.requiresUser);
}

export function activeNav(pathname: string, username: string | null): NavKey | null {
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/repos")) return "overview";
  if (pathname.startsWith("/dashboard/timeline")) return "timeline";
  if (pathname.startsWith("/dashboard/settings")) return "settings";
  if (pathname.startsWith("/leaderboard")) return "leaderboard";
  if (username && pathname.startsWith(`/u/${username}/`) && /\/\d{4}$/.test(pathname)) return "wrapped";
  if (username && pathname === `/u/${username}`) return "profile";
  return null;
}
