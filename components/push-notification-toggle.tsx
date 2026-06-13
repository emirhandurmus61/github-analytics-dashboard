"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff, BellRing, Loader2, AlertTriangle, XCircle } from "lucide-react";
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
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  accent: string;
  disabled?: boolean;
}) {
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      className="relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0"
      style={{
        backgroundColor: checked ? accent : "#3f3f46",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div
        className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200"
        style={{ left: checked ? "calc(100% - 18px)" : "2px" }}
      />
    </div>
  );
}

const NOTIFY_TYPES: { key: keyof Omit<NotifyPref, "hour">; label: string; desc: string }[] = [
  { key: "streak", label: "Streak Uyarısı", desc: "Bugün commit atmadıysan akşam hatırlatır" },
  { key: "goal", label: "Hedef İlerlemesi", desc: "Hedefe yaklaştığında bildirim alırsın" },
  { key: "badge", label: "Yeni Rozet", desc: "Rozet kazandığında anlık bildirim" },
  { key: "summary", label: "Haftalık Özet", desc: "Pazartesi sabahı haftanın özetini gönderir" },
];

const HOURS = [8, 10, 12, 14, 16, 18, 20, 22];

export default function PushNotificationToggle({
  accent,
  prefs,
  onPrefsChange,
}: {
  accent: string;
  prefs: NotifyPref;
  onPrefsChange: (prefs: NotifyPref) => void;
}) {
  const { state, subscribe, unsubscribe, error } = usePushNotifications();

  const isEnabled = state === "granted";
  const isLoading = state === "loading";
  const isDenied = state === "denied";
  const isUnsupported = state === "unsupported";

  // Push API sadece HTTPS veya localhost'ta çalışır — state "unsupported" değilse ve
  // state artık "loading" değilse kontrol et (hydration mismatch'i önlemek için)
  const [isInsecure, setIsInsecure] = useState(false);
  useEffect(() => {
    setIsInsecure(
      location.protocol !== "https:"
      && location.hostname !== "localhost"
      && location.hostname !== "127.0.0.1"
    );
  }, []);

  return (
    <div className="space-y-4">
      {/* HTTPS uyarısı */}
      {isInsecure && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2.5">
          <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300 leading-relaxed">
            Push bildirimleri yalnızca HTTPS bağlantısında çalışır. Lütfen uygulamayı deploy edilmiş Vercel URL'inden aç.
          </p>
        </div>
      )}

      {/* Ana aç/kapat satırı */}
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
            <p className="text-xs text-zinc-500">
              {isUnsupported
                ? "Bu tarayıcı push bildirimleri desteklemiyor"
                : isDenied
                ? "Tarayıcı izni engellendi"
                : isEnabled
                ? "Bildirimler etkin"
                : "Toggle'a tıklayarak izin ver"}
            </p>
          </div>
        </div>

        {isUnsupported ? (
          <AlertTriangle size={16} className="text-amber-500 shrink-0" />
        ) : isDenied ? (
          <AlertTriangle size={16} className="text-amber-500 shrink-0" />
        ) : isLoading ? (
          <div className="w-9 h-5 rounded-full bg-zinc-700 animate-pulse shrink-0" />
        ) : (
          <Toggle
            checked={isEnabled}
            onChange={(v) => (v ? subscribe() : unsubscribe())}
            accent={accent}
          />
        )}
      </div>

      {/* Hata mesajı */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5">
          <XCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-xs text-red-400 font-medium">Bildirim açılamadı</p>
            <p className="text-[11px] text-red-500 mt-0.5 break-all">{error}</p>
            {error.includes("push_subscriptions") || error.includes("500") ? (
              <p className="text-[11px] text-red-400 mt-1">
                Veritabanı tablosu eksik — Supabase Dashboard'dan{" "}
                <code className="bg-red-500/20 px-1 rounded">schema_v11.sql</code>'i çalıştır.
              </p>
            ) : null}
          </div>
        </div>
      )}

      {/* Tarayıcı engeli uyarısı */}
      {isDenied && (
        <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2.5">
          <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300 leading-relaxed">
            Bildirim izni engellendi. Tarayıcının adres çubuğundaki{" "}
            <strong>kilit ikonu → Bildirimler → İzin Ver</strong> seçeneğini aktif et, sonra sayfayı yenile.
          </p>
        </div>
      )}

      {/* Bildirim tipleri — sadece açıkken */}
      {isEnabled && (
        <div className="space-y-3">
          <p className="text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">
            Bildirim Tipleri
          </p>
          {NOTIFY_TYPES.map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-zinc-200 font-medium">{label}</p>
                <p className="text-[11px] text-zinc-600 leading-snug">{desc}</p>
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
            <div className="flex items-center justify-between gap-3 pt-1 border-t border-zinc-800">
              <div>
                <p className="text-sm text-zinc-200 font-medium">Uyarı Saati</p>
                <p className="text-[11px] text-zinc-600">Streak uyarısı bu saatte gönderilir</p>
              </div>
              <select
                value={prefs.hour}
                onChange={(e) => onPrefsChange({ ...prefs, hour: Number(e.target.value) })}
                className="rounded-lg bg-zinc-800 border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-200 outline-none focus:border-zinc-500"
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>
                ))}
              </select>
            </div>
          )}

          {/* Test bildirimi */}
          <button
            onClick={async () => {
              try {
                const reg = await navigator.serviceWorker.ready;
                await reg.showNotification("Dev Analytics", {
                  body: "Bildirimler düzgün çalışıyor! 🎉",
                  icon: "/favicon.ico",
                  tag: "test",
                });
              } catch {
                alert("Bildirim gönderilemedi — tarayıcı izinlerini kontrol et.");
              }
            }}
            className="flex items-center gap-2 rounded-xl border border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-400 hover:border-zinc-500 hover:text-zinc-200 transition-all"
          >
            <Bell size={13} />
            Test Bildirimi Gönder
          </button>
        </div>
      )}
    </div>
  );
}
