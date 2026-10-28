"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";

export type PushState = "unsupported" | "loading" | "denied" | "granted" | "unsubscribed";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function getSWRegistration(): Promise<ServiceWorkerRegistration> {
  // Önce var olanı kontrol et
  const existing = await navigator.serviceWorker.getRegistration("/sw.js");
  if (existing) return existing;
  // Yoksa kaydet
  return navigator.serviceWorker.register("/sw.js");
}

const noop = () => () => {};

/** What the browser allows before any async work: "ok" means ask the SW. */
function capability(): "unsupported" | "denied" | "ok" {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  return "ok";
}

export function usePushNotifications() {
  const cap = useSyncExternalStore(noop, capability, () => "pending" as const);
  const [asyncState, setState] = useState<PushState>("loading");
  const state: PushState = cap === "unsupported" ? "unsupported" : cap === "denied" && asyncState === "loading" ? "denied" : asyncState;
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cap !== "ok") return;
    getSWRegistration()
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (sub) { setSubscription(sub); setState("granted"); }
        else setState("unsubscribed");
      })
      .catch(() => setState("unsubscribed"));
  }, [cap]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    setError(null);
    setState("loading");
    try {
      // 1. İzin iste
      const permission = await Notification.requestPermission();
      if (permission === "denied") { setState("denied"); return false; }
      if (permission !== "granted") { setState("unsubscribed"); return false; }

      // 2. SW kaydet — timeout ile sar (bazı tarayıcılarda takılabilir)
      const reg = await Promise.race([
        getSWRegistration(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Service Worker 10 saniyede yüklenemedi")), 10_000)
        ),
      ]);

      // 3. Push subscription oluştur
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error("VAPID public key eksik — .env.local kontrol et");

      const sub = await Promise.race([
        reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as ArrayBuffer,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Push subscription zaman aşımına uğradı")), 10_000)
        ),
      ]);

      // 4. Sunucuya kaydet
      const res = await fetch("/api/push-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `API hatası: ${res.status}`);
      }

      setSubscription(sub);
      setState("granted");
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setState("unsubscribed");
      return false;
    }
  }, []);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setError(null);
    setState("loading");
    try {
      if (subscription) {
        await fetch("/api/push-unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
        setSubscription(null);
      }
      setState("unsubscribed");
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setState("granted");
      return false;
    }
  }, [subscription]);

  return { state, subscription, subscribe, unsubscribe, error };
}
