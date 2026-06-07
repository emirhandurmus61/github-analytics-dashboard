"use client";

type Props = {
  linesAdded: number;
  linesDeleted: number;
  totalCommits: number;
  mergedPRs: number;
  openIssues: number;
  closedIssues: number;
};

function formatLines(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export default function CodeStats({
  linesAdded,
  linesDeleted,
  totalCommits,
  mergedPRs,
  openIssues,
  closedIssues,
}: Props) {
  const netLines = linesAdded - linesDeleted;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <h2 className="mb-5 text-sm font-medium text-zinc-400">Kod & Katkı İstatistikleri</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">

        <StatBox
          value={`+${formatLines(linesAdded)}`}
          label="Satır Eklendi"
          color="text-emerald-400"
        />
        <StatBox
          value={`-${formatLines(linesDeleted)}`}
          label="Satır Silindi"
          color="text-red-400"
        />
        <StatBox
          value={netLines >= 0 ? `+${formatLines(netLines)}` : formatLines(netLines)}
          label="Net Değişim"
          color={netLines >= 0 ? "text-blue-400" : "text-orange-400"}
        />
        <StatBox
          value={totalCommits.toLocaleString("tr-TR")}
          label="Commit"
          color="text-zinc-100"
        />
        <StatBox
          value={mergedPRs.toString()}
          label="Merge PR"
          color="text-purple-400"
        />
        <StatBox
          value={`${closedIssues}/${openIssues + closedIssues}`}
          label="Kapalı Issue"
          color="text-yellow-400"
        />
      </div>

      {/* Satır oranı bar */}
      {(linesAdded + linesDeleted) > 0 && (
        <div className="mt-5">
          <div className="mb-1.5 flex justify-between text-xs text-zinc-600">
            <span>Ekleme vs Silme oranı</span>
            <span>
              %{Math.round((linesAdded / (linesAdded + linesDeleted)) * 100)} ekleme
            </span>
          </div>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-red-900/40">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{
                width: `${(linesAdded / (linesAdded + linesDeleted)) * 100}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div className="rounded-xl bg-zinc-800/50 px-3 py-3 text-center">
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      <div className="mt-1 text-xs text-zinc-600">{label}</div>
    </div>
  );
}
