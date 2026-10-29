"use client";

import { type Dispatch, type SetStateAction } from "react";
import { LayoutTemplate, ChevronUp, ChevronDown, Check } from "lucide-react";
import { WIDGET_KEYS, PRESETS, PRESETS_LOCALIZED, getWidgetLabelByKey, type WidgetKey, type WidgetPreset } from "@/lib/widgets";
import { useLanguage } from "@/lib/i18n";
import { Section, ACCENT, ACCENT_BG, ACCENT_BORDER } from "../ui";
import { ReadmeEditor } from "../readme-editor";

export function ProfilePageSection({ selectedReadmeSource, setSelectedReadmeSource, readme, setReadme, githubReadme, order, visibleWidgets, moveUp, moveDown, applyPreset, toggleWidget, username }: {
  selectedReadmeSource: "github" | "custom";
  setSelectedReadmeSource: Dispatch<SetStateAction<"github" | "custom">>;
  readme: string;
  setReadme: Dispatch<SetStateAction<string>>;
  githubReadme: string | null;
  order: WidgetKey[];
  visibleWidgets: Set<WidgetKey>;
  moveUp: (index: number) => void;
  moveDown: (index: number) => void;
  applyPreset: (preset: WidgetPreset) => void;
  toggleWidget: (key: WidgetKey) => void;
  username: string;
}) {
  const { lang } = useLanguage();

  return (
    <Section
      icon={LayoutTemplate}
      title={lang === "en" ? "Profile Page & README Layout" : "Profil Sayfası & README Düzeni"}
      desc={
        lang === "en"
          ? "README content, widget order, and visibility preferences on your public profile page."
          : "Public profil sayfanızdaki README metni, widget'ların sırası ve görünürlük tercihleri."
      }
      badge={lang === "en" ? "Page Structure" : "Sayfa Yapısı"}
      accent={ACCENT}
      accentBorder={ACCENT_BORDER}
      accentBg={ACCENT_BG}
    >
      <div className="space-y-6">
        {/* README Kaynağı Seçimi */}
        <div>
          <p className="mb-2 text-xs font-semibold text-zinc-300">
            {lang === "en" ? "README Source Preference" : "README Kaynak Tercihi"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(["github", "custom"] as const).map((src) => {
              const isSelected = selectedReadmeSource === src;
              return (
                <button
                  key={src}
                  type="button"
                  onClick={() => setSelectedReadmeSource(src)}
                  className="rounded-panel border p-4 text-left transition-all duration-200"
                  style={
                    isSelected
                      ? {
                          borderColor: ACCENT_BORDER,
                          backgroundColor: ACCENT_BG,
                          boxShadow: `0 0 16px color-mix(in oklab, var(--accent) 8%, transparent)`,
                        }
                      : {
                          borderColor: "var(--line)",
                          backgroundColor: "var(--bg-2)",
                        }
                  }
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-bold"
                      style={{ color: isSelected ? ACCENT : "var(--ink-1)" }}
                    >
                      {src === "github"
                        ? lang === "en"
                          ? "GitHub Auto README"
                          : "GitHub Otomatik README"
                        : lang === "en"
                        ? "Custom Markdown Editor"
                        : "Özel Markdown Editörü"}
                    </span>
                    {isSelected && <Check className="h-4 w-4" style={{ color: ACCENT }} />}
                  </div>
                  <span className="mt-1 block text-xs text-zinc-500 leading-relaxed">
                    {src === "github"
                      ? lang === "en"
                        ? "Automatically fetched from your GitHub special repository (username/username)."
                        : "GitHub kullanıcı repoundan (username/username) otomatik olarak çekilir."
                      : lang === "en"
                      ? "Create and customize your own rich Markdown content."
                      : "Kendinize özel zengin Markdown içeriği oluşturun ve düzenleyin."}
                  </span>
                </button>
              );
            })}
          </div>
          <input type="hidden" name="readme_source" value={selectedReadmeSource} />
        </div>

        {/* README İçerik Alanı */}
        {selectedReadmeSource === "github" ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-400">
              {lang === "en" ? "Fetched GitHub README Preview" : "Çekilen GitHub README Önizlemesi"}
            </p>
            {githubReadme ? (
              <div className="rounded-panel border border-zinc-800 bg-zinc-900/90 px-4 py-3.5 text-xs text-zinc-400 font-mono leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap custom-scroll">
                {githubReadme.slice(0, 1000)}
                {githubReadme.length > 1000
                  ? lang === "en"
                    ? "\n\n... (remaining content shown on profile)"
                    : "\n\n... (kalan içerik profilde gösterilir)"
                  : ""}
              </div>
            ) : (
              <div className="rounded-panel border border-zinc-800/80 bg-zinc-900/40 p-4">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {lang === "en" ? (
                    <>
                      No README found on your GitHub profile yet or not yet synchronized. Once the{" "}
                      <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300">
                        {username}/{username}
                      </code>{" "}
                      repository is created, it will automatically appear here on sync.
                    </>
                  ) : (
                    <>
                      GitHub profilinizde henüz README bulunamadı veya senkronize edilmedi.{" "}
                      <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-300">
                        {username}/{username}
                      </code>{" "}
                      reposu oluşturulduğunda sync ile otomatik buraya aktarılır.
                    </>
                  )}
                </p>
              </div>
            )}
            <input type="hidden" name="profile_readme" value={readme} />
          </div>
        ) : (
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-400">
              {lang === "en" ? "Custom Markdown Editor" : "Özel Markdown Editörü"}
            </p>
            <ReadmeEditor
              value={readme}
              onChange={setReadme}
              accentColor={ACCENT}
              accentBorder={ACCENT_BORDER}
              accentBg={ACCENT_BG}
            />
          </div>
        )}

        <div className="border-t border-zinc-800/80 my-4" />

        {/* Hazır Düzen Seçenekleri */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-zinc-300">
              {lang === "en" ? "Preset Widget Layouts" : "Hazır Widget Düzenleri"}
            </p>
            <span className="text-[11px] text-zinc-500">
              {lang === "en" ? "Apply quick template" : "Hızlı şablon uygula"}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(Object.entries(PRESETS) as [WidgetPreset, (typeof PRESETS)[WidgetPreset]][]).map(
              ([key, preset]) => {
                const loc = PRESETS_LOCALIZED[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyPreset(key)}
                    className="rounded-[var(--r-control)] border border-zinc-800 bg-zinc-900/60 p-3.5 text-left transition-all duration-150 hover:border-zinc-700 hover:bg-zinc-900"
                  >
                    <p className="text-xs font-semibold text-zinc-200">
                      {loc ? (lang === "en" ? loc.labelEn : loc.labelTr) : preset.label}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-500 leading-snug">
                      {loc ? (lang === "en" ? loc.descEn : loc.descTr) : preset.desc}
                    </p>
                  </button>
                );
              }
            )}
          </div>
        </div>

        {/* Widget Sıralama ve Görünürlük */}
        <div>
          <p className="mb-3 text-xs font-semibold text-zinc-300">
            {lang === "en" ? "Widget Order & Visibility" : "Widget Sırası & Görünürlük"}
          </p>
          <div className="space-y-2">
            {order.map((key, i) => {
              const visible = visibleWidgets.has(key);
              return (
                <div
                  key={key}
                  className="flex items-center gap-3 rounded-panel border px-4 py-3 transition-all duration-150"
                  style={{
                    borderColor: visible ? ACCENT_BORDER : "var(--line)",
                    backgroundColor: visible ? ACCENT_BG : "var(--bg-2)",
                  }}
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                    style={
                      visible
                        ? { color: ACCENT, backgroundColor: "var(--accent-soft)" }
                        : { color: "var(--ink-3)", backgroundColor: "var(--bg-2)" }
                    }
                  >
                    {i + 1}
                  </span>

                  <span
                    className="flex-1 text-sm font-medium"
                    style={{ color: visible ? "var(--ink-1)" : "var(--ink-3)" }}
                  >
                    {getWidgetLabelByKey(key, lang)}
                  </span>

                  <button
                    type="button"
                    onClick={() => toggleWidget(key)}
                    className="rounded-[var(--r-control)] border px-3 py-1.5 text-xs font-medium transition-all"
                    style={
                      visible
                        ? {
                            borderColor: ACCENT_BORDER,
                            color: ACCENT,
                            backgroundColor: "var(--accent-soft)",
                          }
                        : {
                            borderColor: "var(--line-2)",
                            color: "var(--ink-3)",
                            backgroundColor: "transparent",
                          }
                    }
                  >
                    {visible
                      ? lang === "en"
                        ? "Visible"
                        : "Görünür"
                      : lang === "en"
                      ? "Hidden"
                      : "Gizli"}
                  </button>

                  {/* Yeniden Sıralama Butonları */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveUp(i)}
                      disabled={i === 0}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 disabled:opacity-20 transition-colors"
                      title={lang === "en" ? "Move up" : "Yukarı taşı"}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveDown(i)}
                      disabled={i === order.length - 1}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 disabled:opacity-20 transition-colors"
                      title={lang === "en" ? "Move down" : "Aşağı taşı"}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <input type="hidden" name="widget_order" value={JSON.stringify(order)} />
        {WIDGET_KEYS.map((key) =>
          visibleWidgets.has(key) ? (
            <input key={key} type="hidden" name={`widget_${key}`} value="on" />
          ) : null
        )}
      </div>
    </Section>
  );
}
