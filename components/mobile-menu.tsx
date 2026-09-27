"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  History,
  Trophy,
  Sparkles,
  Settings,
  User,
  LogOut,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { handleSignOut } from "@/app/actions/auth";

type Props = {
  username: string;
  currentYear: number;
  avatarUrl: string | null;
  displayName: string;
};

export default function MobileMenu({
  username,
  currentYear,
  avatarUrl,
  displayName,
}: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Route değiştiğinde menüyü otomatik kapat (React 19 pattern: adjusting state during render)
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  // Açıkken arka plan kaydırmayı kilitle
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // ESC tuşuna basıldığında kapat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const navLinks = [
    {
      href: "/dashboard",
      label: "Genel Bakış",
      desc: "Metrikler, grafikler ve istatistikler",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      href: "/dashboard/timeline",
      label: "Zaman Çizelgesi",
      desc: "Aktivite akışı ve commit geçmişi",
      icon: History,
      active: pathname.startsWith("/dashboard/timeline"),
    },
    {
      href: "/leaderboard",
      label: "Sıralama",
      desc: "Global geliştirici ligi ve rozetler",
      icon: Trophy,
      active: pathname.startsWith("/leaderboard"),
    },
    ...(username
      ? [
          {
            href: `/u/${username}/${currentYear}`,
            label: `Wrapped ${currentYear}`,
            desc: "Yıllık geliştirici performansı özeti",
            icon: Sparkles,
            active:
              pathname.startsWith(`/u/${username}/${currentYear}`) ||
              pathname.endsWith(`/${currentYear}`),
            badge: `${currentYear}`,
          },
          {
            href: `/u/${username}`,
            label: "Geliştirici Profili",
            desc: "Kamuya açık vitrin sayfası",
            icon: User,
            active:
              pathname === `/u/${username}` &&
              !pathname.includes(`/${currentYear}`),
          },
        ]
      : []),
    {
      href: "/dashboard/settings",
      label: "Ayarlar",
      desc: "Tema, görünüm ve hesap tercihleri",
      icon: Settings,
      active: pathname.startsWith("/dashboard/settings"),
    },
  ];

  return (
    <div className="md:hidden">
      {/* Menü Tetikleme Butonu */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label={open ? "Menüyü Kapat" : "Menüyü Aç"}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800/80 bg-zinc-900/60 text-zinc-300 transition-all hover:border-zinc-700 hover:bg-zinc-800/80 hover:text-white active:scale-95"
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      {/* Menü Katmanı */}
      {open && (
        <>
          {/* Karartma Arka Planı */}
          <div
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Menü Paneli */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Mobil Gezinme Menüsü"
            className="fixed inset-x-0 top-0 z-50 max-h-[90vh] overflow-y-auto custom-scroll border-b border-zinc-800/80 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-2xl ring-1 ring-white/5 animate-in slide-in-from-top-4 duration-200"
          >
            {/* Üst Bar: Logo ve Kapat */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/60">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-700/60 bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-inner">
                  <div className="absolute inset-0 rounded-xl bg-[var(--accent-bg)] opacity-60" />
                  <svg
                    className="relative h-4 w-4 text-[var(--accent)]"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tracking-tight text-zinc-100">
                    Dev Analytics
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-400">
                    <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                    v2.0
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                aria-label="Kapat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Kullanıcı Kartı */}
            {username && (
              <div className="mt-3 flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-3">
                <div className="flex items-center gap-3 min-w-0">
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
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-zinc-100">
                      {displayName || username}
                    </div>
                    <div className="truncate font-mono text-[11px] text-zinc-500">
                      @{username}
                    </div>
                  </div>
                </div>

                <Link
                  href={`/u/${username}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-1 rounded-lg border border-zinc-700/60 bg-zinc-800/60 px-2.5 py-1 text-[11px] font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-700/60 hover:text-white shrink-0"
                >
                  <span>Profil</span>
                  <ExternalLink className="h-3 w-3 text-zinc-400" />
                </Link>
              </div>
            )}

            {/* Navigasyon Linkleri */}
            <div className="mt-3 space-y-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = link.active;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`group flex items-center justify-between rounded-xl border p-2.5 transition-all ${
                      isActive
                        ? "border-[var(--accent-border)] bg-[var(--accent-bg)] text-zinc-100 shadow-sm"
                        : "border-zinc-800/60 bg-zinc-900/30 text-zinc-400 hover:border-zinc-700/80 hover:bg-zinc-900/70 hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                          isActive
                            ? "border-[var(--accent-border)] bg-[var(--accent-bg)] text-[var(--accent)]"
                            : "border-zinc-800 bg-zinc-900 text-zinc-400 group-hover:border-zinc-700 group-hover:text-zinc-200"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-medium truncate ${
                              isActive ? "text-zinc-100" : "text-zinc-300"
                            }`}
                          >
                            {link.label}
                          </span>
                          {"badge" in link && link.badge && (
                            <span className="rounded-md border border-[var(--accent-border)] bg-[var(--accent-bg)] px-1.5 py-0.2 font-mono text-[9px] font-medium text-[var(--accent)]">
                              {link.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500 truncate">
                          {link.desc}
                        </p>
                      </div>
                    </div>

                    <ChevronRight
                      className={`h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                        isActive ? "text-[var(--accent)]" : "text-zinc-600"
                      }`}
                    />
                  </Link>
                );
              })}
            </div>

            {/* Alt Çıkış Butonu */}
            <div className="mt-4 border-t border-zinc-800/60 pt-3">
              <form action={handleSignOut}>
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-800/80 bg-zinc-900/40 px-4 py-2.5 text-xs font-medium text-zinc-400 transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Oturumu Kapat</span>
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
