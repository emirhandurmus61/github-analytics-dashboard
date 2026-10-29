"use client";

import { Sparkles } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Section, ACCENT, ACCENT_BG, ACCENT_BORDER } from "../ui";
import { ReadmeWidgets } from "../readme-editor";

export function ReadmeWidgetsSection({ username }: {
  username: string;
}) {
  const { lang, t } = useLanguage();

  return (
    <Section
      icon={Sparkles}
      title={t.settings.navReadmeWidgets}
      desc={
        lang === "en"
          ? "Add streak, overall stats, language breakdown, and 52-week heatmap SVG cards to your GitHub profile."
          : "Streak, genel istatistik, dil dağılımı ve 52 haftalık ısı haritası SVG kartlarını GitHub profilinize ekleyin."
      }
      badge={lang === "en" ? "Live SVG" : "Canlı SVG"}
      accent={ACCENT}
      accentBorder={ACCENT_BORDER}
      accentBg={ACCENT_BG}
    >
      <ReadmeWidgets
        username={username}
        accentColor={ACCENT}
        accentBg={ACCENT_BG}
        accentBorder={ACCENT_BORDER}
      />
    </Section>
  );
}
