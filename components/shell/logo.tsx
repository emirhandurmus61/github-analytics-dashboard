import { cn } from "@/lib/ui/format";

/**
 * Devboard mark: a 3×3 slice of a contribution graph, heat rising along the
 * diagonal. Colors come from the heat ramp, so it follows scheme and accent.
 */
const CELLS = [1, 2, 4, 2, 4, 2, 4, 2, 0];

export function LogoMark({ size = 20, className }: { size?: number; className?: string }) {
  const c = 4;
  const g = 1.5;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 15 15"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      {CELLS.map((lvl, i) => {
        const x = (i % 3) * (c + g);
        const y = Math.floor(i / 3) * (c + g);
        return <rect key={i} x={x} y={y} width={c} height={c} rx={1} fill={`var(--heat-${lvl})`} />;
      })}
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-mono text-[14px] font-[650] tracking-[-0.02em] text-ink", className)}>
      devboard
    </span>
  );
}
