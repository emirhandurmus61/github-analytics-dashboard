"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** true after hydration, false on the server and during the hydration pass. */
export function useIsClient() {
  return useSyncExternalStore(noop, () => true, () => false);
}

/** window.location.origin on the client, "" on the server. */
export function useOrigin() {
  return useSyncExternalStore(noop, () => window.location.origin, () => "");
}

/** Live media query result; `serverValue` is used for SSR and hydration. */
export function useMediaQuery(query: string, serverValue = false) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => serverValue,
  );
}

/** Wall clock that ticks every `ms`; null on the server. */
export function useNow(ms = 30_000) {
  return useSyncExternalStore(
    (cb) => {
      const t = setInterval(cb, ms);
      return () => clearInterval(t);
    },
    () => Math.floor(Date.now() / ms) * ms,
    () => null,
  );
}
