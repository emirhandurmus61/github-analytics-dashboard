"use client";

import { useState, useEffect, useCallback } from "react";

export type PushState = "unsupported" | "loading" | "denied" | "granted" | "unsubscribed";

async function registerSW(): Promise<ServiceWorkerRegistration> {
  const reg = await navigator.serviceWorker.register("/sw.js");
  // Yeni SW'yi hemen aktif et
  if (reg.installing) {
    await new Promise<void>((resolve) => {
      reg.installing!.addEventListener("statechange", function handler() {
        if (this.state === "activated") { this.removeEventListener("statechange", handler); resolve(); }
      });
    });
  }
  return navigator.serviceWorker.ready;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushState>("loading");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setState("denied");
      return;
    }

    // Mevcut SW üzerinden abonelik kontrol et
    navigator.serviceWorker.getRegistration("/sw.js").then((reg) => {
      if (!reg) { setState("unsubscribed"); return; }
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) { setSubscription(sub); setState("granted"); }
        else setState("unsubscribed");
      });
    }).catch(() => setState("unsubscribed"));
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    setError(null);
    setState("loading");
    try {
      // İzin iste
      const permission = await Notification.requestPermission();
      if (permission === "denied") { setState("denied"); return false; }
      if (permission !== "granted") { setState("unsubscribed"); return false; }

      // SW'yi kaydet ve hazır olmasını bekle
      const reg = await registerSW();

      // Mevcut aboneliği iptal et (stale olabilir)
      const existing = await reg.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();

      // Yeni abonelik oluştur
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error("VAPID public key eksik");

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as unknown as ArrayBuffer,
      });

      // Sunucuya kaydet
      const res = await fetch("/api/push-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Sunucu hatası: ${res.status}`);
      }

      setSubscription(sub);
      setState("granted");
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Bilinmeyen hata";
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
      const msg = err instanceof Error ? err.message : "Bilinmeyen hata";
      setError(msg);
      setState("granted");
      return false;
    }
  }, [subscription]);

  return { state, subscription, subscribe, unsubscribe, error };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
