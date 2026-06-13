"use client";

import { useEffect } from "react";
import { Bell, BellOff, BellRing, Loader2, AlertTriangle } from "lucide-react";
import { usePushNotifications } from "@/hooks/use-push-notifications";

type NotifyPref = {
  streak: boolean;
  goal: boolean;
  badge: boolean;
  summary: boolean;
  hour: number;
};

function Toggle({
  checked,
  onChange,
  accent,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  accent: string;
}) {
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative w-9 h-5 rounded-full transition-colors duration-200 cursor-pointer shrink-0"
      style={{ backgroundColor: checked ? accent : "#3f3f46" }}
    >
      <div
        className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200"
        style={{ left: checked ? "calc(100% - 18px)" : "2px" }}
      />
    </div>
  );
}

export default function PushNotificationToggle({
  accent,
  prefs,
  onPrefsChange,
}: {
  accent: string;
  prefs: NotifyPref;
  onPrefsChange: (prefs: NotifyPref) => void;
}) {
  const { state, subscribe, unsubscribe } = usePushNotifications();

  // Service Worker'ı kaydet
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  const isEnabled = state === "granted";
  const isLoading = state === "loading";
  const isDenied = state === "denied";
  const isUnsupported = state === "unsupported";

  const NOTIFY_TYPES: { key: keyof Omit<NotifyPref, "hour">; label: string; desc: string }[] = [
    { key: "streak", label: "Streak Uyarısı", desc: "Bugün commit atmadıysan akşam hatırlatır" },
    { key: "goal", label: "Hedef İlerlemesi", desc: "Hedefe yaklaştığında bildirim alırsın" },
    { key: "badge", label: "Yeni Rozet", desc: "Rozet kazandığında anlık bildirim" },
    { key: "summary", label: "Haftalık Özet", desc: "Pazartesi sabahı haftanın özetini gönderir" },
  ];

  const HOURS = Array.from({ length: 12 }, (_, i) => 8 + i * 2); // 08:00 - 18:00 ve üstü

  return (
    <div className="space-y-4">
      {/* Ana aç/kapat */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          {isLoading ? (
            <Loader2 size={18} className="text-zinc-500 animate-spin shrink-0" />
          ) : isEnabled ? (
            <BellRing size={18} className="shrink-0" style={{ color: accent }} />
          ) : (
            <BellOff size={18} className="text-zinc-500 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-100">
              {isEnabled ? "Bildirimler Açık" : "Bildirimleri Aç"}
            </p>
            <p className="text-xs text-zinc-500 truncate">
              {isUnsupported
                ? "Bu tarayıcı push bildirimleri desteklemiyor"
                : isDenied
                ? "Tarayıcı izni engellendi — site ayarlarından aç"
                : isEnabled
                ? "Bildirimler etkin"
                : "İzin ver ve bildirim al"}
            </p>
          </div>
        </div>

        {isUnsupported || isDenied ? (
          <AlertTriangle size={16} className="text-amber-500 shrink-0" />
        ) : isLoading ? null : (
          <Toggle
            checked={isEnabled}
            onChange={(v) => (v ? subscribe() : unsubscribe())}
            accent={accent}
          />
        )}
      </div>

      {/* Engellendi uyarısı */}
      {isDenied && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2.5">
          <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300 leading-relaxed">
            Bildirim izni engellendi. Tarayıcının adres çubuğundaki kilit ikonuna tıklayarak{" "}
            <strong>Bildirimler → İzin Ver</strong> seçeneğini aktif et.
          </p>
        </div>
      )}

      {/* Bildirim tipleri — sadece açıkken göster */}
      {isEnabled && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            Bildirim Tipleri
          </p>

          {NOTIFY_TYPES.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center gap-3 justify-between">
              <div className="min-w-0">
                <p className="text-sm text-zinc-200 font-medium">{label}</p>
                <p className="text-xs text-zinc-600 leading-snug">{desc}</p>
              </div>
              <Toggle
                checked={prefs[key]}
                onChange={(v) => onPrefsChange({ ...prefs, [key]: v })}
                accent={accent}
              />
            </div>
          ))}

          {/* Saat seçimi */}
          {prefs.streak && (
            <div className="flex items-center gap-3 justify-between pt-1">
              <div>
                <p className="text-sm text-zinc-200 font-medium">Uyarı Saati</p>
                <p className="text-xs text-zinc-600">Streak uyarısı bu saatte gönderilir</p>
              </div>
              <select
                value={prefs.hour}
                onChange={(e) => onPrefsChange({ ...prefs, hour: Number(e.target.value) })}
                className="rounded-lg bg-zinc-800 border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-zinc-500"
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, "0")}:00
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Test bildirimi */}
      {isEnabled && (
        <button
          onClick={async () => {
            const reg = await navigator.serviceWorker.ready;
            await reg.showNotification("Dev Analytics", {
              body: "Bildirimler düzgün çalışıyor! 🎉",
              icon: "/favicon.ico",
              tag: "test",
            });
          }}
          className="flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-all"
        >
          <Bell size={13} />
          Test Bildirimi Gönder
        </button>
      )}
    </div>
  );
}
