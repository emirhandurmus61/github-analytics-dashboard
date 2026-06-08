"use client";

import { useActionState } from "react";
import { saveProfileSettings } from "./actions";

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
};

const initialState: { error?: string; success?: boolean } = {};

export default function SettingsForm({
  bio,
  pinnedRepo,
  widgets,
  repos,
  username,
  badgeUrl,
}: Props) {
  const [state, formAction, pending] = useActionState(
    saveProfileSettings,
    initialState
  );

  return (
    <div className="space-y-8">
      <form action={formAction} className="space-y-6">
        {/* Biyografi */}
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
                  className="h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-900"
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
            className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-white disabled:opacity-50 transition-colors"
          >
            {pending ? "Kaydediliyor..." : "Kaydet"}
          </button>

          {state?.success && (
            <span className="text-sm text-emerald-400">Profil güncellendi.</span>
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
          {/* Önizleme */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={badgeUrl}
            alt="Dev Analytics Badge"
            className="block"
            style={{ imageRendering: "auto" }}
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
