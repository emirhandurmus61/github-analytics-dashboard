"use client";

import { useState } from "react";
import { Eye, Copy, Check, ExternalLink } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Panel } from "@/components/ui/primitives";
import { Glance } from "@/components/ui/glance";
import { useWidgetSize } from "@/components/ui/widget-size";
import { fmtInt, type Lang } from "@/lib/ui/format";

export default function ProfileViewsCard({ thisWeek, total, username }: { thisWeek: number; total: number; username: string }) {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const { shape } = useWidgetSize();
  const [copied, setCopied] = useState(false);
  const path = `/u/${username}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${path}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  };

  const link = (
    <div className="flex items-center gap-1.5 rounded-[var(--r-control)] border border-line bg-canvas pl-2.5 pr-1 h-8 min-w-0">
      <span className="truncate font-mono text-[12px] text-ink-3">devboard{path}</span>
      <button type="button" className="btn btn-ghost btn-sm btn-icon ml-auto shrink-0" onClick={copy} aria-label={l === "en" ? "Copy profile link" : "Profil linkini kopyala"}>
        {copied ? <Check className="text-good" /> : <Copy />}
      </button>
      <a href={path} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm btn-icon shrink-0" aria-label={l === "en" ? "Open profile" : "Profili aç"}>
        <ExternalLink />
      </a>
    </div>
  );

  return (
    <Panel title={l === "en" ? "Profile visits" : "Profil ziyaretleri"} icon={Eye} meta={l === "en" ? "7 days" : "7 gün"}>
      {shape === "glance" && (
        <Glance
          figure={fmtInt(thisWeek, l)}
          unit={l === "en" ? "this week" : "bu hafta"}
          sub={`${fmtInt(total, l)} ${l === "en" ? "all time" : "toplam"}`}
          viz={
            thisWeek === 0 ? (
              <button type="button" onClick={copy} className="text-[11.5px] text-accent hover:underline text-left">
                {copied ? (l === "en" ? "Link copied" : "Link kopyalandı") : l === "en" ? "Copy link to share" : "Paylaşmak için linki kopyala"}
              </button>
            ) : undefined
          }
        />
      )}
      {shape !== "glance" && (
        <div className="flex h-full flex-col gap-3">
          <div className="flex items-end gap-6">
            <div>
              <div className="figure text-[38px]">{fmtInt(thisWeek, l)}</div>
              <div className="label mt-1.5">{l === "en" ? "visits this week" : "bu haftaki ziyaret"}</div>
            </div>
            <div>
              <div className="figure text-[22px] !text-ink-2">{fmtInt(total, l)}</div>
              <div className="label mt-1.5">{l === "en" ? "all time" : "toplam"}</div>
            </div>
          </div>
          <div className="mt-auto flex flex-col gap-1.5">
            {thisWeek === 0 && <p className="text-[12px] text-ink-3">{l === "en" ? "No visits yet. Put the link in your GitHub bio." : "Henüz ziyaret yok. Linki GitHub bio'na ekle."}</p>}
            {link}
          </div>
        </div>
      )}
    </Panel>
  );
}
