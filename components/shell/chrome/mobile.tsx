"use client";

import Link from "next/link";
import {
  Search,
  RefreshCw,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useUIPrefs } from "@/components/ui-prefs";
import { cn, type Lang } from "@/lib/ui/format";
import { LogoMark } from "../logo";
import { useShell } from "../shell-context";
import { L, SignInButton, type ChromeProps } from "./common";
import { UserMenu } from "./user-menu";

/* ── Mobile: compact top bar + bottom tab bar ─────────────────────────── */

export function MobileTopBar({ user, crumbs, year }: ChromeProps & { ui: string }) {
  const { lang } = useLanguage();
  const { prefs } = useUIPrefs();
  const { openPalette, sync, startSync } = useShell();
  const title = crumbs[crumbs.length - 1]?.label ?? "devboard";
  const terminal = prefs.ui === "terminal";
  return (
    <header className="sticky top-0 z-30 md:hidden border-b border-line bg-[color-mix(in_oklab,var(--bg-0)_88%,transparent)] backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="flex h-[52px] items-center gap-2 px-4">
        <Link href={user ? "/dashboard" : "/"} className="shrink-0" aria-label="Devboard">
          <LogoMark size={20} />
        </Link>
        <h1 className={cn("min-w-0 flex-1 truncate text-[15px] font-semibold text-ink", terminal && "font-mono text-[13.5px]")}>
          {terminal ? `~/${title.toLocaleLowerCase(lang === "en" ? "en" : "tr").replace(/\s+/g, "-")}` : title}
        </h1>
        <button type="button" className="btn btn-ghost btn-icon" onClick={() => openPalette()} aria-label={L(lang as Lang, "Ara", "Search")}>
          <Search size={17} />
        </button>
        {user ? (
          <>
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={() => startSync()}
              disabled={sync.status === "syncing"}
              aria-label={L(lang as Lang, "Senkronize et", "Sync")}
            >
              <RefreshCw size={16} className={cn(sync.status === "syncing" && "animate-spin text-accent")} />
            </button>
            <UserMenu user={user} year={year} />
          </>
        ) : (
          <SignInButton compact />
        )}
      </div>
    </header>
  );
}

export function TabBar({ nav, active }: ChromeProps) {
  const { lang } = useLanguage();
  const { prefs } = useUIPrefs();
  const { editing } = useShell();
  const tabs = nav.filter((n) => n.key !== "settings").slice(0, 5);
  if (editing || tabs.length < 2) return null;
  const studio = prefs.ui === "studio";
  const terminal = prefs.ui === "terminal";
  return (
    <nav
      className={cn(
        "fixed z-40 md:hidden",
        studio
          ? "inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+10px)] rounded-[22px] border border-line bg-[color-mix(in_oklab,var(--bg-1)_92%,transparent)] backdrop-blur-xl shadow-[0_16px_40px_-16px_rgba(0,0,0,var(--shadow-strength))]"
          : "inset-x-0 bottom-0 border-t border-line bg-[color-mix(in_oklab,var(--bg-0)_94%,transparent)] backdrop-blur-xl pb-[env(safe-area-inset-bottom)]",
      )}
      aria-label={L(lang as Lang, "Ana gezinme", "Main navigation")}
    >
      <div className="grid h-[58px]" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
        {tabs.map((n, i) => {
          const on = active === n.key;
          const Icon = n.icon;
          return (
            <Link
              key={n.key}
              href={n.href}
              aria-current={on ? "page" : undefined}
              className={cn("relative flex flex-col items-center justify-center gap-1 text-[10.5px] font-medium", on ? "text-ink" : "text-ink-3")}
            >
              {on && !studio && !terminal && <span className="absolute top-0 h-[2px] w-8 rounded-b-full bg-accent" />}
              {studio && on && <span className="absolute inset-1.5 rounded-[16px] bg-raised" />}
              <Icon size={20} strokeWidth={on ? 2.1 : 1.7} className={cn("relative", on && "text-accent")} />
              <span className={cn("relative", terminal && "font-mono", terminal && on && "bg-accent text-on-accent px-1")}>
                {terminal ? `${i + 1}:${n.slug}` : n.short[lang as Lang]}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
