"use client";

import { useState } from "react";
import { Dna, ChevronDown, Link2, Check } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Panel, Track } from "@/components/ui/primitives";
import { useWidgetSize } from "@/components/ui/widget-size";
import type { DeveloperDNA } from "@/lib/developer-dna";
import { cn, type Lang } from "@/lib/ui/format";

type Meta = { code: string; color: string; score: number; tr: string; en: string; descTr: string; descEn: string };

const WORK: Record<string, Meta> = {
  "Gece Kuşu": { code: "NGT", color: "var(--hue-purple)", score: 85, tr: "Gece kuşu", en: "Night owl", descTr: "Commitlerin çoğu gece yarısıyla sabah arasında. Sessizlikte odaklanıyorsun.", descEn: "Most commits land between midnight and dawn. You focus best when it is quiet." },
  "Sabahçı": { code: "MRN", color: "var(--hue-orange)", score: 75, tr: "Sabahçı", en: "Early bird", descTr: "Güne kodla başlıyorsun; en verimli saatlerin sabah.", descEn: "You start the day with code; mornings are your most productive hours." },
  "Öğleden Sonracı": { code: "AFT", color: "var(--hue-yellow)", score: 60, tr: "Öğleden sonracı", en: "Afternoon coder", descTr: "Sabah toplantılarından sonra ritme giriyor, öğleden sonra zirve yapıyorsun.", descEn: "You find your groove after morning meetings and peak in the afternoon." },
  "Akşamcı": { code: "EVE", color: "var(--hue-orange)", score: 70, tr: "Akşamcı", en: "Evening coder", descTr: "Mesai bittikten sonra üretkenliğin artıyor.", descEn: "Your output climbs once the workday is over." },
  "Her Saatte": { code: "ANY", color: "var(--ink-2)", score: 50, tr: "Her saatte", en: "All hours", descTr: "Gün boyunca dengeli; belirli bir saat kalıbın yok.", descEn: "Spread evenly across the day; no fixed pattern." },
};
const RHYTHM: Record<string, Meta> = {
  "Küçük & Sık": { code: "SMF", color: "var(--hue-green)", score: 80, tr: "Küçük ve sık", en: "Small & frequent", descTr: "Sık sık küçük değişiklik gönderiyorsun: incelemesi ve geri alması kolay.", descEn: "You ship small, frequent changes: easy to review and revert." },
  "Büyük & Seyrek": { code: "BIG", color: "var(--hue-blue)", score: 65, tr: "Büyük ve seyrek", en: "Large & rare", descTr: "Özelliği bitirip tek seferde gönderiyorsun.", descEn: "You finish a feature, then ship it in one go." },
  "Patlama Yapan": { code: "BRS", color: "var(--hue-red)", score: 90, tr: "Patlamalı", en: "Bursty", descTr: "Kısa sürede çok commit: sprint ya da hackathon temposu.", descEn: "Many commits in short bursts: sprint or hackathon pace." },
  "Dengeli": { code: "BAL", color: "var(--hue-purple)", score: 55, tr: "Dengeli", en: "Balanced", descTr: "Küçük ve büyük değişiklik arasında doğal bir denge.", descEn: "A natural balance between small and large changes." },
};
const LANGP: Record<string, Meta> = {
  "Uzman": { code: "SPC", color: "var(--hue-cyan)", score: 95, tr: "Uzman", en: "Specialist", descTr: "Tek bir dilde derinleşmişsin; ekosistemi iyi tanıyorsun.", descEn: "Deep in one language and its ecosystem." },
  "Poliglot": { code: "PLY", color: "var(--hue-green)", score: 85, tr: "Poliglot", en: "Polyglot", descTr: "5'ten fazla dil kullanıyorsun; yeni yığınlara hızlı uyum sağlıyorsun.", descEn: "Five or more languages; you adapt to new stacks fast." },
  "Geçiş Aşamasında": { code: "TRN", color: "var(--hue-orange)", score: 60, tr: "Geçişte", en: "Transitioning", descTr: "Ana dilinden yeni bir dile geçiyorsun.", descEn: "Moving from your main language to a new one." },
  "Keşifçi": { code: "EXP", color: "var(--hue-yellow)", score: 70, tr: "Keşifçi", en: "Explorer", descTr: "2–4 dil arasında dengeli dağılım.", descEn: "Evenly spread across two to four languages." },
};
const MSG: Record<string, Meta> = {
  "Konvansiyonalist": { code: "CNV", color: "var(--hue-purple)", score: 90, tr: "Konvansiyonel", en: "Conventional", descTr: "feat:, fix:, chore: düzenini tutarlı kullanıyorsun; changelog için ideal.", descEn: "Consistent feat:, fix:, chore: prefixes; ideal for changelogs." },
  "Minimalist": { code: "MIN", color: "var(--ink-2)", score: 40, tr: "Minimalist", en: "Minimalist", descTr: "Kısa mesajlar. Hızlı ama zamanla bağlam kayboluyor.", descEn: "Short messages. Fast, but context fades over time." },
  "Anlatıcı": { code: "NAR", color: "var(--hue-green)", score: 80, tr: "Anlatıcı", en: "Storyteller", descTr: "Mesajların \"neden\"i de açıklıyor; ekip için değerli.", descEn: "Your messages explain the why, which helps the team." },
  "Karma": { code: "MIX", color: "var(--hue-yellow)", score: 60, tr: "Karma", en: "Mixed", descTr: "Duruma göre değişen, tutarlı olmayan bir stil.", descEn: "Style changes with the situation." },
};
const FOCUS: Record<string, Meta> = {
  "Tek Proje": { code: "ONE", color: "var(--hue-cyan)", score: 90, tr: "Tek proje", en: "Single project", descTr: "Commitlerin büyük kısmı tek projede: derin odak.", descEn: "Most commits go to one project: deep focus." },
  "Çok Ön Yüz": { code: "MLT", color: "var(--hue-purple)", score: 70, tr: "Çoklu repo", en: "Multi-repo", descTr: "2–5 repo arasında dengeli; bağlam değiştirmekte rahatsın.", descEn: "Balanced across two to five repos; comfortable switching context." },
  "Keşifçi": { code: "WDE", color: "var(--hue-yellow)", score: 60, tr: "Geniş yelpaze", en: "Wide ranging", descTr: "6'dan fazla repoya commit; yeni projeler denemekten çekinmiyorsun.", descEn: "Commits across six or more repos; you like trying new projects." },
};

