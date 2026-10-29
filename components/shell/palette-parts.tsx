"use client";

import { type ComponentType, type ReactNode } from "react";
import { SCHEMES, type SchemeId } from "@/lib/ui/schemes";

export type Icon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

export type Cmd = {
  id: string;
  group: string;
  label: string;
  keywords?: string;
  icon?: Icon;
  visual?: ReactNode;
  hint?: ReactNode;
  current?: boolean;
  preview?: () => void;
  run: () => void;
};

/** Subsequence match. Returns score (higher is better) and matched indices. */
export function match(q: string, text: string): { score: number; idx: number[] } | null {
  if (!q) return { score: 0, idx: [] };
  const t = text.toLocaleLowerCase("tr");
  const s = q.toLocaleLowerCase("tr");
  const direct = t.indexOf(s);
  if (direct >= 0) {
    return { score: 100 - direct + (direct === 0 ? 50 : 0), idx: Array.from({ length: s.length }, (_, i) => direct + i) };
  }
  const idx: number[] = [];
  let ti = 0;
  for (const ch of s) {
    if (ch === " ") continue;
    const at = t.indexOf(ch, ti);
    if (at < 0) return null;
    idx.push(at);
    ti = at + 1;
  }
  const spread = idx[idx.length - 1] - idx[0];
  return { score: 40 - spread, idx };
}

export function Highlight({ text, idx }: { text: string; idx: number[] }) {
  if (!idx.length) return <>{text}</>;
  const set = new Set(idx);
  return (
    <>
      {Array.from(text).map((c, i) =>
        set.has(i) ? (
          <span key={i} className="text-accent font-semibold">
            {c}
          </span>
        ) : (
          <span key={i}>{c}</span>
        ),
      )}
    </>
  );
}

export function SchemeSwatch({ id, size = 14 }: { id: SchemeId; size?: number }) {
  const s = SCHEMES[id];
  return (
    <span
      className="inline-grid grid-cols-2 overflow-hidden shrink-0 border"
      style={{ width: size * 1.6, height: size, borderColor: s.line2, borderRadius: 3, background: s.bg[1] }}
      aria-hidden
    >
      <span style={{ background: s.bg[0] }} />
      <span className="grid grid-rows-2">
        <span style={{ background: s.hue.green }} />
        <span style={{ background: s.hue.purple }} />
      </span>
    </span>
  );
}
