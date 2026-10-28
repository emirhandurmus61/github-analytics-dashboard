"use client";

import Link from "next/link";
import { Trophy, Check, Command } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useUIPrefs } from "@/components/ui-prefs";
import { Kbd, Seg } from "@/components/ui/primitives";
import { WidgetSlotProvider } from "@/components/ui/widget-size";
import { GithubGlyph } from "@/components/shell/chrome";
import { SCHEMES, type SchemeId } from "@/lib/ui/schemes";
import { cn, type Lang } from "@/lib/ui/format";
import type { DashboardData } from "@/app/dashboard/types";
import StreakCard from "@/app/dashboard/streak-card";
import { StatCommits, LangDist } from "@/app/dashboard/stat-cards";
import ContributionHeatmap from "@/app/dashboard/contribution-heatmap";
import WeekCompare from "@/app/dashboard/week-compare";
import CommitQuality from "@/app/dashboard/commit-quality";
import { Shield2 } from "@/app/dashboard/badge-collection";

const TRY_SCHEMES: SchemeId[] = ["devboard-night", "tokyo-night", "gruvbox-dark", "catppuccin-mocha", "nord", "devboard-day", "solarized-light"];

function Slot({ w, h, children, className }: { w: number; h: number; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <WidgetSlotProvider value={{ w, h, mobile: false }}>{children}</WidgetSlotProvider>
    </div>
  );
}

