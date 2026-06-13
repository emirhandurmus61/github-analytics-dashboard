"use client";

import { Moon, Sunrise, Sun, Sunset, Clock,
  GitCommit, Zap, BarChart2, Shuffle,
  Code2, Globe, Layers, Compass,
  AlignLeft, Minimize2, BookOpen, Blend,
  FolderGit2, LayoutGrid, Map,
  Share2, Copy, Check } from "lucide-react";
import { useState } from "react";
import type { DeveloperDNA } from "@/lib/developer-dna";

const DIM_ICONS: Record<string, React.ReactNode> = {
  "Gece Kuşu":        <Moon size={13} />,
  "Sabahçı":          <Sunrise size={13} />,
  "Öğleden Sonracı":  <Sun size={13} />,
  "Akşamcı":          <Sunset size={13} />,
  "Her Saatte":       <Clock size={13} />,

  "Küçük & Sık":      <GitCommit size={13} />,
  "Büyük & Seyrek":   <Zap size={13} />,
  "Patlama Yapan":    <BarChart2 size={13} />,
  "Dengeli":          <Shuffle size={13} />,

  "Uzman":            <Code2 size={13} />,
  "Poliglot":         <Globe size={13} />,
  "Geçiş Aşamasında": <Layers size={13} />,
  "Keşifçi":          <Compass size={13} />,

  "Konvansiyonalist": <AlignLeft size={13} />,
  "Minimalist":       <Minimize2 size={13} />,
  "Anlatıcı":         <BookOpen size={13} />,
  "Karma":            <Blend size={13} />,

  "Tek Proje":        <FolderGit2 size={13} />,
  "Çok Ön Yüz":       <LayoutGrid size={13} />,
};

type Dimension = {
  label: string;
  value: string;
  desc: string;
};

const DIMENSIONS = (dna: DeveloperDNA): Dimension[] => [
  {
    label: "Çalışma Zamanı",
    value: dna.workTime,
    desc: "Commit aktivitesinin yoğunlaştığı saat dilimi",
  },
  {
    label: "Commit Ritmi",
    value: dna.commitRhythm,
    desc: "Commit büyüklüğü ve sıklığına göre çalışma stili",
  },
  {
    label: "Dil Profili",
    value: dna.langProfile,
    desc: "Kullanılan programlama dili çeşitliliği",
  },
  {
    label: "Mesaj Kalitesi",
    value: dna.msgQuality,
    desc: "Commit mesajlarının tarzı ve conventional commit uyumu",
  },
  {
    label: "Odak Stili",
    value: dna.focusStyle,
    desc: "Proje çeşitliliği ve commit dağılımı",
  },
];

export default function DeveloperDNACard({
  dna,
  accentColor,
  accentBg,
  accentBorder,
  username,
}: {
  dna: DeveloperDNA;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  username: string;
}) {
  const [copied, setCopied] = useState(false);

  function copyShare() {
    const url = `${window.location.origin}/u/${username}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div
      className="rounded-2xl border h-full flex flex-col p-5 gap-4"
      style={{ borderColor: accentBorder, backgroundColor: accentBg }}
    >
      {/* Başlık */}
      <div className="flex items-start justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
          >
            <Map size={15} />
          </div>
          <div>
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Developer DNA</p>
            <p className="text-sm font-semibold text-zinc-100 mt-0.5 leading-tight">{dna.developerType}</p>
          </div>
        </div>
        <button
          onClick={copyShare}
          title="Profil linkini kopyala"
          className="shrink-0 flex items-center gap-1.5 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
        >
          {copied ? <Check size={12} className="text-emerald-400" /> : <Share2 size={12} />}
          {copied ? "Kopyalandı" : "Paylaş"}
        </button>
      </div>

      {/* Güven göstergesi */}
      {dna.confidence < 60 && (
        <p className="text-xs text-zinc-600 -mt-1 shrink-0">
          Daha fazla commit ile analiz hassaslaşır ({dna.confidence}% güven)
        </p>
      )}

      {/* 5 boyut */}
      <div className="grid grid-cols-1 gap-2 flex-1">
        {DIMENSIONS(dna).map((dim) => (
          <div
            key={dim.label}
            className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-3 py-2"
          >
            <span className="text-xs text-zinc-500 shrink-0 w-28">{dim.label}</span>
            <div
              className="flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium"
              style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
            >
              {DIM_ICONS[dim.value] ?? <Code2 size={13} />}
              {dim.value}
            </div>
          </div>
        ))}
      </div>

      {/* Alt bilgi */}
      <p className="text-[10px] text-zinc-700 shrink-0 text-center">
        Son 365 günlük commit verisi üzerinden hesaplanır · her sync'te güncellenir
      </p>
    </div>
  );
}
