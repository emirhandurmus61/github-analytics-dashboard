"use client";

import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { cn, type Lang } from "@/lib/ui/format";
import { Kbd } from "@/components/ui/primitives";
import { LogoMark, Wordmark } from "../logo";
import { useShell } from "../shell-context";
import { L, SyncButton, ModeToggle, LangSeg, SignInButton, type ChromeProps } from "./common";
import { UserMenu } from "./user-menu";

/* ── Studio: centered pill navigation ─────────────────────────────────── */

export function StudioTopBar({ user, nav, active, year }: ChromeProps) {
  const { lang } = useLanguage();
  const { openPalette } = useShell();
  const main = nav.filter((n) => n.key !== "settings");
  return (
    <header className="sticky top-0 z-30 hidden md:flex h-16 items-center gap-4 px-5 lg:px-8 bg-[color-mix(in_oklab,var(--bg-0)_82%,transparent)] backdrop-blur-xl">
      <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2.5 shrink-0">
        <LogoMark size={20} />
        <Wordmark className="font-sans !tracking-[-0.03em] text-[15px]" />
      </Link>
      <nav className="mx-auto flex items-center gap-1 rounded-full border border-line bg-surface p-1 shadow-[0_8px_24px_-16px_rgba(0,0,0,var(--shadow-strength))]">
        {main.map((n) => {
          const on = active === n.key;
          const Icon = n.icon;
          return (
            <Link
              key={n.key}
              href={n.href}
              aria-current={on ? "page" : undefined}
              className={cn(
                "flex h-8 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium transition-colors",
                on ? "bg-raised text-ink shadow-[inset_0_0_0_1px_var(--line-2)]" : "text-ink-3 hover:text-ink",
              )}
            >
              <Icon size={15} className={on ? "text-accent" : ""} />
              <span className="hidden lg:inline">{n.short[lang as Lang]}</span>
            </Link>
          );
        })}
      </nav>
      <div className="flex items-center gap-1 shrink-0">
        <button type="button" onClick={() => openPalette()} className="btn btn-ghost btn-sm" aria-label={L(lang as Lang, "Komut paleti", "Command palette")}>
          <Search />
          <Kbd className="hidden lg:inline-flex">⌘K</Kbd>
        </button>
        {user && <SyncButton compact />}
        <ModeToggle />
        {user ? (
          <>
            <Link href="/dashboard/settings" className={cn("btn btn-ghost btn-sm btn-icon", active === "settings" && "!text-accent")} aria-label={L(lang as Lang, "Ayarlar", "Settings")}>
              <SlidersHorizontal />
            </Link>
            <UserMenu user={user} year={year} />
          </>
        ) : (
          <>
            <LangSeg />
            <SignInButton />
          </>
        )}
      </div>
    </header>
  );
}
