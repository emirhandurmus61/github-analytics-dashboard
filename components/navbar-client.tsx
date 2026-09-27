"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  History,
  Trophy,
  Sparkles,
  User,
  Settings,
  LogOut,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { handleSignOut, handleSignIn } from "@/app/actions/auth";
import MobileMenu from "./mobile-menu";

type NavbarClientProps = {
  isLoggedIn: boolean;
  username: string;
  avatarUrl: string | null;
  displayName: string;
  currentYear: number;
};

export default function NavbarClient({
  isLoggedIn,
  username,
  avatarUrl,
  displayName,
  currentYear,
}: NavbarClientProps) {
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sayfa değiştiğinde dropdown'ı kapat (React 19 pattern: adjusting state during render)
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setDropdownOpen(false);
  }

  // Dropdown dışına tıklandığında kapat
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDropdownOpen(false);
      }
    }

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dropdownOpen]);

  // Navigasyon linkleri ve aktiflik durumları
  const isDashboardActive = pathname === "/dashboard";
  const isTimelineActive = pathname.startsWith("/dashboard/timeline");
  const isLeaderboardActive = pathname.startsWith("/leaderboard");
  const isWrappedActive =
    Boolean(username) &&
    (pathname.startsWith(`/u/${username}/${currentYear}`) ||
      pathname.endsWith(`/${currentYear}`));
  const isProfileActive =
    Boolean(username) &&
    pathname === `/u/${username}` &&
    !pathname.includes(`/${currentYear}`);
  const isSettingsActive = pathname.startsWith("/dashboard/settings");

  const navItems = [
    {
      href: "/dashboard",
      label: "Genel Bakış",
      icon: LayoutDashboard,
      active: isDashboardActive,
    },
    {
      href: "/dashboard/timeline",
      label: "Zaman Çizelgesi",
      icon: History,
      active: isTimelineActive,
    },
    {
      href: "/leaderboard",
      label: "Sıralama",
      icon: Trophy,
      active: isLeaderboardActive,
    },
    ...(username
      ? [
          {
            href: `/u/${username}/${currentYear}`,
            label: "Wrapped",
            icon: Sparkles,
            active: isWrappedActive,
            badge: `${currentYear}`,
          },
          {
            href: `/u/${username}`,
            label: "Profil",
            icon: User,
            active: isProfileActive,
          },
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 bg-zinc-950/60 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Sol: Logo & Marka Kimliği */}
        <div className="flex items-center gap-6">
          <Link
            href={isLoggedIn ? "/dashboard" : "/"}
            className="group flex items-center gap-2.5 transition-transform active:scale-98"
          >
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-700/60 bg-gradient-to-br from-zinc-800/90 to-zinc-900/90 shadow-inner transition-all duration-300 group-hover:border-[var(--accent)]/50 group-hover:shadow-[0_0_15px_var(--accent-bg)]">
              <div className="absolute inset-0 rounded-xl bg-[var(--accent-bg)] opacity-40 transition-opacity group-hover:opacity-80" />
              <svg
                className="relative h-4 w-4 text-[var(--accent)] transition-transform duration-300 group-hover:scale-105"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold tracking-tight text-zinc-100 transition-colors group-hover:text-white">
                  Dev Analytics
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-400">
                  <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                  v2.0
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Orta: Masaüstü Navigasyon İskelesi (Desktop Dock) */}
        {isLoggedIn && (
          <nav className="hidden md:flex items-center gap-1 rounded-2xl border border-zinc-800/60 bg-zinc-900/40 p-1 backdrop-blur-md shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.active;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? "border border-zinc-700/60 bg-zinc-800/90 text-zinc-100 shadow-sm"
                      : "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 transition-colors ${
                      isActive ? "text-[var(--accent)]" : "text-zinc-400"
                    }`}
                  />
                  <span>{item.label}</span>
                  {"badge" in item && item.badge && (
                    <span className="rounded-md border border-[var(--accent-border)] bg-[var(--accent-bg)] px-1.5 py-0.2 font-mono text-[9px] font-semibold text-[var(--accent)]">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-3 rounded-full bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]" />
                  )}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Sağ: Kullanıcı Kontrolleri veya Giriş Butonu */}
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              {/* Hızlı Ayarlar İkon Butonu (Masaüstü) */}
              <Link
                href="/dashboard/settings"
                title="Ayarlar"
                className={`hidden sm:flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
                  isSettingsActive
                    ? "border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent)] shadow-sm"
                    : "border-zinc-800/80 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800/70 hover:text-zinc-200"
                }`}
              >
                <Settings className="h-4 w-4" />
              </Link>

              {/* Kullanıcı Profili Açılır Menüsü (Masaüstü) */}
              <div className="relative hidden sm:block" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  aria-expanded={dropdownOpen}
                  aria-haspopup="true"
                  className={`group flex items-center gap-2 rounded-xl border p-1 pl-1.5 pr-2.5 transition-all ${
                    dropdownOpen
                      ? "border-zinc-700 bg-zinc-800/90 text-zinc-100 ring-2 ring-[var(--accent-border)]"
                      : "border-zinc-800/80 bg-zinc-900/50 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/60"
                  }`}
                >
                  <div className="relative">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={displayName || username}
                        width={28}
                        height={28}
                        unoptimized
                        className="rounded-lg ring-1 ring-zinc-700/80 shrink-0"
                      />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-800 text-[11px] font-semibold text-zinc-300 ring-1 ring-zinc-700">
                        {(displayName || username)?.[0]?.toUpperCase() ?? "U"}
                      </div>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-zinc-950 bg-emerald-400" />
                  </div>

                  <span className="max-w-[110px] truncate text-xs font-medium text-zinc-200 lg:max-w-[130px]">
                    {displayName || username}
                  </span>

                  <ChevronDown
                    className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 group-hover:text-zinc-200 ${
                      dropdownOpen ? "rotate-180 text-[var(--accent)]" : ""
                    }`}
                  />
                </button>

                {/* Cam Açılır Panel */}
                {dropdownOpen && (
                  <div className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right rounded-2xl border border-zinc-800/90 bg-zinc-950/95 p-2 shadow-2xl backdrop-blur-2xl ring-1 ring-white/5 animate-in fade-in zoom-in-95 duration-150">
                    {/* Kullanıcı Başlığı */}
                    <div className="flex items-center gap-3 rounded-xl border border-zinc-800/60 bg-zinc-900/50 p-2.5">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={displayName || username}
                          width={36}
                          height={36}
                          unoptimized
                          className="rounded-full ring-2 ring-[var(--accent)]/30 shrink-0"
                        />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-300 ring-2 ring-zinc-700">
                          {(displayName || username)?.[0]?.toUpperCase() ?? "U"}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-zinc-100">
                          {displayName || username}
                        </div>
                        {username && (
                          <div className="truncate font-mono text-[11px] text-zinc-500">
                            @{username}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Hızlı Eylemler */}
                    <div className="my-1.5 space-y-0.5">
                      {username && (
                        <Link
                          href={`/u/${username}`}
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-800/70 hover:text-white"
                        >
                          <div className="flex items-center gap-2">
                            <User className="h-3.5 w-3.5 text-zinc-400" />
                            <span>Profili Görüntüle</span>
                          </div>
                          <ExternalLink className="h-3 w-3 text-zinc-500" />
                        </Link>
                      )}

                      <Link
                        href="/dashboard/settings"
                        onClick={() => setDropdownOpen(false)}
                        className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                          isSettingsActive
                            ? "bg-[var(--accent-bg)] text-[var(--accent)] font-medium"
                            : "text-zinc-300 hover:bg-zinc-800/70 hover:text-white"
                        }`}
                      >
                        <Settings className="h-3.5 w-3.5 text-zinc-400" />
                        <span>Ayarlar</span>
                      </Link>
                    </div>

                    <div className="my-1 h-px bg-zinc-800/60" />

                    {/* Çıkış Yap Butonu */}
                    <form action={handleSignOut}>
                      <button
                        type="submit"
                        className="group flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 transition-all hover:bg-red-500/10 hover:text-red-400"
                      >
                        <LogOut className="h-3.5 w-3.5 text-zinc-500 transition-colors group-hover:text-red-400" />
                        <span>Çıkış Yap</span>
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {/* Mobil Menü (Hamburger) */}
              <MobileMenu
                username={username}
                currentYear={currentYear}
                avatarUrl={avatarUrl}
                displayName={displayName}
              />
            </>
          ) : (
            /* Giriş Yapmamış Kullanıcı Görünümü */
            <div className="flex items-center gap-2">
              <Link
                href="/leaderboard"
                className="hidden sm:flex items-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
              >
                <Trophy className="h-3.5 w-3.5 text-amber-400" />
                <span>Sıralama</span>
              </Link>
              <form action={handleSignIn}>
                <button
                  type="submit"
                  className="group flex items-center gap-2 rounded-xl border border-zinc-700/80 bg-zinc-900/80 px-3.5 py-1.5 text-xs font-medium text-zinc-100 shadow-sm transition-all hover:border-[var(--accent)]/50 hover:bg-zinc-800 hover:shadow-[0_0_12px_var(--accent-bg)]"
                >
                  <svg
                    className="h-3.5 w-3.5 text-zinc-300 transition-colors group-hover:text-[var(--accent)]"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  <span>Giriş Yap</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
