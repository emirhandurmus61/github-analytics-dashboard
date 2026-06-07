"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

export type DateRange = "30" | "90" | "365";

export default function Filters({
  hideForks,
  dateRange,
}: {
  hideForks: boolean;
  dateRange: DateRange;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(key, value);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="flex items-center gap-3">
      {/* Tarih aralığı */}
      <div className="flex rounded-lg border border-zinc-800 bg-zinc-900 p-0.5">
        {(["30", "90", "365"] as DateRange[]).map((d) => (
          <button
            key={d}
            onClick={() => setParam("range", d)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              dateRange === d
                ? "bg-zinc-700 text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {d === "365" ? "1 Yıl" : `${d} Gün`}
          </button>
        ))}
      </div>

      {/* Fork filtresi */}
      <button
        onClick={() => setParam("hideForks", hideForks ? "0" : "1")}
        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
          hideForks
            ? "border-zinc-600 bg-zinc-800 text-zinc-200"
            : "border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-zinc-300"
        }`}
      >
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
        </svg>
        Fork'ları Gizle
      </button>
    </div>
  );
}
