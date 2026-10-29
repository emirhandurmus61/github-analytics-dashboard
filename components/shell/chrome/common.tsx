"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  RefreshCw,
  Moon,
  Sun,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useUIPrefs } from "@/components/ui-prefs";
import { handleSignIn } from "@/app/actions/auth";
import { cn, timeAgo, type Lang } from "@/lib/ui/format";
import { useShell } from "../shell-context";
import type { NavItem, NavKey } from "../nav";

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

export const L = (lang: Lang, tr: string, en: string) => (lang === "en" ? en : tr);

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

export function useSyncLabel() {
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

export function ModeToggle() {
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

export function LangSeg() {
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
