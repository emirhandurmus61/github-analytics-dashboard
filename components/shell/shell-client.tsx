"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { X, Check, AlertTriangle } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useUIPrefs } from "@/components/ui-prefs";
import { cn, type Lang } from "@/lib/ui/format";
import { isValidTheme } from "@/lib/themes";
import { Kbd } from "@/components/ui/primitives";
import { ShellProvider, useShell } from "./shell-context";
import { buildNav, activeNav } from "./nav";
import CommandPalette from "./command-palette";
import {
  EditorRail,
  EditorTitleBar,
  EditorStatusBar,
  TmuxBar,
  StatusLine,
  StudioTopBar,
  MobileTopBar,
  TabBar,
  type ShellUser,
  type ShellStatus,
  type ChromeProps,
} from "./chrome";

type Props = {
  user: ShellUser | null;
  status: ShellStatus | null;
  lastSyncedAt: string | null;
  year: number;
  bleed?: boolean;
  dbAccent?: string | null;
  children: ReactNode;
};

export default function ShellClient(props: Props) {
  return (
    <ShellProvider lastSyncedAt={props.lastSyncedAt} loggedIn={!!props.user}>
      <ShellFrame {...props} />
    </ShellProvider>
  );
}

function isTyping(el: EventTarget | null) {
  const t = el as HTMLElement | null;
  if (!t) return false;
  const tag = t.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable;
}

function ShellFrame({ user, status, year, bleed, dbAccent, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { lang } = useLanguage();
  const { prefs, setPrefs } = useUIPrefs();
  const shell = useShell();
  const l = lang as Lang;
  const ui = prefs.ui;

  // The account accent (DB) wins over a stale cookie from another device.
  const accentSynced = useRef(false);
  useEffect(() => {
    if (accentSynced.current) return;
    accentSynced.current = true;
    if (dbAccent && isValidTheme(dbAccent) && dbAccent !== prefs.accent) setPrefs({ accent: dbAccent });
  }, [dbAccent, prefs.accent, setPrefs]);

  const nav = useMemo(() => buildNav(user?.username ?? null, year), [user?.username, year]);
  const active = activeNav(pathname, user?.username ?? null);

  const crumbs = useMemo(() => {
    const out: { label: string; href?: string }[] = [];
    const repo = pathname.match(/^\/dashboard\/repos\/([^/]+)/);
    if (repo) {
      out.push({ label: l === "en" ? "Overview" : "Genel bakış", href: "/dashboard" });
      out.push({ label: decodeURIComponent(repo[1]) });
      return out;
    }
    const item = nav.find((n) => n.key === active);
    if (item) return [{ label: item.label[l], href: item.href }];
    const prof = pathname.match(/^\/u\/([^/]+)(?:\/(\d{4}))?/);
    if (prof) {
      out.push({ label: `@${prof[1]}`, href: `/u/${prof[1]}` });
      if (prof[2]) out.push({ label: `Wrapped ${prof[2]}` });
      return out;
    }
    return [{ label: "devboard" }];
  }, [pathname, nav, active, l]);

  /* Keyboard: ⌘K, /, :, ?, g-chords, e, digits (terminal), esc. */
  const chord = useRef<{ key: string; at: number } | null>(null);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (shell.paletteOpen) shell.closePalette();
        else shell.openPalette();
        return;
      }
      if (shell.paletteOpen || isTyping(e.target) || mod || e.altKey) return;

      if (e.key === "Escape" && shell.editing) {
        shell.setEditing(false);
        return;
      }
      if (shell.helpOpen) {
        if (e.key === "Escape" || e.key === "?") shell.setHelpOpen(false);
        return;
      }
      if (e.key === "/" || (e.key === ":" && ui === "terminal")) {
        e.preventDefault();
        shell.openPalette();
        return;
      }
      if (e.key === "?") {
        e.preventDefault();
        shell.setHelpOpen(true);
        return;
      }
      const now = Date.now();
      if (chord.current && chord.current.key === "g" && now - chord.current.at < 1200) {
        const target = nav.find((n) => n.go === e.key.toLowerCase());
        chord.current = null;
        if (target) {
          e.preventDefault();
          router.push(target.href);
        }
        return;
      }
      if (e.key === "g") {
        chord.current = { key: "g", at: now };
        return;
      }
      if (e.key === "e" && shell.editable) {
        e.preventDefault();
        shell.setEditing((v) => !v);
        return;
      }
      if (ui === "terminal" && /^[1-9]$/.test(e.key)) {
        const target = nav[Number(e.key) - 1];
        if (target) {
          e.preventDefault();
          router.push(target.href);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shell, nav, router, ui]);

  const chrome: ChromeProps = { user, status, nav, active, crumbs, year };
  const loggedIn = !!user;

  // Main content offsets per interface.
  const mainPad = cn(
    "min-h-dvh",
    ui === "editor" && "md:pl-[52px]",
    loggedIn && (ui === "studio" ? "pb-[calc(88px+env(safe-area-inset-bottom))]" : "pb-[calc(58px+env(safe-area-inset-bottom))]"),
    ui === "studio" ? "md:pb-0" : "md:pb-6",
  );

  return (
    <div data-shell={ui} className="relative">
      <SyncProgress />
      {ui === "editor" && <EditorRail {...chrome} />}
      <div className={mainPad}>
        {ui === "editor" && <EditorTitleBar {...chrome} />}
        {ui === "terminal" && <TmuxBar {...chrome} />}
        {ui === "studio" && <StudioTopBar {...chrome} />}
        <MobileTopBar {...chrome} ui={ui} />
        {bleed ? (
          children
        ) : (
          <main className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">{children}</main>
        )}
      </div>
      {ui === "editor" && <EditorStatusBar {...chrome} />}
      {ui === "terminal" && <StatusLine {...chrome} />}
      {loggedIn && <TabBar {...chrome} />}
      {shell.paletteOpen && <CommandPalette username={user?.username ?? null} year={year} variant={ui === "terminal" ? "cmdline" : "center"} />}
      <ShortcutHelp />
      <Toasts />
    </div>
  );
}

