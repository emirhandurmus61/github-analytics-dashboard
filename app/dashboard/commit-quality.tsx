"use client";

import { useThemeColors } from "@/components/theme-provider";

type BigCommit = {
  message: string;
  additions: number;
  deletions: number;
  date: string;
};

type Props = {
  avgMsgLength: number;
  multiLinePct: number;
  conventionalPct: number;
  typeDist: { type: string; count: number }[];
  biggestCommits: BigCommit[];
  totalAnalyzed: number;
};

const TYPE_COLORS: Record<string, string> = {
  feat:     "#34d399",
  fix:      "#f87171",
  refactor: "#818cf8",
  chore:    "#71717a",
  docs:     "#60a5fa",
  test:     "#fbbf24",
  style:    "#f472b6",
  perf:     "#fb923c",
  build:    "#a3e635",
  ci:       "#22d3ee",
  revert:   "#e879f9",
};

const TYPE_LABELS: Record<string, string> = {
  feat:     "Özellik",
  fix:      "Düzeltme",
  refactor: "Refactor",
  chore:    "Chore",
  docs:     "Dokümantasyon",
  test:     "Test",
  style:    "Stil",
  perf:     "Performans",
  build:    "Build",
  ci:       "CI",
  revert:   "Geri Al",
};

function getMsgQuality(avg: number): { label: string; color: string; emoji: string } {
  if (avg >= 50) return { label: "Açıklayıcı", color: "#34d399", emoji: "✓" };
  if (avg >= 20) return { label: "Yeterli",    color: "#fb923c", emoji: "~" };
  return               { label: "Çok kısa",   color: "#f87171", emoji: "!" };
}

function getConventionalQuality(pct: number): { label: string; color: string } {
  if (pct >= 80) return { label: "Mükemmel",  color: "#34d399" };
  if (pct >= 40) return { label: "Gelişiyor", color: "#fb923c" };
  if (pct >= 10) return { label: "Az",        color: "#71717a" };
  return               { label: "Yok",        color: "#52525b" };
}

