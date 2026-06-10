"use client";

import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { useThemeColors } from "@/components/theme-provider";
import { useState } from "react";

export type MonthLangPoint = {
  month: string;
  label: string;
  [lang: string]: string | number;
};

type Props = {
  data: MonthLangPoint[];
  languages: string[];
};

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
  Rust: "#dea584", Go: "#00ADD8", CSS: "#563d7c", HTML: "#e34c26",
  Java: "#b07219", "C++": "#f34b7d", "C#": "#178600", C: "#555555",
  Swift: "#F05138", Kotlin: "#7F52FF", Ruby: "#701516", PHP: "#4F5D95",
  Shell: "#89e051", Dart: "#00B4AB", Vue: "#41b883", Svelte: "#ff3e00",
};

const FALLBACK_COLORS = [
  "#818cf8", "#f472b6", "#fb923c", "#a3e635",
  "#22d3ee", "#e879f9", "#fbbf24", "#34d399",
];

function getLangColor(lang: string, index: number): string {
  return LANG_COLORS[lang] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: { name: string; value: number; fill: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0);
  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-xs shadow-xl min-w-32">
      <p className="mb-2 font-medium text-zinc-300">{label}</p>
      {[...payload].reverse().map((p) =>
        p.value > 0 ? (
          <div key={p.name} className="flex items-center justify-between gap-4 mb-0.5">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: p.fill }} />
              <span className="text-zinc-400">{p.name}</span>
            </div>
            <span className="font-medium" style={{ color: p.fill }}>
              {total > 0 ? Math.round((p.value / total) * 100) : 0}%
            </span>
          </div>
        ) : null
      )}
      <p className="mt-1 pt-1 border-t border-zinc-800 text-zinc-600">{total} commit</p>
    </div>
  );
}

export default function LangEvolution({ data, languages }: Props) {
  const theme = useThemeColors();
  const [mode, setMode] = useState<"stacked" | "pct">("pct");

  if (data.length === 0 || languages.length === 0) return null;

  const normalizedData = data.map((point) => {
    const total = languages.reduce((s, l) => s + ((point[l] as number) ?? 0), 0);
    if (mode === "pct" && total > 0) {
      const norm: MonthLangPoint = { month: point.month, label: point.label };
      for (const l of languages) {
        norm[l] = Math.round((((point[l] as number) ?? 0) / total) * 100);
      }
      return norm;
    }
    return point;
  });

  const langTotals = languages.map((l) => ({
    lang: l,
    total: data.reduce((s, d) => s + ((d[l] as number) ?? 0), 0),
  })).sort((a, b) => b.total - a.total);

  const topLang = langTotals[0]?.lang ?? null;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between shrink-0 mb-3">
        <div>
          <h2 className="text-sm font-medium text-zinc-400">Dil Evrimi</h2>
          <p className="text-xs text-zinc-600 mt-0.5">Son 12 ay commit dagilimi</p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-zinc-800 p-1 self-start">
          {(["pct", "stacked"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="rounded-md px-2.5 py-1 text-xs transition-colors"
              style={
                mode === m
                  ? { backgroundColor: theme.accentBg, color: theme.accent }
                  : { color: "#71717a" }
              }
            >
              {m === "pct" ? "% Oran" : "Sayi"}
            </button>
          ))}
        </div>
      </div>

      {/* Top lang badge */}
      {topLang && (
        <div className="flex flex-wrap gap-2 mb-3 shrink-0">
          <div
            className="flex items-center gap-2 rounded-lg border px-3 py-1.5"
            style={{ borderColor: theme.accentBorder, backgroundColor: theme.accentBg }}
          >
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: getLangColor(topLang, 0) }} />
            <span className="text-xs" style={{ color: theme.accent }}>
              Ana dil: <span className="font-semibold">{topLang}</span>
            </span>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={normalizedData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              {languages.map((lang, i) => (
                <linearGradient key={lang} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={getLangColor(lang, i)} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={getLangColor(lang, i)} stopOpacity={0.05} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} interval={1} />
            <YAxis tick={{ fill: "#52525b", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false}
              domain={[0, mode === "pct" ? 100 : "auto"]}
              tickFormatter={(v) => mode === "pct" ? `${v}%` : String(v)} />
            <Tooltip content={<CustomTooltip />} />
            {languages.map((lang, i) => (
              <Area key={lang} type="monotone" dataKey={lang} stackId="1"
                stroke={getLangColor(lang, i)} strokeWidth={1.5} fill={`url(#grad-${i})`} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Lang chips */}
      <div className="flex flex-wrap gap-2 mt-3 shrink-0">
        {langTotals.map(({ lang, total }, i) => (
          <div key={lang} className="flex items-center gap-1.5 rounded-full border border-zinc-800 px-2.5 py-1 text-xs">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: getLangColor(lang, i) }} />
            <span className="text-zinc-300">{lang}</span>
            <span className="text-zinc-600">{total}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
