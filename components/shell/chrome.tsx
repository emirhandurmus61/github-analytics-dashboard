"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Search,
  RefreshCw,
  Flame,
  GitCommitHorizontal,
  Moon,
  Sun,
  Monitor,
  LogOut,
  UserRound,
  SlidersHorizontal,
  Clapperboard,
  PanelsTopLeft,
  SquareTerminal,
  AppWindow,
  Check,
  AlertTriangle,
  Pencil,
  Palette,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useUIPrefs } from "@/components/ui-prefs";
import { handleSignIn, handleSignOut } from "@/app/actions/auth";
import { cn, timeAgo, type Lang } from "@/lib/ui/format";
import { useIsClient, useNow } from "@/lib/ui/hooks";
import { Kbd } from "@/components/ui/primitives";
import { LogoMark, Wordmark } from "./logo";
import { useShell } from "./shell-context";
import type { NavItem, NavKey } from "./nav";

export type ShellUser = { username: string; name: string; avatarUrl: string | null };
export type ShellStatus = { streak: number; weekCommits: number; todayCommits: number };

export type ChromeProps = {
  user: ShellUser | null;
  status: ShellStatus | null;
  nav: NavItem[];
  active: NavKey | null;
  crumbs: { label: string; href?: string }[];
  year: number;
};

const L = (lang: Lang, tr: string, en: string) => (lang === "en" ? en : tr);

/* ── Shared bits ──────────────────────────────────────────────────────── */

export function Avatar({ user, size = 26, className }: { user: ShellUser; size?: number; className?: string }) {
  return user.avatarUrl ? (
    <Image
      src={user.avatarUrl}
      alt=""
      width={size}
      height={size}
      unoptimized
      className={cn("shrink-0 rounded-full ring-1 ring-line-strong", className)}
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      className={cn("shrink-0 grid place-items-center rounded-full bg-raised text-ink-2 text-[11px] font-semibold ring-1 ring-line-strong", className)}
      style={{ width: size, height: size }}
    >
      {(user.name || user.username)[0]?.toUpperCase()}
    </span>
  );
}

function useSyncLabel() {
  const { lang } = useLanguage();
  const { sync } = useShell();
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);
  if (sync.status === "syncing") {
    const prog = sync.total ? ` ${sync.current ?? 0}/${sync.total}` : "";
    return { text: `${L(lang as Lang, "senkronize ediliyor", "syncing")}${prog}`, tone: "busy" as const };
  }
  if (sync.status === "error") return { text: L(lang as Lang, "senkron hatası", "sync failed"), tone: "err" as const };
  return { text: sync.lastSyncedAt ? timeAgo(sync.lastSyncedAt, lang) : L(lang as Lang, "hiç senkronlanmadı", "never synced"), tone: "ok" as const };
}

export function SyncButton({ compact }: { compact?: boolean }) {
  const { lang } = useLanguage();
  const { sync, startSync } = useShell();
  const label = useSyncLabel();
  const busy = sync.status === "syncing";
  return (
    <button
      type="button"
      onClick={() => startSync()}
      disabled={busy}
      className={cn("btn btn-ghost btn-sm", compact && "btn-icon")}
      title={L(lang as Lang, "GitHub verilerini şimdi çek", "Pull GitHub data now")}
      aria-label={L(lang as Lang, "Senkronize et", "Sync")}
    >
      <RefreshCw className={cn(busy && "animate-spin")} />
      {!compact && <span className="font-mono text-[11.5px] text-ink-3 font-normal">{label.text}</span>}
    </button>
  );
}

function ModeToggle() {
  const { lang } = useLanguage();
  const { prefs, setPrefs, scheme } = useUIPrefs();
  const next = scheme.kind === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm btn-icon"
      onClick={() => setPrefs({ mode: next })}
      title={
        prefs.mode === "system"
          ? L(lang as Lang, "Sistemi izliyor. Tıkla: sabitle", "Following system. Click to pin")
          : next === "light"
            ? L(lang as Lang, "Açık moda geç", "Switch to light")
            : L(lang as Lang, "Koyu moda geç", "Switch to dark")
      }
      aria-label={L(lang as Lang, "Görünüm modunu değiştir", "Toggle appearance mode")}
    >
      {scheme.kind === "dark" ? <Moon /> : <Sun />}
    </button>
  );
}

