"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import { saveProfileSettings } from "./actions";
import { THEMES, type ThemeAccent } from "@/lib/themes";
import { ImagePlus, Loader2, Check, Copy } from "lucide-react";
import PushNotificationToggle from "@/components/push-notification-toggle";
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

const NAV_ITEMS = [
  { id: "gorunum", label: "Görünüm", icon: "◐" },
  { id: "profil", label: "Profil", icon: "◈" },
  { id: "sosyal", label: "Sosyal", icon: "◎" },
  { id: "profil-sayfasi", label: "Profil Sayfası", icon: "◫" },
  { id: "badge", label: "Badge", icon: "◆" },
  { id: "readme-widgets", label: "README Widgets", icon: "◉" },
  { id: "bildirimler", label: "Bildirimler", icon: "◎" },
  { id: "gizlilik", label: "Gizlilik", icon: "◌" },
] as const;

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

  const [selectedTheme, setSelectedTheme] = useState<ThemeAccent>(currentTheme);
  const previewColors = THEMES[selectedTheme];

  const [selectedPinned, setSelectedPinned] = useState<string[]>(
    pinnedRepos.length > 0 ? pinnedRepos : (pinnedRepo ? [pinnedRepo] : [])
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
  const [activeSection, setActiveSection] = useState("gorunum");
  const [showSuccess, setShowSuccess] = useState(false);
  const [optIn, setOptIn] = useState(leaderboardOptIn);
  const [pushPrefs, setPushPrefs] = useState({
    streak: true, goal: true, badge: true, summary: true, hour: 20,
  });

  // Başarı toast
  useEffect(() => {
    if (state?.success) {
      setShowSuccess(true);
      const t = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(t);
    }
  }, [state]);

  // IntersectionObserver ile aktif section takibi
  useEffect(() => {
    const sections = NAV_ITEMS.map((n) => document.getElementById(n.id)).filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );
    sections.forEach((s) => s && observer.observe(s));
    return () => observer.disconnect();
  }, []);

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

  const accent = previewColors.accent;
  const accentBg = previewColors.accentBg;
  const accentBorder = previewColors.accentBorder;

  return (
    <div className="relative">
      {/* Toast */}
      <div
        className="fixed top-20 right-6 z-50 transition-all duration-300"
        style={{
          opacity: showSuccess ? 1 : 0,
          transform: showSuccess ? "translateY(0)" : "translateY(-8px)",
          pointerEvents: showSuccess ? "auto" : "none",
        }}
      >
        <div
          className="flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-xl backdrop-blur-sm"
          style={{ backgroundColor: accentBg, borderColor: accentBorder, color: accent }}
        >
          <Check className="h-4 w-4 shrink-0" />
          <span className="font-medium">Profil güncellendi</span>
        </div>
      </div>

      {/* Hata */}
      {state?.error && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
          {state.error}
        </div>
      )}

      <div className="flex gap-8">
        {/* ── Sol Nav ── */}
        <aside className="hidden lg:block w-44 shrink-0">
          <nav className="sticky top-24 space-y-0.5">
            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Ayarlar</p>
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-all duration-150"
                  style={
                    isActive
                      ? { color: accent, backgroundColor: accentBg }
                      : { color: "#52525b" }
                  }
                >
                  <span
                    className="text-sm leading-none"
                    style={{ color: isActive ? accent : "#3f3f46" }}
                  >
                    {item.icon}
                  </span>
                  <span className={isActive ? "font-medium" : ""}>{item.label}</span>
                  {isActive && (
                    <span
                      className="ml-auto h-1 w-1 rounded-full"
                      style={{ backgroundColor: accent }}
                    />
                  )}
                </a>
              );
            })}
          </nav>
        </aside>

        {/* ── İçerik ── */}
        <form action={formAction} className="min-w-0 flex-1 space-y-4 pb-32">

          {/* ── GÖRÜNÜM ── */}
          <Section id="gorunum" title="Görünüm" desc="Tema rengin dashboard ve public profilinde her yerde uygulanır." accentBorder={accentBorder}>
            {/* Tema grid */}
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {(Object.entries(THEMES) as [ThemeAccent, typeof THEMES[ThemeAccent]][]).map(([key, theme]) => {
                const isSelected = selectedTheme === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedTheme(key)}
                    className="group flex flex-col items-center gap-2.5 rounded-xl border p-3 transition-all duration-200"
                    style={
                      isSelected
                        ? { borderColor: theme.accentBorder, backgroundColor: theme.accentBg }
                        : { borderColor: "#27272a", backgroundColor: "transparent" }
                    }
                  >
                    <div
                      className="h-8 w-8 rounded-full transition-transform duration-200"
                      style={{
                        backgroundColor: theme.accent,
                        transform: isSelected ? "scale(1.1)" : "scale(1)",
                        boxShadow: isSelected ? `0 0 12px ${theme.accent}40` : "none",
                      }}
                    />
                    <span
                      className="text-[11px] font-medium"
                      style={{ color: isSelected ? theme.accent : "#52525b" }}
                    >
                      {theme.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Önizleme */}
            <div
              className="rounded-xl border p-5 transition-all duration-300"
              style={{ backgroundColor: accentBg, borderColor: accentBorder }}
            >
              <p className="mb-4 text-[10px] font-semibold uppercase tracking-widest" style={{ color: accent }}>
                Önizleme
              </p>
              <div className="flex items-center gap-5">
                {/* Streak */}
                <div className="flex flex-col items-center gap-1 rounded-xl border px-4 py-3" style={{ borderColor: accentBorder, backgroundColor: "rgba(0,0,0,0.3)" }}>
                  <span className="text-[10px] text-zinc-600">Streak 🔥</span>
                  <span className="text-2xl font-bold tabular-nums" style={{ color: accent }}>12</span>
                  <span className="text-[10px] text-zinc-600">gün</span>
                </div>

                {/* Progress */}
                <div className="flex-1 space-y-3">
                  <div>
                    <div className="mb-1.5 flex justify-between text-[11px]">
                      <span className="text-zinc-500">Haftalık Hedef</span>
                      <span style={{ color: accent }}>14 / 20</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: "70%", backgroundColor: accent }}
                      />
                    </div>
                  </div>
                  {/* Heatmap dots */}
                  <div className="flex gap-1">
                    {previewColors.shades.map((shade, i) => (
                      <div
                        key={i}
                        className="h-3.5 w-3.5 rounded-sm"
                        style={{ backgroundColor: shade }}
                      />
                    ))}
                    <div className="h-3.5 w-3.5 rounded-sm bg-zinc-800" />
                    <div className="h-3.5 w-3.5 rounded-sm bg-zinc-800" />
                  </div>
                </div>
              </div>
            </div>

            <input type="hidden" name="theme_accent" value={selectedTheme} />
          </Section>

          {/* ── PROFİL ── */}
          <Section id="profil" title="Profil" desc="Public profilinde görünen kişisel bilgiler." accentBorder={accentBorder}>
            {/* Bio */}
            <Field label="Biyografi" hint="maks. 200 karakter">
              <div className="relative">
                <textarea
                  name="bio"
                  defaultValue={bio ?? ""}
                  maxLength={200}
                  rows={3}
                  placeholder="Kendini kısaca tanıt..."
                  className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 transition-colors focus:border-zinc-600 focus:outline-none"
                />
              </div>
            </Field>

            {/* Şu an üzerinde çalıştığım */}
            <Field label="Şu an üzerinde çalışıyorum" hint="maks. 150 karakter">
              <input
                name="currently_working_on"
                type="text"
                defaultValue={currentlyWorkingOn ?? ""}
                maxLength={150}
                placeholder="Örn: Rust ile bir CLI aracı geliştiriyorum..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 transition-colors focus:border-zinc-600 focus:outline-none"
              />
            </Field>

            {/* Bu yıl hedefim */}
            <Field label="Bu yıl hedefim" hint="maks. 150 karakter">
              <input
                name="yearly_goal"
                type="text"
                defaultValue={yearlyGoal ?? ""}
                maxLength={150}
                placeholder="Örn: Açık kaynak projeye katkı sağlamak..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 transition-colors focus:border-zinc-600 focus:outline-none"
              />
            </Field>

            {/* Tech tags */}
            <Field label="Favori araçlar & teknolojiler" hint="virgülle ayır, maks. 12">
              <input
                name="tech_tags"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="TypeScript, Neovim, Docker, Postgres..."
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 transition-colors focus:border-zinc-600 focus:outline-none"
              />
              {tagInput.trim() && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {tagInput.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 12).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border px-2.5 py-0.5 text-[11px] font-medium"
                      style={{ borderColor: accentBorder, color: accent, backgroundColor: accentBg }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Field>

            {/* Pinned repos */}
            <Field label="Öne çıkan repolar" hint="maks. 3">
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-zinc-700">
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
                      className="w-full appearance-none rounded-xl border border-zinc-800 bg-zinc-900 py-3 pl-8 pr-4 text-sm text-zinc-100 transition-colors focus:border-zinc-600 focus:outline-none"
                    >
                      <option value="">{i === 0 ? "— Repo seç —" : "— Opsiyonel —"}</option>
                      {repos
                        .filter((r) => !selectedPinned.includes(r.name) || selectedPinned[i] === r.name)
                        .map((r) => (
                          <option key={r.name} value={r.name}>{r.name}</option>
                        ))}
                    </select>
                  </div>
                ))}
              </div>
              <input type="hidden" name="pinned_repos" value={JSON.stringify(selectedPinned)} />
              <input type="hidden" name="pinned_repo" value={selectedPinned[0] ?? ""} />
            </Field>
          </Section>

          {/* ── SOSYAL ── */}
          <Section id="sosyal" title="Sosyal Linkler" desc="Public profilinde ikonlar olarak görünür." accentBorder={accentBorder}>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Twitter / X">
                <PrefixInput prefix="x.com/" name="social_twitter" defaultValue={socialTwitter ?? ""} placeholder="kullanici_adi" maxLength={50} />
              </Field>
              <Field label="LinkedIn">
                <PrefixInput prefix="linkedin.com/in/" name="social_linkedin" defaultValue={socialLinkedin ?? ""} placeholder="kullanici-adi" maxLength={80} />
              </Field>
              <Field label="Kişisel Site">
                <input
                  name="social_website"
                  type="url"
                  defaultValue={socialWebsite ?? ""}
                  maxLength={200}
                  placeholder="https://..."
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 transition-colors focus:border-zinc-600 focus:outline-none"
                />
              </Field>
              <Field label="Discord">
                <input
                  name="social_discord"
                  type="text"
                  defaultValue={socialDiscord ?? ""}
                  maxLength={50}
                  placeholder="kullanici#0000"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder-zinc-700 transition-colors focus:border-zinc-600 focus:outline-none"
                />
              </Field>
            </div>
          </Section>

          {/* ── PROFİL SAYFASI ── */}
          <Section id="profil-sayfasi" title="Profil Sayfası" desc="Public profilindeki widget'lar ve README içeriği." accentBorder={accentBorder}>

            {/* README kaynak seçimi */}
            <div>
              <p className="mb-2.5 text-xs text-zinc-500">README Kaynağı</p>
              <div className="grid grid-cols-2 gap-2">
                {(["github", "custom"] as const).map((src) => {
                  const isSelected = selectedReadmeSource === src;
                  return (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setSelectedReadmeSource(src)}
                      className="rounded-xl border p-4 text-left transition-all duration-150"
                      style={
                        isSelected
                          ? { borderColor: accentBorder, backgroundColor: accentBg }
                          : { borderColor: "#27272a" }
                      }
                    >
                      <span
                        className="block text-xs font-semibold"
                        style={{ color: isSelected ? accent : "#a1a1aa" }}
                      >
                        {src === "github" ? "GitHub README" : "Özel README"}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-zinc-600">
                        {src === "github"
                          ? (githubReadme ? "Sync ile otomatik güncellenir" : "Henüz çekilmedi — sync yap")
                          : "Kendi içeriğini yaz"}
                      </span>
                    </button>
                  );
                })}
              </div>
              <input type="hidden" name="readme_source" value={selectedReadmeSource} />
            </div>

            {/* README içerik */}
            {selectedReadmeSource === "github" ? (
              githubReadme ? (
                <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-500 font-mono leading-relaxed max-h-52 overflow-y-auto whitespace-pre-wrap">
                  {githubReadme.slice(0, 500)}{githubReadme.length > 500 ? "…" : ""}
                </div>
              ) : (
                <p className="text-xs text-zinc-600">
                  GitHub profilinde README bulunamadı.{" "}
                  <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-zinc-500">{username}/{username}</code>{" "}
                  reposunu oluşturup sync yap.
                </p>
              )
            ) : (
              <ReadmeEditor
                value={readme}
                onChange={setReadme}
                accentColor={accent}
                accentBorder={accentBorder}
                accentBg={accentBg}
              />
            )}

            {/* Divider */}
            <div className="border-t border-zinc-800" />

            {/* Widget preset */}
            <div>
              <p className="mb-2.5 text-xs text-zinc-500">Hazır Düzen</p>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(PRESETS) as [WidgetPreset, typeof PRESETS[WidgetPreset]][]).map(([key, preset]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyPreset(key)}
                    className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-left transition-colors hover:border-zinc-700"
                  >
                    <p className="text-xs font-semibold text-zinc-300">{preset.label}</p>
                    <p className="mt-0.5 text-[11px] text-zinc-600">{preset.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Widget sıralama */}
            <div>
              <p className="mb-2.5 text-xs text-zinc-500">Sıra & Görünürlük</p>
              <div className="space-y-2">
                {order.map((key, i) => {
                  const visible = visibleWidgets.has(key);
                  return (
                    <div
                      key={key}
                      className="flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-150"
                      style={{
                        borderColor: visible ? accentBorder : "#27272a",
                        backgroundColor: visible ? accentBg : "transparent",
                      }}
                    >
                      {/* Sıra */}
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold"
                        style={visible
                          ? { color: accent, backgroundColor: `${accent}20` }
                          : { color: "#3f3f46", backgroundColor: "#18181b" }
                        }
                      >
                        {i + 1}
                      </span>

                      {/* Label */}
                      <span
                        className="flex-1 text-sm"
                        style={{ color: visible ? "#e4e4e7" : "#52525b" }}
                      >
                        {WIDGET_LABELS[key]}
                      </span>

                      {/* Toggle */}
                      <button
                        type="button"
                        onClick={() => toggleWidget(key)}
                        className="rounded-lg border px-3 py-1 text-[11px] font-medium transition-all duration-150"
                        style={
                          visible
                            ? { borderColor: accentBorder, color: accent, backgroundColor: `${accent}15` }
                            : { borderColor: "#3f3f46", color: "#52525b" }
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
                          className="flex h-5 w-5 items-center justify-center rounded text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-20"
                        >
                          <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 6 6">
                            <path d="M3 0L6 6H0z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => moveDown(i)}
                          disabled={i === order.length - 1}
                          className="flex h-5 w-5 items-center justify-center rounded text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-300 disabled:opacity-20"
                        >
                          <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 6 6">
                            <path d="M3 6L0 0h6z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gizli input'lar */}
            <input type="hidden" name="widget_order" value={JSON.stringify(order)} />
            {WIDGET_KEYS.map((key) =>
              visibleWidgets.has(key)
                ? <input key={key} type="hidden" name={`widget_${key}`} value="on" />
                : null
            )}
          </Section>

          {/* ── BADGE ── */}
          <Section id="badge" title="README Badge" desc="GitHub README'ne ekle — veriler otomatik güncellenir." accentBorder={accentBorder}>
            {/* Badge önizleme */}
            <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={badgeUrl} alt="Dev Analytics Badge" className="block" />
            </div>

            <div className="space-y-3">
              <div>
                <p className="mb-2 text-xs text-zinc-500">Markdown</p>
                <CopyBox value={`[![Dev Analytics](${badgeUrl})](https://devanalytics.app/u/${username})`} accentColor={accent} accentBg={accentBg} accentBorder={accentBorder} />
              </div>
              <div>
                <p className="mb-2 text-xs text-zinc-500">HTML</p>
                <CopyBox value={`<a href="https://devanalytics.app/u/${username}"><img src="${badgeUrl}" alt="Dev Analytics"></a>`} accentColor={accent} accentBg={accentBg} accentBorder={accentBorder} />
              </div>
            </div>
          </Section>

          {/* ── README WIDGETS ── */}
          <Section id="readme-widgets" title="README Widgets" desc="GitHub profiline veya herhangi bir README'ye ekle — her saat otomatik güncellenir." accentBorder={accentBorder}>
            <ReadmeWidgets username={username} accentColor={accent} accentBg={accentBg} accentBorder={accentBorder} />
          </Section>

          {/* ── BİLDİRİMLER ── */}
          <Section id="bildirimler" title="Bildirimler" desc="Push bildirimleriyle streak'ini ve hedeflerini takip et. Uygulama kapalıyken bile çalışır." accentBorder={accentBorder}>
            <PushNotificationToggle
              accent={accent}
              prefs={pushPrefs}
              onPrefsChange={setPushPrefs}
            />
          </Section>

          {/* ── GİZLİLİK ── */}
          <Section id="gizlilik" title="Gizlilik" desc="Hangi verilerinin herkese açık gösterileceğini kontrol et." accentBorder={accentBorder}>
            <div className="space-y-4">
              <div
                className="flex items-start justify-between gap-4 rounded-xl border p-4"
                style={{ borderColor: optIn ? `${accent}30` : "#27272a", backgroundColor: optIn ? `${accent}08` : "transparent" }}
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-zinc-200">Liderlik Tablosuna Katıl</p>
                  <p className="text-xs text-zinc-500">
                    Haftalık commit, streak ve rozet sayın{" "}
                    <a href="/leaderboard" target="_blank" className="underline" style={{ color: accent }}>
                      liderlik tablosunda
                    </a>{" "}
                    varsayılan olarak görünür. Kapatarak gizleyebilirsin.
                  </p>
                </div>
                {/* Toggle switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={optIn}
                  onClick={() => setOptIn((v) => !v)}
                  className="relative shrink-0 h-6 w-11 rounded-full transition-colors"
                  style={{ backgroundColor: optIn ? accent : "#3f3f46" }}
                >
                  <span
                    className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
                    style={{ transform: optIn ? "translateX(20px)" : "translateX(0)" }}
                  />
                </button>
                <input type="hidden" name="leaderboard_opt_in" value={optIn ? "on" : "off"} />
              </div>
            </div>
          </Section>

          {/* ── Sticky Kaydet ── */}
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800/80 bg-zinc-950/90 backdrop-blur-xl">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
              <p className="text-xs text-zinc-600">
                Değişiklikler kaydedilene kadar uygulanmaz.
              </p>
              <button
                type="submit"
                disabled={pending}
                className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-150 disabled:opacity-50"
                style={{ backgroundColor: accent, color: "#09090b" }}
              >
                {pending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Kaydet
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Alt bileşenler ───────────────────────────────────────────────────────────

function Section({
  id,
  title,
  desc,
  children,
  accentBorder,
}: {
  id: string;
  title: string;
  desc: string;
  children: React.ReactNode;
  accentBorder: string;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden"
    >
      {/* Üst accent çizgisi */}
      <div className="h-px w-full" style={{ background: `linear-gradient(to right, ${accentBorder}, transparent)` }} />
      <div className="p-6 space-y-5">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
          <p className="mt-0.5 text-xs text-zinc-500">{desc}</p>
        </div>
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline gap-1.5">
        <label className="text-xs font-medium text-zinc-400">{label}</label>
        {hint && <span className="text-[10px] text-zinc-700">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function PrefixInput({
  prefix,
  name,
  defaultValue,
  placeholder,
  maxLength,
}: {
  prefix: string;
  name: string;
  defaultValue: string;
  placeholder: string;
  maxLength: number;
}) {
  return (
    <div className="flex items-center overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 transition-colors focus-within:border-zinc-600">
      <span className="shrink-0 border-r border-zinc-800 bg-zinc-900/50 px-3 py-3 text-[11px] text-zinc-600">
        {prefix}
      </span>
      <input
        name={name}
        type="text"
        defaultValue={defaultValue}
        maxLength={maxLength}
        placeholder={placeholder}
        className="flex-1 bg-transparent px-3 py-3 text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none"
      />
    </div>
  );
}

function CopyBox({
  value,
  accentColor,
  accentBg,
  accentBorder,
}: {
  value: string;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex items-stretch gap-2">
      <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-xs text-zinc-500">
        {value}
      </code>
      <button
        type="button"
        onClick={handleCopy}
        className="flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all duration-200"
        style={
          copied
            ? { borderColor: accentBorder, color: accentColor, backgroundColor: accentBg }
            : { borderColor: "#3f3f46", color: "#71717a" }
        }
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? "Kopyalandı" : "Kopyala"}
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
        alert(data.error ?? "Yükleme başarısız");
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
      alert("Yükleme sırasında hata oluştu");
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

  const TOOLBAR = [
    { label: "B", title: "Kalın", action: () => insertAround("**", "**", "kalın metin"), cls: "font-bold" },
    { label: "I", title: "İtalik", action: () => insertAround("*", "*", "italik metin"), cls: "italic" },
    { label: "H", title: "Başlık", action: () => insertAt("\n### "), cls: "" },
    { label: "<>", title: "Kod", action: () => insertAround("`", "`", "kod"), cls: "font-mono" },
    { label: "•", title: "Liste", action: () => insertAt("\n- "), cls: "" },
  ];

  const charPct = (value.length / 2000) * 100;

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1.5">
        {TOOLBAR.map((btn) => (
          <button
            key={btn.label}
            type="button"
            onClick={btn.action}
            title={btn.title}
            className={`rounded-lg px-2.5 py-1.5 text-xs text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-200 ${btn.cls}`}
          >
            {btn.label}
          </button>
        ))}
        <div className="mx-1 h-4 w-px bg-zinc-800" />
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors disabled:opacity-50 hover:bg-zinc-800"
          style={{ color: accentColor }}
          title="Görsel yükle"
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">Görsel</span>
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
        maxLength={2000}
        placeholder={"### Merhaba!\n\nBen bir yazılım geliştiriciyim.\n\n- Şu an **proje** üzerinde çalışıyorum\n- **Rust** öğreniyorum"}
        className="w-full resize-y rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 font-mono text-sm leading-relaxed text-zinc-100 placeholder-zinc-700 transition-colors focus:border-zinc-600 focus:outline-none"
      />

      <div className="flex items-center justify-between">
        <p className="text-[10px] text-zinc-700">Görsel: sürükle-bırak, yapıştır veya Görsel butonunu kullan</p>
        <div className="flex items-center gap-2">
          <div className="h-1 w-16 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${charPct}%`,
                backgroundColor: charPct > 90 ? "#f87171" : accentColor,
              }}
            />
          </div>
          <span className="text-[10px] tabular-nums text-zinc-700">{value.length}/2000</span>
        </div>
      </div>
    </div>
  );
}

/* ── README Widgets ─────────────────────────────────────────────────────────── */

const WIDGET_ITEMS = [
  {
    id: "streak",
    label: "Streak Widget",
    desc: "Günlük commit serisi, en uzun streak ve son 14 günlük mini bar chart.",
    path: (u: string) => `/api/widget/streak/${u}`,
  },
  {
    id: "stats",
    label: "Stats Widget",
    desc: "Yıllık commit, streak, repo sayısı ve toplam yıldız — 4 sütunlu kompakt kart.",
    path: (u: string) => `/api/widget/stats/${u}`,
  },
  {
    id: "langs",
    label: "Top Languages",
    desc: "En çok kullandığın 5 programlama dili ve yüzdeleri.",
    path: (u: string) => `/api/widget/langs/${u}`,
  },
  {
    id: "heatmap",
    label: "Contribution Heatmap",
    desc: "Son 52 haftanın katkı ısı haritası — temanın rengiyle.",
    path: (u: string) => `/api/widget/heatmap/${u}`,
  },
] as const;

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
  const [active, setActive] = useState<string>("streak");
  const current = WIDGET_ITEMS.find((w) => w.id === active)!;
  const base = typeof window !== "undefined" ? window.location.origin : "https://devanalytics.app";
  const imgUrl = `${base}${current.path(username)}`;
  const profileUrl = `${base}/u/${username}`;

  const mdSnippet = `[![${current.label}](${imgUrl})](${profileUrl})`;
  const htmlSnippet = `<a href="${profileUrl}"><img src="${imgUrl}" alt="${current.label}"></a>`;

  return (
    <div className="space-y-5">
      {/* Widget seçici tablar */}
      <div className="flex flex-wrap gap-2">
        {WIDGET_ITEMS.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => setActive(w.id)}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-all"
            style={
              active === w.id
                ? { borderColor: accentBorder, color: accentColor, backgroundColor: accentBg }
                : { borderColor: "#27272a", color: "#71717a" }
            }
          >
            {w.label}
          </button>
        ))}
      </div>

      {/* Açıklama */}
      <p className="text-xs text-zinc-500">{current.desc}</p>

      {/* Önizleme */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 p-4 flex items-center justify-center min-h-[80px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={imgUrl} src={imgUrl} alt={current.label} className="max-w-full block" />
      </div>

      {/* Snippet'ler */}
      <div className="space-y-3">
        <div>
          <p className="mb-2 text-xs text-zinc-500">Markdown (GitHub README)</p>
          <CopyBox value={mdSnippet} accentColor={accentColor} accentBg={accentBg} accentBorder={accentBorder} />
        </div>
        <div>
          <p className="mb-2 text-xs text-zinc-500">HTML</p>
          <CopyBox value={htmlSnippet} accentColor={accentColor} accentBg={accentBg} accentBorder={accentBorder} />
        </div>
      </div>

      {/* Tüm widgetları ekle */}
      <div>
        <p className="mb-2 text-xs text-zinc-500">Hepsini birden ekle (Markdown)</p>
        <CopyBox
          value={WIDGET_ITEMS.map((w) => `[![${w.label}](${base}${w.path(username)})](${profileUrl})`).join("\n")}
          accentColor={accentColor}
          accentBg={accentBg}
          accentBorder={accentBorder}
        />
      </div>
    </div>
  );
}
