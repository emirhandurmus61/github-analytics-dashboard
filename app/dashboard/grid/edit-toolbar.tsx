"use client";

import { useState } from "react";
import { Check, LayoutTemplate, Plus, RotateCcw, X } from "lucide-react";
import { getWidgetLabel } from "@/lib/widget-config";
import { useLanguage } from "@/lib/i18n";
import { useShell } from "@/components/shell/shell-context";
import { cn, type Lang } from "@/lib/ui/format";
import { Kbd } from "@/components/ui/primitives";
import { useGrid } from "./state";

/* ── Toolbar shown while editing ─────────────────────────────────────── */

export function EditToolbar({ onReset }: { onReset: () => void }) {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const { configs, toggleVisible, compact } = useGrid();
  const { setEditing } = useShell();
  const [tray, setTray] = useState(false);
  const hidden = configs.filter((c) => !c.visible);

  return (
    <div className={cn("fixed inset-x-0 z-50 flex justify-center px-3 pointer-events-none", compact ? "bottom-[calc(env(safe-area-inset-bottom)+12px)]" : "bottom-10")}>
      <div className="pointer-events-auto surface-pop w-full max-w-2xl anim-pop">
        {tray && (
          <div className="border-b border-line p-2.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] font-medium text-ink-2">
                {l === "en" ? `Hidden cards (${hidden.length})` : `Gizli kartlar (${hidden.length})`}
              </span>
              <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={() => setTray(false)} aria-label={l === "en" ? "Close" : "Kapat"}>
                <X />
              </button>
            </div>
            {hidden.length === 0 ? (
              <p className="text-[12px] text-ink-3 py-2">{l === "en" ? "Every card is on the board." : "Tüm kartlar panoda."}</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-auto">
                {hidden.map((c) => (
                  <button key={c.id} type="button" className="btn btn-sm" onClick={() => toggleVisible(c.id)}>
                    <Plus /> {getWidgetLabel(c.id, l)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 p-2">
          <button type="button" className="btn btn-primary" onClick={() => setEditing(false)}>
            <Check /> {l === "en" ? "Done" : "Bitti"}
          </button>
          <span className="hidden sm:flex items-center gap-1.5 text-[12px] text-ink-3 min-w-0 truncate">
            {compact
              ? l === "en"
                ? "Pick S/M/L/XL, move with arrows"
                : "S/M/L/XL seç, oklarla taşı"
              : l === "en"
                ? "Drag to move · pull an edge to resize"
                : "Sürükle taşı · kenarı çek boyutlandır"}
            {!compact && (
              <>
                <Kbd>Esc</Kbd>
              </>
            )}
          </span>
          <button type="button" className="btn btn-sm ml-auto" onClick={() => setTray((v) => !v)} aria-expanded={tray}>
            <LayoutTemplate /> {l === "en" ? "Hidden" : "Gizli"}
            <span className="font-mono text-ink-3">{hidden.length}</span>
          </button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onReset} title={l === "en" ? "Restore the default layout" : "Varsayılan düzene dön"}>
            <RotateCcw /> <span className="hidden sm:inline">{l === "en" ? "Reset" : "Sıfırla"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
