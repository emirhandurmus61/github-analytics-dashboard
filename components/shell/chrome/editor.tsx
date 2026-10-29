"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  RefreshCw,
  Flame,
  GitCommitHorizontal,
  Check,
  AlertTriangle,
  Pencil,
  Palette,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useUIPrefs } from "@/components/ui-prefs";
import { cn, type Lang } from "@/lib/ui/format";
import { useIsClient } from "@/lib/ui/hooks";
import { Kbd } from "@/components/ui/primitives";
import { LogoMark } from "../logo";
import { useShell } from "../shell-context";
import type { NavItem } from "../nav";
import { L, useSyncLabel, SyncButton, ModeToggle, LangSeg, SignInButton, type ChromeProps } from "./common";
import { UserMenu } from "./user-menu";

/* ── Editor: activity rail + title bar + status bar ───────────────────── */

export function EditorRail({ user, nav, active, year }: ChromeProps) {
  const { lang } = useLanguage();
  const main = nav.filter((n) => n.key !== "settings");
  const settings = nav.find((n) => n.key === "settings");
  return (
    <aside className="fixed left-0 top-0 bottom-6 z-40 hidden md:flex w-[52px] flex-col items-center border-r border-line bg-canvas py-2">
      <Link href={user ? "/dashboard" : "/"} className="grid h-10 w-10 place-items-center mb-2 rounded-[var(--r-control)] hover:bg-raised" aria-label="Devboard">
        <LogoMark size={18} />
      </Link>
      <nav className="flex flex-col items-center gap-1" aria-label={L(lang as Lang, "Ana gezinme", "Main navigation")}>
        {main.map((n) => (
          <RailItem key={n.key} item={n} active={active === n.key} lang={lang as Lang} />
        ))}
      </nav>
      <div className="mt-auto flex flex-col items-center gap-1">
        {settings && <RailItem item={settings} active={active === "settings"} lang={lang as Lang} />}
        {user && (
          <div className="mt-1">
            <UserMenu user={user} year={year} side="top" align="left" />
          </div>
        )}
      </div>
    </aside>
  );
}

function RailItem({ item, active, lang }: { item: NavItem; active: boolean; lang: Lang }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative grid h-10 w-10 place-items-center rounded-[var(--r-control)] transition-colors",
        active ? "text-ink" : "text-ink-3 hover:text-ink hover:bg-raised",
      )}
    >
      {active && <span className="absolute -left-[6px] top-2 bottom-2 w-[2px] rounded-full bg-accent" />}
      <Icon size={19} strokeWidth={active ? 2 : 1.7} />
      <span className="pointer-events-none absolute left-full ml-2.5 z-50 flex items-center gap-2 whitespace-nowrap surface-pop px-2 py-1.5 text-[12px] text-ink opacity-0 translate-x-[-4px] transition-[opacity,transform] duration-100 group-hover:opacity-100 group-hover:translate-x-0 group-focus-visible:opacity-100">
        {item.label[lang]}
        <span className="flex gap-0.5">
          <Kbd>G</Kbd>
          <Kbd>{item.go.toUpperCase()}</Kbd>
        </span>
      </span>
    </Link>
  );
}

export function EditorTitleBar({ user, crumbs }: ChromeProps) {
  const { lang } = useLanguage();
  const { openPalette } = useShell();
  const client = useIsClient();
  const mac = !client || /Mac|iP(hone|ad)/.test(navigator.platform);
  return (
    <header className="sticky top-0 z-30 hidden md:flex h-11 items-center gap-3 border-b border-line px-4 bg-[color-mix(in_oklab,var(--bg-0)_86%,transparent)] backdrop-blur-md">
      <nav className="flex min-w-0 items-center gap-1.5 text-[13px]" aria-label="Breadcrumb">
        {user && <span className="font-mono text-[12px] text-ink-3">@{user.username}</span>}
        {crumbs.map((c, i) => (
          <span key={i} className="flex min-w-0 items-center gap-1.5">
            <span className="text-ink-4">/</span>
            {c.href && i < crumbs.length - 1 ? (
              <Link href={c.href} className="truncate text-ink-3 hover:text-ink">
                {c.label}
              </Link>
            ) : (
              <span className="truncate font-medium text-ink">{c.label}</span>
            )}
          </span>
        ))}
      </nav>
      <button
        type="button"
        onClick={() => openPalette()}
        className="mx-auto hidden lg:flex h-7 w-[min(440px,36vw)] items-center gap-2 rounded-[var(--r-control)] border border-line bg-surface px-2.5 text-[12.5px] text-ink-3 hover:border-line-strong hover:text-ink-2 transition-colors"
      >
        <Search size={14} />
        {L(lang as Lang, "Ara veya bir yere git…", "Search or jump to…")}
        <span className="ml-auto flex gap-0.5">
          <Kbd>{mac ? "⌘" : "Ctrl"}</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>
      <div className="ml-auto lg:ml-0 flex items-center gap-1">
        <button type="button" className="btn btn-ghost btn-sm btn-icon lg:hidden" onClick={() => openPalette()} aria-label={L(lang as Lang, "Komut paleti", "Command palette")}>
          <Search />
        </button>
        {user && <SyncButton />}
        <ModeToggle />
        {!user && <LangSeg />}
        {!user && <SignInButton />}
      </div>
    </header>
  );
}

