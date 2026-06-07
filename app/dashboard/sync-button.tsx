"use client";

import { useState } from "react";
import { startSync } from "@/app/actions/sync";

export default function SyncButton({ label = "Senkronizasyonu Başlat" }: { label?: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    setStatus("loading");
    setError(null);
    const result = await startSync();
    if (result.success) {
      setStatus("done");
    } else {
      setStatus("error");
      setError(result.error ?? "Bilinmeyen hata");
    }
  }

  if (status === "done") {
    return (
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
          <svg className="h-6 w-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm text-emerald-400">Senkronizasyon tamamlandı!</p>
        <p className="text-xs text-zinc-500">Sayfa yenileniyor...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={handleSync}
        disabled={status === "loading"}
        className="flex items-center gap-2.5 rounded-xl bg-zinc-100 px-6 py-2.5 text-sm font-semibold text-zinc-900 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "loading" ? (
          <>
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Senkronize ediliyor...
          </>
        ) : (
          label
        )}
      </button>
      {status === "loading" && (
        <p className="text-xs text-zinc-600">
          Repolar ve commitler çekiliyor, bu birkaç dakika sürebilir...
        </p>
      )}
      {status === "error" && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
