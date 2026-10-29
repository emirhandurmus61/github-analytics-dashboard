"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TZ_COOKIE } from "@/lib/tz";

/** Reports the browser's timezone to the server (cookie); refreshes once if it changed. */
export default function TzSync() {
  const router = useRouter();
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!tz) return;
      const current = document.cookie.split("; ").find((c) => c.startsWith(`${TZ_COOKIE}=`))?.split("=")[1];
      if (current === encodeURIComponent(tz)) return;
      document.cookie = `${TZ_COOKIE}=${encodeURIComponent(tz)}; path=/; max-age=31536000; samesite=lax`;
      router.refresh();
    } catch {
      /* cookies blocked: server falls back to the geo header / UTC */
    }
  }, [router]);
  return null;
}
