"use client";

import { Award } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Section, CopyBox, ACCENT, ACCENT_BG, ACCENT_BORDER } from "../ui";

export function BadgeSection({ badgeUrl, username }: {
  badgeUrl: string;
  username: string;
}) {
  const { lang, t } = useLanguage();

  return (
    <Section
      icon={Award}
      title={t.settings.navBadge}
      desc={
        lang === "en"
          ? "Dynamic SVG badge that you can embed in your GitHub profile README or docs."
          : "GitHub profil README dosyanıza veya dokümanlarınıza gömebileceğiniz dinamik SVG rozeti."
      }
      badge={lang === "en" ? "SVG Badge" : "SVG Rozet"}
      accent={ACCENT}
      accentBorder={ACCENT_BORDER}
      accentBg={ACCENT_BG}
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
              accentColor={ACCENT}
              accentBg={ACCENT_BG}
              accentBorder={ACCENT_BORDER}
            />
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-zinc-400">
              {t.settings.badgeHtml}
            </p>
            <CopyBox
              value={`<a href="https://devboard.app/u/${username}"><img src="${badgeUrl}" alt="Devboard"></a>`}
              accentColor={ACCENT}
              accentBg={ACCENT_BG}
              accentBorder={ACCENT_BORDER}
            />
          </div>
        </div>
      </div>
    </Section>
  );
}
