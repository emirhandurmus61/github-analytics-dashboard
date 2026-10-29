"use client";

import { useState, useRef } from "react";
import { ImagePlus, Loader2, Bold, Italic, Heading, Code, List } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { useOrigin } from "@/lib/ui/hooks";
import { DARK_SCHEMES, LIGHT_SCHEMES } from "@/lib/ui/schemes";
import { CopyBox } from "./ui";

export function ReadmeEditor({
  value,
  onChange,
  accentColor,
}: {
  value: string;
  onChange: (v: string) => void;
  accentColor: string;
  accentBorder?: string;
  accentBg?: string;
}) {
  const { lang } = useLanguage();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? (lang === "en" ? "Upload failed" : "Yükleme başarısız"));
        return;
      }
      const textarea = textareaRef.current;
      const imageMarkdown = `\n![${file.name}](${data.url})\n`;
      if (textarea) {
        const start = textarea.selectionStart;
        const before = value.slice(0, start);
        const after = value.slice(start);
        onChange(before + imageMarkdown + after);
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = start + imageMarkdown.length;
          textarea.focus();
        });
      } else {
        onChange(value + imageMarkdown);
      }
    } catch {
      alert(lang === "en" ? "An error occurred during upload" : "Yükleme sırasında hata oluştu");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleUpload(file);
  }

  function handlePaste(e: React.ClipboardEvent) {
    for (const item of e.clipboardData.items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) handleUpload(file);
        return;
      }
    }
  }

  function insertAround(before: string, after: string, fallback: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);
    const inserted = selected ? `${before}${selected}${after}` : `${before}${fallback}${after}`;
    onChange(value.slice(0, start) + inserted + value.slice(end));
  }

  function insertAt(text: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    onChange(value.slice(0, start) + text + value.slice(start));
  }

  function applyFormat(type: "bold" | "italic" | "heading" | "code" | "list") {
    if (type === "bold") insertAround("**", "**", lang === "en" ? "bold text" : "kalın metin");
    else if (type === "italic") insertAround("*", "*", lang === "en" ? "italic text" : "italik metin");
    else if (type === "heading") insertAt("\n### ");
    else if (type === "code") insertAround("`", "`", lang === "en" ? "code" : "kod");
    else if (type === "list") insertAt("\n- ");
  }

  const charPct = Math.min(100, (value.length / 10000) * 100);

  return (
    <div className="space-y-2">
      {/* Editör Araç Çubuğu */}
      <div className="flex items-center gap-1 rounded-[var(--r-control)] border border-zinc-800 bg-zinc-900/90 p-1.5">
        <button
          type="button"
          onClick={() => applyFormat("bold")}
          title={lang === "en" ? "Bold" : "Kalın"}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 cursor-pointer"
        >
          <Bold className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-[11px]">{lang === "en" ? "Bold" : "Kalın"}</span>
        </button>
        <button
          type="button"
          onClick={() => applyFormat("italic")}
          title={lang === "en" ? "Italic" : "İtalik"}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 cursor-pointer"
        >
          <Italic className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-[11px]">{lang === "en" ? "Italic" : "İtalik"}</span>
        </button>
        <button
          type="button"
          onClick={() => applyFormat("heading")}
          title={lang === "en" ? "Heading" : "Başlık"}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 cursor-pointer"
        >
          <Heading className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-[11px]">{lang === "en" ? "Heading" : "Başlık"}</span>
        </button>
        <button
          type="button"
          onClick={() => applyFormat("code")}
          title={lang === "en" ? "Code Block" : "Kod Bloğu"}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 cursor-pointer"
        >
          <Code className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-[11px]">{lang === "en" ? "Code" : "Kod"}</span>
        </button>
        <button
          type="button"
          onClick={() => applyFormat("list")}
          title={lang === "en" ? "Bullet List" : "Madde Listesi"}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 cursor-pointer"
        >
          <List className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-[11px]">{lang === "en" ? "List" : "Liste"}</span>
        </button>
        <div className="mx-1 h-4 w-px bg-zinc-800" />
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs transition-colors disabled:opacity-50 hover:bg-zinc-800 cursor-pointer"
          style={{ color: accentColor }}
          title={lang === "en" ? "Upload image" : "Görsel yükle"}
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline font-medium text-[11px]">
            {lang === "en" ? "Upload Image" : "Görsel Yükle"}
          </span>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = "";
        }}
      />

      <textarea
        ref={textareaRef}
        name="profile_readme"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onPaste={handlePaste}
        rows={10}
        maxLength={10000}
        placeholder={
          lang === "en"
            ? "### Hello!\n\nI am a software developer.\n\n- Currently working on **project**\n- Developing with **Rust & TypeScript**"
            : "### Merhaba!\n\nBen bir yazılım geliştiriciyim.\n\n- Şu an **proje** üzerinde çalışıyorum\n- **Rust & TypeScript** ile geliştirme yapıyorum"
        }
        className="w-full resize-y rounded-[var(--r-control)] border border-zinc-800 bg-zinc-900/90 px-4 py-3 font-mono text-xs leading-relaxed text-zinc-100 placeholder-zinc-600 transition-colors focus:border-zinc-500 focus:outline-none custom-scroll"
      />

      <div className="flex items-center justify-between text-[11px] text-zinc-500">
        <span>
          {lang === "en"
            ? "Image: drag and drop, paste from clipboard, or use the button"
            : "Görsel: sürükle-bırak, panodan yapıştır veya butonu kullan"}
        </span>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${charPct}%`,
                backgroundColor: charPct > 90 ? "var(--hue-red)" : accentColor,
              }}
            />
          </div>
          <span className="font-mono text-zinc-400">{value.length} / 10000</span>
        </div>
      </div>
    </div>
  );
}

/* ── README Widgets ─────────────────────────────────────────────────────────── */

export function ReadmeWidgets({
  username,
  accentColor,
  accentBg,
  accentBorder,
}: {
  username: string;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
}) {
  const { lang } = useLanguage();
  const [active, setActive] = useState<string>("streak");
  const [wScheme, setWScheme] = useState<string>("");
  const [wLang, setWLang] = useState<"tr" | "en">(lang === "en" ? "en" : "tr");

  const widgetItems = [
    {
      id: "streak",
      label: "Streak Widget",
      desc:
        lang === "en"
          ? "Current and longest streak, plus the last 21 days with the running streak highlighted."
          : "Güncel ve en uzun seri, aktif serinin vurgulandığı son 21 gün.",
      path: (u: string) => `/api/widget/streak/${u}`,
    },
    {
      id: "stats",
      label: "Stats Widget",
      desc:
        lang === "en"
          ? "Yearly commits, streak, active days, repos and stars in one compact row."
          : "Yıllık commit, seri, aktif gün, repo ve yıldız tek satırda.",
      path: (u: string) => `/api/widget/stats/${u}`,
    },
    {
      id: "langs",
      label: "Top Languages",
      desc:
        lang === "en"
          ? "Your 6 most used languages with a stacked share bar."
          : "En çok kullandığın 6 dil ve yüzdelik dağılım çubuğu.",
      path: (u: string) => `/api/widget/langs/${u}`,
    },
    {
      id: "heatmap",
      label: "Contribution Heatmap",
      desc:
        lang === "en"
          ? "The last 53 weeks of commits, colored with your scheme and accent."
          : "Son 53 haftanın commit ısı haritası; şema ve vurgu rengine uyar.",
      path: (u: string) => `/api/widget/heatmap/${u}`,
    },
  ] as const;

  const current = widgetItems.find((w) => w.id === active)!;
  // Resolve the origin after mount so server and client render the same markup.
  const origin = useOrigin();
  const base = origin || (process.env.NEXT_PUBLIC_BASE_URL ?? "");
  const query = new URLSearchParams({ ...(wScheme ? { scheme: wScheme } : {}), ...(wLang !== "tr" ? { lang: wLang } : {}) }).toString();
  const imgUrl = `${base}${current.path(username)}${query ? `?${query}` : ""}`;
  const profileUrl = `${base}/u/${username}`;

  const mdSnippet = `[![${current.label}](${imgUrl})](${profileUrl})`;
  const htmlSnippet = `<a href="${profileUrl}"><img src="${imgUrl}" alt="${current.label}"></a>`;

  return (
    <div className="space-y-5">
      {/* Widget Seçici Sekmeler */}
      <div className="flex flex-wrap gap-2">
        {widgetItems.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => setActive(w.id)}
            className="rounded-[var(--r-control)] border px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer"
            style={
              active === w.id
                ? { borderColor: accentBorder, color: accentColor, backgroundColor: accentBg }
                : { borderColor: "var(--line)", color: "var(--ink-2)", backgroundColor: "var(--bg-2)" }
            }
          >
            {w.label}
          </button>
        ))}
      </div>

      {/* Açıklama */}
      <p className="text-xs text-zinc-400">{current.desc}</p>

      {/* Görünüm: şema ve dil, URL parametresi olarak eklenir */}
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-[12.5px] text-ink-3">
          {lang === "en" ? "Scheme" : "Şema"}
          <select value={wScheme} onChange={(e) => setWScheme(e.target.value)} className="input !h-8 !w-auto !py-0 font-mono !text-[12px]">
            <option value="">devboard-night</option>
            {[...DARK_SCHEMES, ...LIGHT_SCHEMES].filter((id) => id !== "devboard-night").map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        </label>
        <div className="seg" role="group" aria-label={lang === "en" ? "Widget language" : "Widget dili"}>
          {(["tr", "en"] as const).map((x) => (
            <button key={x} type="button" aria-pressed={wLang === x} onClick={() => setWLang(x)} className="font-mono">
              {x}
            </button>
          ))}
        </div>
        <span className="text-[11.5px] text-ink-4">{lang === "en" ? "Added to the URL as ?scheme= and ?lang=" : "URL'ye ?scheme= ve ?lang= olarak eklenir"}</span>
      </div>

      {/* Canlı Önizleme */}
      <div className="overflow-hidden rounded-panel border border-zinc-800/80 bg-zinc-950 p-6 flex items-center justify-center min-h-[100px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={imgUrl} src={imgUrl} alt={current.label} className="max-w-full block drop-shadow-md" />
      </div>

      {/* Kod Kutuları */}
      <div className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-400">
            {lang === "en" ? "Markdown Code (For Your GitHub Profile)" : "Markdown Kodu (GitHub Profiliniz İçin)"}
          </p>
          <CopyBox value={mdSnippet} accentColor={accentColor} accentBg={accentBg} accentBorder={accentBorder} />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-400">
            {lang === "en" ? "HTML Code" : "HTML Kodu"}
          </p>
          <CopyBox value={htmlSnippet} accentColor={accentColor} accentBg={accentBg} accentBorder={accentBorder} />
        </div>
        <div>
          <p className="mb-2 text-xs font-medium text-zinc-400">
            {lang === "en" ? "Add All Widgets Together (Markdown)" : "Tüm Widget'ları Birlikte Ekle (Markdown)"}
          </p>
          <CopyBox
            value={widgetItems.map((w) => `[![${w.label}](${base}${w.path(username)})](${profileUrl})`).join("\n\n")}
            accentColor={accentColor}
            accentBg={accentBg}
            accentBorder={accentBorder}
          />
        </div>
      </div>
    </div>
  );
}
