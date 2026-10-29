"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Pencil, Languages, Keyboard, LogOut, PanelsTopLeft, SquareTerminal, AppWindow, Moon, Sun, Monitor, Rows3 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useUIPrefs } from "@/components/ui-prefs";
import { useShell } from "./shell-context";
import type { NavItem } from "./nav";
import { SCHEMES, DARK_SCHEMES, LIGHT_SCHEMES, type SchemeId } from "@/lib/ui/schemes";
import type { UIPrefs } from "@/lib/ui/prefs";
import { ACCENT_ORDER, THEMES, ACCENT_HUE, type ThemeAccent } from "@/lib/themes";
import { saveAccent } from "@/app/actions/ui";
import { handleSignOut } from "@/app/actions/auth";
import { Kbd } from "@/components/ui/primitives";
import { type Icon, type Cmd, SchemeSwatch } from "./palette-parts";

/** Every command the palette can run, in display order. */
export function useCommands({
  nav,
  previewScheme,
  previewAccent,
}: {
  nav: NavItem[];
  previewScheme: (id: SchemeId) => void;
  previewAccent: (a: ThemeAccent) => void;
}): Cmd[] {
  const router = useRouter();
  const { lang, toggleLang } = useLanguage();
  const { prefs, setPrefs } = useUIPrefs();
  const shell = useShell();
  const L = (tr: string, en: string) => (lang === "en" ? en : tr);

  return useMemo(() => {
    const list: Cmd[] = [];
    const G = {
      go: L("Git", "Go to"),
      act: L("Eylemler", "Actions"),
      ui: L("Arayüz", "Interface"),
      scheme: L("Renk şeması", "Color scheme"),
      accent: L("Vurgu rengi", "Accent"),
      mode: L("Görünüm modu", "Appearance mode"),
      density: L("Yoğunluk", "Density"),
    };

    for (const n of nav) {
      list.push({
        id: `go:${n.key}`,
        group: G.go,
        label: n.label[lang],
        keywords: `${n.slug} ${n.label.tr} ${n.label.en}`,
        icon: n.icon,
        hint: <span className="flex gap-1"><Kbd>G</Kbd><Kbd>{n.go.toUpperCase()}</Kbd></span>,
        run: () => router.push(n.href),
      });
    }

    if (shell.loggedIn) {
      list.push({
        id: "act:sync",
        group: G.act,
        label: L("Şimdi senkronize et", "Sync now"),
        keywords: "sync refresh yenile github",
        icon: RefreshCw,
        run: () => shell.startSync(),
      });
    }
    if (shell.editable) {
      list.push({
        id: "act:edit",
        group: G.act,
        label: shell.editing ? L("Düzenlemeyi bitir", "Finish editing") : L("Kartları düzenle", "Customize cards"),
        keywords: "layout edit düzen kart widget resize boyut",
        icon: Pencil,
        hint: <Kbd>E</Kbd>,
        run: () => shell.setEditing((v) => !v),
      });
    }
    list.push({
      id: "act:lang",
      group: G.act,
      label: lang === "en" ? "Türkçe'ye geç" : "Switch to English",
      keywords: "language dil türkçe english",
      icon: Languages,
      run: () => {
        toggleLang();
        router.refresh();
      },
    });
    list.push({
      id: "act:keys",
      group: G.act,
      label: L("Klavye kısayolları", "Keyboard shortcuts"),
      keywords: "shortcuts help yardım kısayol",
      icon: Keyboard,
      hint: <Kbd>?</Kbd>,
      run: () => shell.setHelpOpen(true),
    });

    const uis: { id: UIPrefs["ui"]; label: string; icon: Icon; kw: string }[] = [
      { id: "editor", label: L("Editör", "Editor"), icon: PanelsTopLeft, kw: "editor vscode ide rail" },
      { id: "terminal", label: "Terminal", icon: SquareTerminal, kw: "terminal tui tmux vim mono" },
      { id: "studio", label: L("Stüdyo", "Studio"), icon: AppWindow, kw: "studio soft calm yumuşak" },
    ];
    for (const u of uis) {
      list.push({
        id: `ui:${u.id}`,
        group: G.ui,
        label: u.label,
        keywords: u.kw,
        icon: u.icon,
        current: prefs.ui === u.id,
        run: () => setPrefs({ ui: u.id }),
      });
    }

    const modes: { id: UIPrefs["mode"]; label: string; icon: Icon }[] = [
      { id: "dark", label: L("Koyu", "Dark"), icon: Moon },
      { id: "light", label: L("Açık", "Light"), icon: Sun },
      { id: "system", label: L("Sistemi izle", "Follow system"), icon: Monitor },
    ];
    for (const m of modes) {
      list.push({
        id: `mode:${m.id}`,
        group: G.mode,
        label: m.label,
        keywords: "theme mode dark light koyu açık",
        icon: m.icon,
        current: prefs.mode === m.id,
        run: () => setPrefs({ mode: m.id }),
      });
    }

    for (const id of [...DARK_SCHEMES, ...LIGHT_SCHEMES]) {
      const s = SCHEMES[id];
      const isCurrent = s.kind === "dark" ? prefs.dark === id : prefs.light === id;
      list.push({
        id: `scheme:${id}`,
        group: G.scheme,
        label: s.name,
        keywords: `theme tema ${s.kind} ${s.kind === "dark" ? "koyu" : "açık"}`,
        visual: <SchemeSwatch id={id} />,
        hint: <span className="font-mono text-[10.5px] text-ink-4">{s.kind === "dark" ? L("koyu", "dark") : L("açık", "light")}</span>,
        current: isCurrent && (prefs.mode === "system" || prefs.mode === s.kind),
        preview: () => previewScheme(id),
        run: () =>
          setPrefs(
            s.kind === "dark"
              ? { dark: id, mode: prefs.mode === "light" ? "dark" : prefs.mode }
              : { light: id, mode: prefs.mode === "dark" ? "light" : prefs.mode },
          ),
      });
    }

    for (const a of ACCENT_ORDER) {
      list.push({
        id: `accent:${a}`,
        group: G.accent,
        label: lang === "en" ? THEMES[a].label : THEMES[a].labelTr,
        keywords: `accent vurgu renk color ${a} ${ACCENT_HUE[a]}`,
        visual: <span className="inline-block size-3.5 rounded-full" style={{ background: `var(--hue-${ACCENT_HUE[a]})` }} />,
        current: prefs.accent === a,
        preview: () => previewAccent(a),
        run: () => {
          setPrefs({ accent: a });
          if (shell.loggedIn) void saveAccent(a);
        },
      });
    }

    const dens: { id: UIPrefs["density"]; label: string }[] = [
      { id: "compact", label: L("Sıkı", "Compact") },
      { id: "regular", label: L("Normal", "Regular") },
      { id: "roomy", label: L("Ferah", "Roomy") },
    ];
    for (const d of dens) {
      list.push({
        id: `density:${d.id}`,
        group: G.density,
        label: d.label,
        keywords: "density yoğunluk spacing boşluk",
        icon: Rows3,
        current: prefs.density === d.id,
        run: () => setPrefs({ density: d.id }),
      });
    }

    if (shell.loggedIn) {
      list.push({
        id: "act:signout",
        group: G.act,
        label: L("Çıkış yap", "Sign out"),
        keywords: "logout sign out çıkış",
        icon: LogOut,
        run: () => void handleSignOut(),
      });
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav, lang, prefs, shell.loggedIn, shell.editable, shell.editing]);
}
