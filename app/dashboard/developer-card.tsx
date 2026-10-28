"use client";

import { useState } from "react";
import { Download, Link2, Check, IdCard } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Panel, Seg } from "@/components/ui/primitives";
import { useWidgetSize } from "@/components/ui/widget-size";
import { cn, type Lang } from "@/lib/ui/format";

type Format = "og" | "square" | "twitter";

const FORMATS: { id: Format; label: string; size: string; ratio: string }[] = [
  { id: "og", label: "OG", size: "1200×630", ratio: "1200/630" },
  { id: "square", label: "1:1", size: "600×600", ratio: "1/1" },
  { id: "twitter", label: "X", size: "1500×500", ratio: "3/1" },
];

export default function DeveloperCard({ username }: { username: string }) {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const { shape } = useWidgetSize();
  const [format, setFormat] = useState<Format>("og");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState<string | null>(null);
  const url = `/api/card/${username}?format=${format}`;
  const f = FORMATS.find((x) => x.id === format)!;

  async function download() {
    setBusy(true);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${username}-devboard-${format}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setBusy(false);
    }
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  }

  const preview = (
    <div className="relative h-full w-full min-h-[64px] overflow-hidden rounded-[var(--r-control)] border border-line bg-canvas">
      {loaded !== url && <div className="skel absolute inset-0" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img key={url} src={url} alt={l === "en" ? "Developer card preview" : "Developer card önizlemesi"} onLoad={() => setLoaded(url)} className={cn("absolute inset-0 h-full w-full object-contain transition-opacity", loaded === url ? "opacity-100" : "opacity-0")} />
    </div>
  );

  const actions = (
    <div className="flex gap-1.5">
      <button type="button" className="btn btn-primary btn-sm flex-1" onClick={download} disabled={busy}>
        <Download /> {busy ? (l === "en" ? "Saving…" : "Kaydediliyor…") : "PNG"}
      </button>
      <button type="button" className="btn btn-sm" onClick={copy} aria-label={l === "en" ? "Copy image link" : "Görsel linkini kopyala"}>
        {copied ? <Check className="text-good" /> : <Link2 />}
        <span className="hidden @min-[260px]:inline">{copied ? (l === "en" ? "Copied" : "Kopyalandı") : l === "en" ? "Link" : "Link"}</span>
      </button>
      <a
        className="btn btn-sm btn-icon"
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(l === "en" ? "My year in commits, on Devboard" : "Commit yılım, Devboard'da")}&url=${encodeURIComponent(`https://devboard.app/u/${username}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={l === "en" ? "Share on X" : "X'te paylaş"}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.726-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>
    </div>
  );

  const seg = <Seg size="sm" value={format} onChange={setFormat} options={FORMATS.map((x) => ({ value: x.id, label: <span className="font-mono">{x.label}</span>, title: x.size }))} />;

  return (
    <Panel title="Developer Card" icon={IdCard} meta={shape === "glance" ? undefined : f.size}>
      {shape === "glance" && (
        <div className="flex h-full flex-col gap-2">
          <div className="flex-1 min-h-0">{preview}</div>
          <button type="button" className="btn btn-sm w-full" onClick={download} disabled={busy}>
            <Download /> PNG
          </button>
        </div>
      )}
      {shape === "strip" && (
        <div className="flex h-full items-center gap-4">
          <div className="h-full w-[48%] shrink-0">{preview}</div>
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            {seg}
            {actions}
          </div>
        </div>
      )}
      {(shape === "column" || shape === "block") && (
        <div className="flex h-full flex-col gap-2.5">
          <div className="flex-1 min-h-0">{preview}</div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            {seg}
            <span className="font-mono text-[11px] text-ink-4">{f.size}</span>
          </div>
          {actions}
        </div>
      )}
    </Panel>
  );
}
