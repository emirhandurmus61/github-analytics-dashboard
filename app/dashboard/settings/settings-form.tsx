"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import { saveProfileSettings } from "./actions";
import { THEMES, type ThemeAccent } from "@/lib/themes";
import {
  Palette,
  User,
  Share2,
  LayoutTemplate,
  Award,
  Sparkles,
  Bell,
  Shield,
  ChevronUp,
  ChevronDown,
  Check,
  Copy,
  ImagePlus,
  Loader2,
  Bold,
  Italic,
  Heading,
  Code,
  List,
  Globe,
  ExternalLink,
  Search,
} from "lucide-react";
import PushNotificationToggle from "@/components/push-notification-toggle";
import { PageHeader } from "@/components/ui/page-header";
import { useUIPrefs } from "@/components/ui-prefs";
import { cn } from "@/lib/ui/format";
import AppearanceSettings from "./appearance";
import { DARK_SCHEMES, LIGHT_SCHEMES } from "@/lib/ui/schemes";
import { useOrigin } from "@/lib/ui/hooks";
import { useLanguage } from "@/lib/i18n";
import {
  WIDGET_KEYS,
  PRESETS,
  PRESETS_LOCALIZED,
  getWidgetLabelByKey,
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
  githubReadme: string | null;
  readmeSource: "github" | "custom";
  widgets: Widgets;
  widgetOrder: WidgetKey[];
  repos: { name: string }[];
  username: string;
  badgeUrl: string;
  currentTheme: ThemeAccent;
  currentlyWorkingOn: string | null;
  yearlyGoal: string | null;
  techTags: string[];
  socialTwitter: string | null;
  socialLinkedin: string | null;
  socialWebsite: string | null;
  socialDiscord: string | null;
  leaderboardOptIn: boolean;
};

export type SettingsSectionId =
  | "gorunum"
  | "profil"
  | "sosyal"
  | "profil-sayfasi"
  | "badge"
  | "readme-widgets"
  | "bildirimler"
  | "gizlilik";

export const VALID_SECTION_IDS: SettingsSectionId[] = [
  "gorunum",
  "profil",
  "sosyal",
  "profil-sayfasi",
  "badge",
  "readme-widgets",
  "bildirimler",
  "gizlilik",
];

interface NavItem {
  id: SettingsSectionId;
  label: string;
  shortDesc: string;
  badgeText?: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  group: "ozellestirme" | "entegrasyon" | "tercihler";
}

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

const initialState: { error?: string; success?: boolean } = {};

