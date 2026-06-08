"use client";

import { useActionState, useState } from "react";
import { saveProfileSettings } from "./actions";
import { THEMES, type ThemeAccent } from "@/lib/themes";
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
            <label className="block text-xs text-zinc-500 mb-1.5" htmlFor="pinned_repo">
              Öne Çıkan Repo
            </label>
            <select
              id="pinned_repo"
              name="pinned_repo"
              defaultValue={pinnedRepo ?? ""}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 focus:border-zinc-500 focus:outline-none"
            >
              <option value="">— Seçme —</option>
              {repos.map((r) => (
                <option key={r.name} value={r.name}>{r.name}</option>
              ))}
            </select>
          </div>
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
