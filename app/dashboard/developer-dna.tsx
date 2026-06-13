"use client";

import {
  Moon, Sunrise, Sun, Sunset, Clock,
  GitCommit, Zap, TrendingUp, Shuffle,
  Code2, Globe, Layers, Compass,
  AlignLeft, Minus, BookOpen, Blend,
  FolderGit2, LayoutGrid, Map, Share2, Check,
} from "lucide-react";
import { useState } from "react";
import { useThemeColors } from "@/components/theme-provider";
import type { DeveloperDNA } from "@/lib/developer-dna";

/* ─── Boyut meta verisi ─── */

type DimMeta = {
  icon: React.ReactNode;
  color: string;
  desc: string;
  score: number; // 0-100 görsel doluluk
};

const WORK_TIME_META: Record<string, DimMeta> = {
  "Gece Kuşu":       { icon: <Moon size={14} />,    color: "#818cf8", score: 85, desc: "Commitlerinin büyük bölümü gece yarısından sabaha kadar olan saatlerde. Sessiz ortamda odaklanıyorsun." },
  "Sabahçı":         { icon: <Sunrise size={14} />, color: "#fb923c", score: 75, desc: "Sabah erken saatlerde en verimli haldeyken kod yazıyorsun. Günü kodla başlatıyorsun." },
  "Öğleden Sonracı": { icon: <Sun size={14} />,     color: "#fbbf24", score: 60, desc: "Öğleden sonra doruk noktasına ulaşıyorsun. Sabah toplantıları bittikten sonra ritme giriyorsun." },
  "Akşamcı":         { icon: <Sunset size={14} />,  color: "#f97316", score: 70, desc: "İş günü bittikten sonra gerçek üretkenlik başlıyor. Akşam saatlerinde commit sayın artıyor." },
  "Her Saatte":      { icon: <Clock size={14} />,   color: "#94a3b8", score: 50, desc: "Gün boyunca dengeli dağılmış. Belirli bir kalıp yok — ihtiyaç duydukça kodluyorsun." },
};

const RHYTHM_META: Record<string, DimMeta> = {
  "Küçük & Sık":   { icon: <GitCommit size={14} />,   color: "#34d399", score: 80, desc: "Sık sık küçük değişiklikler atıyorsun. CI dostu, geri alması kolay, gözden geçirmesi rahat bir stil." },
  "Büyük & Seyrek": { icon: <Zap size={14} />,          color: "#60a5fa", score: 65, desc: "Az sayıda ama kapsamlı commit. Büyük özellikleri tamamlayıp tek seferde göndermeyi tercih ediyorsun." },
  "Patlama Yapan": { icon: <TrendingUp size={14} />,   color: "#f43f5e", score: 90, desc: "Kısa sürede çok sayıda commit: sprint veya hackathon tarzı çalışma. Enerjini biriктirip boşaltıyorsun." },
  "Dengeli":       { icon: <Shuffle size={14} />,      color: "#a78bfa", score: 55, desc: "Küçük ile büyük arasında doğal denge. Koşullara göre adapte olan esnek bir commit stili." },
};

const LANG_META: Record<string, DimMeta> = {
  "Uzman":            { icon: <Code2 size={14} />,   color: "#22d3ee", score: 95, desc: "Tek bir dilde derin uzmanlık. Ekosistemi, idiomları ve en iyi pratikleri içselleştirmişsin." },
  "Poliglot":         { icon: <Globe size={14} />,   color: "#4ade80", score: 85, desc: "5+ farklı dil kullanıyorsun. Yeni teknolojilere adaptasyon kolaylığın var, geniş bakış açısı." },
  "Geçiş Aşamasında": { icon: <Layers size={14} />,  color: "#fb923c", score: 60, desc: "Birincil dilinden uzaklaşıp yeni bir dile geçiş yapıyorsun. Aktif bir öğrenme sürecinin içindesin." },
  "Keşifçi":          { icon: <Compass size={14} />, color: "#f59e0b", score: 70, desc: "2-4 dil arasında dengeli dağılım. Birden fazla alanda yetkin olmayı tercih ediyorsun." },
};

const MSG_META: Record<string, DimMeta> = {
  "Konvansiyonalist": { icon: <AlignLeft size={14} />, color: "#a78bfa", score: 90, desc: "feat:, fix:, chore: gibi conventional commit formatını tutarlı kullanıyorsun. Changelog otomasyonu için ideal." },
  "Minimalist":       { icon: <Minus size={14} />,     color: "#94a3b8", score: 40, desc: "Kısa ve öz mesajlar. \"fix bug\", \"update\" gibi. Hızlısın ama geçmişe bakınca bağlam kaybolabiliyor." },
  "Anlatıcı":         { icon: <BookOpen size={14} />,  color: "#34d399", score: 80, desc: "Ayrıntılı commit mesajları yazıyorsun. \"Neden\" sorusunu da yanıtlayan, ekip çalışmasına değer katan bir stil." },
  "Karma":            { icon: <Blend size={14} />,     color: "#fbbf24", score: 60, desc: "Tutarlı bir format yok ama kasıtlı bir çeşitlilik de değil. Duruma göre değişen doğal bir akış." },
};

const FOCUS_META: Record<string, DimMeta> = {
  "Tek Proje":  { icon: <FolderGit2 size={14} />,  color: "#22d3ee", score: 90, desc: "Commitlerinin büyük bölümü tek projede yoğunlaşıyor. Derin odak ve süreklilik. Monorepo dostu çalışma tarzı." },
  "Çok Ön Yüz": { icon: <LayoutGrid size={14} />, color: "#a78bfa", score: 70, desc: "2-5 repo arasında dengeli dağılım. Birden fazla projeyi aynı anda götürebilen, context-switch yapabilen birisin." },
  "Keşifçi":    { icon: <Compass size={14} />,    color: "#f59e0b", score: 60, desc: "6+ farklı repoya commit. Yeni projeleri denemekten çekinmiyorsun, geniş bir teknik yelpaze inşa ediyorsun." },
};

