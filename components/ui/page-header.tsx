"use client";

import type { ReactNode } from "react";
import { useUIPrefs } from "@/components/ui-prefs";
import { cn } from "@/lib/ui/format";

/**
 * Page title row. Same content, three voices:
 *   editor   a compact workspace header
 *   terminal a prompt line with the command that "produced" the page
 *   studio   a larger editorial title
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  command,
  className,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  /** terminal only: e.g. "overview --range=1y" */
  command?: string;
  className?: string;
  children?: ReactNode;
}) {
  const { prefs } = useUIPrefs();
  const ui = prefs.ui;

  return (
    <header className={cn("mb-5 lg:mb-6", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          {ui === "terminal" ? (
            <>
              <h1 className="font-mono text-[15px] sm:text-[17px] font-semibold text-ink leading-tight">
                <span className="text-accent mr-2" aria-hidden>
                  ❯
                </span>
                <span className="sr-only">{title}</span>
                <span aria-hidden className="caret">
                  {command ?? (typeof title === "string" ? title.toLowerCase() : "")}
                </span>
              </h1>
              {subtitle && <p className="mt-1.5 font-mono text-[12.5px] text-ink-3"># {subtitle}</p>}
            </>
          ) : ui === "studio" ? (
            <>
              <h1 className="text-[26px] sm:text-[32px] font-[760] tracking-[-0.035em] text-ink leading-[1.05]">{title}</h1>
              {subtitle && <p className="mt-2 text-[14px] text-ink-3 max-w-[70ch]">{subtitle}</p>}
            </>
          ) : (
            <>
              <h1 className="text-[20px] sm:text-[22px] font-[650] tracking-[-0.02em] text-ink leading-tight">{title}</h1>
              {subtitle && <p className="mt-1 text-[13px] text-ink-3 max-w-[80ch]">{subtitle}</p>}
            </>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 sm:justify-end shrink-0">{actions}</div>}
      </div>
      {children}
    </header>
  );
}