function LangSeg() {
  const { lang, setLang } = useLanguage();
  const router = useRouter();
  return (
    <div className="seg [&>button]:h-[22px] [&>button]:px-[7px] [&>button]:font-mono [&>button]:text-[11px]" role="group" aria-label="Language">
      {(["tr", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          aria-pressed={lang === l}
          onClick={() => {
            if (lang === l) return;
            setLang(l);
            router.refresh();
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

/* ── User menu (desktop popover / mobile sheet) ───────────────────────── */

export function UserMenu({ user, year, align = "right", side = "bottom" }: { user: ShellUser; year: number; align?: "left" | "right"; side?: "bottom" | "top" }) {
  const { lang } = useLanguage();
  const { prefs, setPrefs } = useUIPrefs();
  const { openPalette } = useShell();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const l = lang as Lang;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "flex items-center gap-2.5 h-8 px-2.5 rounded-[var(--r-control)] text-[13px] text-ink-2 hover:bg-raised hover:text-ink";

  const content = (
    <>
      <div className="flex items-center gap-2.5 p-2.5">
        <Avatar user={user} size={34} />
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-ink truncate">{user.name || user.username}</div>
          <div className="font-mono text-[11.5px] text-ink-3 truncate">@{user.username}</div>
        </div>
      </div>
      <div className="h-px bg-line my-1" />
      <Link href={`/u/${user.username}`} className={item} onClick={() => setOpen(false)}>
        <UserRound size={15} /> {L(l, "Profilim", "My profile")}
      </Link>
      <Link href={`/u/${user.username}/${year}`} className={item} onClick={() => setOpen(false)}>
        <Clapperboard size={15} /> Wrapped {year}
      </Link>
      <Link href="/dashboard/settings" className={item} onClick={() => setOpen(false)}>
        <SlidersHorizontal size={15} /> {L(l, "Ayarlar", "Settings")}
      </Link>
      <div className="h-px bg-line my-1" />
      <div className="px-2.5 pt-1.5 pb-1 text-[11px] text-ink-4">{L(l, "Arayüz", "Interface")}</div>
      <div className="px-1.5 pb-1.5">
        <div className="seg w-full [&>button]:flex-1 [&>button]:justify-center" role="group">
          {(
            [
              ["editor", PanelsTopLeft, L(l, "Editör", "Editor")],
              ["terminal", SquareTerminal, "Terminal"],
              ["studio", AppWindow, L(l, "Stüdyo", "Studio")],
            ] as const
          ).map(([id, Icon, label]) => (
            <button key={id} type="button" aria-pressed={prefs.ui === id} onClick={() => setPrefs({ ui: id })} title={label}>
              <Icon /> <span className="text-[11.5px]">{label}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="px-1.5 pb-1.5 flex items-center gap-1.5">
        <div className="seg flex-1 [&>button]:flex-1 [&>button]:justify-center" role="group" aria-label={L(l, "Mod", "Mode")}>
          {(
            [
              ["dark", Moon, L(l, "Koyu", "Dark")],
              ["light", Sun, L(l, "Açık", "Light")],
              ["system", Monitor, L(l, "Sistem", "System")],
            ] as const
          ).map(([id, Icon, label]) => (
            <button key={id} type="button" aria-pressed={prefs.mode === id} onClick={() => setPrefs({ mode: id })} title={label}>
              <Icon />
            </button>
          ))}
        </div>
        <LangSeg />
      </div>
      <button
        type="button"
        className={item + " w-full"}
        onClick={() => {
          setOpen(false);
          openPalette("scheme");
        }}
      >
        <Palette size={15} /> {L(l, "Renk şeması seç…", "Pick a color scheme…")}
      </button>
      <div className="h-px bg-line my-1" />
      <form action={handleSignOut}>
        <button type="submit" className={item + " w-full hover:!text-bad"}>
          <LogOut size={15} /> {L(l, "Çıkış yap", "Sign out")}
        </button>
      </form>
    </>
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="grid place-items-center rounded-full p-0.5 hover:ring-2 hover:ring-line-strong transition-shadow"
        title={`@${user.username}`}
      >
        <Avatar user={user} size={26} />
      </button>
      {open && (
        <>
          {/* phones: bottom sheet */}
          <div className="md:hidden fixed inset-0 z-[70]">
            <div className="absolute inset-0 bg-[var(--scrim)] anim-fade" onClick={() => setOpen(false)} />
            <div className="absolute inset-x-0 bottom-0 surface-pop rounded-b-none p-1.5 pb-[calc(env(safe-area-inset-bottom)+8px)] anim-sheet">
              <div className="mx-auto mb-1 mt-1 h-1 w-9 rounded-full bg-line-strong" />
              {content}
            </div>
          </div>
          {/* desktop: popover */}
          <div
            className={cn(
              "hidden md:block absolute z-[70] w-[268px] surface-pop p-1.5 anim-pop",
              align === "right" ? "right-0" : "left-0",
              side === "bottom" ? "top-full mt-2" : "bottom-0 left-full ml-2",
            )}
            role="menu"
          >
            {content}
          </div>
        </>
      )}
    </div>
  );
}

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

/* ── Terminal: tmux window bar + vim status line ──────────────────────── */

export function TmuxBar({ user, nav, active }: ChromeProps) {
  const tick = useNow(30_000);
  const now = tick === null ? null : new Date(tick);
  const { lang } = useLanguage();
  return (
    <header className="sticky top-0 z-30 hidden md:flex h-7 items-stretch bg-raised font-mono text-[12px] border-b border-line select-none">
      <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-1.5 px-2.5 font-semibold bg-accent text-on-accent">
        [devboard]
      </Link>
      <nav className="flex items-stretch overflow-x-auto" aria-label="Windows">
        {nav.map((n, i) => {
          const on = active === n.key;
          return (
            <Link
              key={n.key}
              href={n.href}
              aria-current={on ? "page" : undefined}
              className={cn("flex items-center px-2 whitespace-nowrap", on ? "bg-surface text-ink font-semibold" : "text-ink-3 hover:text-ink")}
              title={`${n.label[lang as Lang]} (${i + 1})`}
            >
              {i + 1}:{n.slug}
              {on ? "*" : ""}
            </Link>
          );
        })}
      </nav>
      <div className="ml-auto flex items-center gap-3 px-2.5 text-ink-3">
        {user ? <UserMenu user={user} year={new Date().getFullYear()} /> : <SignInButton terminal />}
        {now && (
          <span className="text-ink-2 num">
            {now.toLocaleTimeString(lang === "en" ? "en-GB" : "tr-TR", { hour: "2-digit", minute: "2-digit" })}{" "}
            <span className="text-ink-4">{now.toLocaleDateString(lang === "en" ? "en-GB" : "tr-TR", { day: "2-digit", month: "short" })}</span>
          </span>
        )}
      </div>
    </header>
  );
}

export function StatusLine({ user, status, crumbs }: ChromeProps) {
  const { lang, toggleLang } = useLanguage();
  const router = useRouter();
  const { scheme } = useUIPrefs();
  const { sync, startSync, editing, openPalette, setHelpOpen } = useShell();
  const label = useSyncLabel();
  const l = lang as Lang;
  const mode = editing ? "EDIT" : sync.status === "syncing" ? "SYNC" : "NORMAL";
  const modeBg = editing ? "var(--hue-yellow)" : sync.status === "syncing" ? "var(--hue-blue)" : "var(--accent)";
  const path = "~/" + crumbs.map((c) => c.label.toLocaleLowerCase(lang === "en" ? "en" : "tr").replace(/\s+/g, "-")).join("/");
  return (
    <footer className="fixed bottom-0 inset-x-0 z-40 hidden md:flex h-6 items-stretch bg-canvas border-t border-line font-mono text-[11.5px] text-ink-3 select-none">
      <span className="flex items-center px-2.5 font-bold tracking-wide" style={{ background: modeBg, color: "var(--on-accent)" }}>
        {mode}
      </span>
      <span className="flex items-center px-2.5 bg-raised text-ink-2">{path}</span>
      {user && (
        <button type="button" onClick={() => startSync()} className="flex items-center gap-1.5 px-2.5 hover:text-ink">
          {sync.status === "error" ? "✗" : sync.status === "syncing" ? "⟳" : "✓"} {label.text}
        </button>
      )}
      {editing && (
        <span className="flex items-center px-2.5 text-ink-2">
          {L(l, "sürükle · kenardan boyutlandır · esc bitir", "drag · resize from edges · esc to finish")}
        </span>
      )}
      <div className="ml-auto flex items-stretch">
        {status && (
          <>
            <span className="flex items-center px-2">streak {status.streak}d</span>
            <span className="flex items-center px-2">wk {status.weekCommits}</span>
          </>
        )}
        <button type="button" className="flex items-center px-2 hover:text-ink" onClick={() => { toggleLang(); router.refresh(); }}>
          {lang}
        </button>
        <button type="button" className="flex items-center px-2.5 bg-raised text-ink-2 hover:text-ink" onClick={() => openPalette("scheme")}>
          {scheme.id}
        </button>
        <button type="button" className="flex items-center px-2 hover:text-ink" onClick={() => openPalette()}>
          :cmd
        </button>
        <button type="button" className="flex items-center px-2 hover:text-ink" onClick={() => setHelpOpen(true)}>
          ?help
        </button>
      </div>
    </footer>
  );
}

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

/* ── Sign-in (logged out) ─────────────────────────────────────────────── */

export function SignInButton({ compact, terminal }: { compact?: boolean; terminal?: boolean }) {
  const { lang } = useLanguage();
  return (
    <form action={handleSignIn}>
      <button type="submit" className={cn("btn btn-primary btn-sm", terminal && "!h-[22px] !rounded-none")}>
        <GithubGlyph />
        {!compact && L(lang as Lang, "GitHub ile giriş", "Sign in with GitHub")}
      </button>
    </form>
  );
}

export function GithubGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.65.5.5 5.65.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.58.23 2.75.11 3.04.74.8 1.18 1.83 1.18 3.08 0 4.41-2.69 5.39-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
    </svg>
  );
}
