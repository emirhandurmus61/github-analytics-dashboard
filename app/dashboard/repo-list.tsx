"use client";

import Link from "next/link";
import { FolderGit2, Star, GitFork } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Panel, Dot } from "@/components/ui/primitives";
import { useWidgetSize } from "@/components/ui/widget-size";
import { langColor } from "@/lib/ui/lang-colors";
import { fmtCompact, fmtPct, type Lang } from "@/lib/ui/format";
import type { RepoRow } from "./types";

export default function RepoList({ repos }: { repos: RepoRow[] }) {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const { shape, w, h } = useWidgetSize();
  const title = l === "en" ? "Active repos" : "Aktif repolar";
  const active = repos.filter((r) => r.commit_count > 0);
  const total = Math.max(1, active.reduce((s, r) => s + r.commit_count, 0));
  const max = Math.max(...repos.map((r) => r.commit_count), 1);

  if (!active.length) {
    return (
      <Panel title={title} icon={FolderGit2}>
        <p className="text-[12.5px] text-ink-3">{l === "en" ? "No commits to your own repos in this range." : "Bu aralıkta kendi repolarına commit yok."}</p>
      </Panel>
    );
  }

  const top = active[0];
  const shareBar = (n: number, height = 8) => (
    <div className="flex w-full overflow-hidden rounded-full bg-inset gap-px" style={{ height }}>
      {active.slice(0, n).map((r) => (
        <span key={r.name} title={`${r.name}: ${r.commit_count}`} style={{ width: `${(r.commit_count / total) * 100}%`, background: langColor(r.language) }} />
      ))}
    </div>
  );

  return (
    <Panel title={title} icon={FolderGit2} meta={`${active.length} repo`}>
      {shape === "glance" && (
        <Link href={`/dashboard/repos/${top.name}`} className="flex h-full flex-col group">
          <div className="flex items-center gap-1.5 min-w-0">
            <Dot color={langColor(top.language)} size={8} />
            <span className="truncate font-mono text-[15px] font-semibold text-ink group-hover:text-accent">{top.name}</span>
          </div>
          <div className="mt-1 text-[11.5px] text-ink-3">
            {top.commit_count} commit · {fmtPct((top.commit_count / total) * 100, l)}
          </div>
          <div className="mt-auto">{shareBar(6, 6)}</div>
        </Link>
      )}

      {shape === "strip" && (
        <div className="flex h-full flex-col justify-center gap-3">
          {shareBar(8, 10)}
          <ul className="grid gap-x-4 gap-y-1" style={{ gridTemplateColumns: `repeat(${Math.min(4, w + 1)}, minmax(0,1fr))` }}>
            {active.slice(0, Math.min(4, w + 1) * (w >= 3 ? 1 : 1)).map((r) => (
              <li key={r.name} className="min-w-0">
                <Link href={`/dashboard/repos/${r.name}`} className="flex items-center gap-1.5 text-[12px] hover:text-accent">
                  <Dot color={langColor(r.language)} size={7} />
                  <span className="truncate font-mono text-ink-2">{r.name}</span>
                  <span className="ml-auto font-mono text-[11px] text-ink-4 num">{r.commit_count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(shape === "column" || shape === "block") && (
        <ul className="flex h-full flex-col overflow-y-auto -mx-1">
          {(shape === "block" && w >= 3) && (
            <li className="grid grid-cols-[minmax(0,1fr)_minmax(80px,1.2fr)_48px_56px_48px] gap-3 px-1 pb-1.5 text-[11px] text-ink-4 border-b border-line">
              <span>repo</span>
              <span>commit</span>
              <span />
              <span className="text-right">★</span>
              <span className="text-right">fork</span>
            </li>
          )}
          {repos.slice(0, h >= 3 ? 10 : 7).map((r) =>
            shape === "block" && w >= 3 ? (
              <li key={r.name}>
                <Link href={`/dashboard/repos/${r.name}`} className="grid grid-cols-[minmax(0,1fr)_minmax(80px,1.2fr)_48px_56px_48px] items-center gap-3 rounded-[var(--r-control)] px-1 py-1.5 hover:bg-raised">
                  <span className="flex items-center gap-2 min-w-0">
                    <Dot color={langColor(r.language)} size={8} />
                    <span className="truncate font-mono text-[12.5px] text-ink">{r.name}</span>
                    <span className="hidden @min-[640px]:inline text-[11px] text-ink-4">{r.language}</span>
                  </span>
                  <span className="h-1.5 rounded-full bg-inset overflow-hidden">
                    <span className="block h-full rounded-full" style={{ width: `${(r.commit_count / max) * 100}%`, background: langColor(r.language) }} />
                  </span>
                  <span className="text-right font-mono text-[12px] text-ink num">{r.commit_count}</span>
                  <span className="text-right font-mono text-[11.5px] text-ink-3 num">{fmtCompact(r.stars, l)}</span>
                  <span className="text-right font-mono text-[11.5px] text-ink-3 num">{fmtCompact(r.forks, l)}</span>
                </Link>
              </li>
            ) : (
              <li key={r.name}>
                <Link href={`/dashboard/repos/${r.name}`} className="block rounded-[var(--r-control)] px-1 py-1.5 hover:bg-raised">
                  <div className="mb-1 flex items-center gap-2 text-[12.5px]">
                    <Dot color={langColor(r.language)} size={8} />
                    <span className="truncate font-mono text-ink">{r.name}</span>
                    <span className="ml-auto flex items-center gap-2.5 font-mono text-[11px] text-ink-3 num">
                      <span className="text-ink">{r.commit_count}</span>
                      {shape === "block" && (
                        <>
                          <span className="inline-flex items-center gap-0.5"><Star size={10} />{fmtCompact(r.stars, l)}</span>
                          <span className="inline-flex items-center gap-0.5"><GitFork size={10} />{fmtCompact(r.forks, l)}</span>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-inset overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(r.commit_count / max) * 100}%`, background: langColor(r.language) }} />
                  </div>
                </Link>
              </li>
            ),
          )}
        </ul>
      )}
    </Panel>
  );
}
