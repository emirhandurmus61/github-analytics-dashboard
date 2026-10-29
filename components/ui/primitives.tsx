"use client";

import { useId, type ComponentType, type ReactNode, type CSSProperties } from "react";
import { useIsClient } from "@/lib/ui/hooks";
import { createPortal } from "react-dom";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn, fmtPct, type Lang } from "@/lib/ui/format";

type Icon = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

/* ── Panel ───────────────────────────────────────────────────────────────
   One shell for every card. Its look comes from the active interface:
   editor = tab strip, terminal = TUI box with the title in the border,
   studio = soft card. Content never needs to know which one is active. */
export function Panel({
  title,
  icon: IconCmp,
  meta,
  actions,
  tone,
  flush,
  headless,
  className,
  bodyClassName,
  bodyStyle,
  children,
  id,
}: {
  title?: ReactNode;
  icon?: Icon;
  meta?: ReactNode;
  actions?: ReactNode;
  tone?: "accent";
  flush?: boolean;
  headless?: boolean;
  className?: string;
  bodyClassName?: string;
  bodyStyle?: CSSProperties;
  children?: ReactNode;
  id?: string;
}) {
  const hid = useId();
  return (
    <section
      id={id}
      className={cn("panel", className)}
      data-tone={tone}
      data-headless={headless ? "" : undefined}
      aria-labelledby={headless || !title ? undefined : hid}
    >
      {!headless && (
        <header className="panel-head">
          <div className="panel-tab">
            {IconCmp && (
              <span className="panel-glyph" aria-hidden>
                <IconCmp size={14} strokeWidth={1.8} />
              </span>
            )}
            <h2 id={hid} className="panel-title">
              {title}
            </h2>
          </div>
          {meta != null && meta !== false && <div className="panel-meta">{meta}</div>}
          {actions && <div className={cn("panel-actions", (meta == null || meta === false) && "ml-auto")}>{actions}</div>}
        </header>
      )}
      <div className={cn("panel-body @container", flush && "flush", bodyClassName)} style={bodyStyle}>
        {children}
      </div>
    </section>
  );
}

/* ── Track / meter ─────────────────────────────────────────────────────── */
export function Track({
  value,
  max = 100,
  color,
  className,
  height,
  label,
}: {
  value: number;
  max?: number;
  color?: string;
  className?: string;
  height?: number;
  label?: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div
      className={cn("track", className)}
      style={height ? { height } : undefined}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
    >
      <i style={{ width: `${pct}%`, ...(color ? { ["--fill" as string]: color, background: color } : null) }} />
    </div>
  );
}

/* ── Sparkline ─────────────────────────────────────────────────────────── */
export function Spark({
  values,
  height = 32,
  color = "var(--accent)",
  area = true,
  className,
  strokeWidth = 1.5,
  dot = true,
}: {
  values: number[];
  height?: number;
  color?: string;
  area?: boolean;
  className?: string;
  strokeWidth?: number;
  dot?: boolean;
}) {
  const gid = useId().replace(/:/g, "");
  if (values.length < 2) return <div className={className} style={{ height }} />;
  const max = Math.max(...values, 1);
  const W = 100;
  const H = height;
  const pad = 2;
  const step = W / (values.length - 1);
  const pts = values.map((v, i) => [i * step, H - pad - (v / max) * (H - pad * 2)] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg
      className={cn("block w-full overflow-visible", className)}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      style={{ height }}
      aria-hidden
    >
      {area && (
        <>
          <defs>
            <linearGradient id={`sg${gid}`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={`${d} L${W},${H} L0,${H} Z`} fill={`url(#sg${gid})`} />
        </>
      )}
      <path d={d} fill="none" stroke={color} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
      {dot && (
        <circle cx={last[0]} cy={last[1]} r={2.2} fill={color} vectorEffect="non-scaling-stroke" style={{ transformBox: "fill-box" }} />
      )}
    </svg>
  );
}

/* ── Mini bars ─────────────────────────────────────────────────────────── */
export function Bars({
  values,
  height = 36,
  color = "var(--accent)",
  dim = "var(--bg-3)",
  highlight = "last",
  gap = 2,
  className,
  titles,
}: {
  values: number[];
  height?: number | string;
  color?: string;
  dim?: string;
  highlight?: "last" | "max" | "none" | number;
  gap?: number;
  className?: string;
  titles?: string[];
}) {
  const max = Math.max(...values, 1);
  const hi =
    highlight === "last"
      ? values.length - 1
      : highlight === "max"
        ? values.indexOf(Math.max(...values))
        : typeof highlight === "number"
          ? highlight
          : -1;
  return (
    <div className={cn("flex items-end w-full", className)} style={{ height, gap }} aria-hidden={!titles}>
      {values.map((v, i) => {
        const h = v > 0 ? Math.max(8, (v / max) * 100) : 4;
        const on = hi === -1 ? v > 0 : i === hi;
        return (
          <div
            key={i}
            title={titles?.[i]}
            className="flex-1 min-w-0 rounded-[2px] transition-[height] duration-500"
            style={{
              height: `${h}%`,
              background: v === 0 ? dim : on ? color : `color-mix(in oklab, ${color} 45%, ${dim})`,
            }}
          />
        );
      })}
    </div>
  );
}

/* ── Delta ─────────────────────────────────────────────────────────────── */
export function Delta({
  value,
  lang,
  suffix,
  className,
  invert,
}: {
  value: number;
  lang: Lang;
  suffix?: string;
  className?: string;
  invert?: boolean;
}) {
  const up = value > 0;
  const flat = value === 0;
  const good = invert ? !up : up;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn("inline-flex items-center gap-0.5 font-mono text-[11px] font-semibold num", className)}
      style={{ color: flat ? "var(--ink-3)" : good ? "var(--hue-green)" : "var(--hue-red)" }}
    >
      <Icon size={12} strokeWidth={2.2} />
      {suffix ?? fmtPct(Math.abs(value), lang)}
    </span>
  );
}

/* ── Segmented control ─────────────────────────────────────────────────── */
export function Seg<T extends string>({
  value,
  options,
  onChange,
  className,
  size,
  label,
}: {
  value: T;
  options: { value: T; label: ReactNode; title?: string }[];
  onChange: (v: T) => void;
  className?: string;
  size?: "sm";
  label?: string;
}) {
  return (
    <div className={cn("seg", size === "sm" && "[&>button]:h-[21px] [&>button]:px-[7px] [&>button]:text-[11px]", className)} role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" aria-pressed={o.value === value} title={o.title} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── Kbd ───────────────────────────────────────────────────────────────── */
export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return <kbd className={cn("kbd", className)}>{children}</kbd>;
}

/* ── Dot (status / legend) ─────────────────────────────────────────────── */
export function Dot({ color, className, size = 8 }: { color: string; className?: string; size?: number }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block shrink-0 rounded-full", className)}
      style={{ width: size, height: size, background: color }}
    />
  );
}

/* ── Portal: dialogs must escape container-query/transform containing blocks ─ */
export function Portal({ children }: { children: ReactNode }) {
  const client = useIsClient();
  return client ? createPortal(children, document.body) : null;
}
