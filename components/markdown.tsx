"use client";

import React, { useState, type ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { Info, Lightbulb, MessageSquareWarning, TriangleAlert, OctagonAlert, Copy, Check } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/ui/format";

/* GitHub-flavored README rendering, styled with the scheme tokens. */

const ALERTS = {
  NOTE: { icon: Info, color: "var(--hue-blue)", tr: "Not", en: "Note" },
  TIP: { icon: Lightbulb, color: "var(--hue-green)", tr: "İpucu", en: "Tip" },
  IMPORTANT: { icon: MessageSquareWarning, color: "var(--hue-purple)", tr: "Önemli", en: "Important" },
  WARNING: { icon: TriangleAlert, color: "var(--hue-yellow)", tr: "Uyarı", en: "Warning" },
  CAUTION: { icon: OctagonAlert, color: "var(--hue-red)", tr: "Dikkat", en: "Caution" },
} as const;

type AlertKind = keyof typeof ALERTS;

/** Detects `> [!TIP]` style alerts; whitespace text nodes come before the paragraph. */
function Blockquote({ children, lang }: { children: ReactNode; lang: "tr" | "en" }) {
  const nodes = React.Children.toArray(children).filter((c) => !(typeof c === "string" && !c.trim()));
  const first = nodes[0];
  if (React.isValidElement<{ children?: ReactNode }>(first)) {
    const inner = React.Children.toArray(first.props.children);
    const head = typeof inner[0] === "string" ? inner[0] : "";
    const m = head.match(/^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*([\s\S]*)$/i);
    if (m) {
      const kind = m[1].toUpperCase() as AlertKind;
      const a = ALERTS[kind];
      const Icon = a.icon;
      const rest = [m[2] || null, ...inner.slice(1)].filter((x) => x !== null && x !== "");
      return (
        <div className="my-4 border-l-[3px] py-1.5 pl-4" style={{ borderColor: a.color }}>
          <p className="mb-1.5 flex items-center gap-2 text-[13.5px] font-semibold" style={{ color: a.color }}>
            <Icon size={15} />
            {a[lang]}
          </p>
          <div className="text-[14px] leading-relaxed text-ink-2 [&>p]:mb-2 [&>p:last-child]:mb-0">
            {rest.length > 0 && <p>{rest}</p>}
            {nodes.slice(1)}
          </div>
        </div>
      );
    }
  }
  return <blockquote className="my-4 border-l-[3px] border-line-strong pl-4 text-ink-3 [&>p:last-child]:mb-0">{children}</blockquote>;
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const { lang } = useLanguage();
  const [copied, setCopied] = useState(false);
  return (
    <div className="my-4 overflow-hidden rounded-[var(--r-control)] border border-line bg-canvas">
      <div className="flex h-8 items-center justify-between border-b border-line bg-raised pl-3 pr-1">
        <span className="font-mono text-[11.5px] text-ink-3">{language || "text"}</span>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() =>
            navigator.clipboard.writeText(code).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            })
          }
        >
          {copied ? <Check className="text-good" /> : <Copy />}
          {copied ? (lang === "en" ? "Copied" : "Kopyalandı") : lang === "en" ? "Copy" : "Kopyala"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3.5 font-mono text-[12.5px] leading-[1.65] text-ink">
        <code>{code}</code>
      </pre>
    </div>
  );
}

type WithAlign = { align?: string; node?: unknown };

/** react-markdown passes its AST node as a prop; keep it off the DOM. */
function strip<T extends { node?: unknown }>(props: T): Omit<T, "node"> {
  const out = { ...props };
  delete out.node;
  return out;
}

