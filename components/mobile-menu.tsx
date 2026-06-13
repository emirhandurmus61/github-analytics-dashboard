"use client";

import { useState } from "react";
import { handleSignOut } from "@/app/actions/auth";

type Props = {
  username: string;
  currentYear: number;
  avatarUrl: string | null;
  displayName: string;
};

export default function MobileMenu({ username, currentYear, avatarUrl, displayName }: Props) {
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/dashboard/settings", label: "Ayarlar" },
    { href: "/dashboard/timeline", label: "Zaman Çizelgesi" },
    { href: `/u/${username}`, label: "Profil" },
    { href: `/u/${username}/${currentYear}`, label: "Wrapped" },
    { href: "/leaderboard", label: "Sıralama" },
  ];

  return (
    <div className="relative sm:hidden">
      {/* Hamburger butonu */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
        aria-label="Menüyü aç"
      >
        {open ? (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          {/* Panel */}
          <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl border border-zinc-800 bg-zinc-950/95 py-2 shadow-2xl backdrop-blur-xl">
            {/* Kullanıcı */}
            <div className="flex items-center gap-3 border-b border-zinc-800/60 px-4 py-3">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt={displayName} className="h-8 w-8 rounded-full ring-1 ring-zinc-700" />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs text-zinc-400">
                  {displayName?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}
              <span className="max-w-[130px] truncate text-xs font-medium text-zinc-300">{displayName}</span>
            </div>

            {/* Linkler */}
            <div className="py-1">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center px-4 py-2.5 text-sm text-zinc-400 transition-colors hover:bg-zinc-800/60 hover:text-zinc-200"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Çıkış */}
            <div className="border-t border-zinc-800/60 pt-1">
              <form action={handleSignOut}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-800/60 hover:text-red-400"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                  Çıkış Yap
                </button>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