export default function CommitQuality({
  avgMsgLength,
  multiLinePct,
  conventionalPct,
  typeDist,
  biggestCommits,
  totalAnalyzed,
}: Props) {
  const theme = useThemeColors();
  const msgQ = getMsgQuality(avgMsgLength);
  const convQ = getConventionalQuality(conventionalPct);
  const maxTypeCount = Math.max(...typeDist.map((t) => t.count), 1);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-6">
      {/* Başlık */}
      <div>
        <h2 className="text-sm font-medium text-zinc-400">Commit Kalite Analizi</h2>
        <p className="mt-0.5 text-xs text-zinc-600">
          {totalAnalyzed.toLocaleString("tr-TR")} commit incelendi
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

        {/* Sol kolon */}
        <div className="space-y-4">

          {/* Metrik kartlar — 2x2 grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Ort. mesaj uzunluğu */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-800/40 p-4">
              <p className="text-xs text-zinc-500 mb-1">Ort. Mesaj Uzunluğu</p>
              <p className="text-2xl font-bold" style={{ color: msgQ.color }}>
                {avgMsgLength}
                <span className="text-sm font-normal text-zinc-600 ml-1">kr</span>
              </p>
              <p className="text-xs mt-1" style={{ color: msgQ.color }}>
                {msgQ.emoji} {msgQ.label}
              </p>
            </div>

            {/* Çok satır oranı */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-800/40 p-4">
              <p className="text-xs text-zinc-500 mb-1">Detaylı Açıklama</p>
              <p className="text-2xl font-bold" style={{ color: theme.accent }}>
                %{multiLinePct}
              </p>
              <p className="text-xs text-zinc-600 mt-1">çok satırlı commit</p>
            </div>

            {/* Conventional commits */}
            <div className="col-span-2 rounded-xl border border-zinc-800 bg-zinc-800/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-zinc-500">Conventional Commits</p>
                <span className="text-xs font-medium" style={{ color: convQ.color }}>
                  {convQ.label}
                </span>
              </div>
              <div className="flex items-end gap-3">
                <p className="text-2xl font-bold" style={{ color: convQ.color }}>
                  %{conventionalPct}
                </p>
                <div className="flex-1 mb-1">
                  <div className="h-2 w-full rounded-full bg-zinc-700 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${conventionalPct}%`, backgroundColor: convQ.color }}
                    />
                  </div>
                </div>
              </div>
              {conventionalPct === 0 && (
                <p className="text-xs text-zinc-600 mt-1">
                  feat:, fix:, chore: gibi prefix'ler kullanılmıyor
                </p>
              )}
            </div>
          </div>

          {/* Tip dağılımı */}
          {typeDist.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-zinc-500">Commit Tipi Dağılımı</p>
              {typeDist.slice(0, 6).map(({ type, count }) => {
                const color = TYPE_COLORS[type] ?? theme.accent;
                const pct = Math.round((count / maxTypeCount) * 100);
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-xs text-zinc-300">{TYPE_LABELS[type] ?? type}</span>
                        <code className="text-xs text-zinc-600">{type}:</code>
                      </div>
                      <span className="text-xs text-zinc-600">{count}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Conventional commit yoksa ipucu */}
          {typeDist.length === 0 && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-800/20 p-4 space-y-1">
              <p className="text-xs text-zinc-500">Tip Dağılımı</p>
              <p className="text-xs text-zinc-600 leading-relaxed">
                Commit mesajlarında <code className="text-zinc-500">feat:</code>,{" "}
                <code className="text-zinc-500">fix:</code>,{" "}
                <code className="text-zinc-500">chore:</code> gibi conventional commit formatı
                kullanılmadığı için dağılım görüntülenemiyor.
              </p>
            </div>
          )}
        </div>

        {/* Sağ kolon — en büyük commitler */}
        <div className="space-y-3">
          <p className="text-xs text-zinc-500">En Büyük Commitler</p>
          {biggestCommits.length === 0 ? (
            <p className="text-xs text-zinc-600">Satır verisi bulunan commit yok</p>
          ) : (
            <div className="space-y-2">
              {biggestCommits.map((c, i) => {
                const total = c.additions + c.deletions;
                const addPct = total > 0 ? (c.additions / total) * 100 : 50;
                return (
                  <div
                    key={i}
                    className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-3 space-y-2"
                  >
                    {/* Mesaj */}
                    <p className="text-xs text-zinc-300 leading-snug line-clamp-2">{c.message || "(boş mesaj)"}</p>

                    {/* Satır bar */}
                    <div className="flex h-1.5 w-full rounded-full overflow-hidden">
                      <div
                        className="h-full"
                        style={{ width: `${addPct}%`, backgroundColor: "#34d399" }}
                      />
                      <div
                        className="h-full"
                        style={{ width: `${100 - addPct}%`, backgroundColor: "#f87171" }}
                      />
                    </div>

                    {/* Meta */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400">+{c.additions.toLocaleString("tr-TR")}</span>
                        <span className="text-red-400">−{c.deletions.toLocaleString("tr-TR")}</span>
                      </div>
                      <span className="text-zinc-700">{c.date}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Mesaj kalitesi ipucu */}
          {avgMsgLength < 20 && (
            <div
              className="rounded-xl border p-3 mt-2"
              style={{ borderColor: "#f8717133", backgroundColor: "#f8717108" }}
            >
              <p className="text-xs" style={{ color: "#f87171" }}>
                Commit mesajların ortalama {avgMsgLength} karakter — daha açıklayıcı mesajlar
                proje geçmişini anlamayı kolaylaştırır.
              </p>
            </div>
          )}
          {avgMsgLength >= 50 && (
            <div
              className="rounded-xl border p-3 mt-2"
              style={{ borderColor: theme.accentBorder, backgroundColor: theme.accentBg }}
            >
              <p className="text-xs" style={{ color: theme.accent }}>
                Commit mesajların oldukça açıklayıcı — iyi pratik!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
