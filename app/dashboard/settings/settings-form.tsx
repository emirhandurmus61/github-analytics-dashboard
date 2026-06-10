"use client";

import { useActionState, useState, useRef } from "react";
import { saveProfileSettings } from "./actions";
import { THEMES, type ThemeAccent } from "@/lib/themes";
import { ImagePlus, Loader2 } from "lucide-react";
import {
  WIDGET_KEYS,
  WIDGET_LABELS,
  PRESETS,
  type WidgetKey,
  type WidgetPreset,
} from "@/lib/widgets";

type Widgets = {
  heatmap: boolean;
  languages: boolean;
  repos: boolean;
  streak: boolean;
};

type Props = {
  bio: string | null;
  pinnedRepo: string | null;
  pinnedRepos: string[];
  profileReadme: string | null;
  widgets: Widgets;
  widgetOrder: WidgetKey[];
  repos: { name: string }[];
  username: string;
  badgeUrl: string;
  currentTheme: ThemeAccent;
  currentlyWorkingOn: string | null;
  yearlyGoal: string | null;
  techTags: string[];
};

const initialState: { error?: string; success?: boolean } = {};

export default function SettingsForm({
  bio,
  pinnedRepo,
  pinnedRepos,
  profileReadme,
  widgets,
  widgetOrder,
  repos,
  username,
  badgeUrl,
  currentTheme,
  currentlyWorkingOn,
  yearlyGoal,
  techTags,
}: Props) {
  const [state, formAction, pending] = useActionState(saveProfileSettings, initialState);

  // Tema
  const [selectedTheme, setSelectedTheme] = useState<ThemeAccent>(currentTheme);
  const previewColors = THEMES[selectedTheme];

  // Pinned repos (max 3)
  const [selectedPinned, setSelectedPinned] = useState<string[]>(
    pinnedRepos.length > 0 ? pinnedRepos : (pinnedRepo ? [pinnedRepo] : [])
  );

  // Profile README
  const [readme, setReadme] = useState(profileReadme ?? "");

  // Widget görünürlük
  const [visibleWidgets, setVisibleWidgets] = useState<Set<WidgetKey>>(
    new Set(
      WIDGET_KEYS.filter((k) => widgets[k])
    )
  );

  // Widget sırası
  const [order, setOrder] = useState<WidgetKey[]>(() => {
    // widgetOrder içinde olmayan key'leri sona ekle
    const existing = widgetOrder.filter((k) => WIDGET_KEYS.includes(k));
    const missing = WIDGET_KEYS.filter((k) => !existing.includes(k));
    return [...existing, ...missing];
  });

  // Tech tags
  const [tagInput, setTagInput] = useState(techTags.join(", "));

  function moveUp(index: number) {
    if (index === 0) return;
    const next = [...order];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    setOrder(next);
  }

  function moveDown(index: number) {
    if (index === order.length - 1) return;
    const next = [...order];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    setOrder(next);
  }

  function applyPreset(preset: WidgetPreset) {
    const p = PRESETS[preset];
    setOrder(p.order);
    setVisibleWidgets(new Set(p.visible));
  }

  function toggleWidget(key: WidgetKey) {
    setVisibleWidgets((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-6">

        {/* ── Tema Rengi ── */}
        <Section title="Tema Rengi" desc="Tüm vurgu noktaları bu renkle boyalanır — dashboard ve public profilinde.">
          <div className="flex flex-wrap gap-4">
            {(Object.entries(THEMES) as [ThemeAccent, typeof THEMES[ThemeAccent]][]).map(([key, theme]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedTheme(key)}
                className="flex flex-col items-center gap-2 group"
              >
                <div
                  className="h-9 w-9 rounded-full transition-all duration-200"
                  style={{
                    backgroundColor: theme.accent,
                    boxShadow: selectedTheme === key
                      ? `0 0 0 3px #09090b, 0 0 0 5px ${theme.accent}`
                      : "none",
                    transform: selectedTheme === key ? "scale(1.15)" : "scale(1)",
                  }}
                />
                <span className="text-xs transition-colors" style={{ color: selectedTheme === key ? theme.accent : "#71717a" }}>
                  {theme.label}
                </span>
              </button>
            ))}
          </div>

          {/* Canlı önizleme */}
          <div
            className="rounded-xl border p-4 space-y-3 transition-all duration-300 mt-2"
            style={{ backgroundColor: previewColors.accentBg, borderColor: previewColors.accentBorder }}
          >
            <p className="text-xs text-zinc-500">Önizleme</p>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold" style={{ color: previewColors.accent }}>7</span>
                <span className="text-xs text-zinc-600">Streak 🔥</span>
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-600">Haftalık Hedef</span>
                  <span style={{ color: previewColors.accent }}>14 / 20</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: "70%", backgroundColor: previewColors.accentMid }} />
                </div>
              </div>
              <div className="flex gap-0.5">
                {previewColors.shades.map((shade, i) => (
                  <div key={i} className="h-4 w-4 rounded-sm" style={{ backgroundColor: shade }} />
                ))}
              </div>
            </div>
          </div>

          <input type="hidden" name="theme_accent" value={selectedTheme} />
        </Section>

        {/* ── Profil Bilgileri ── */}
        <Section title="Profil Bilgileri" desc="Public profilinde adının altında görünür.">
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5" htmlFor="bio">
              Biyografi <span className="text-zinc-700">(maks. 200 karakter)</span>
            </label>
            <textarea
              id="bio"
              name="bio"
              defaultValue={bio ?? ""}
              maxLength={200}
              rows={3}
              placeholder="Kendini kısaca tanıt..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1.5">
              One Cikan Repolar <span className="text-zinc-700">(maks. 3)</span>
            </label>
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <select
                  key={i}
                  value={selectedPinned[i] ?? ""}
                  onChange={(e) => {
                    setSelectedPinned((prev) => {
                      const next = [...prev];
                      if (e.target.value) {
                        next[i] = e.target.value;
                      } else {
                        next.splice(i, 1);
                      }
                      return next.filter(Boolean);
                    });
                  }}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
                >
                  <option value="">{i === 0 ? "— Repo sec —" : "— Opsiyonel —"}</option>
                  {repos
                    .filter((r) => !selectedPinned.includes(r.name) || selectedPinned[i] === r.name)
                    .map((r) => (
                      <option key={r.name} value={r.name}>{r.name}</option>
                    ))}
                </select>
              ))}
            </div>
            <input type="hidden" name="pinned_repos" value={JSON.stringify(selectedPinned)} />
            {/* Backward compat */}
            <input type="hidden" name="pinned_repo" value={selectedPinned[0] ?? ""} />
          </div>
        </Section>

        {/* ── Profil README ── */}
        <Section title="Profil README" desc="Markdown destekli vitrin alani. GitHub profil README'si gibi profilinde gorunsun.">
          <ReadmeEditor
            value={readme}
            onChange={setReadme}
            accentColor={previewColors.accent}
            accentBorder={previewColors.accentBorder}
            accentBg={previewColors.accentBg}
          />
        </Section>

        {/* ── F.3 Özel Bölümler ── */}
        <Section title="Özel Bölümler" desc="Profil sayfanda standart istatistiklerin yanında kişisel bilgiler göster.">
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5" htmlFor="currently_working_on">
              Şu an üzerinde çalıştığım <span className="text-zinc-700">(maks. 150 karakter)</span>
            </label>
            <input
              id="currently_working_on"
              name="currently_working_on"
              type="text"
              defaultValue={currentlyWorkingOn ?? ""}
              maxLength={150}
              placeholder="Örn: Bir CLI aracı geliştiriyorum — Rust ile..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1.5" htmlFor="yearly_goal">
              Bu yıl hedefim <span className="text-zinc-700">(maks. 150 karakter)</span>
            </label>
            <input
              id="yearly_goal"
              name="yearly_goal"
              type="text"
              defaultValue={yearlyGoal ?? ""}
              maxLength={150}
              placeholder="Örn: Açık kaynak projeye katkı sağlamak..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1.5" htmlFor="tech_tags">
              Favori araçlar / teknolojiler{" "}
              <span className="text-zinc-700">(virgülle ayır, maks. 12)</span>
            </label>
            <input
              id="tech_tags"
              name="tech_tags"
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="TypeScript, Neovim, Docker, Postgres..."
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
            />
            {/* Tag önizleme */}
            {tagInput.trim() && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {tagInput.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 12).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border px-2.5 py-0.5 text-xs"
                    style={{ borderColor: previewColors.accentBorder, color: previewColors.accent, backgroundColor: previewColors.accentBg }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* ── F.2 Widget Düzeni ── */}
        <Section title="Profil Widget Düzeni" desc="Public profilinde hangi bölümler görünsün ve hangi sırada?">

          {/* Preset butonları */}
          <div>
            <p className="text-xs text-zinc-500 mb-2">Hazır düzen</p>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(PRESETS) as [WidgetPreset, typeof PRESETS[WidgetPreset]][]).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => applyPreset(key)}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-left hover:border-zinc-600 transition-colors"
                >
                  <p className="text-xs font-medium text-zinc-300">{preset.label}</p>
                  <p className="text-xs text-zinc-600 mt-0.5">{preset.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Sıralama listesi */}
          <div className="space-y-2">
            <p className="text-xs text-zinc-500">Sıra & Görünürlük</p>
            {order.map((key, i) => {
              const visible = visibleWidgets.has(key);
              return (
                <div
                  key={key}
                  className="flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors"
                  style={{
                    borderColor: visible ? previewColors.accentBorder : "#3f3f46",
                    backgroundColor: visible ? previewColors.accentBg : "transparent",
                  }}
                >
                  {/* Sıra numarası */}
                  <span className="w-5 shrink-0 text-center text-xs text-zinc-600">{i + 1}</span>

                  {/* Label */}
                  <span
                    className="flex-1 text-sm"
                    style={{ color: visible ? previewColors.accent : "#71717a" }}
                  >
                    {WIDGET_LABELS[key]}
                  </span>

                  {/* Görünürlük toggle */}
                  <button
                    type="button"
                    onClick={() => toggleWidget(key)}
                    className="rounded-lg px-2.5 py-1 text-xs transition-colors border"
                    style={
                      visible
                        ? { borderColor: previewColors.accentBorder, color: previewColors.accent, backgroundColor: previewColors.accentBg }
                        : { borderColor: "#3f3f46", color: "#71717a" }
                    }
                  >
                    {visible ? "Görünür" : "Gizli"}
                  </button>

                  {/* Ok butonları */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveUp(i)}
                      disabled={i === 0}
                      className="rounded px-1.5 py-0.5 text-xs text-zinc-600 hover:text-zinc-300 disabled:opacity-20 transition-colors"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moveDown(i)}
                      disabled={i === order.length - 1}
                      className="rounded px-1.5 py-0.5 text-xs text-zinc-600 hover:text-zinc-300 disabled:opacity-20 transition-colors"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Gizli input'lar */}
          <input type="hidden" name="widget_order" value={JSON.stringify(order)} />
          {WIDGET_KEYS.map((key) => (
            visibleWidgets.has(key)
              ? <input key={key} type="hidden" name={`widget_${key}`} value="on" />
              : null
          ))}
        </Section>

        {/* ── Kaydet ── */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg px-5 py-2.5 text-sm font-medium disabled:opacity-50 transition-colors"
            style={{ backgroundColor: previewColors.accent, color: "#09090b" }}
          >
            {pending ? "Kaydediliyor..." : "Kaydet"}
          </button>
          {state?.success && (
            <span className="text-sm" style={{ color: previewColors.accent }}>Profil güncellendi.</span>
          )}
          {state?.error && (
            <span className="text-sm text-red-400">{state.error}</span>
          )}
        </div>
      </form>

      {/* ── Badge ── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
        <h2 className="text-sm font-medium text-zinc-300">README Badge</h2>
        <p className="text-xs text-zinc-500">
          GitHub README'ne ekle — streak, haftalık commit ve en aktif dil otomatik güncellenir.
        </p>
        <div className="rounded-lg overflow-hidden border border-zinc-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={badgeUrl} alt="Dev Analytics Badge" className="block" />
        </div>
        <div className="space-y-2">
          <p className="text-xs text-zinc-500">Markdown:</p>
          <CopyBox value={`[![Dev Analytics](${badgeUrl})](https://devanalytics.app/u/${username})`} />
        </div>
        <div className="space-y-2">
          <p className="text-xs text-zinc-500">HTML:</p>
          <CopyBox value={`<a href="https://devanalytics.app/u/${username}"><img src="${badgeUrl}" alt="Dev Analytics"></a>`} />
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
      <div>
        <h2 className="text-sm font-medium text-zinc-300">{title}</h2>
        <p className="mt-0.5 text-xs text-zinc-500">{desc}</p>
      </div>
      {children}
    </div>
  );
}

function CopyBox({ value }: { value: string }) {
  return (
    <div className="flex gap-2">
      <code className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-400 overflow-x-auto whitespace-nowrap">
        {value}
      </code>
      <button
        type="button"
        onClick={() => navigator.clipboard.writeText(value)}
        className="shrink-0 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition-colors"
      >
        Kopyala
      </button>
    </div>
  );
}

function ReadmeEditor({
  value,
  onChange,
  accentColor,
  accentBorder,
  accentBg,
}: {
  value: string;
  onChange: (v: string) => void;
  accentColor: string;
  accentBorder: string;
  accentBg: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Yukleme basarisiz");
        return;
      }
      // Insert markdown image at cursor position
      const textarea = textareaRef.current;
      const imageMarkdown = `\n![${file.name}](${data.url})\n`;
      if (textarea) {
        const start = textarea.selectionStart;
        const before = value.slice(0, start);
        const after = value.slice(start);
        onChange(before + imageMarkdown + after);
        // Set cursor after inserted text
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = start + imageMarkdown.length;
          textarea.focus();
        });
      } else {
        onChange(value + imageMarkdown);
      }
    } catch {
      alert("Yukleme sirasinda hata olustu");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleUpload(file);
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) handleUpload(file);
        return;
      }
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-1 mb-2 p-1 rounded-lg border border-zinc-800 bg-zinc-800/50 w-fit">
        <button
          type="button"
          onClick={() => {
            const textarea = textareaRef.current;
            if (!textarea) return;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const selected = value.slice(start, end);
            const wrapped = selected ? `**${selected}**` : "**kalin metin**";
            onChange(value.slice(0, start) + wrapped + value.slice(end));
          }}
          className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-200 rounded transition-colors font-bold"
          title="Kalin"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => {
            const textarea = textareaRef.current;
            if (!textarea) return;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const selected = value.slice(start, end);
            const wrapped = selected ? `*${selected}*` : "*italik metin*";
            onChange(value.slice(0, start) + wrapped + value.slice(end));
          }}
          className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-200 rounded transition-colors italic"
          title="Italik"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => {
            const textarea = textareaRef.current;
            if (!textarea) return;
            const start = textarea.selectionStart;
            onChange(value.slice(0, start) + "\n### " + value.slice(start));
          }}
          className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-200 rounded transition-colors"
          title="Baslik"
        >
          H
        </button>
        <button
          type="button"
          onClick={() => {
            const textarea = textareaRef.current;
            if (!textarea) return;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const selected = value.slice(start, end);
            const wrapped = selected ? `\`${selected}\`` : "`kod`";
            onChange(value.slice(0, start) + wrapped + value.slice(end));
          }}
          className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-200 rounded transition-colors font-mono"
          title="Kod"
        >
          {"<>"}
        </button>
        <button
          type="button"
          onClick={() => {
            const textarea = textareaRef.current;
            if (!textarea) return;
            const start = textarea.selectionStart;
            onChange(value.slice(0, start) + "\n- " + value.slice(start));
          }}
          className="px-2 py-1 text-xs text-zinc-500 hover:text-zinc-200 rounded transition-colors"
          title="Liste"
        >
          •
        </button>
        <div className="w-px h-4 bg-zinc-700 mx-0.5" />
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors disabled:opacity-50"
          style={{ color: accentColor }}
          title="Gorsel yukle"
        >
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">Gorsel</span>
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = "";
        }}
      />

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        name="profile_readme"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onPaste={handlePaste}
        rows={10}
        maxLength={2000}
        placeholder={"### Merhaba!\n\nBen bir yazilim gelistiriciyim.\n\n- Su an **proje adi** uzerinde calisiyorum\n- **Rust** ogreniyorum\n\n![banner](https://example.com/banner.png)"}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none resize-y font-mono leading-relaxed"
      />
      <div className="flex items-center justify-between mt-1">
        <p className="text-[10px] text-zinc-600">
          Gorsel: surukle-birak, yapistir veya Gorsel butonunu kullan
        </p>
        <p className="text-[10px] text-zinc-600 tabular-nums">{value.length}/2000</p>
      </div>
    </div>
  );
}