/* Thin progress line along the top edge while syncing. */
function SyncProgress() {
  const { sync } = useShell();
  if (sync.status !== "syncing") return null;
  const pct = sync.total ? Math.max(4, Math.round(((sync.current ?? 0) / sync.total) * 100)) : null;
  return (
    <div className="fixed inset-x-0 top-0 z-[90] h-[2px] overflow-hidden" role="progressbar" aria-valuenow={pct ?? undefined}>
      {pct === null ? (
        <div className="h-full w-full bg-accent origin-left" style={{ animation: "progress-indeterminate 1.4s ease-in-out infinite" }} />
      ) : (
        <div className="h-full bg-accent transition-[width] duration-300" style={{ width: `${pct}%` }} />
      )}
    </div>
  );
}

function Toasts() {
  const { toasts } = useShell();
  return (
    <div className="pointer-events-none fixed z-[95] inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom))] md:bottom-10 md:right-4 md:left-auto flex flex-col items-center md:items-end gap-2 px-4" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto surface-pop flex items-center gap-2 px-3 py-2 text-[13px] text-ink anim-pop max-w-sm">
          {t.tone === "ok" ? <Check size={15} className="text-good shrink-0" /> : <AlertTriangle size={15} className="text-bad shrink-0" />}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

function ShortcutHelp() {
  const { helpOpen, setHelpOpen } = useShell();
  const { lang } = useLanguage();
  const { prefs } = useUIPrefs();
  const l = lang as Lang;
  if (!helpOpen) return null;
  const rows: [string[], string][] = [
    [["⌘", "K"], l === "en" ? "Command palette" : "Komut paleti"],
    [["/"], l === "en" ? "Command palette" : "Komut paleti"],
    [["G", "O"], l === "en" ? "Go to overview" : "Genel bakışa git"],
    [["G", "T"], l === "en" ? "Go to timeline" : "Zaman çizelgesine git"],
    [["G", "L"], l === "en" ? "Go to leaderboard" : "Sıralamaya git"],
    [["G", "W"], l === "en" ? "Go to Wrapped" : "Wrapped'e git"],
    [["G", "P"], l === "en" ? "Go to profile" : "Profile git"],
    [["G", "S"], l === "en" ? "Go to settings" : "Ayarlara git"],
    [["E"], l === "en" ? "Customize cards (overview)" : "Kartları düzenle (genel bakış)"],
    [["Esc"], l === "en" ? "Finish editing / close" : "Düzenlemeyi bitir / kapat"],
    [["?"], l === "en" ? "This list" : "Bu liste"],
  ];
  if (prefs.ui === "terminal") {
    rows.splice(2, 0, [["1", "…", "6"], l === "en" ? "Switch window" : "Pencere değiştir"], [[":"], l === "en" ? "Command line" : "Komut satırı"]);
  }
  return (
    <div className="fixed inset-0 z-[85] grid place-items-center p-4">
      <div className="absolute inset-0 bg-[var(--scrim)] anim-fade" onClick={() => setHelpOpen(false)} />
      <div className="relative w-full max-w-md surface-pop anim-pop" role="dialog" aria-modal aria-label={l === "en" ? "Keyboard shortcuts" : "Klavye kısayolları"}>
        <div className="flex items-center justify-between px-4 h-11 border-b border-line">
          <h2 className="text-[13px] font-semibold text-ink">{l === "en" ? "Keyboard shortcuts" : "Klavye kısayolları"}</h2>
          <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => setHelpOpen(false)} aria-label={l === "en" ? "Close" : "Kapat"}>
            <X />
          </button>
        </div>
        <ul className="p-2">
          {rows.map(([keys, label], i) => (
            <li key={i} className="flex items-center justify-between h-8 px-2 text-[13px] text-ink-2">
              {label}
              <span className="flex gap-1">
                {keys.map((k, j) => (
                  <Kbd key={j}>{k}</Kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
