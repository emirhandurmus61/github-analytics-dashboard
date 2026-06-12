"use client";

import { useState } from "react";
import { Download, Share2, Check, ExternalLink } from "lucide-react";
import { useThemeColors } from "@/components/theme-provider";

type Format = "og" | "square" | "twitter";

const FORMATS: { id: Format; label: string; size: string }[] = [
  { id: "og", label: "LinkedIn / OG", size: "1200×630" },
  { id: "square", label: "Instagram", size: "600×600" },
  { id: "twitter", label: "Twitter / X", size: "1500×500" },
];

export default function DeveloperCard({ username }: { username: string }) {
  const theme = useThemeColors();
  const [format, setFormat] = useState<Format>("og");
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const cardUrl = `/api/card/${username}?format=${format}`;
  const tweetText = encodeURIComponent(
    `GitHub aktivitelerime bakın! 🚀\nDev Analytics üzerinde istatistiklerinizi görün`
  );
  const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(`https://devanalytics.app/u/${username}`)}`;

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(cardUrl);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${username}-devcard-${format}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setDownloading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(`${window.location.origin}${cardUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <Share2 className="w-4 h-4 text-zinc-500" />
          <h2 className="text-sm font-medium text-zinc-400">Developer Card</h2>
        </div>
        <a
          href={`/u/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border transition-colors hover:opacity-80"
          style={{ borderColor: theme.accentBorder, color: theme.accent, backgroundColor: theme.accentBg }}
        >
          <ExternalLink className="w-3 h-3" />
          Profil
        </a>
      </div>

      {/* Card preview */}
      <div className="flex-1 min-h-0 flex flex-col gap-3">
        {/* Live preview — sabit yükseklik, görsel içine sığar */}
        <div className="relative w-full rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 flex items-center justify-center" style={{ height: 160 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={cardUrl}
            src={cardUrl}
            alt="Developer Card"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>

        {/* Format seçici */}
        <div className="flex rounded-lg border border-zinc-800 bg-zinc-950 p-0.5 shrink-0">
          {FORMATS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFormat(f.id)}
              className={`flex-1 rounded-md px-1.5 py-1 text-[11px] font-medium transition-colors flex flex-col items-center gap-0.5 ${
                format === f.id
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <span>{f.label}</span>
              <span className="text-[9px] text-zinc-600 tabular-nums">{f.size}</span>
            </button>
          ))}
        </div>

        {/* Aksiyon butonları */}
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: theme.accent, color: "#09090b" }}
          >
            <Download className="w-3.5 h-3.5" />
            {downloading ? "İndiriliyor..." : "PNG İndir"}
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Kopyalandı</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                Kopyala
              </>
            )}
          </button>
        </div>

        {/* Twitter paylaş */}
        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-medium border border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.726-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Twitter&apos;da Paylaş
        </a>
      </div>
    </div>
  );
}