const ALL_META = [WORK_TIME_META, RHYTHM_META, LANG_META, MSG_META, FOCUS_META];

const DIM_LABELS = [
  "Çalışma Zamanı",
  "Commit Ritmi",
  "Dil Profili",
  "Mesaj Stili",
  "Odak Stili",
];

const DIM_KEYS: (keyof DeveloperDNA)[] = [
  "workTime",
  "commitRhythm",
  "langProfile",
  "msgQuality",
  "focusStyle",
];

/* ─── Bileşen ─── */

export default function DeveloperDNACard({
  dna,
  username,
}: {
  dna: DeveloperDNA;
  username: string;
  accentColor?: string;
  accentBg?: string;
  accentBorder?: string;
}) {
  const theme = useThemeColors();
  const [copied, setCopied] = useState(false);
  const [active, setActive] = useState<number | null>(null);

  function copyShare() {
    const url = `${window.location.origin}/u/${username}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const dims = DIM_KEYS.map((k, i) => {
    const val = dna[k] as string;
    const meta = ALL_META[i][val] ?? { icon: <Code2 size={14} />, color: "#6b7280", score: 50, desc: "" };
    return { label: DIM_LABELS[i], value: val, meta };
  });

  const activeDim = active !== null ? dims[active] : null;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 h-full flex flex-col overflow-hidden">

      {/* ── Gradient başlık ── */}
      <div
        className="relative px-5 pt-5 pb-4 shrink-0"
        style={{
          background: `linear-gradient(135deg, ${theme.accent}12 0%, transparent 60%)`,
          borderBottom: `1px solid ${theme.accentBorder}`,
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl shrink-0"
              style={{ backgroundColor: `${theme.accent}20`, color: theme.accent, boxShadow: `0 0 12px ${theme.accent}25` }}
            >
              <Map size={16} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-0.5">Developer DNA</p>
              <p
                className="text-sm font-bold leading-tight"
                style={{ color: theme.accent }}
              >
                {dna.developerType}
              </p>
            </div>
          </div>
          <button
            onClick={copyShare}
            title="Profil linkini kopyala"
            className="shrink-0 flex items-center gap-1.5 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-400 transition-all hover:border-zinc-600 hover:text-zinc-200 hover:bg-zinc-800"
          >
            {copied ? <Check size={11} className="text-emerald-400" /> : <Share2 size={11} />}
            {copied ? "Kopyalandı" : "Paylaş"}
          </button>
        </div>

        {/* Güven skoru */}
        {dna.confidence < 60 && (
          <p className="mt-2.5 text-[10px] text-zinc-600 bg-zinc-800/50 rounded-lg px-2.5 py-1.5">
            Daha fazla commit ile analiz hassaslaşır — şu an %{dna.confidence} güven
          </p>
        )}
      </div>

      {/* ── 5 boyut ── */}
      <div className="flex-1 min-h-0 overflow-auto custom-scroll p-4 space-y-2">
        {dims.map((dim, i) => {
          const isActive = active === i;
          return (
            <button
              key={dim.label}
              onClick={() => setActive(isActive ? null : i)}
              className="w-full text-left rounded-xl border transition-all duration-200"
              style={{
                borderColor: isActive ? `${dim.meta.color}40` : "#27272a",
                backgroundColor: isActive ? `${dim.meta.color}08` : "transparent",
              }}
            >
              {/* Satır */}
              <div className="flex items-center gap-3 px-3 py-2.5">
                {/* İkon */}
                <div
                  className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0 transition-all"
                  style={{
                    backgroundColor: `${dim.meta.color}18`,
                    color: dim.meta.color,
                    boxShadow: isActive ? `0 0 10px ${dim.meta.color}30` : "none",
                  }}
                >
                  {dim.meta.icon}
                </div>

                {/* Etiket + değer */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wide">{dim.label}</span>
                    <span
                      className="text-xs font-semibold shrink-0 ml-2"
                      style={{ color: dim.meta.color }}
                    >
                      {dim.value}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1 w-full rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${dim.meta.score}%`,
                        background: `linear-gradient(90deg, ${dim.meta.color}80, ${dim.meta.color})`,
                        boxShadow: isActive ? `0 0 6px ${dim.meta.color}60` : "none",
                      }}
                    />
                  </div>
                </div>

                {/* Chevron */}
                <svg
                  className="shrink-0 text-zinc-700 transition-transform duration-200"
                  style={{ transform: isActive ? "rotate(180deg)" : "rotate(0deg)" }}
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>

              {/* Açıklama (expand) */}
              {isActive && (
                <div
                  className="px-3 pb-3 pt-0"
                >
                  <p
                    className="text-xs leading-relaxed rounded-lg px-3 py-2"
                    style={{ color: `${dim.meta.color}cc`, backgroundColor: `${dim.meta.color}08`, borderLeft: `2px solid ${dim.meta.color}40` }}
                  >
                    {dim.meta.desc}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Alt bilgi ── */}
      <div
        className="px-4 py-2.5 shrink-0 flex items-center justify-between"
        style={{ borderTop: "1px solid #27272a" }}
      >
        <p className="text-[10px] text-zinc-700">
          Son 365 gün · her sync&apos;te güncellenir
        </p>
        <div className="flex items-center gap-1">
          <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-zinc-600">Canlı</span>
        </div>
      </div>
    </div>
  );
}
