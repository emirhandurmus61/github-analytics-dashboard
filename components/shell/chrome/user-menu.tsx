"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import {
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
  Palette,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useUIPrefs } from "@/components/ui-prefs";
import { handleSignOut } from "@/app/actions/auth";
import { cn, type Lang } from "@/lib/ui/format";
import { useShell } from "../shell-context";
import { L, Avatar, LangSeg, type ShellUser } from "./common";

/* ── User menu (desktop popover / mobile sheet) ───────────────────────── */

export function UserMenu({ user, year, align = "right", side = "bottom" }: { user: ShellUser; year: number; align?: "left" | "right"; side?: "bottom" | "top" }) {
  const { lang } = useLanguage();
  const { prefs, setPrefs } = useUIPrefs();
  const { openPalette } = useShell();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const l = lang as Lang;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (ref.current?.contains(t) || sheetRef.current?.contains(t)) return;
      setOpen(false);
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
          {/* phones: bottom sheet. Portaled to <body>: the top bar's backdrop-filter would otherwise
              become the containing block of this `fixed` layer and clip it to the bar's height. */}
          {createPortal(
            <div className="md:hidden fixed inset-0 z-[70]" ref={sheetRef}>
              <div className="absolute inset-0 bg-[var(--scrim)] anim-fade" onClick={() => setOpen(false)} />
              <div className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto overscroll-contain surface-pop rounded-b-none p-1.5 pb-[calc(env(safe-area-inset-bottom)+8px)] anim-sheet">
                <div className="mx-auto mb-1 mt-1 h-1 w-9 rounded-full bg-line-strong" />
                {content}
              </div>
            </div>,
            document.body,
          )}
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
