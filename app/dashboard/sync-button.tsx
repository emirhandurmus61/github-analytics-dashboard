"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = "idle" | "loading" | "done" | "error";

type ProgressEvent = {
  step: string;
  message: string;
  total?: number;
  current?: number;
};

export default function SyncButton({ label = "Senkronizasyonu Başlat" }: { label?: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState<ProgressEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSync() {
    setStatus("loading");
    setError(null);
    setProgress({ step: "start", message: "Başlatılıyor..." });

    const es = new EventSource("/api/sync");

    es.addEventListener("progress", (e) => {
      const data: ProgressEvent = JSON.parse(e.data);
      setProgress(data);
    });

    es.addEventListener("done", () => {
      es.close();
      setStatus("done");
      setProgress(null);
      setTimeout(() => router.refresh(), 800);
    });

    es.addEventListener("error", (e) => {
      es.close();
      try {
        const data = JSON.parse((e as MessageEvent).data);
        setError(data.message);
      } catch {
        setError("Senkronizasyon sırasında hata oluştu");
      }
      setStatus("error");
    });

    es.onerror = () => {
      if (status !== "done") {
        es.close();
        setError("Bağlantı kesildi");
        setStatus("error");
      }
    };
  }

  if (status === "done") {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-400">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Tamamlandı!
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleSync}
        disabled={status === "loading"}
        className="flex items-center gap-2 rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-900 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "loading" ? (
          <>
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Senkronize ediliyor...
          </>
        ) : label}
      </button>

      {status === "loading" && progress && (
        <div className="w-72 rounded-xl border border-zinc-800 bg-zinc-900 p-3">
          <p className="mb-2 text-xs text-zinc-400">{progress.message}</p>
          {progress.total && progress.current !== undefined && (
            <>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
              <p className="mt-1 text-right text-xs text-zinc-600">
                {progress.current}/{progress.total}
              </p>
            </>
          )}
        </div>
      )}

      {status === "error" && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
