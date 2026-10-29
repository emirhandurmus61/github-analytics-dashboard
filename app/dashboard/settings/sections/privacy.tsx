"use client";

import { type Dispatch, type SetStateAction } from "react";
import { Shield, ExternalLink } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Section, ACCENT, ACCENT_BG, ACCENT_BORDER } from "../ui";

export function PrivacySection({ optIn, setOptIn }: {
  optIn: boolean;
  setOptIn: Dispatch<SetStateAction<boolean>>;
}) {
  const { lang } = useLanguage();

  return (
    <Section
      icon={Shield}
      title={lang === "en" ? "Privacy & Leaderboard" : "Gizlilik & Liderlik Tablosu"}
      desc={
        lang === "en"
          ? "Configure your visibility and ranking participation in the developer community."
          : "Geliştirici topluluğunda görünürlüğünüzü ve sıralama katılımınızı buradan yapılandırın."
      }
      badge={lang === "en" ? "Privacy" : "Gizlilik"}
      accent={ACCENT}
      accentBorder={ACCENT_BORDER}
      accentBg={ACCENT_BG}
    >
      <div className="space-y-4">
        <div
          className="flex items-start justify-between gap-4 rounded-panel border p-5 transition-all"
          style={{
            borderColor: optIn ? "var(--accent-line)" : "var(--line)",
            backgroundColor: optIn ? ACCENT_BG : "var(--bg-2)",
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
                    style={{ color: ACCENT }}
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
                    style={{ color: ACCENT }}
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
            style={{ backgroundColor: optIn ? ACCENT : "var(--line-2)" }}
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
  );
}
