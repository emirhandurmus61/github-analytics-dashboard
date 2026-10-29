"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

/** Accent tokens shared by every settings section. */
export const ACCENT = "var(--accent)";
export const ACCENT_BG = "var(--accent-soft)";
export const ACCENT_BORDER = "var(--accent-line)";

export function Section({
  icon: Icon,
  title,
  desc,
  badge,
  children,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  desc: string;
  badge?: string;
  children: React.ReactNode;
  accent?: string;
  accentBorder?: string;
  accentBg?: string;
}) {
  return (
    <section className="min-w-0">
      <header className="mb-6 flex items-start gap-3 border-b border-line pb-4">
        <Icon className="mt-1 h-4 w-4 shrink-0 text-accent" />
        <div className="min-w-0 flex-1">
          <h2 className="text-[18px] font-[650] tracking-[-0.01em] text-ink">{title}</h2>
          <p className="mt-0.5 max-w-[70ch] text-[13px] leading-relaxed text-ink-3">{desc}</p>
        </div>
        {badge && <span className="chip shrink-0">{badge}</span>}
      </header>
      <div>{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  desc,
  children,
}: {
  label: string;
  hint?: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-[13px] font-medium text-ink">{label}</label>
        {hint && <span className="font-mono text-[11px] text-ink-4">{hint}</span>}
      </div>
      {desc && <p className="text-[12px] leading-normal text-ink-3">{desc}</p>}
      {children}
    </div>
  );
}

export function PrefixInput({
  icon,
  prefix,
  name,
  defaultValue,
  placeholder,
  maxLength,
}: {
  icon?: React.ReactNode;
  prefix: string;
  name: string;
  defaultValue: string;
  placeholder: string;
  maxLength: number;
}) {
  return (
    <div className="flex h-8 items-stretch overflow-hidden rounded-[var(--r-control)] border border-line-strong bg-canvas transition-[border-color,box-shadow] focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-soft)]">
      <div className="flex shrink-0 items-center gap-2 border-r border-line bg-raised px-2.5 text-ink-3">
        {icon}
        <span className="font-mono text-[11.5px]">{prefix}</span>
      </div>
      <input
        name={name}
        type="text"
        defaultValue={defaultValue}
        maxLength={maxLength}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent px-2.5 text-[13px] text-ink placeholder:text-ink-4 focus:outline-none"
      />
    </div>
  );
}

export function CopyBox({ value }: { value: string; accentColor?: string; accentBg?: string; accentBorder?: string }) {
  const { lang } = useLanguage();
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex items-stretch gap-2">
      <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-[var(--r-control)] border border-line bg-canvas px-3 py-2 font-mono text-[12px] text-ink-2">
        {value}
      </code>
      <button type="button" onClick={handleCopy} className="btn shrink-0">
        {copied ? <Check className="text-good" /> : <Copy />}
        {copied ? (lang === "en" ? "Copied" : "Kopyalandı") : lang === "en" ? "Copy" : "Kopyala"}
      </button>
    </div>
  );
}

