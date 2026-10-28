"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";

/* ── Sync ─────────────────────────────────────────────────────────────── */

export type SyncState = {
  status: "idle" | "syncing" | "done" | "error";
  message: string | null;
  current?: number;
  total?: number;
  lastSyncedAt: string | null;
  error: string | null;
};

type ShellCtx = {
  sync: SyncState;
  startSync: (opts?: { quiet?: boolean }) => void;
  editing: boolean;
  setEditing: (v: boolean | ((p: boolean) => boolean)) => void;
  editable: boolean;
  setEditable: (v: boolean) => void;
  paletteOpen: boolean;
  openPalette: (section?: string) => void;
  closePalette: () => void;
  paletteSection: string | null;
  helpOpen: boolean;
  setHelpOpen: (v: boolean) => void;
  toast: (msg: string, tone?: "ok" | "err") => void;
  toasts: { id: number; msg: string; tone: "ok" | "err" }[];
  loggedIn: boolean;
};

const Ctx = createContext<ShellCtx | null>(null);

export function useShell() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useShell must be used inside <ShellProvider>");
  return c;
}

/** Safe variant for components that may render outside the shell. */
export function useShellOptional() {
  return useContext(Ctx);
}

const ONE_HOUR = 60 * 60 * 1000;

export function ShellProvider({
  children,
  lastSyncedAt,
  loggedIn,
}: {
  children: ReactNode;
  lastSyncedAt: string | null;
  loggedIn: boolean;
}) {
  const router = useRouter();
  const { lang } = useLanguage();
  const [sync, setSync] = useState<SyncState>({
    status: "idle",
    message: null,
    lastSyncedAt,
    error: null,
  });
  const [editing, setEditing] = useState(false);
  const [editable, setEditable] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteSection, setPaletteSection] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; msg: string; tone: "ok" | "err" }[]>([]);
  const esRef = useRef<EventSource | null>(null);
  const tid = useRef(0);

  const toast = useCallback((msg: string, tone: "ok" | "err" = "ok") => {
    const id = ++tid.current;
    setToasts((t) => [...t.slice(-2), { id, msg, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const startSync = useCallback(
    ({ quiet = false }: { quiet?: boolean } = {}) => {
      if (esRef.current) return;
      setSync((s) => ({
        ...s,
        status: "syncing",
        error: null,
        message: lang === "en" ? "Starting…" : "Başlatılıyor…",
        current: undefined,
        total: undefined,
      }));
      const es = new EventSource("/api/sync");
      esRef.current = es;
      let finished = false;

      es.addEventListener("progress", (e) => {
        try {
          const d = JSON.parse((e as MessageEvent).data);
          setSync((s) => ({ ...s, message: d.message ?? s.message, current: d.current, total: d.total }));
        } catch {
          /* malformed event */
        }
      });
      es.addEventListener("done", () => {
        finished = true;
        es.close();
        esRef.current = null;
        setSync((s) => ({ ...s, status: "done", message: null, lastSyncedAt: new Date().toISOString() }));
        if (!quiet) toast(lang === "en" ? "Sync complete" : "Senkronizasyon tamamlandı");
        router.refresh();
        setTimeout(() => setSync((s) => (s.status === "done" ? { ...s, status: "idle" } : s)), 2500);
      });
      const fail = (msg?: string) => {
        if (finished) return;
        finished = true;
        es.close();
        esRef.current = null;
        const m = msg ?? (lang === "en" ? "Sync failed. Check your connection and try again." : "Senkronizasyon başarısız. Bağlantını kontrol edip tekrar dene.");
        setSync((s) => ({ ...s, status: "error", message: null, error: m }));
        if (!quiet) toast(m, "err");
      };
      es.addEventListener("error", (e) => {
        try {
          const d = JSON.parse((e as MessageEvent).data);
          fail(d.message);
        } catch {
          fail();
        }
      });
      es.onerror = () => fail();
    },
    [lang, router, toast],
  );

  // Background refresh when data is older than an hour (replaces <AutoSync/>).
  const autoRan = useRef(false);
  useEffect(() => {
    if (autoRan.current || !loggedIn || !lastSyncedAt) return;
    autoRan.current = true;
    if (Date.now() - new Date(lastSyncedAt).getTime() > ONE_HOUR) startSync({ quiet: true });
  }, [loggedIn, lastSyncedAt, startSync]);

  useEffect(() => () => esRef.current?.close(), []);

  const openPalette = useCallback((section?: string) => {
    setPaletteSection(section ?? null);
    setPaletteOpen(true);
  }, []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);

  const value = useMemo<ShellCtx>(
    () => ({
      sync,
      startSync,
      editing,
      setEditing,
      editable,
      setEditable,
      paletteOpen,
      openPalette,
      closePalette,
      paletteSection,
      helpOpen,
      setHelpOpen,
      toast,
      toasts,
      loggedIn,
    }),
    [sync, startSync, editing, editable, paletteOpen, openPalette, closePalette, paletteSection, helpOpen, toast, toasts, loggedIn],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
