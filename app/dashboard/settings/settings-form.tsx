"use client";

import { useActionState, useState, useEffect } from "react";
import { saveProfileSettings } from "./actions";
import { THEMES, type ThemeAccent } from "@/lib/themes";
import { Palette, User, Share2, LayoutTemplate, Award, Sparkles, Bell, Shield, Check, Loader2, Search } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { useUIPrefs } from "@/components/ui-prefs";
import { cn } from "@/lib/ui/format";
import AppearanceSettings from "./appearance";
import { useLanguage } from "@/lib/i18n";
import { WIDGET_KEYS, PRESETS, type WidgetKey, type WidgetPreset } from "@/lib/widgets";
import { VALID_SECTION_IDS, SEARCH_HINTS, type NavItem, type SettingsSectionId } from "./nav";
import { Section, ACCENT, ACCENT_BG, ACCENT_BORDER } from "./ui";
import { ProfileSection } from "./sections/profile";
import { SocialSection } from "./sections/social";
import { ProfilePageSection } from "./sections/profile-page";
import { BadgeSection } from "./sections/badge";
import { ReadmeWidgetsSection } from "./sections/readme-widgets";
import { NotificationsSection } from "./sections/notifications";
import { PrivacySection } from "./sections/privacy";

export type { SettingsSectionId } from "./nav";

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
              accent={ACCENT}
              accentBorder={ACCENT_BORDER}
              accentBg={ACCENT_BG}
            >
              <AppearanceSettings />
            </Section>
          </div>

                    <div className={activeSection === "profil" ? "block" : "hidden"}>
            <ProfileSection
              bioInput={bioInput}
              setBioInput={setBioInput}
              workingOnInput={workingOnInput}
              setWorkingOnInput={setWorkingOnInput}
              yearlyGoalInput={yearlyGoalInput}
              setYearlyGoalInput={setYearlyGoalInput}
              tagInput={tagInput}
              setTagInput={setTagInput}
              addSuggestedTag={addSuggestedTag}
              removeTag={removeTag}
              selectedPinned={selectedPinned}
              setSelectedPinned={setSelectedPinned}
              repos={repos}
            />
          </div>

          {/* 3. SOSYAL LİNKLER SEKME İÇERİĞİ */}
          <div className={activeSection === "sosyal" ? "block" : "hidden"}>
            <SocialSection
              socialTwitter={socialTwitter}
              socialLinkedin={socialLinkedin}
              socialWebsite={socialWebsite}
              socialDiscord={socialDiscord}
            />
          </div>

          {/* 4. PROFİL SAYFASI & README SEKME İÇERİĞİ */}
          <div className={activeSection === "profil-sayfasi" ? "block" : "hidden"}>
            <ProfilePageSection
              selectedReadmeSource={selectedReadmeSource}
              setSelectedReadmeSource={setSelectedReadmeSource}
              readme={readme}
              setReadme={setReadme}
              githubReadme={githubReadme}
              order={order}
              visibleWidgets={visibleWidgets}
              moveUp={moveUp}
              moveDown={moveDown}
              applyPreset={applyPreset}
              toggleWidget={toggleWidget}
              username={username}
            />
          </div>

          {/* 5. README ROZETİ SEKME İÇERİĞİ */}
          <div className={activeSection === "badge" ? "block" : "hidden"}>
            <BadgeSection
              badgeUrl={badgeUrl}
              username={username}
            />
          </div>

          {/* 6. README WIDGET'LARI SEKME İÇERİĞİ */}
          <div className={activeSection === "readme-widgets" ? "block" : "hidden"}>
            <ReadmeWidgetsSection
              username={username}
            />
          </div>

          {/* 7. BİLDİRİMLER SEKME İÇERİĞİ */}
          <div className={activeSection === "bildirimler" ? "block" : "hidden"}>
            <NotificationsSection
              pushPrefs={pushPrefs}
              setPushPrefs={setPushPrefs}
            />
          </div>

          {/* 8. GİZLİLİK & SIRALAMA SEKME İÇERİĞİ */}
          <div className={activeSection === "gizlilik" ? "block" : "hidden"}>
            <PrivacySection
              optIn={optIn}
              setOptIn={setOptIn}
            />
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

