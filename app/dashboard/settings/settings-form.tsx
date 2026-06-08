"use client";

import { useActionState, useState } from "react";
import { saveProfileSettings } from "./actions";
import { THEMES, type ThemeAccent } from "@/lib/themes";

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
  repos: { name: string }[];
  username: string;
  badgeUrl: string;
  currentTheme: ThemeAccent;
};

const initialState: { error?: string; success?: boolean } = {};

export default function SettingsForm({
  bio,
  pinnedRepo,
  widgets,
  repos,
  username,
  badgeUrl,
  currentTheme,
}: Props) {
  const [state, formAction, pending] = useActionState(
    saveProfileSettings,
    initialState
  );
  const [selectedTheme, setSelectedTheme] = useState<ThemeAccent>(currentTheme);

  // Canlı önizleme için seçili temanın renklerini al
  const previewColors = THEMES[selectedTheme];

  return (
    <div className="space-y-8">
      <form action={formAction} className="space-y-6">

        {/* Tema Seçimi */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-5">
          <div>
            <h2 className="text-sm font-medium text-zinc-300">Tema Rengi</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Seçtiğin renk dashboard ve public profilinde tüm vurgu noktalarına yansır.
            </p>
          </div>

          {/* Renk seçenekleri */}
          <div className="flex flex-wrap gap-3">
            {(Object.entries(THEMES) as [ThemeAccent, typeof THEMES[ThemeAccent]][]).map(
              ([key, theme]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedTheme(key)}
                  className="group flex flex-col items-center gap-2"
                  title={theme.label}
                >
                  <div
                    className="h-8 w-8 rounded-full transition-all duration-200"
                    style={{
                      backgroundColor: theme.accent,
                      boxShadow:
                        selectedTheme === key
                          ? `0 0 0 3px #09090b, 0 0 0 5px ${theme.accent}`
                          : "none",
                      transform: selectedTheme === key ? "scale(1.15)" : "scale(1)",
                    }}
                  />
                  <span
                    className="text-xs transition-colors"
                    style={{
                      color: selectedTheme === key ? theme.accent : "#71717a",
                    }}
                  >
                    {theme.label}
                  </span>
                </button>
              )
            )}
          </div>

          {/* Canlı önizleme */}
          <div
            className="rounded-xl border p-4 space-y-3 transition-all duration-300"
            style={{
              backgroundColor: previewColors.accentBg,
              borderColor: previewColors.accentBorder,
            }}
          >
            <p className="text-xs text-zinc-500">Önizleme</p>
            <div className="flex items-center gap-4">
              {/* Mini streak kartı */}
              <div className="flex flex-col items-center">
                <span className="text-2xl font-bold" style={{ color: previewColors.accent }}>7</span>
                <span className="text-xs text-zinc-600">Streak 🔥</span>
              </div>
              {/* Mini progress bar */}
              <div className="flex-1 space-y-1">
                <div className="flex justify-between text-xs text-zinc-600">
                  <span>Haftalık Hedef</span>
                  <span style={{ color: previewColors.accent }}>14 / 20</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: "70%", backgroundColor: previewColors.accentMid }}
                  />
                </div>
              </div>
              {/* Mini heatmap örneği */}
              <div className="flex gap-0.5">
                {previewColors.shades.map((shade, i) => (
                  <div
                    key={i}
                    className="h-4 w-4 rounded-sm"
                    style={{ backgroundColor: shade }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Gizli input */}
          <input type="hidden" name="theme_accent" value={selectedTheme} />
        </div>

        {/* Profil Bilgileri */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
          <h2 className="text-sm font-medium text-zinc-300">Profil Bilgileri</h2>

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
                <option key={r.name} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Widget görünürlüğü */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
          <h2 className="text-sm font-medium text-zinc-300">Genel Profilde Gösterilecek Bölümler</h2>
          <p className="text-xs text-zinc-500">
            Seçtiğin bölümler{" "}
            <a href={`/u/${username}`} className="text-zinc-400 hover:text-zinc-300 underline underline-offset-2">
              /u/{username}
            </a>{" "}
            sayfasında görünür.
          </p>

          <div className="space-y-3">
            {[
              { key: "widget_heatmap", label: "Katkı Heatmap", checked: widgets.heatmap },
              { key: "widget_languages", label: "Dil Dağılımı", checked: widgets.languages },
              { key: "widget_repos", label: "En Yıldızlı Repolar", checked: widgets.repos },
              { key: "widget_streak", label: "Streak Kartı", checked: widgets.streak },
            ].map(({ key, label, checked }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  name={key}
                  defaultChecked={checked}
                  className="h-4 w-4 rounded border-zinc-600 bg-zinc-800"
                />
                <span className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Kaydet */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 transition-colors"
            style={{
              backgroundColor: previewColors.accent,
              color: "#09090b",
            }}
          >
            {pending ? "Kaydediliyor..." : "Kaydet"}
          </button>

          {state?.success && (
            <span className="text-sm" style={{ color: previewColors.accent }}>
              Profil güncellendi.
            </span>
          )}
          {state?.error && (
            <span className="text-sm text-red-400">{state.error}</span>
          )}
        </div>
      </form>

      {/* Badge bölümü */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-4">
        <h2 className="text-sm font-medium text-zinc-300">README Badge</h2>
        <p className="text-xs text-zinc-500">
          Bu badge'i GitHub README dosyana ekle — streak, haftalık commit sayısı ve en aktif dili otomatik gösterir.
        </p>

        <div className="rounded-lg overflow-hidden border border-zinc-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={badgeUrl}
            alt="Dev Analytics Badge"
            className="block"
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs text-zinc-500">Markdown:</p>
          <CopyBox
            value={`[![Dev Analytics](${badgeUrl})](https://devanalytics.app/u/${username})`}
          />
        </div>

        <div className="space-y-2">
          <p className="text-xs text-zinc-500">HTML:</p>
          <CopyBox
            value={`<a href="https://devanalytics.app/u/${username}"><img src="${badgeUrl}" alt="Dev Analytics"></a>`}
          />
        </div>
      </div>
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