export default function Markdown({ children, className }: { children: string; className?: string }) {
  const { lang } = useLanguage();
  const l = lang === "en" ? "en" : "tr";

  const components: Components = {
    div: ({ className: c, align, children: ch, ...raw }: React.HTMLAttributes<HTMLDivElement> & WithAlign) => (
      <div className={cn(c, align === "center" && "text-center [&_img]:mx-auto")} {...strip(raw)}>
        {ch}
      </div>
    ),
    p: ({ align, children: ch, className: c, ...raw }: React.HTMLAttributes<HTMLParagraphElement> & WithAlign) => (
      <p className={cn("mb-4 text-[14.5px] leading-[1.7] text-ink-2", align === "center" && "text-center", c)} {...strip(raw)}>
        {ch}
      </p>
    ),
    h1: ({ children: ch }) => <h1 className="mb-4 mt-7 border-b border-line pb-2 text-[26px] font-[700] tracking-[-0.02em] text-ink first:mt-0">{ch}</h1>,
    h2: ({ children: ch }) => <h2 className="mb-3 mt-7 border-b border-line pb-1.5 text-[20px] font-[650] tracking-[-0.015em] text-ink first:mt-0">{ch}</h2>,
    h3: ({ children: ch }) => <h3 className="mb-2 mt-5 text-[16px] font-semibold text-ink">{ch}</h3>,
    h4: ({ children: ch }) => <h4 className="mb-2 mt-4 text-[14.5px] font-semibold text-ink">{ch}</h4>,
    ul: ({ children: ch, className: c }) => (
      <ul className={cn("mb-4 space-y-1 pl-6 text-[14.5px] text-ink-2", c?.includes("contains-task-list") ? "list-none pl-1" : "list-disc marker:text-ink-4")}>{ch}</ul>
    ),
    ol: ({ children: ch }) => <ol className="mb-4 list-decimal space-y-1 pl-6 text-[14.5px] text-ink-2 marker:font-mono marker:text-ink-4">{ch}</ol>,
    li: ({ children: ch }) => <li className="leading-[1.65]">{ch}</li>,
    strong: ({ children: ch }) => <strong className="font-semibold text-ink">{ch}</strong>,
    em: ({ children: ch }) => <em className="italic">{ch}</em>,
    hr: () => <hr className="my-6 border-line" />,
    pre: ({ children: ch }) => {
      const codeEl = React.Children.toArray(ch).find((c) => React.isValidElement(c)) as React.ReactElement<{ className?: string; children?: ReactNode }> | undefined;
      const language = /language-([\w-]+)/.exec(codeEl?.props.className ?? "")?.[1] ?? "";
      const text = String(codeEl?.props.children ?? "").replace(/\n$/, "");
      return <CodeBlock language={language} code={text} />;
    },
    code: ({ children: ch }) => <code className="rounded-[4px] border border-line bg-raised px-1.5 py-[1px] font-mono text-[0.88em] text-ink">{ch}</code>,
    a: ({ children: ch, href, ...raw }: React.AnchorHTMLAttributes<HTMLAnchorElement> & WithAlign) => {
      const hasImg = React.Children.toArray(ch).some((c) => React.isValidElement(c) && (c.type === "img" || Boolean((c.props as { src?: string }).src)));
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={hasImg ? "inline-block" : "text-accent underline decoration-[var(--accent-line)] underline-offset-[3px] hover:decoration-[var(--accent)]"} {...strip(raw)}>
          {ch}
        </a>
      );
    },
    blockquote: ({ children: ch }) => <Blockquote lang={l}>{ch}</Blockquote>,
    table: ({ children: ch }) => (
      <div className="my-4 overflow-x-auto rounded-[var(--r-control)] border border-line">
        <table className="w-full border-collapse text-left text-[13px]">{ch}</table>
      </div>
    ),
    thead: ({ children: ch }) => <thead className="bg-raised text-ink">{ch}</thead>,
    th: ({ children: ch }) => <th className="border-b border-line px-3 py-2 font-semibold">{ch}</th>,
    td: ({ children: ch }) => <td className="border-b border-line px-3 py-2 text-ink-2">{ch}</td>,
    input: ({ type, checked }) =>
      type === "checkbox" ? (
        <span className={cn("mr-2 inline-grid size-4 place-items-center rounded-[4px] border align-[-3px]", checked ? "border-accent bg-accent text-on-accent" : "border-line-strong bg-canvas")} aria-checked={!!checked} role="checkbox">
          {checked && <Check size={11} strokeWidth={3} />}
        </span>
      ) : (
        <input type={type} />
      ),
    img: ({ src, alt, ...raw }: React.ImgHTMLAttributes<HTMLImageElement> & WithAlign) => {
      const s = typeof src === "string" ? src : "";
      const badge = /shields\.io|badgen\.net|\/api\/badge|badge\.svg/.test(s);
      const card = /github-readme-stats|streak-stats|readme-typing-svg|github-profile-trophy|capsule-render|\/api\/widget\//.test(s);
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={s}
          alt={alt ?? ""}
          loading="lazy"
          className={badge ? "my-0.5 mr-1 inline-block max-h-7 align-middle" : card ? "my-1.5 mr-1.5 inline-block max-w-full align-middle" : "my-4 h-auto max-h-[520px] max-w-full rounded-[var(--r-control)] border border-line"}
          {...strip(raw)}
        />
      );
    },
  };

  return (
    <div className={cn("min-w-0 break-words", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
