"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, RefreshCw, Pencil, Languages, Keyboard, LogOut, Check, PanelsTopLeft, SquareTerminal, AppWindow, Moon, Sun, Monitor, Rows3, CornerDownLeft, X } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useUIPrefs } from "@/components/ui-prefs";
import { useShell } from "./shell-context";
import { buildNav } from "./nav";
import { SCHEMES, DARK_SCHEMES, LIGHT_SCHEMES, schemeDeclarations, type SchemeId } from "@/lib/ui/schemes";
import { buildSchemeCss, type UIPrefs } from "@/lib/ui/prefs";
import { ACCENT_ORDER, THEMES, ACCENT_HUE, type ThemeAccent } from "@/lib/themes";
import { saveAccent } from "@/app/actions/ui";
import { handleSignOut } from "@/app/actions/auth";
import { cn } from "@/lib/ui/format";
import { Kbd } from "@/components/ui/primitives";
import { Icon, Cmd, match, Highlight, SchemeSwatch } from "./palette-parts";

export default function CommandPalette({
  username,
  year,
  variant,
}: {
  username: string | null;
  year: number;
  variant: "center" | "cmdline";
}) {
  const router = useRouter();
  const { lang, toggleLang } = useLanguage();
  const { prefs, setPrefs } = useUIPrefs();
  const shell = useShell();
  const { paletteOpen, closePalette, paletteSection } = shell;
  // Mounted fresh on every open (see ShellFrame), so initial state is the reset state.
  const [q, setQRaw] = useState("");
  const [active, setActive] = useState(0);
  const [section, setSectionRaw] = useState<string | null>(paletteSection);
  const listRef = useRef<HTMLDivElement>(null);
  const committed = useRef(false);
  const snapshot = useRef<UIPrefs | null>(prefs);
  const setQ = (v: string) => {
    setQRaw(v);
    setActive(0);
  };
  const setSection = (v: string | null) => {
    setSectionRaw(v);
    setActive(0);
  };

  const L = (tr: string, en: string) => (lang === "en" ? en : tr);


  /* Live preview of schemes/accents without persisting. */
  function previewScheme(id: SchemeId) {
    const style = document.getElementById("ui-scheme");
    if (style) style.textContent = `:root{${schemeDeclarations(SCHEMES[id])}}`;
  }
  function previewAccent(a: ThemeAccent) {
    document.documentElement.setAttribute("data-accent", a);
  }
  function restorePreview() {
    const base = snapshot.current;
    if (!base) return;
    const style = document.getElementById("ui-scheme");
    if (style) style.textContent = buildSchemeCss(base);
    document.documentElement.setAttribute("data-accent", base.accent);
  }

  function close() {
    if (!committed.current) restorePreview();
    closePalette();
  }

  const nav = useMemo(() => buildNav(username, year), [username, year]);

  const cmds: Cmd[] = useMemo(() => {
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

  const sectionGroup = useMemo(() => {
    if (!section) return null;
    const map: Record<string, string> = {
      scheme: L("Renk şeması", "Color scheme"),
      accent: L("Vurgu rengi", "Accent"),
      ui: L("Arayüz", "Interface"),
      mode: L("Görünüm modu", "Appearance mode"),
    };
    return map[section] ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, lang]);

  const results = useMemo(() => {
    const query = q.trim().replace(/^[:>]/, "");
    const pool = sectionGroup ? cmds.filter((c) => c.group === sectionGroup) : cmds;
    const scored = pool
      .map((c) => {
        const m = match(query, c.label);
        const k = !m && c.keywords ? match(query, c.keywords) : null;
        if (!m && !k) return null;
        return { c, idx: m?.idx ?? [], score: m ? m.score + 10 : (k?.score ?? 0) };
      })
      .filter(Boolean) as { c: Cmd; idx: number[]; score: number }[];
    if (query) scored.sort((a, b) => b.score - a.score);
    return scored;
  }, [q, cmds, sectionGroup]);

  // Keep the active row valid and visible; preview it if it supports that.
  useEffect(() => {
    if (!paletteOpen) return;
    const row = results[active];
    if (row?.c.preview) row.c.preview();
    else restorePreview();
    const el = listRef.current?.querySelector<HTMLElement>(`[data-row="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active, results, paletteOpen]);


  function runAt(i: number) {
    const row = results[i];
    if (!row) return;
    committed.current = true;
    closePalette();
    row.c.run();
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown" || (e.key === "n" && e.ctrlKey) || (e.key === "j" && e.ctrlKey)) {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === "ArrowUp" || (e.key === "p" && e.ctrlKey) || (e.key === "k" && e.ctrlKey)) {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      runAt(active);
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (section) setSection(null);
      else close();
    } else if (e.key === "Backspace" && !q && section) {
      setSection(null);
    }
  }

  if (!paletteOpen) return null;

  let lastGroup = "";
  const rows = results.map(({ c, idx }, i) => {
    const header = c.group !== lastGroup ? c.group : null;
    lastGroup = c.group;
    const Icon = c.icon;
    return (
      <div key={c.id}>
        {header && (
          <div className="px-3 pt-3 pb-1 text-[11px] font-medium text-ink-4 select-none">{header}</div>
        )}
        <button
          type="button"
          data-row={i}
          onMouseMove={() => active !== i && setActive(i)}
          onClick={() => runAt(i)}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 h-9 text-left text-[13px] rounded-[var(--r-control)]",
            i === active ? "bg-raised text-ink" : "text-ink-2",
          )}
          style={i === active ? { boxShadow: "inset 2px 0 0 var(--accent)" } : undefined}
        >
          <span className="w-5 flex justify-center text-ink-3 shrink-0">
            {c.visual ?? (Icon ? <Icon size={15} strokeWidth={1.8} /> : null)}
          </span>
          <span className="flex-1 truncate">
            <Highlight text={c.label} idx={idx} />
          </span>
          {c.current && <Check size={14} className="text-accent shrink-0" />}
          {c.hint && <span className="shrink-0 text-ink-4">{c.hint}</span>}
        </button>
      </div>
    );
  });

  const placeholder =
    variant === "cmdline"
      ? L("komut yaz…  (örn. tokyo, sync, timeline)", "type a command…  (e.g. tokyo, sync, timeline)")
      : L("Ara veya bir komut yaz…", "Search or type a command…");

  const input = (
    <div className="flex items-center gap-2 px-3 h-12 border-b border-line">
      {variant === "cmdline" ? (
        <span className="font-mono text-accent text-[15px] font-semibold">:</span>
      ) : (
        <Search size={16} className="text-ink-3 shrink-0" />
      )}
      {sectionGroup && (
        <button
          type="button"
          onClick={() => setSection(null)}
          className="chip shrink-0"
          data-tone="accent"
          title={L("Tüm komutlar", "All commands")}
        >
          {sectionGroup}
          <X size={11} />
        </button>
      )}
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={onKey}
        placeholder={placeholder}
        className={cn("flex-1 min-w-0 bg-transparent outline-none text-base sm:text-[14px] text-ink placeholder:text-ink-4", variant === "cmdline" && "font-mono")}
        aria-label={L("Komut ara", "Search commands")}
        role="combobox"
        aria-expanded
        aria-controls="cmdk-list"
        spellCheck={false}
        autoComplete="off"
      />
      <Kbd className="hidden sm:inline-flex">esc</Kbd>
    </div>
  );

  const list = (
    <div ref={listRef} id="cmdk-list" role="listbox" className="flex-1 min-h-0 overflow-y-auto p-1.5">
      {rows.length ? (
        rows
      ) : (
        <div className="px-3 py-8 text-center text-[13px] text-ink-3">
          {L("Eşleşen komut yok. Daha kısa bir şey dene.", "No matching command. Try something shorter.")}
        </div>
      )}
    </div>
  );

  const footer = (
    <div className="hidden sm:flex items-center gap-4 px-3 h-8 border-t border-line text-[11px] text-ink-4">
      <span className="flex items-center gap-1.5"><Kbd>↑</Kbd><Kbd>↓</Kbd>{L("gez", "move")}</span>
      <span className="flex items-center gap-1.5"><Kbd><CornerDownLeft size={10} /></Kbd>{L("çalıştır", "run")}</span>
      <span className="flex items-center gap-1.5"><Kbd>esc</Kbd>{L("kapat", "close")}</span>
      <span className="ml-auto font-mono">{results.length}</span>
    </div>
  );

  if (variant === "cmdline") {
    return (
      <div className="fixed inset-0 z-[80]" onMouseDown={(e) => e.target === e.currentTarget && close()}>
        <div className="absolute inset-0 bg-[var(--scrim)] anim-fade" onMouseDown={close} />
        <div className="absolute left-0 right-0 bottom-0 md:bottom-6 md:left-4 md:right-4 max-w-3xl mx-auto anim-sheet md:anim-pop">
          <div className="surface-pop flex flex-col max-h-[60vh] font-mono">
            {list}
            {input}
            {footer}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-hidden px-3 pt-[calc(env(safe-area-inset-top)+10px)] sm:pt-[12vh]">
      <div className="absolute inset-0 bg-[var(--scrim)] anim-fade" onMouseDown={close} />
      <div className="relative w-full min-w-0 sm:max-w-[620px] sm:mx-4 surface-pop flex flex-col max-h-[46dvh] sm:max-h-[64vh] anim-pop">
        {input}
        {list}
        {footer}
      </div>
    </div>
  );
}
