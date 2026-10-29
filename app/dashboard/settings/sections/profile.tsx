"use client";

import { type Dispatch, type SetStateAction } from "react";
import { User } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Section, Field, ACCENT, ACCENT_BG, ACCENT_BORDER } from "../ui";

const SUGGESTED_TAGS = [
  "TypeScript",
  "React",
  "Next.js",
  "Tailwind CSS",
  "Node.js",
  "Python",
  "Rust",
  "Go",
  "Docker",
  "PostgreSQL",
];

export function ProfileSection({ bioInput, setBioInput, workingOnInput, setWorkingOnInput, yearlyGoalInput, setYearlyGoalInput, tagInput, setTagInput, addSuggestedTag, removeTag, selectedPinned, setSelectedPinned, repos }: {
  bioInput: string;
  setBioInput: Dispatch<SetStateAction<string>>;
  workingOnInput: string;
  setWorkingOnInput: Dispatch<SetStateAction<string>>;
  yearlyGoalInput: string;
  setYearlyGoalInput: Dispatch<SetStateAction<string>>;
  tagInput: string;
  setTagInput: Dispatch<SetStateAction<string>>;
  addSuggestedTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  selectedPinned: string[];
  setSelectedPinned: Dispatch<SetStateAction<string[]>>;
  repos: { name: string }[];
}) {
  const { lang, t } = useLanguage();

  return (
    <Section
      icon={User}
      title={t.settings.navProfile}
      desc={
        lang === "en"
          ? "Personal details displayed to visitors on your developer portfolio and public profile."
          : "Geliştirici portföyünde ve herkese açık sayfanızda ziyaretçilere gösterilecek kişisel detaylar."
      }
      badge={lang === "en" ? "Public Profile" : "Public Profil"}
      accent={ACCENT}
      accentBorder={ACCENT_BORDER}
      accentBg={ACCENT_BG}
    >
      <div className="space-y-5">
        {/* Biyografi */}
        <Field
          label={lang === "en" ? "Bio" : "Biyografi"}
          hint={
            lang === "en"
              ? `max 200 chars (${bioInput.length}/200)`
              : `maks. 200 karakter (${bioInput.length}/200)`
          }
          desc={
            lang === "en"
              ? "Displayed as a summary description at the top of your profile."
              : "Profilinizin üst kısmında özet açıklama olarak görüntülenir."
          }
        >
          <textarea
            name="bio"
            value={bioInput}
            onChange={(e) => setBioInput(e.target.value)}
            maxLength={200}
            rows={3}
            placeholder={
              lang === "en"
                ? "Briefly introduce yourself, your focus areas, or your work style..."
                : "Kendinizi, odaklandığınız alanları veya çalışma tarzınızı kısaca tanıtın..."
            }
            className="w-full resize-none rounded-[var(--r-control)] border border-zinc-800 bg-zinc-900/90 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 transition-colors focus:border-zinc-500 focus:outline-none custom-scroll"
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Şu an üzerinde çalıştığım */}
          <Field
            label={lang === "en" ? "Currently working on" : "Şu an üzerinde çalışıyorum"}
            hint={
              lang === "en"
                ? `max 150 (${workingOnInput.length}/150)`
                : `maks. 150 (${workingOnInput.length}/150)`
            }
          >
            <input
              name="currently_working_on"
              type="text"
              value={workingOnInput}
              onChange={(e) => setWorkingOnInput(e.target.value)}
              maxLength={150}
              placeholder={
                lang === "en"
                  ? "e.g. Open-source CLI tools and Rust..."
                  : "Örn: Açık kaynak CLI araçları ve Rust..."
              }
              className="w-full rounded-[var(--r-control)] border border-zinc-800 bg-zinc-900/90 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 transition-colors focus:border-zinc-500 focus:outline-none"
            />
          </Field>

          {/* Bu yıl hedefim */}
          <Field
            label={lang === "en" ? "Yearly goal" : "Bu yıl hedefim"}
            hint={
              lang === "en"
                ? `max 150 (${yearlyGoalInput.length}/150)`
                : `maks. 150 (${yearlyGoalInput.length}/150)`
            }
          >
            <input
              name="yearly_goal"
              type="text"
              value={yearlyGoalInput}
              onChange={(e) => setYearlyGoalInput(e.target.value)}
              maxLength={150}
              placeholder={
                lang === "en"
                  ? "e.g. 1000 commits and 5 open-source contributions..."
                  : "Örn: 1000 commit ve 5 açık kaynak katkısı..."
              }
              className="w-full rounded-[var(--r-control)] border border-zinc-800 bg-zinc-900/90 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 transition-colors focus:border-zinc-500 focus:outline-none"
            />
          </Field>
        </div>

        {/* Favori Teknolojiler */}
        <Field
          label={lang === "en" ? "Favorite Technologies & Tools" : "Favori Teknolojiler & Araçlar"}
          hint={lang === "en" ? "comma-separated, max 12" : "virgülle ayırın, maks. 12"}
          desc={
            lang === "en"
              ? "Badges for your skills and technologies will be listed on your profile."
              : "Yeteneklerinizin ve kullandığınız dillerin rozetleri profilinizde listelenir."
          }
        >
          <input
            name="tech_tags"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="TypeScript, React, Rust, Docker, PostgreSQL..."
            className="w-full rounded-[var(--r-control)] border border-zinc-800 bg-zinc-900/90 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 transition-colors focus:border-zinc-500 focus:outline-none"
          />

          {/* Aktif Etiketler */}
          {tagInput.trim() && (
            <div className="mt-3 flex flex-wrap gap-1.5 items-center">
              <span className="text-[11px] text-zinc-500 font-medium mr-1">
                {lang === "en" ? "Selected:" : "Seçilenler:"}
              </span>
              {tagInput
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
                .slice(0, 12)
                .map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all group"
                    style={{
                      borderColor: ACCENT_BORDER,
                      color: ACCENT,
                      backgroundColor: ACCENT_BG,
                    }}
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-zinc-500 hover:text-zinc-200 transition-colors"
                      title={lang === "en" ? `Remove ${tag} tag` : `${tag} etiketini kaldır`}
                    >
                      ×
                    </button>
                  </span>
                ))}
            </div>
          )}

          {/* Öneri Etiketler */}
          <div className="mt-2.5 flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] text-zinc-600 font-medium mr-1">
              {lang === "en" ? "Quick add:" : "Hızlı ekle:"}
            </span>
            {SUGGESTED_TAGS.map((tag) => {
              const isAdded = tagInput
                .split(",")
                .map((t) => t.trim().toLowerCase())
                .includes(tag.toLowerCase());
              if (isAdded) return null;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addSuggestedTag(tag)}
                  className="rounded-md border border-zinc-800 bg-zinc-900/40 px-2 py-0.5 text-[11px] text-zinc-500 hover:border-zinc-700 hover:text-zinc-300 transition-colors"
                >
                  + {tag}
                </button>
              );
            })}
          </div>
        </Field>

        {/* Öne Çıkan Repolar */}
        <Field
          label={lang === "en" ? "Featured Repositories" : "Öne Çıkan Repolar"}
          hint={lang === "en" ? "select up to 3 repos" : "maks. 3 repo seçin"}
          desc={
            lang === "en"
              ? "Featured as showcase projects on your profile card and public page."
              : "Profil kartınızda ve sayfanızda vitrin projeler olarak öne çıkarılır."
          }
        >
          <div className="space-y-2.5 max-w-2xl">
            {[0, 1, 2].map((i) => (
              <div key={i} className="relative">
                <span
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold border"
                  style={{
                    borderColor: selectedPinned[i] ? ACCENT_BORDER : "var(--line)",
                    backgroundColor: selectedPinned[i] ? ACCENT_BG : "var(--bg-2)",
                    color: selectedPinned[i] ? ACCENT : "var(--ink-3)",
                  }}
                >
                  {i + 1}
                </span>
                <select
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
                  className="w-full appearance-none rounded-[var(--r-control)] border border-zinc-800 bg-zinc-900/90 py-2.5 pl-11 pr-4 text-xs text-zinc-100 transition-colors focus:border-zinc-500 focus:outline-none custom-scroll"
                >
                  <option value="">
                    {lang === "en"
                      ? i === 0
                        ? "— Select first repo —"
                        : i === 1
                        ? "— Select second repo (optional) —"
                        : "— Select third repo (optional) —"
                      : i === 0
                      ? "— Birinci repo seç —"
                      : i === 1
                      ? "— İkinci repo seç (opsiyonel) —"
                      : "— Üçüncü repo seç (opsiyonel) —"}
                  </option>
                  {repos
                    .filter(
                      (r) => !selectedPinned.includes(r.name) || selectedPinned[i] === r.name
                    )
                    .map((r) => (
                      <option key={r.name} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                </select>
              </div>
            ))}
          </div>
          <input type="hidden" name="pinned_repos" value={JSON.stringify(selectedPinned)} />
          <input type="hidden" name="pinned_repo" value={selectedPinned[0] ?? ""} />
        </Field>
      </div>
    </Section>
  );
}
