"use client";

import { type ComponentProps } from "react";
import { Bell } from "lucide-react";
import PushNotificationToggle from "@/components/push-notification-toggle";
import { useLanguage } from "@/lib/i18n";
import { Section, ACCENT, ACCENT_BG, ACCENT_BORDER } from "../ui";

export function NotificationsSection({ pushPrefs, setPushPrefs }: {
  pushPrefs: ComponentProps<typeof PushNotificationToggle>["prefs"];
  setPushPrefs: (prefs: ComponentProps<typeof PushNotificationToggle>["prefs"]) => void;
}) {
  const { lang } = useLanguage();

  return (
    <Section
      icon={Bell}
      title={lang === "en" ? "Notification Preferences" : "Bildirim Tercihleri"}
      desc={
        lang === "en"
          ? "Protect your streak serially with web push notifications and get instant alerts when you reach your weekly goals."
          : "Web push bildirimleriyle streak serinizi koruyun ve haftalık hedeflerinize ulaştığınızda anlık uyarı alın."
      }
      badge={lang === "en" ? "Push Alerts" : "Push Uyarıları"}
      accent={ACCENT}
      accentBorder={ACCENT_BORDER}
      accentBg={ACCENT_BG}
    >
      <PushNotificationToggle
        accent={ACCENT}
        prefs={pushPrefs}
        onPrefsChange={setPushPrefs}
      />
    </Section>
  );
}