export default function SettingsForm({
  bio,
  pinnedRepo,
  pinnedRepos,
  profileReadme,
  githubReadme,
  readmeSource,
  widgets,
  widgetOrder,
  repos,
  username,
  badgeUrl,
  currentTheme,
  currentlyWorkingOn,
  yearlyGoal,
  techTags,
  socialTwitter,
  socialLinkedin,
  socialWebsite,
  socialDiscord,
  leaderboardOptIn,
}: Props) {
  const [state, formAction, pending] = useActionState(saveProfileSettings, initialState);

  const [selectedTheme] = useState<ThemeAccent>(currentTheme);
  const [query, setQuery] = useState("");
  const { prefs } = useUIPrefs();
  const previewColors = THEMES[selectedTheme];

  const [selectedPinned, setSelectedPinned] = useState<string[]>(
    pinnedRepos.length > 0 ? pinnedRepos : pinnedRepo ? [pinnedRepo] : []
  );

  const [selectedReadmeSource, setSelectedReadmeSource] = useState<"github" | "custom">(readmeSource);
  const [readme, setReadme] = useState(profileReadme ?? "");

  const [visibleWidgets, setVisibleWidgets] = useState<Set<WidgetKey>>(
    new Set(WIDGET_KEYS.filter((k) => widgets[k]))
  );

  const [order, setOrder] = useState<WidgetKey[]>(() => {
    const existing = widgetOrder.filter((k) => WIDGET_KEYS.includes(k));
    const missing = WIDGET_KEYS.filter((k) => !existing.includes(k));
    return [...existing, ...missing];
  });

  const [tagInput, setTagInput] = useState(techTags.join(", "));
  const [bioInput, setBioInput] = useState(bio ?? "");
  const [workingOnInput, setWorkingOnInput] = useState(currentlyWorkingOn ?? "");
  const [yearlyGoalInput, setYearlyGoalInput] = useState(yearlyGoal ?? "");

  // URL hash sync ve aktif sekme
  const [activeSection, setActiveSection] = useState<SettingsSectionId>("gorunum");
  const [showSuccess, setShowSuccess] = useState(false);
  const [optIn, setOptIn] = useState(leaderboardOptIn);
  const [pushPrefs, setPushPrefs] = useState({
    streak: true,
    goal: true,
    badge: true,
    summary: true,
    hour: 20,
  });

  const { lang, t } = useLanguage();

  const navGroups = [
    { id: "ozellestirme", label: t.settings.groupCustomization },
    { id: "entegrasyon", label: t.settings.groupIntegration },
    { id: "tercihler", label: t.settings.groupPreferences },
  ] as const;

  const navItems: NavItem[] = [
    {
      id: "gorunum",
      label: t.settings.navAppearance,
      shortDesc: t.settings.navAppearanceDesc,
      badgeText: lang === "tr" ? "Tema" : "Theme",
      icon: Palette,
      group: "ozellestirme",
    },
    {
      id: "profil",
      label: t.settings.navProfile,
      shortDesc: t.settings.navProfileDesc,
      badgeText: lang === "tr" ? "Profil" : "Profile",
      icon: User,
      group: "ozellestirme",
    },
    {
      id: "sosyal",
      label: t.settings.navSocial,
      shortDesc: t.settings.navSocialDesc,
      badgeText: lang === "tr" ? "Sosyal" : "Social",
      icon: Share2,
      group: "ozellestirme",
    },
    {
      id: "profil-sayfasi",
      label: t.settings.navProfilePage,
      shortDesc: t.settings.navProfilePageDesc,
      badgeText: "README",
      icon: LayoutTemplate,
      group: "entegrasyon",
    },
    {
      id: "badge",
      label: t.settings.navBadge,
      shortDesc: t.settings.navBadgeDesc,
      badgeText: lang === "tr" ? "Rozet" : "Badge",
      icon: Award,
      group: "entegrasyon",
    },
    {
      id: "readme-widgets",
      label: t.settings.navReadmeWidgets,
      shortDesc: t.settings.navReadmeWidgetsDesc,
      badgeText: "Widget",
      icon: Sparkles,
      group: "entegrasyon",
    },
    {
      id: "bildirimler",
      label: t.settings.navNotifications,
      shortDesc: t.settings.navNotificationsDesc,
      badgeText: "Push",
      icon: Bell,
      group: "tercihler",
    },
    {
      id: "gizlilik",
      label: t.settings.navPrivacy,
      shortDesc: t.settings.navPrivacyDesc,
      badgeText: lang === "tr" ? "Gizlilik" : "Privacy",
      icon: Shield,
      group: "tercihler",
    },
  ];

  // URL hash kontrolü ve dinleyici
  useEffect(() => {
    function handleHashChange() {
      const hash = window.location.hash.replace("#", "") as SettingsSectionId;
      if (VALID_SECTION_IDS.includes(hash)) {
        setActiveSection(hash);
      }
    }
    const timer = setTimeout(handleHashChange, 0);
    window.addEventListener("hashchange", handleHashChange);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  function switchSection(id: SettingsSectionId) {
    setActiveSection(id);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${id}`);
    }
  }

  const [prevSuccess, setPrevSuccess] = useState(state?.success);
  if (state?.success !== prevSuccess) {
    setPrevSuccess(state?.success);
    if (state?.success) {
      setShowSuccess(true);
    }
  }

  // Başarı toast otomatik gizleme
  useEffect(() => {
    if (showSuccess) {
      const t = setTimeout(() => setShowSuccess(false), 3500);
      return () => clearTimeout(t);
    }
  }, [showSuccess]);

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

  function addSuggestedTag(tag: string) {
    const current = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (!current.includes(tag) && current.length < 12) {
      const next = [...current, tag].join(", ");
      setTagInput(next);
    }
  }

  function removeTag(tagToRemove: string) {
    const next = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && t !== tagToRemove)
      .join(", ");
    setTagInput(next);
  }

  const accent = "var(--accent)";
  const accentBg = "var(--accent-soft)";
  const accentBorder = "var(--accent-line)";
  void previewColors;

  const ql = query.trim().toLocaleLowerCase(lang);
  const matches = (item: NavItem) =>
    !ql || `${item.label} ${item.shortDesc} ${item.badgeText ?? ""} ${SEARCH_HINTS[item.id]}`.toLocaleLowerCase(lang).includes(ql);
  const firstMatch = navItems.find(matches);
  const currentNav = navItems.find((n) => n.id === activeSection) || navItems[0];
  const CurrentIcon = currentNav.icon;

  return (
    <div className="relative">
      <PageHeader
        title={t.settings.title}
        command={`settings${activeSection !== "gorunum" ? ` --section=${activeSection}` : ""}`}
        subtitle={lang === "en" ? "Appearance applies instantly. Profile changes publish when you save." : "Görünüm anında uygulanır. Profil değişiklikleri kaydettiğinde yayınlanır."}
        actions={
          <label className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-4" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && firstMatch) switchSection(firstMatch.id);
              }}
              placeholder={lang === "en" ? "Search settings" : "Ayarlarda ara"}
              className="input !h-8 !pl-8"
              aria-label={lang === "en" ? "Search settings" : "Ayarlarda ara"}
            />
          </label>
        }
      />

      {state?.error && (
        <div className="mb-5 flex items-center gap-2.5 rounded-[var(--r-control)] border border-[color-mix(in_oklab,var(--hue-red)_35%,transparent)] bg-[color-mix(in_oklab,var(--hue-red)_10%,transparent)] px-3.5 py-2.5 text-[13px] text-bad">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-bad" />
          {state.error}
        </div>
      )}

      {/* Phones and tablets: section switcher */}
      <div className="lg:hidden -mx-4 mb-5 overflow-x-auto px-4 [scrollbar-width:none]">
        <div className="seg">
          {navItems.filter(matches).map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} type="button" aria-pressed={activeSection === item.id} onClick={() => switchSection(item.id)}>
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <aside className="sticky top-16 hidden w-56 shrink-0 lg:block">
          <nav className="flex flex-col gap-5" aria-label={t.settings.title}>
            {navGroups.map((group) => {
              const items = navItems.filter((item) => item.group === group.id);
              return (
                <div key={group.id}>
                  <p className="mb-1.5 px-2.5 text-[11.5px] text-ink-4">{group.label}</p>
                  <div className="flex flex-col gap-0.5">
                    {items.map((item) => {
                      const on = activeSection === item.id;
                      const Icon = item.icon;
                      const hit = matches(item);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => switchSection(item.id)}
                          aria-current={on ? "page" : undefined}
                          className={cn(
                            "relative flex h-8 items-center gap-2.5 rounded-[var(--r-control)] px-2.5 text-left text-[13px] transition-colors",
                            on ? "bg-raised text-ink font-medium" : "text-ink-3 hover:bg-raised hover:text-ink",
                            !hit && "opacity-35",
                          )}
                        >
                          {on && <span className="absolute -left-2 top-1.5 bottom-1.5 w-[2px] rounded-full bg-accent" />}
                          <Icon className={cn("h-3.5 w-3.5 shrink-0", on && "text-accent")} />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
          <p className="mt-6 px-2.5 text-[11.5px] leading-relaxed text-ink-4">
            {lang === "en" ? "Profile sections share one save button; switching sections keeps your edits." : "Profil bölümleri tek bir kaydet düğmesini paylaşır; bölüm değiştirmek düzenlemelerini silmez."}
          </p>
        </aside>

        <form action={formAction} className="min-w-0 flex-1 w-full max-w-[920px] pb-28">
          <div className={activeSection === "gorunum" ? "block" : "hidden"}>
            <Section
              icon={Palette}
              title={t.settings.tabAppearance}
              desc={lang === "en" ? "Interface, colors, type and motion for this browser." : "Bu tarayıcı için arayüz, renkler, yazı ve hareket."}
              accent={accent}
              accentBorder={accentBorder}
              accentBg={accentBg}
            >
              <AppearanceSettings />
            </Section>
          </div>

          {/* 2. PROFİL SEKME İÇERİĞİ */}
          <div className={activeSection === "profil" ? "block" : "hidden"}>
            <Section
              icon={User}
              title={t.settings.navProfile}
              desc={
                lang === "en"
                  ? "Personal details displayed to visitors on your developer portfolio and public profile."
                  : "Geliştirici portföyünde ve herkese açık sayfanızda ziyaretçilere gösterilecek kişisel detaylar."
              }
              badge={lang === "en" ? "Public Profile" : "Public Profil"}
              accent={accent}
              accentBorder={accentBorder}
              accentBg={accentBg}
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
                              borderColor: accentBorder,
                              color: accent,
                              backgroundColor: accentBg,
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
                            borderColor: selectedPinned[i] ? accentBorder : "var(--line)",
                            backgroundColor: selectedPinned[i] ? accentBg : "var(--bg-2)",
                            color: selectedPinned[i] ? accent : "var(--ink-3)",
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
          </div>

          {/* 3. SOSYAL LİNKLER SEKME İÇERİĞİ */}
          <div className={activeSection === "sosyal" ? "block" : "hidden"}>
            <Section
              icon={Share2}
              title={t.settings.navSocial}
              desc={
                lang === "en"
                  ? "Displayed as clickable icons on your public profile and developer card."
                  : "Public profilinizde ve geliştirici kartınızda tıklanabilir ikonlar olarak görüntülenir."
              }
              badge={lang === "en" ? "Social Networks" : "Sosyal Ağlar"}
              accent={accent}
              accentBorder={accentBorder}
              accentBg={accentBg}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Twitter / X">
                  <PrefixInput
                    icon={
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    }
                    prefix="x.com/"
                    name="social_twitter"
                    defaultValue={socialTwitter ?? ""}
                    placeholder={lang === "en" ? "username" : "kullanici_adi"}
                    maxLength={50}
                  />
                </Field>

                <Field label="LinkedIn">
                  <PrefixInput
                    icon={
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    }
                    prefix="linkedin.com/in/"
                    name="social_linkedin"
                    defaultValue={socialLinkedin ?? ""}
                    placeholder={lang === "en" ? "username" : "kullanici-adi"}
                    maxLength={80}
                  />
                </Field>

                <Field label={lang === "en" ? "Personal Website" : "Kişisel Web Sitesi"}>
                  <PrefixInput
                    icon={<Globe className="w-3.5 h-3.5 text-zinc-400" />}
                    prefix="https://"
                    name="social_website"
                    defaultValue={socialWebsite ? socialWebsite.replace(/^https?:\/\//, "") : ""}
                    placeholder="example.com"
                    maxLength={200}
                  />
                </Field>

                <Field label="Discord">
                  <PrefixInput
                    icon={
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                      </svg>
                    }
                    prefix="@"
                    name="social_discord"
                    defaultValue={socialDiscord ?? ""}
                    placeholder={lang === "en" ? "username" : "kullanici_adi"}
                    maxLength={50}
                  />
                </Field>
              </div>
            </Section>
          </div>

          {/* 4. PROFİL SAYFASI & README SEKME İÇERİĞİ */}
          <div className={activeSection === "profil-sayfasi" ? "block" : "hidden"}>
            <Section
              icon={LayoutTemplate}
              title={lang === "en" ? "Profile Page & README Layout" : "Profil Sayfası & README Düzeni"}
              desc={
                lang === "en"
                  ? "README content, widget order, and visibility preferences on your public profile page."
                  : "Public profil sayfanızdaki README metni, widget'ların sırası ve görünürlük tercihleri."
              }
              badge={lang === "en" ? "Page Structure" : "Sayfa Yapısı"}
              accent={accent}
              accentBorder={accentBorder}
              accentBg={accentBg}
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
                                  borderColor: accentBorder,
                                  backgroundColor: accentBg,
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
                              style={{ color: isSelected ? accent : "var(--ink-1)" }}
                            >
                              {src === "github"
                                ? lang === "en"
                                  ? "GitHub Auto README"
                                  : "GitHub Otomatik README"
                                : lang === "en"
                                ? "Custom Markdown Editor"
                                : "Özel Markdown Editörü"}
                            </span>
                            {isSelected && <Check className="h-4 w-4" style={{ color: accent }} />}
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
                      accentColor={accent}
                      accentBorder={accentBorder}
                      accentBg={accentBg}
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
                            borderColor: visible ? accentBorder : "var(--line)",
                            backgroundColor: visible ? accentBg : "var(--bg-2)",
                          }}
                        >
                          <span
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                            style={
                              visible
                                ? { color: accent, backgroundColor: "var(--accent-soft)" }
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
                                    borderColor: accentBorder,
                                    color: accent,
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
          </div>

          {/* 5. README ROZETİ SEKME İÇERİĞİ */}
          <div className={activeSection === "badge" ? "block" : "hidden"}>
            <Section
              icon={Award}
              title={t.settings.navBadge}
              desc={
                lang === "en"
                  ? "Dynamic SVG badge that you can embed in your GitHub profile README or docs."
                  : "GitHub profil README dosyanıza veya dokümanlarınıza gömebileceğiniz dinamik SVG rozeti."
              }
              badge={lang === "en" ? "SVG Badge" : "SVG Rozet"}
              accent={accent}
              accentBorder={accentBorder}
              accentBg={accentBg}
            >
              <div className="space-y-6">
                {/* Rozet Önizleme Kartı */}
                <div>
                  <p className="mb-2 text-xs font-semibold text-zinc-400">
                    {t.settings.badgeLiveView}
                  </p>
                  <div className="flex items-center justify-center rounded-panel border border-zinc-800/80 bg-zinc-950 p-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={badgeUrl} alt={lang === "en" ? "Devboard Badge" : "Devboard Rozet"} className="block max-w-full drop-shadow-md" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs font-medium text-zinc-400">
                      {t.settings.badgeMarkdown}
                    </p>
                    <CopyBox
                      value={`[![Devboard](${badgeUrl})](https://devboard.app/u/${username})`}
                      accentColor={accent}
                      accentBg={accentBg}
                      accentBorder={accentBorder}
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-medium text-zinc-400">
                      {t.settings.badgeHtml}
                    </p>
                    <CopyBox
                      value={`<a href="https://devboard.app/u/${username}"><img src="${badgeUrl}" alt="Devboard"></a>`}
                      accentColor={accent}
                      accentBg={accentBg}
                      accentBorder={accentBorder}
                    />
                  </div>
                </div>
              </div>
            </Section>
          </div>

          {/* 6. README WIDGET'LARI SEKME İÇERİĞİ */}
          <div className={activeSection === "readme-widgets" ? "block" : "hidden"}>
            <Section
              icon={Sparkles}
              title={t.settings.navReadmeWidgets}
              desc={
                lang === "en"
                  ? "Add streak, overall stats, language breakdown, and 52-week heatmap SVG cards to your GitHub profile."
                  : "Streak, genel istatistik, dil dağılımı ve 52 haftalık ısı haritası SVG kartlarını GitHub profilinize ekleyin."
              }
              badge={lang === "en" ? "Live SVG" : "Canlı SVG"}
              accent={accent}
              accentBorder={accentBorder}
              accentBg={accentBg}
            >
              <ReadmeWidgets
                username={username}
                accentColor={accent}
                accentBg={accentBg}
                accentBorder={accentBorder}
              />
            </Section>
          </div>

          {/* 7. BİLDİRİMLER SEKME İÇERİĞİ */}
          <div className={activeSection === "bildirimler" ? "block" : "hidden"}>
            <Section
              icon={Bell}
              title={lang === "en" ? "Notification Preferences" : "Bildirim Tercihleri"}
              desc={
                lang === "en"
                  ? "Protect your streak serially with web push notifications and get instant alerts when you reach your weekly goals."
                  : "Web push bildirimleriyle streak serinizi koruyun ve haftalık hedeflerinize ulaştığınızda anlık uyarı alın."
              }
              badge={lang === "en" ? "Push Alerts" : "Push Uyarıları"}
              accent={accent}
              accentBorder={accentBorder}
              accentBg={accentBg}
            >
              <PushNotificationToggle
                accent={accent}
                prefs={pushPrefs}
                onPrefsChange={setPushPrefs}
              />
            </Section>
          </div>

          {/* 8. GİZLİLİK & SIRALAMA SEKME İÇERİĞİ */}
          <div className={activeSection === "gizlilik" ? "block" : "hidden"}>
            <Section
              icon={Shield}
              title={lang === "en" ? "Privacy & Leaderboard" : "Gizlilik & Liderlik Tablosu"}
              desc={
                lang === "en"
                  ? "Configure your visibility and ranking participation in the developer community."
                  : "Geliştirici topluluğunda görünürlüğünüzü ve sıralama katılımınızı buradan yapılandırın."
              }
              badge={lang === "en" ? "Privacy" : "Gizlilik"}
              accent={accent}
              accentBorder={accentBorder}
              accentBg={accentBg}
            >
              <div className="space-y-4">
                <div
                  className="flex items-start justify-between gap-4 rounded-panel border p-5 transition-all"
                  style={{
                    borderColor: optIn ? "var(--accent-line)" : "var(--line)",
                    backgroundColor: optIn ? accentBg : "var(--bg-2)",
                  }}
                >
                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold text-zinc-100">
                      {lang === "en" ? "Participate in Leaderboard" : "Liderlik Tablosuna Katıl"}
                    </p>
                    <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                      {lang === "en" ? (
                        <>
                          Your weekly commit count, active streak days, and earned badges are publicly listed on the{" "}
                          <a
                            href="/leaderboard"
                            target="_blank"
                            className="underline inline-flex items-center gap-1 font-medium"
                            style={{ color: accent }}
                          >
                            leaderboard
                            <ExternalLink className="h-3 w-3" />
                          </a>
                          . You can turn this off to completely hide yourself from the ranking.
                        </>
                      ) : (
                        <>
                          Haftalık commit sayınız, aktif streak gününüz ve kazandığınız rozetler{" "}
                          <a
                            href="/leaderboard"
                            target="_blank"
                            className="underline inline-flex items-center gap-1 font-medium"
                            style={{ color: accent }}
                          >
                            liderlik tablosunda
                            <ExternalLink className="h-3 w-3" />
                          </a>{" "}
                          herkese açık olarak listelenir. Bu ayarı kapatarak kendinizi sıralamadan tamamen gizleyebilirsiniz.
                        </>
                      )}
                    </p>
                  </div>

                  {/* Switch Butonu */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={optIn}
                    aria-label={lang === "en" ? "Leaderboard opt-in toggle" : "Liderlik tablosu katılım anahtarı"}
                    onClick={() => setOptIn((v) => !v)}
                    className="relative shrink-0 h-7 w-12 rounded-full transition-colors duration-200 mt-1"
                    style={{ backgroundColor: optIn ? accent : "var(--line-2)" }}
                  >
                    <span
                      className="absolute top-1 left-1 h-5 w-5 rounded-full bg-ink shadow-md transition-transform duration-200"
                      style={{ transform: optIn ? "translateX(20px)" : "translateX(0)" }}
                    />
                  </button>
                  <input type="hidden" name="leaderboard_opt_in" value={optIn ? "on" : "off"} />
                </div>
              </div>
            </Section>
          </div>

          {activeSection !== "gorunum" && (
            <div
              className={cn(
                "fixed inset-x-0 z-40 flex justify-center px-3 pointer-events-none",
                prefs.ui === "studio"
                  ? "bottom-[calc(env(safe-area-inset-bottom)+82px)] md:bottom-4"
                  : "bottom-[calc(env(safe-area-inset-bottom)+66px)] md:bottom-9",
              )}
            >
              <div className="pointer-events-auto surface-pop flex w-full max-w-2xl items-center gap-3 p-2 pl-3.5">
                <CurrentIcon className="h-4 w-4 shrink-0 text-accent" />
                <p className="min-w-0 flex-1 truncate text-[12.5px] text-ink-3">
                  <span className="text-ink">{currentNav.label}</span>
                  <span className="hidden sm:inline">
                    {" · "}
                    {lang === "tr" ? "değişiklikler herkese açık profiline yayınlanır" : "changes publish to your public profile"}
                  </span>
                </p>
                <button type="submit" disabled={pending} className="btn btn-primary">
                  {pending ? <Loader2 className="animate-spin" /> : <Check />}
                  {pending ? t.settings.saving : t.settings.saveChanges}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// ── Alt Bileşenler ─────────────────────────────────────────────────────────────

const SEARCH_HINTS: Record<SettingsSectionId, string> = {
  gorunum: "tema theme renk color şema scheme arayüz interface terminal editör editor stüdyo studio yazı font dil language yoğunluk density koyu açık dark light",
  profil: "bio biyografi tag etiket pinned sabit repo hedef goal",
  sosyal: "twitter x linkedin website discord sosyal social link",
  "profil-sayfasi": "readme markdown widget profil sayfası page",
  badge: "badge rozet shield markdown html embed",
  "readme-widgets": "readme widget svg embed github stats",
  bildirimler: "push bildirim notification",
  gizlilik: "privacy gizlilik leaderboard sıralama opt-in",
};

function Section({
  icon: Icon,
  title,
  desc,
  badge,
  children,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  desc: string;
  badge?: string;
  children: React.ReactNode;
  accent?: string;
  accentBorder?: string;
  accentBg?: string;
}) {
  return (
    <section className="min-w-0">
      <header className="mb-6 flex items-start gap-3 border-b border-line pb-4">
        <Icon className="mt-1 h-4 w-4 shrink-0 text-accent" />
        <div className="min-w-0 flex-1">
          <h2 className="text-[18px] font-[650] tracking-[-0.01em] text-ink">{title}</h2>
          <p className="mt-0.5 max-w-[70ch] text-[13px] leading-relaxed text-ink-3">{desc}</p>
        </div>
        {badge && <span className="chip shrink-0">{badge}</span>}
      </header>
      <div>{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  desc,
  children,
}: {
  label: string;
  hint?: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-[13px] font-medium text-ink">{label}</label>
        {hint && <span className="font-mono text-[11px] text-ink-4">{hint}</span>}
      </div>
      {desc && <p className="text-[12px] leading-normal text-ink-3">{desc}</p>}
      {children}
    </div>
  );
}

function PrefixInput({
  icon,
  prefix,
  name,
  defaultValue,
  placeholder,
  maxLength,
}: {
  icon?: React.ReactNode;
  prefix: string;
  name: string;
  defaultValue: string;
  placeholder: string;
  maxLength: number;
}) {
  return (
    <div className="flex h-8 items-stretch overflow-hidden rounded-[var(--r-control)] border border-line-strong bg-canvas transition-[border-color,box-shadow] focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-soft)]">
      <div className="flex shrink-0 items-center gap-2 border-r border-line bg-raised px-2.5 text-ink-3">
        {icon}
        <span className="font-mono text-[11.5px]">{prefix}</span>
      </div>
      <input
        name={name}
        type="text"
        defaultValue={defaultValue}
        maxLength={maxLength}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent px-2.5 text-[13px] text-ink placeholder:text-ink-4 focus:outline-none"
      />
    </div>
  );
}

function CopyBox({ value }: { value: string; accentColor?: string; accentBg?: string; accentBorder?: string }) {
  const { lang } = useLanguage();
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex items-stretch gap-2">
      <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-[var(--r-control)] border border-line bg-canvas px-3 py-2 font-mono text-[12px] text-ink-2">
        {value}
      </code>
      <button type="button" onClick={handleCopy} className="btn shrink-0">
        {copied ? <Check className="text-good" /> : <Copy />}
        {copied ? (lang === "en" ? "Copied" : "Kopyalandı") : lang === "en" ? "Copy" : "Kopyala"}
      </button>
    </div>
  );
}

function ReadmeEditor({
  value,
  onChange,
  accentColor,
}: {
  value: string;
  onChange: (v: string) => void;
  accentColor: string;
  accentBorder?: string;
  accentBg?: string;
}) {
  const { lang } = useLanguage();
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
        alert(data.error ?? (lang === "en" ? "Upload failed" : "Yükleme başarısız"));
        return;
      }
      const textarea = textareaRef.current;
      const imageMarkdown = `\n![${file.name}](${data.url})\n`;
      if (textarea) {
        const start = textarea.selectionStart;
        const before = value.slice(0, start);
        const after = value.slice(start);
        onChange(before + imageMarkdown + after);
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = start + imageMarkdown.length;
          textarea.focus();
        });
      } else {
        onChange(value + imageMarkdown);
      }
    } catch {
      alert(lang === "en" ? "An error occurred during upload" : "Yükleme sırasında hata oluştu");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleUpload(file);
  }

  function handlePaste(e: React.ClipboardEvent) {
    for (const item of e.clipboardData.items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) handleUpload(file);
        return;
      }
    }
  }

  function insertAround(before: string, after: string, fallback: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);
    const inserted = selected ? `${before}${selected}${after}` : `${before}${fallback}${after}`;
    onChange(value.slice(0, start) + inserted + value.slice(end));
  }

  function insertAt(text: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    onChange(value.slice(0, start) + text + value.slice(start));
  }

  function applyFormat(type: "bold" | "italic" | "heading" | "code" | "list") {
    if (type === "bold") insertAround("**", "**", lang === "en" ? "bold text" : "kalın metin");
    else if (type === "italic") insertAround("*", "*", lang === "en" ? "italic text" : "italik metin");
    else if (type === "heading") insertAt("\n### ");
    else if (type === "code") insertAround("`", "`", lang === "en" ? "code" : "kod");
    else if (type === "list") insertAt("\n- ");
  }

  const charPct = Math.min(100, (value.length / 10000) * 100);

  return (
    <div className="space-y-2">
      {/* Editör Araç Çubuğu */}
      <div className="flex items-center gap-1 rounded-[var(--r-control)] border border-zinc-800 bg-zinc-900/90 p-1.5">
        <button
          type="button"
          onClick={() => applyFormat("bold")}
          title={lang === "en" ? "Bold" : "Kalın"}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 cursor-pointer"
        >
          <Bold className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-[11px]">{lang === "en" ? "Bold" : "Kalın"}</span>
        </button>
        <button
          type="button"
          onClick={() => applyFormat("italic")}
          title={lang === "en" ? "Italic" : "İtalik"}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 cursor-pointer"
        >
          <Italic className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-[11px]">{lang === "en" ? "Italic" : "İtalik"}</span>
        </button>
        <button
          type="button"
          onClick={() => applyFormat("heading")}
          title={lang === "en" ? "Heading" : "Başlık"}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 cursor-pointer"
        >
          <Heading className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-[11px]">{lang === "en" ? "Heading" : "Başlık"}</span>
        </button>
        <button
          type="button"
          onClick={() => applyFormat("code")}
          title={lang === "en" ? "Code Block" : "Kod Bloğu"}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 cursor-pointer"
        >
          <Code className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-[11px]">{lang === "en" ? "Code" : "Kod"}</span>
        </button>
        <button
          type="button"
          onClick={() => applyFormat("list")}
          title={lang === "en" ? "Bullet List" : "Madde Listesi"}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 cursor-pointer"
        >
          <List className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-[11px]">{lang === "en" ? "List" : "Liste"}</span>
        </button>
        <div className="mx-1 h-4 w-px bg-zinc-800" />
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors disabled:opacity-50 hover:bg-zinc-800 cursor-pointer"
          style={{ color: accentColor }}
          title={lang === "en" ? "Upload image" : "Görsel yükle"}
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline font-medium text-[11px]">
            {lang === "en" ? "Upload Image" : "Görsel Yükle"}
          </span>
        </button>
      </div>

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

      <textarea
        ref={textareaRef}
        name="profile_readme"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onPaste={handlePaste}
        rows={10}
        maxLength={10000}
        placeholder={
          lang === "en"
            ? "### Hello!\n\nI am a software developer.\n\n- Currently working on **project**\n- Developing with **Rust & TypeScript**"
            : "### Merhaba!\n\nBen bir yazılım geliştiriciyim.\n\n- Şu an **proje** üzerinde çalışıyorum\n- **Rust & TypeScript** ile geliştirme yapıyorum"
        }
        className="w-full resize-y rounded-[var(--r-control)] border border-zinc-800 bg-zinc-900/90 px-4 py-3 font-mono text-xs leading-relaxed text-zinc-100 placeholder-zinc-600 transition-colors focus:border-zinc-500 focus:outline-none custom-scroll"
      />

      <div className="flex items-center justify-between text-[11px] text-zinc-500">
        <span>
          {lang === "en"
            ? "Image: drag and drop, paste from clipboard, or use the button"
            : "Görsel: sürükle-bırak, panodan yapıştır veya butonu kullan"}
        </span>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${charPct}%`,
                backgroundColor: charPct > 90 ? "var(--hue-red)" : accentColor,
              }}
            />
          </div>
          <span className="font-mono text-zinc-400">{value.length} / 10000</span>
        </div>
      </div>
    </div>
  );
}

/* ── README Widgets ─────────────────────────────────────────────────────────── */

function ReadmeWidgets({
  username,
  accentColor,
  accentBg,
  accentBorder,
}: {
  username: string;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
}) {
  const { lang } = useLanguage();
  const [active, setActive] = useState<string>("streak");
  const [wScheme, setWScheme] = useState<string>("");
  const [wLang, setWLang] = useState<"tr" | "en">(lang === "en" ? "en" : "tr");

  const widgetItems = [
    {
      id: "streak",
      label: "Streak Widget",
      desc:
        lang === "en"
          ? "Current and longest streak, plus the last 21 days with the running streak highlighted."
          : "Güncel ve en uzun seri, aktif serinin vurgulandığı son 21 gün.",
      path: (u: string) => `/api/widget/streak/${u}`,
    },
    {
      id: "stats",
      label: "Stats Widget",
      desc:
        lang === "en"
          ? "Yearly commits, streak, active days, repos and stars in one compact row."
          : "Yıllık commit, seri, aktif gün, repo ve yıldız tek satırda.",
      path: (u: string) => `/api/widget/stats/${u}`,
    },
    {
      id: "langs",
      label: "Top Languages",
      desc:
        lang === "en"
          ? "Your 6 most used languages with a stacked share bar."
          : "En çok kullandığın 6 dil ve yüzdelik dağılım çubuğu.",
      path: (u: string) => `/api/widget/langs/${u}`,
    },
    {
      id: "heatmap",
      label: "Contribution Heatmap",
      desc:
        lang === "en"
          ? "The last 53 weeks of commits, colored with your scheme and accent."
          : "Son 53 haftanın commit ısı haritası; şema ve vurgu rengine uyar.",
      path: (u: string) => `/api/widget/heatmap/${u}`,
    },
  ] as const;

  const current = widgetItems.find((w) => w.id === active)!;
  // Resolve the origin after mount so server and client render the same markup.
  const origin = useOrigin();
  const base = origin || (process.env.NEXT_PUBLIC_BASE_URL ?? "");
  const query = new URLSearchParams({ ...(wScheme ? { scheme: wScheme } : {}), ...(wLang !== "tr" ? { lang: wLang } : {}) }).toString();
  const imgUrl = `${base}${current.path(username)}${query ? `?${query}` : ""}`;
  const profileUrl = `${base}/u/${username}`;

  const mdSnippet = `[![${current.label}](${imgUrl})](${profileUrl})`;
  const htmlSnippet = `<a href="${profileUrl}"><img src="${imgUrl}" alt="${current.label}"></a>`;

  return (
    <div className="space-y-5">
      {/* Widget Seçici Sekmeler */}
      <div className="flex flex-wrap gap-2">
        {widgetItems.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => setActive(w.id)}
            className="rounded-[var(--r-control)] border px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer"
            style={
              active === w.id
                ? { borderColor: accentBorder, color: accentColor, backgroundColor: accentBg }
                : { borderColor: "var(--line)", color: "var(--ink-2)", backgroundColor: "var(--bg-2)" }
            }
          >
            {w.label}
          </button>
        ))}
      </div>

      {/* Açıklama */}
      <p className="text-xs text-zinc-400">{current.desc}</p>

      {/* Görünüm: şema ve dil, URL parametresi olarak eklenir */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-[12.5px] text-ink-3">
          {lang === "en" ? "Scheme" : "Şema"}
          <select value={wScheme} onChange={(e) => setWScheme(e.target.value)} className="input !h-8 !w-auto !py-0 font-mono !text-[12px]">
            <option value="">devboard-night</option>
            {[...DARK_SCHEMES, ...LIGHT_SCHEMES].filter((id) => id !== "devboard-night").map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        </label>
        <div className="seg" role="group" aria-label={lang === "en" ? "Widget language" : "Widget dili"}>
          {(["tr", "en"] as const).map((x) => (
            <button key={x} type="button" aria-pressed={wLang === x} onClick={() => setWLang(x)} className="font-mono">
              {x}
            </button>
          ))}
        </div>
        <span className="text-[11.5px] text-ink-4">{lang === "en" ? "Added to the URL as ?scheme= and ?lang=" : "URL'ye ?scheme= ve ?lang= olarak eklenir"}</span>
      </div>

      {/* Canlı Önizleme */}
      <div className="overflow-hidden rounded-panel border border-zinc-800/80 bg-zinc-950 p-6 flex items-center justify-center min-h-[100px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={imgUrl} src={imgUrl} alt={current.label} className="max-w-full block drop-shadow-md" />
      </div>

      {/* Kod Kutuları */}
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-400">
            {lang === "en" ? "Markdown Code (For Your GitHub Profile)" : "Markdown Kodu (GitHub Profiliniz İçin)"}
          </p>
          <CopyBox value={mdSnippet} accentColor={accentColor} accentBg={accentBg} accentBorder={accentBorder} />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-400">
            {lang === "en" ? "HTML Code" : "HTML Kodu"}
          </p>
          <CopyBox value={htmlSnippet} accentColor={accentColor} accentBg={accentBg} accentBorder={accentBorder} />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-400">
            {lang === "en" ? "Add All Widgets Together (Markdown)" : "Tüm Widget'ları Birlikte Ekle (Markdown)"}
          </p>
          <CopyBox
            value={widgetItems.map((w) => `[![${w.label}](${base}${w.path(username)})](${profileUrl})`).join("\n\n")}
            accentColor={accentColor}
            accentBg={accentBg}
            accentBorder={accentBorder}
          />
        </div>
      </div>
    </div>
  );
}