export default function LandingClient({ signInAction, demo }: { signInAction: () => Promise<void>; demo: DashboardData }) {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const T = (tr: string, en: string) => (l === "en" ? en : tr);
  const { prefs, setPrefs, scheme } = useUIPrefs();

  const pickScheme = (id: SchemeId) =>
    SCHEMES[id].kind === "dark" ? setPrefs({ dark: id, mode: "dark" }) : setPrefs({ light: id, mode: "light" });

  const signIn = (
    <form action={signInAction}>
      <button type="submit" className="btn btn-primary btn-lg">
        <GithubGlyph size={16} />
        {T("GitHub ile başla", "Start with GitHub")}
      </button>
    </form>
  );

  const streak = <StreakCard streak={demo.streak} heatmap={demo.heatmapData} status="safe" todayCommits={demo.todayCommits} />;

  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-10">
      {/* Hero: the product itself, live, with the switches that restyle it */}
      <section className="grid gap-10 pb-16 pt-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-14 lg:pt-16">
        <div>
          <p className="font-mono text-[13px] text-ink-3">
            <span className="text-accent">❯</span> devboard --for developers
          </p>
          <h1 className="mt-5 text-[40px] font-[780] leading-[1.02] tracking-[-0.04em] text-ink sm:text-[56px]">
            {T("GitHub geçmişin, düzenlenebilir bir çalışma alanında.", "Your GitHub history, as a workspace you arrange.")}
          </h1>
          <p className="mt-5 max-w-[46ch] text-[16px] leading-relaxed text-ink-2">
            {T(
              "Commitlerin, serilerin, dillerin ve repoların 26 kartta. Kartları sürükle, boyutlandır; her boyutun kendi tasarımı var. Editör, terminal ya da stüdyo görünümünde, editöründen tanıdığın renk şemalarıyla.",
              "Commits, streaks, languages and repos across 26 cards. Drag and resize them; every size has its own layout. In an editor, terminal or studio interface, with the color schemes you know from your editor.",
            )}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-2.5">
            {signIn}
            <Link href="/leaderboard" className="btn btn-lg">
              <Trophy /> {T("Sıralamaya bak", "See the leaderboard")}
            </Link>
          </div>

          <div className="mt-10 rounded-panel border border-line bg-surface p-4">
            <div className="text-[12.5px] text-ink-3">{T("Burada dene: sayfa anında değişir.", "Try it here: the page changes instantly.")}</div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Seg
                value={prefs.ui}
                onChange={(v) => setPrefs({ ui: v })}
                options={[
                  { value: "editor", label: T("Editör", "Editor") },
                  { value: "terminal", label: "Terminal" },
                  { value: "studio", label: T("Stüdyo", "Studio") },
                ]}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {TRY_SCHEMES.map((id) => {
                const s = SCHEMES[id];
                const on = scheme.id === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => pickScheme(id)}
                    aria-pressed={on}
                    className={cn("inline-flex h-7 items-center gap-1.5 rounded-[var(--r-chip)] border px-2 text-[12px]", on ? "border-accent text-ink" : "border-line text-ink-3 hover:text-ink")}
                  >
                    <span className="inline-flex overflow-hidden rounded-full" aria-hidden>
                      <span className="size-3" style={{ background: s.bg[1] }} />
                      <span className="size-3" style={{ background: s.hue.green }} />
                    </span>
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live demo board */}
        <div className="grid grid-cols-2 gap-3 [grid-auto-rows:168px] sm:grid-cols-4">
          <Slot w={1} h={1}>
            <StatCommits count={demo.stats.commitCount} prev={null} range="365" daily={demo.heatmapData} />
          </Slot>
          <Slot w={1} h={1}>{streak}</Slot>
          <Slot w={2} h={1} className="col-span-2">
            <WeekCompare current={demo.weekDays.current} previous={demo.weekDays.previous} />
          </Slot>
          <Slot w={4} h={1} className="col-span-2 sm:col-span-4">
            <ContributionHeatmap data={demo.heatmapData} streak={demo.streak} />
          </Slot>
          <Slot w={2} h={2} className="col-span-2 row-span-2">
            <CommitQuality data={demo.commitQuality} />
          </Slot>
          <Slot w={2} h={2} className="col-span-2 row-span-2 hidden sm:block">
            <LangDist languages={demo.topLanguages} />
          </Slot>
        </div>
      </section>

      {/* One card, three sizes */}
      <section className="border-t border-line py-16">
        <div className="max-w-2xl">
          <h2 className="text-[28px] font-[720] tracking-[-0.03em] text-ink sm:text-[34px]">{T("Kart küçülünce özetler, büyüyünce anlatır.", "Small cards summarize. Large cards explain.")}</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
            {T(
              "Düzenle'ye bas, kartın kenarını çek. Seri kartı 1×1'de tek bir sayı, 2×1'de son haftaların şeridi, 2×2'de bütün bir takvim olur. Her kart için dört ayrı yerleşim var; telefonda S, M, L ve XL.",
              "Press Customize and pull a card's edge. The streak card is one number at 1×1, a strip of recent weeks at 2×1, a full calendar at 2×2. Every card ships four layouts; S, M, L and XL on a phone.",
            )}
          </p>
        </div>
        <div className="mt-8 grid gap-3 lg:grid-cols-[1fr_2fr_2fr]">
          {[
            { w: 1, h: 1, label: "1×1 · " + T("bakış", "glance"), cls: "h-[184px]" },
            { w: 2, h: 1, label: "2×1 · " + T("şerit", "strip"), cls: "h-[184px]" },
            { w: 2, h: 2, label: "2×2 · " + T("tam", "full"), cls: "h-[380px] lg:row-span-2" },
          ].map((s) => (
            <figure key={s.label} className="flex flex-col gap-2">
              <figcaption className="font-mono text-[12px] text-ink-3">{s.label}</figcaption>
              <Slot w={s.w} h={s.h} className={s.cls}>
                {streak}
              </Slot>
            </figure>
          ))}
        </div>
      </section>

      {/* Keyboard */}
      <section className="grid gap-10 border-t border-line py-16 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="text-[28px] font-[720] tracking-[-0.03em] text-ink sm:text-[34px]">{T("Klavyeden kalkmadan.", "Without leaving the keyboard.")}</h2>
          <p className="mt-3 max-w-[48ch] text-[15px] leading-relaxed text-ink-2">
            {T(
              "Komut paletinden sayfalar arasında geç, senkron başlat, arayüzü ya da renk şemasını değiştir. Şemalar arasında ok tuşlarıyla gezerken önizleme anında gelir.",
              "Jump between pages, start a sync, switch the interface or color scheme from the command palette. Arrowing through schemes previews them instantly.",
            )}
          </p>
          <ul className="mt-6 grid max-w-md gap-2 text-[13.5px] text-ink-2">
            {[
              [["⌘", "K"], T("Komut paleti", "Command palette")],
              [["G", "O"], T("Genel bakışa git", "Go to overview")],
              [["G", "T"], T("Zaman çizelgesine git", "Go to timeline")],
              [["E"], T("Kartları düzenle", "Customize cards")],
              [["?"], T("Tüm kısayollar", "All shortcuts")],
            ].map(([keys, label]) => (
              <li key={label as string} className="flex items-center justify-between border-b border-line py-2">
                {label}
                <span className="flex gap-1">
                  {(keys as string[]).map((k) => (
                    <Kbd key={k}>{k}</Kbd>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="surface-pop overflow-hidden" aria-hidden>
          <div className="flex h-12 items-center gap-2 border-b border-line px-3 text-[14px] text-ink-3">
            <Command size={15} /> tokyo
            <span className="caret" />
          </div>
          <div className="p-1.5">
            <div className="px-3 pb-1 pt-2 text-[11px] text-ink-4">{T("Renk şeması", "Color scheme")}</div>
            {(["tokyo-night", "devboard-night", "nord"] as SchemeId[]).map((id, i) => (
              <div key={id} className={cn("flex h-9 items-center gap-2.5 rounded-[var(--r-control)] px-3 text-[13px]", i === 0 ? "bg-raised text-ink" : "text-ink-2")} style={i === 0 ? { boxShadow: "inset 2px 0 0 var(--accent)" } : undefined}>
                <span className="inline-flex overflow-hidden rounded-[3px] border" style={{ borderColor: SCHEMES[id].line2 }}>
                  <span className="h-3.5 w-3" style={{ background: SCHEMES[id].bg[0] }} />
                  <span className="h-3.5 w-3" style={{ background: SCHEMES[id].hue.purple }} />
                </span>
                {i === 0 ? (
                  <span>
                    <span className="text-accent font-semibold">Tokyo</span> Night
                  </span>
                ) : (
                  SCHEMES[id].name
                )}
                {i === 0 && <Check size={14} className="ml-auto text-accent" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Profile + Wrapped */}
      <section className="grid gap-10 border-t border-line py-16 lg:grid-cols-2">
        <div>
          <h2 className="text-[24px] font-[720] tracking-[-0.03em] text-ink">{T("Herkese açık profil", "A public profile")}</h2>
          <p className="mt-2 max-w-[48ch] text-[15px] leading-relaxed text-ink-2">
            {T("README'n, sabitlediğin repolar, katkı haritan ve rozetlerin tek bir adreste. Kendi vurgu rengini taşır.", "Your README, pinned repos, contribution map and badges at one address. It carries your accent color.")}
          </p>
          <div className="mt-5 flex flex-wrap gap-1.5">
            {demo.badges
              .filter((b) => b.earned)
              .slice(0, 6)
              .map((b) => (
                <Shield2 key={b.id} left={b.name} right={b.target ? String(b.target) : "✓"} color={b.rarity === "epic" ? "var(--hue-purple)" : b.rarity === "rare" ? "var(--hue-blue)" : "var(--ink-2)"} earned size="sm" />
              ))}
          </div>
        </div>
        <div>
          <h2 className="text-[24px] font-[720] tracking-[-0.03em] text-ink">Wrapped</h2>
          <p className="mt-2 max-w-[48ch] text-[15px] leading-relaxed text-ink-2">
            {T("Yılın on slaytta: toplam commit, eklenen satır, en yoğun ay, dillerin ve en büyük commitin. Her slayt paylaşılabilir bir görsel olarak iner.", "Your year in ten slides: commits, lines added, busiest month, languages and your biggest commit. Each slide downloads as a shareable image.")}
          </p>
          <div className="mt-5 font-mono text-[clamp(56px,9vw,104px)] font-[800] leading-none tracking-[-0.05em] text-ink num">{new Date().getFullYear()}</div>
        </div>
      </section>

      <section className="flex flex-col items-start gap-5 border-t border-line py-16 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[24px] font-[720] tracking-[-0.03em] text-ink">{T("İlk senkron bir dakikadan kısa sürer.", "The first sync takes under a minute.")}</h2>
          <p className="mt-1 text-[14px] text-ink-3">{T("Herkese açık aktiviten için salt okunur erişim. Sıralamadan istediğin an çıkabilirsin.", "Read-only access to your public activity. Leave the leaderboard any time.")}</p>
        </div>
        {signIn}
      </section>
      <footer className="border-t border-line py-6 font-mono text-[12px] text-ink-4">devboard</footer>
    </div>
  );
}