const DIMS: { key: keyof DeveloperDNA; tr: string; en: string; map: Record<string, Meta> }[] = [
  { key: "workTime", tr: "Çalışma zamanı", en: "Work time", map: WORK },
  { key: "commitRhythm", tr: "Commit ritmi", en: "Commit rhythm", map: RHYTHM },
  { key: "langProfile", tr: "Dil profili", en: "Language profile", map: LANGP },
  { key: "msgQuality", tr: "Mesaj stili", en: "Message style", map: MSG },
  { key: "focusStyle", tr: "Odak", en: "Focus", map: FOCUS },
];

function translateType(t: string, l: Lang) {
  if (l !== "en") return t;
  return t
    .replace("Gece Çalışan", "Night-shift")
    .replace("Sabah Erken Kalkan", "Early-rising")
    .replace("Akşamcı", "Evening")
    .replace("Öğleden Sonra Üretken", "Afternoon")
    .replace("Uzmanı", "specialist")
    .replace("Poliglot Geliştirici", "polyglot developer")
    .replace("Yazarı", "developer")
    .replace("· Proje Gezgini", "· project explorer")
    .replace("· Sprint Ustası", "· sprint master")
    .replace("· Sürekli Teslimatçı", "· continuous shipper")
    .replace("Bağımsız Geliştirici", "independent developer");
}

