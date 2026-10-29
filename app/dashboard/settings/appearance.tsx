"use client";

import { useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Check, Moon, Sun, Monitor, RotateCcw } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useUIPrefs } from "@/components/ui-prefs";
import { useShellOptional } from "@/components/shell/shell-context";
import { saveAccent } from "@/app/actions/ui";
import { SCHEMES, DARK_SCHEMES, LIGHT_SCHEMES, schemeStyle, type SchemeId } from "@/lib/ui/schemes";
import { DEFAULT_PREFS, type UIPrefs } from "@/lib/ui/prefs";
import { ACCENT_ORDER, ACCENT_HUE, THEMES, type ThemeAccent } from "@/lib/themes";
import { cn, type Lang } from "@/lib/ui/format";
import { Seg } from "@/components/ui/primitives";

/* ── Setting row: VS Code-style "Category › Name", description, control ── */
function SettingRow({
  path,
  title,
  desc,
  children,
  id,
}: {
  path: string;
  title: string;
  desc?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  return (
    <div id={id} className="scroll-mt-24 border-b border-line py-5 first:pt-0 last:border-0" data-setting={`${path} ${title}`.toLowerCase()}>
      <div className="text-[13.5px] text-ink">
        <span className="text-ink-3">{path} › </span>
        <span className="font-semibold">{title}</span>
      </div>
      {desc && <p className="mt-1 max-w-[68ch] text-[12.5px] leading-relaxed text-ink-3">{desc}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

/* ── Miniature of each interface, drawn with the live tokens ─────────── */
function InterfaceMock({ ui }: { ui: UIPrefs["ui"] }) {
  const cells = [1, 2, 0, 3, 4, 2, 1, 3, 0, 2, 4, 3];
  const heat = (
    <div className="grid grid-cols-6 gap-[2px]">
      {cells.map((v, i) => (
        <span key={i} className="aspect-square rounded-[1.5px]" style={{ background: `var(--heat-${v})` }} />
      ))}
    </div>
  );
  if (ui === "editor")
    return (
      <div className="flex h-full overflow-hidden rounded-[6px] border border-line bg-canvas">
        <div className="flex w-4 flex-col items-center gap-1 border-r border-line pt-1.5">
          <span className="h-1 w-1.5 rounded-[1px] bg-accent" />
          <span className="h-1 w-1.5 rounded-[1px] bg-ink-4" />
          <span className="h-1 w-1.5 rounded-[1px] bg-ink-4" />
        </div>
        <div className="flex flex-1 flex-col">
          <div className="h-2.5 border-b border-line" />
          <div className="grid flex-1 grid-cols-2 gap-1 p-1.5">
            {[0, 1].map((k) => (
              <div key={k} className="overflow-hidden rounded-[3px] border border-line bg-surface">
                <div className="flex h-2.5 border-b border-line bg-canvas">
                  <span className="w-6 border-r border-line bg-surface" style={{ boxShadow: k === 0 ? "inset 0 1px 0 var(--accent)" : undefined }} />
                </div>
                <div className="p-1">{heat}</div>
              </div>
            ))}
          </div>
          <div className="flex h-2 items-stretch border-t border-line">
            <span className="w-5 bg-accent" />
          </div>
        </div>
      </div>
    );
  if (ui === "terminal")
    return (
      <div className="flex h-full flex-col overflow-hidden rounded-[3px] border border-line bg-canvas font-mono">
        <div className="flex h-2.5 items-stretch gap-1 bg-raised">
          <span className="w-5 bg-accent" />
          <span className="w-3 bg-surface" />
          <span className="my-[3px] w-3 bg-ink-4/50" />
        </div>
        <div className="grid flex-1 grid-cols-2 gap-1.5 p-1.5 pt-2.5">
          {[0, 1].map((k) => (
            <div key={k} className="relative rounded-[2px] border p-1 pt-1.5" style={{ borderColor: k === 0 ? "var(--accent)" : "var(--line-2)" }}>
              <span className="absolute -top-[3px] left-1.5 h-[5px] w-5" style={{ background: "linear-gradient(var(--bg-0) 50%, var(--bg-1) 50%)" }}>
                <span className="mx-[3px] block h-[2px] mt-[1.5px]" style={{ background: k === 0 ? "var(--accent)" : "var(--ink-3)" }} />
              </span>
              {heat}
            </div>
          ))}
        </div>
        <div className="flex h-2 items-stretch">
          <span className="w-6 bg-accent" />
          <span className="w-8 bg-raised" />
        </div>
      </div>
    );
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[8px] border border-line bg-canvas">
      <div className="flex h-4 items-center justify-center">
        <span className="h-2 w-14 rounded-full border border-line bg-surface" />
      </div>
      <div className="grid flex-1 grid-cols-2 gap-1.5 p-2 pt-1">
        {[0, 1].map((k) => (
          <div key={k} className="rounded-[6px] bg-surface p-1.5 shadow-[0_6px_14px_-8px_rgba(0,0,0,var(--shadow-strength))]">
            <span className="mb-1 block h-[3px] w-6 rounded-full bg-ink-3" />
            {heat}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── A scheme rendered with its own colors ───────────────────────────── */
function SchemeCard({ id, active, onPick, accentHue }: { id: SchemeId; active: boolean; onPick: () => void; accentHue: string }) {
  const s = SCHEMES[id];
  const acc = s.hue[accentHue as keyof typeof s.hue];
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={active}
      className={cn("group relative overflow-hidden rounded-[var(--r-control)] border text-left transition-[border-color,box-shadow]", active ? "border-accent shadow-[0_0_0_1px_var(--accent)]" : "border-line hover:border-line-strong")}
      style={schemeStyle(s) as React.CSSProperties}
    >
      <div className="p-2.5" style={{ background: s.bg[0] }}>
        <div className="rounded-[4px] border p-2" style={{ background: s.bg[1], borderColor: s.line }}>
          <div className="mb-1.5 flex items-center gap-1.5">
            <span className="h-1.5 w-8 rounded-full" style={{ background: s.ink[1] }} />
            <span className="ml-auto h-1.5 w-4 rounded-full" style={{ background: s.ink[3] }} />
          </div>
          <div className="grid grid-cols-10 gap-[2px]">
            {[0, 1, 3, 2, 0, 4, 2, 1, 3, 4, 1, 0, 2, 4, 3, 0, 1, 2, 4, 2].map((v, i) => (
              <span
                key={i}
                className="aspect-square rounded-[1.5px]"
                style={{ background: v === 0 ? s.bg[3] : `color-mix(in oklab, ${acc} ${[0, 30, 52, 76, 100][v]}%, ${s.bg[3]})` }}
              />
            ))}
          </div>
          <div className="mt-1.5 flex gap-1">
            {(["red", "orange", "yellow", "green", "cyan", "blue", "purple", "pink"] as const).map((h) => (
              <span key={h} className="h-1.5 flex-1 rounded-full" style={{ background: s.hue[h] }} />
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 border-t px-2.5 py-1.5" style={{ background: s.bg[1], borderColor: s.line }}>
        <span className="truncate text-[12px] font-medium" style={{ color: s.ink[0] }}>
          {s.name}
        </span>
        {active && <Check size={13} className="ml-auto shrink-0" style={{ color: acc }} />}
      </div>
    </button>
  );
}

const UI_FONTS: { id: UIPrefs["fontUi"]; name: string; family: string }[] = [
  { id: "recursive", name: "Recursive", family: "var(--font-recursive)" },
  { id: "geist", name: "Geist", family: "var(--font-geist)" },
  { id: "plex", name: "IBM Plex Sans", family: "var(--font-plex)" },
  { id: "system", name: "System UI", family: "ui-sans-serif, system-ui, sans-serif" },
];
const MONO_FONTS: { id: UIPrefs["fontMono"]; name: string; family: string }[] = [
  { id: "recursive", name: "Recursive Mono", family: "var(--font-recursive)" },
  { id: "jetbrains", name: "JetBrains Mono", family: "var(--font-jetbrains)" },
  { id: "fira", name: "Fira Code", family: "var(--font-fira)" },
  { id: "plex", name: "IBM Plex Mono", family: "var(--font-plex-mono)" },
  { id: "geist", name: "Geist Mono", family: "var(--font-geist-mono)" },
];

export default function AppearanceSettings() {
  const { lang, setLang } = useLanguage();
  const l = lang as Lang;
  const router = useRouter();
  const { prefs, setPrefs, scheme } = useUIPrefs();
  const shell = useShellOptional();
  const accentTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const T = (tr: string, en: string) => (l === "en" ? en : tr);
  const P = T("Görünüm", "Appearance");

  const pickAccent = (a: ThemeAccent) => {
    setPrefs({ accent: a });
    if (accentTimer.current) clearTimeout(accentTimer.current);
    accentTimer.current = setTimeout(async () => {
      const r = await saveAccent(a);
      if (r && "success" in r) shell?.toast(T("Vurgu rengi profiline de uygulandı", "Accent applied to your profile too"));
    }, 500);
  };

  const pickScheme = (id: SchemeId) => {
    const kind = SCHEMES[id].kind;
    if (kind === "dark") setPrefs({ dark: id, mode: prefs.mode === "light" ? "dark" : prefs.mode });
    else setPrefs({ light: id, mode: prefs.mode === "dark" ? "light" : prefs.mode });
  };

  const uiOptions: { id: UIPrefs["ui"]; name: string; desc: string }[] = [
    { id: "editor", name: T("Editör", "Editor"), desc: T("Sol aktivite çubuğu, sekme başlıklı paneller, alt durum çubuğu.", "Activity rail, tabbed panes, status bar.") },
    { id: "terminal", name: "Terminal", desc: T("Tamamen monospace; tmux pencereleri, çerçeveye gömülü başlıklar, vim durum satırı.", "All monospace; tmux windows, titles in the border, vim status line.") },
    { id: "studio", name: T("Stüdyo", "Studio"), desc: T("Ortada hap menü, yumuşak katmanlı kartlar, daha geniş boşluklar.", "Centered pill nav, soft layered cards, more room.") },
  ];

  return (
    <div>
      <SettingRow id="interface" path={P} title={T("Arayüz", "Interface")} desc={T("Uygulamanın tamamının yerleşimi ve dili. Seçtiğin an uygulanır; panodaki kart düzenin aynı kalır.", "How the whole app is laid out and speaks. Applies instantly; your card layout stays the same.")}>
        <div className="grid gap-3 sm:grid-cols-3">
          {uiOptions.map((o) => {
            const on = prefs.ui === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => setPrefs({ ui: o.id })}
                aria-pressed={on}
                className={cn("flex flex-col gap-2.5 rounded-[var(--r-panel)] border p-2.5 text-left transition-colors", on ? "border-accent bg-[var(--accent-soft)]" : "border-line bg-surface hover:border-line-strong")}
              >
                <div className="aspect-[16/10] w-full" data-ui={o.id}>
                  <InterfaceMock ui={o.id} />
                </div>
                <div className="px-0.5">
                  <div className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
                    {o.name}
                    {on && <Check size={13} className="text-accent" />}
                  </div>
                  <p className="mt-0.5 text-[12px] leading-snug text-ink-3">{o.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </SettingRow>

      <SettingRow id="mode" path={P} title={T("Mod", "Mode")} desc={T("Sistemi izle seçiliyken koyu ve açık şemaların işletim sistemine göre değişir.", "With Follow system, your dark and light schemes switch with the OS.")}>
        <Seg
          value={prefs.mode}
          onChange={(m) => setPrefs({ mode: m })}
          options={[
            { value: "dark", label: <><Moon /> {T("Koyu", "Dark")}</> },
            { value: "light", label: <><Sun /> {T("Açık", "Light")}</> },
            { value: "system", label: <><Monitor /> {T("Sistemi izle", "Follow system")}</> },
          ]}
        />
      </SettingRow>

      <SettingRow id="scheme" path={P} title={T("Renk şeması", "Color scheme")} desc={T("Editörlerden tanıdığın şemalar. Koyu ve açık için ayrı seçim yapabilirsin; şu an kullanılan:", "Schemes you know from your editor. Pick one for dark and one for light; now showing:") + ` ${scheme.name}.`}>
        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-2 text-[12px] text-ink-3">{T("Koyu", "Dark")}</div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
              {DARK_SCHEMES.map((id) => (
                <SchemeCard key={id} id={id} active={prefs.dark === id} onPick={() => pickScheme(id)} accentHue={ACCENT_HUE[prefs.accent]} />
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 text-[12px] text-ink-3">{T("Açık", "Light")}</div>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
              {LIGHT_SCHEMES.map((id) => (
                <SchemeCard key={id} id={id} active={prefs.light === id} onPick={() => pickScheme(id)} accentHue={ACCENT_HUE[prefs.accent]} />
              ))}
            </div>
          </div>
        </div>
      </SettingRow>

      <SettingRow id="accent" path={P} title={T("Vurgu rengi", "Accent")} desc={T("Her şemanın kendi tonuna eşlenir. Herkese açık profilin de bu rengi kullanır.", "Maps to each scheme's own tone. Your public profile uses it too.")}>
        <div className="flex flex-wrap gap-2">
          {ACCENT_ORDER.map((a) => {
            const on = prefs.accent === a;
            return (
              <button
                key={a}
                type="button"
                onClick={() => pickAccent(a)}
                aria-pressed={on}
                className={cn("flex h-9 items-center gap-2 rounded-[var(--r-control)] border pl-2 pr-3 text-[12.5px] transition-colors", on ? "border-ink-3 bg-raised text-ink" : "border-line text-ink-2 hover:border-line-strong")}
              >
                <span className="grid size-5 place-items-center rounded-full" style={{ background: `var(--hue-${ACCENT_HUE[a]})` }}>
                  {on && <Check size={12} strokeWidth={3} style={{ color: "var(--on-accent)" }} />}
                </span>
                {l === "en" ? THEMES[a].label : THEMES[a].labelTr}
              </button>
            );
          })}
        </div>
      </SettingRow>

      <SettingRow id="font-ui" path={P} title={T("Arayüz yazı tipi", "Interface font")} desc={T("Terminal arayüzü her yerde kod yazı tipini kullanır.", "The Terminal interface uses the code font everywhere.")}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {UI_FONTS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={prefs.fontUi === f.id}
              onClick={() => setPrefs({ fontUi: f.id })}
              className={cn("rounded-[var(--r-control)] border p-3 text-left transition-colors", prefs.fontUi === f.id ? "border-accent bg-[var(--accent-soft)]" : "border-line hover:border-line-strong")}
            >
              <div className="text-[22px] leading-none text-ink" style={{ fontFamily: f.family, fontVariationSettings: '"MONO" 0' }}>
                Ağ 614
              </div>
              <div className="mt-2 text-[12px] text-ink-3">{f.name}</div>
            </button>
          ))}
        </div>
      </SettingRow>

      <SettingRow id="font-mono" path={P} title={T("Kod yazı tipi", "Code font")} desc={T("Sayılar, repo adları, commit mesajları ve terminal arayüzü için.", "For numbers, repo names, commit messages and the Terminal interface.")}>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {MONO_FONTS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={prefs.fontMono === f.id}
              onClick={() => setPrefs({ fontMono: f.id })}
              className={cn("rounded-[var(--r-control)] border p-3 text-left transition-colors", prefs.fontMono === f.id ? "border-accent bg-[var(--accent-soft)]" : "border-line hover:border-line-strong")}
            >
              <code className="block truncate text-[13px] text-ink" style={{ fontFamily: f.family, fontVariationSettings: '"MONO" 1' }}>
                <span style={{ color: "var(--hue-purple)" }}>const</span> streak = <span style={{ color: "var(--hue-orange)" }}>42</span>;
              </code>
              <div className="mt-2 text-[12px] text-ink-3">{f.name}</div>
            </button>
          ))}
        </div>
        <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-[12.5px] text-ink-2 select-none">
          <input type="checkbox" className="accent-[var(--accent)]" checked={prefs.casual} onChange={(e) => setPrefs({ casual: e.target.checked })} />
          {T("Recursive için gündelik (el yazısı benzeri) karakter", "Casual letterforms for Recursive")}
        </label>
      </SettingRow>

      <SettingRow id="density" path={P} title={T("Yoğunluk", "Density")} desc={T("Kart iç boşlukları ve genel bakış ızgarasındaki satır yüksekliği.", "Card padding and the row height of the overview grid.")}>
        <Seg
          value={prefs.density}
          onChange={(d) => setPrefs({ density: d })}
          options={[
            { value: "compact", label: T("Sıkı", "Compact") },
            { value: "regular", label: T("Normal", "Regular") },
            { value: "roomy", label: T("Ferah", "Roomy") },
          ]}
        />
      </SettingRow>

      <SettingRow id="motion" path={P} title={T("Hareket", "Motion")} desc={T("Sistemi izle, işletim sistemindeki \"hareketi azalt\" ayarına uyar.", "Follow system respects the OS reduce-motion setting.")}>
        <Seg
          value={prefs.motion}
          onChange={(m) => setPrefs({ motion: m })}
          options={[
            { value: "system", label: T("Sistemi izle", "Follow system") },
            { value: "full", label: T("Açık", "On") },
            { value: "reduced", label: T("Azaltılmış", "Reduced") },
          ]}
        />
      </SettingRow>

      <SettingRow id="language" path={P} title={T("Dil", "Language")}>
        <Seg
          value={lang}
          onChange={(v) => {
            setLang(v as "tr" | "en");
            router.refresh();
          }}
          options={[
            { value: "tr", label: "Türkçe" },
            { value: "en", label: "English" },
          ]}
        />
      </SettingRow>

      <div className="pt-2">
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => {
            setPrefs({ ...DEFAULT_PREFS, accent: prefs.accent });
          }}
        >
          <RotateCcw /> {T("Görünümü varsayılana döndür", "Reset appearance")}
        </button>
      </div>
    </div>
  );
}
