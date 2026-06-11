"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Dashboard mount'ta son sync 1 saatten eskiyse sessizce arka planda sync eder.
// Kullanıcı hiçbir şey görmez — streak ve veriler her zaman güncel kalır.

const ONE_HOUR_MS = 60 * 60 * 1000;

export default function AutoSync({ lastSyncedAt }: { lastSyncedAt: string | null }) {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    // İlk sync yapılmamışsa dokunma — kullanıcı manuel başlatmalı
    if (!lastSyncedAt) return;

    const age = Date.now() - new Date(lastSyncedAt).getTime();
    if (age < ONE_HOUR_MS) return; // 1 saatten yeniyse gerek yok

    // Arka planda SSE bağlantısı aç — done gelince sayfayı yenile
    const es = new EventSource("/api/sync");

    es.addEventListener("done", () => {
      es.close();
      router.refresh();
    });

    es.addEventListener("error", () => {
      es.close(); // sessizce kapat, kullanıcıya gösterme
    });

    es.onerror = () => {
      es.close();
    };

    // Component unmount olursa bağlantıyı kes
    return () => es.close();
  }, [lastSyncedAt, router]);

  return null; // UI yok — tamamen sessiz
}