export default function DeveloperDNACard({ dna, username }: { dna: DeveloperDNA | null; username: string }) {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const { shape, h, w } = useWidgetSize();
  const [open, setOpen] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  if (!dna) {
    return (
      <Panel title="Developer DNA" icon={Dna}>
        <p className="text-[12.5px] text-ink-3">{l === "en" ? "Needs some commit history to read your patterns." : "Kalıplarını okumak için biraz commit geçmişi gerekiyor."}</p>
      </Panel>
    );
  }

  const dims = DIMS.map((d) => {
    const v = dna[d.key] as string;
    const m = d.map[v] ?? { code: "???", color: "var(--ink-3)", score: 50, tr: v, en: v, descTr: "", descEn: "" };
    return { label: d[l], m, value: m[l], desc: l === "en" ? m.descEn : m.descTr };
  });
  const genotype = dims.map((d) => d.m.code).join("-");
  const type = translateType(dna.developerType, l);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/u/${username}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* blocked */
    }
  };

  const strand = (height = 6) => (
    <div className="flex w-full gap-[3px]" aria-hidden>
      {dims.map((d, i) => (
        <span key={i} className="flex-1 rounded-[2px]" style={{ height, background: d.m.color, opacity: 0.35 + (d.m.score / 100) * 0.65 }} />
      ))}
    </div>
  );

  return (
    <Panel
      title="Developer DNA"
      icon={Dna}
      meta={shape === "glance" ? undefined : `${dna.confidence}% ${l === "en" ? "confidence" : "güven"}`}
      actions={
        shape === "block" ? (
          <button type="button" className="btn btn-ghost btn-sm" onClick={copy}>
            {copied ? <Check className="text-good" /> : <Link2 />}
            {copied ? (l === "en" ? "Copied" : "Kopyalandı") : l === "en" ? "Share" : "Paylaş"}
          </button>
        ) : undefined
      }
    >
      {shape === "glance" && (
        <div className="flex h-full flex-col">
          <p className="text-[14px] font-semibold leading-snug text-ink line-clamp-3">{type}</p>
          <div className="mt-auto flex flex-col gap-1.5">
            <code className="font-mono text-[10.5px] text-ink-3 truncate">{genotype}</code>
            {strand(5)}
          </div>
        </div>
      )}

      {shape === "strip" && (
        <div className="flex h-full flex-col justify-center gap-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[15px] font-semibold text-ink truncate">{type}</p>
            <code className="shrink-0 font-mono text-[11.5px] text-ink-3">{genotype}</code>
          </div>
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${w >= 3 ? 5 : 3}, minmax(0,1fr))` }}>
            {dims.slice(0, w >= 3 ? 5 : 3).map((d) => (
              <div key={d.label} className="min-w-0 rounded-[var(--r-control)] border border-line bg-raised px-2 py-1.5">
                <div className="truncate text-[10.5px] text-ink-4">{d.label}</div>
                <div className="truncate text-[12.5px] font-medium" style={{ color: d.m.color }}>{d.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(shape === "column" || shape === "block") && (
        <div className="flex h-full flex-col gap-3">
          <div>
            <p className="text-[15px] font-semibold leading-snug text-ink">{type}</p>
            <code className="mt-1 block font-mono text-[11.5px] text-ink-3">{genotype}</code>
          </div>
          {strand(6)}
          <ul className="flex flex-1 min-h-0 flex-col overflow-y-auto">
            {dims.map((d, i) => {
              const expanded = open === i || (shape === "block" && h >= 3);
              return (
                <li key={d.label} className="border-b border-line last:border-0">
                  <button type="button" className="flex w-full items-center gap-3 py-2 text-left" onClick={() => setOpen(open === i ? null : i)} aria-expanded={expanded}>
                    <span className="w-9 shrink-0 font-mono text-[11px] font-semibold" style={{ color: d.m.color }}>{d.m.code}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-[11.5px] text-ink-3">{d.label}</span>
                        <span className="shrink-0 text-[12.5px] font-medium text-ink">{d.value}</span>
                      </span>
                      <Track value={d.m.score} color={d.m.color} height={3} className="mt-1.5" />
                    </span>
                    {!(shape === "block" && h >= 3) && <ChevronDown size={13} className={cn("shrink-0 text-ink-4 transition-transform", open === i && "rotate-180")} />}
                  </button>
                  {expanded && d.desc && <p className="pb-2.5 pl-12 text-[12px] leading-snug text-ink-3">{d.desc}</p>}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Panel>
  );
}