function StatusItem({ children, onClick, title, className }: { children: ReactNode; onClick?: () => void; title?: string; className?: string }) {
  const cls = cn("flex items-center gap-1.5 px-2 whitespace-nowrap", onClick && "hover:bg-raised hover:text-ink", className);
  return onClick ? (
    <button type="button" className={cls} onClick={onClick} title={title}>
      {children}
    </button>
  ) : (
    <span className={cls} title={title}>
      {children}
    </span>
  );
}

export function EditorStatusBar({ user, status }: ChromeProps) {
  const { lang, toggleLang } = useLanguage();
  const router = useRouter();
  const { scheme, prefs } = useUIPrefs();
  const { sync, startSync, openPalette, editing, setHelpOpen } = useShell();
  const label = useSyncLabel();
  const l = lang as Lang;
  return (
    <footer className="fixed bottom-0 inset-x-0 z-40 hidden md:flex h-6 items-stretch border-t border-line bg-canvas font-mono text-[11.5px] text-ink-3 select-none">
      <span
        className="flex items-center gap-1.5 px-2.5 font-semibold"
        style={{
          background: editing ? "var(--hue-yellow)" : "var(--accent)",
          color: "var(--on-accent)",
        }}
      >
        {editing ? <Pencil size={12} /> : <LogoMark size={11} className="[&_rect]:fill-[var(--on-accent)] opacity-90" />}
        {editing ? L(l, "düzenleme", "editing") : user ? `@${user.username}` : "devboard"}
      </span>
      {user && (
        <StatusItem onClick={() => startSync()} title={L(l, "Şimdi senkronize et", "Sync now")}>
          {sync.status === "error" ? (
            <AlertTriangle size={12} className="text-bad" />
          ) : sync.status === "syncing" ? (
            <RefreshCw size={12} className="animate-spin text-accent" />
          ) : (
            <Check size={12} className="text-good" />
          )}
          {label.text}
        </StatusItem>
      )}
      {status && (
        <>
          <StatusItem title={L(l, "Güncel seri", "Current streak")}>
            <Flame size={12} className={status.streak > 0 ? "text-hue-orange" : ""} />
            {status.streak} {L(l, "gün seri", "day streak")}
          </StatusItem>
          <StatusItem title={L(l, "Bu haftaki commitler", "Commits this week")}>
            <GitCommitHorizontal size={12} />
            {status.weekCommits} {L(l, "bu hafta", "this week")}
          </StatusItem>
        </>
      )}
      <div className="ml-auto flex items-stretch">
        <StatusItem onClick={() => { toggleLang(); router.refresh(); }} title={L(l, "Dili değiştir", "Switch language")}>
          {lang.toUpperCase()}
        </StatusItem>
        <StatusItem onClick={() => openPalette("ui")} title={L(l, "Arayüzü değiştir", "Switch interface")}>
          {prefs.ui === "editor" ? L(l, "editör", "editor") : prefs.ui === "terminal" ? "terminal" : L(l, "stüdyo", "studio")}
        </StatusItem>
        <StatusItem onClick={() => openPalette("scheme")} title={L(l, "Renk şemasını değiştir", "Change color scheme")}>
          <Palette size={12} />
          {scheme.name}
        </StatusItem>
        <StatusItem onClick={() => setHelpOpen(true)} title={L(l, "Klavye kısayolları", "Keyboard shortcuts")}>
          ?
        </StatusItem>
      </div>
    </footer>
  );
}
