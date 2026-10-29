"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { useUIPrefs } from "@/components/ui-prefs";
import { cn, type Lang } from "@/lib/ui/format";
import { useNow } from "@/lib/ui/hooks";
import { useShell } from "../shell-context";
import { L, useSyncLabel, SignInButton, type ChromeProps } from "./common";
import { UserMenu } from "./user-menu";

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
