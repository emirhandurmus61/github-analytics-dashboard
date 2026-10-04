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
import { useLanguage } from "@/lib/i18n";
import type { DeveloperDNA } from "@/lib/developer-dna";

/* ─── Boyut meta verisi ─── */

type DimMeta = {
  icon: React.ReactNode;
  color: string;
  labelTr: string;
  labelEn: string;
  descTr: string;
  descEn: string;
  score: number; // 0-100 görsel doluluk
};

const WORK_TIME_META: Record<string, DimMeta> = {
  "Gece Kuşu":       { icon: <Moon size={14} />,    color: "#818cf8", score: 85, labelTr: "Gece Kuşu",       labelEn: "Night Owl",         descTr: "Commitlerinin büyük bölümü gece yarısından sabaha kadar olan saatlerde. Sessiz ortamda odaklanıyorsun.", descEn: "Most commits happen from midnight to dawn. You focus best in quiet environments." },
  "Sabahçı":         { icon: <Sunrise size={14} />, color: "#fb923c", score: 75, labelTr: "Sabahçı",         labelEn: "Early Bird",        descTr: "Sabah erken saatlerde en verimli haldeyken kod yazıyorsun. Günü kodla başlatıyorsun.", descEn: "You code when most productive in early morning, kicking off the day with code." },
  "Öğleden Sonracı": { icon: <Sun size={14} />,     color: "#fbbf24", score: 60, labelTr: "Öğleden Sonracı", labelEn: "Afternoon Coder",   descTr: "Öğleden sonra doruk noktasına ulaşıyorsun. Sabah toplantıları bittikten sonra ritme giriyorsun.", descEn: "You reach your peak in the afternoon, finding your groove after morning meetings." },
  "Akşamcı":         { icon: <Sunset size={14} />,  color: "#f97316", score: 70, labelTr: "Akşamcı",         labelEn: "Evening Worker",    descTr: "İş günü bittikten sonra gerçek üretkenlik başlıyor. Akşam saatlerinde commit sayın artıyor.", descEn: "True productivity begins after the workday. Your commits surge in evening hours." },
  "Her Saatte":      { icon: <Clock size={14} />,   color: "#94a3b8", score: 50, labelTr: "Her Saatte",      labelEn: "All Hours",         descTr: "Gün boyunca dengeli dağılmış. Belirli bir kalıp yok — ihtiyaç duydukça kodluyorsun.", descEn: "Balanced across the entire day. No fixed pattern — you code whenever needed." },
};

const RHYTHM_META: Record<string, DimMeta> = {
  "Küçük & Sık":   { icon: <GitCommit size={14} />, color: "#34d399", score: 80, labelTr: "Küçük & Sık",   labelEn: "Small & Frequent",   descTr: "Sık sık küçük değişiklikler atıyorsun. CI dostu, geri alması kolay, gözden geçirmesi rahat bir stil.", descEn: "You push small, frequent changes. CI-friendly, easy to revert and review." },
  "Büyük & Seyrek": { icon: <Zap size={14} />,        color: "#60a5fa", score: 65, labelTr: "Büyük & Seyrek", labelEn: "Large & Infrequent", descTr: "Az sayıda ama kapsamlı commit. Büyük özellikleri tamamlayıp tek seferde göndermeyi tercih ediyorsun.", descEn: "Fewer but comprehensive commits. You prefer completing big features before shipping." },
  "Patlama Yapan": { icon: <TrendingUp size={14} />, color: "#f43f5e", score: 90, labelTr: "Patlama Yapan", labelEn: "Burst",             descTr: "Kısa sürede çok sayıda commit: sprint veya hackathon tarzı çalışma. Enerjini biriktirip boşaltıyorsun.", descEn: "Many commits in short bursts: sprint or hackathon style. You accumulate and unleash energy." },
  "Dengeli":       { icon: <Shuffle size={14} />,    color: "#a78bfa", score: 55, labelTr: "Dengeli",       labelEn: "Balanced",          descTr: "Küçük ile büyük arasında doğal denge. Koşullara göre adapte olan esnek bir commit stili.", descEn: "A natural balance between small and large changes. Flexible style adapting to needs." },
};

const LANG_META: Record<string, DimMeta> = {
  "Uzman":            { icon: <Code2 size={14} />,   color: "#22d3ee", score: 95, labelTr: "Uzman",            labelEn: "Specialist",    descTr: "Tek bir dilde derin uzmanlık. Ekosistemi, idiomları ve en iyi pratikleri içselleştirmişsin.", descEn: "Deep expertise in a single language. Internalized ecosystem, idioms, and best practices." },
  "Poliglot":         { icon: <Globe size={14} />,   color: "#4ade80", score: 85, labelTr: "Poliglot",         labelEn: "Polyglot",      descTr: "5+ farklı dil kullanıyorsun. Yeni teknolojilere adaptasyon kolaylığın var, geniş bakış açısı.", descEn: "You use 5+ different languages. Quick to adapt to new stacks with a broad perspective." },
  "Geçiş Aşamasında": { icon: <Layers size={14} />,  color: "#fb923c", score: 60, labelTr: "Geçiş Aşamasında", labelEn: "Transitioning", descTr: "Birincil dilinden uzaklaşıp yeni bir dile geçiş yapıyorsun. Aktif bir öğrenme sürecinin içindesin.", descEn: "Moving away from your primary language to a new stack. Active learning process." },
  "Keşifçi":          { icon: <Compass size={14} />, color: "#f59e0b", score: 70, labelTr: "Keşifçi",          labelEn: "Explorer",      descTr: "2-4 dil arasında dengeli dağılım. Birden fazla alanda yetkin olmayı tercih ediyorsun.", descEn: "Balanced distribution across 2-4 languages. Prefer proficiency in multiple domains." },
};

const MSG_META: Record<string, DimMeta> = {
  "Konvansiyonalist": { icon: <AlignLeft size={14} />, color: "#a78bfa", score: 90, labelTr: "Konvansiyonalist", labelEn: "Conventionalist", descTr: "feat:, fix:, chore: gibi conventional commit formatını tutarlı kullanıyorsun. Changelog otomasyonu için ideal.", descEn: "Consistent use of conventional commits (feat:, fix:, chore:). Ideal for automated changelogs." },
  "Minimalist":       { icon: <Minus size={14} />,     color: "#94a3b8", score: 40, labelTr: "Minimalist",       labelEn: "Minimalist",       descTr: "Kısa ve öz mesajlar. \"fix bug\", \"update\" gibi. Hızlısın ama geçmişe bakınca bağlam kaybolabiliyor.", descEn: "Short and sweet messages like 'fix bug', 'update'. Fast, but context can be lost over time." },
  "Anlatıcı":         { icon: <BookOpen size={14} />,  color: "#34d399", score: 80, labelTr: "Anlatıcı",         labelEn: "Storyteller",      descTr: "Ayrıntılı commit mesajları yazıyorsun. \"Neden\" sorusunu da yanıtlayan, ekip çalışmasına değer katan bir stil.", descEn: "Detailed commit messages explaining the 'why', adding immense value to teamwork." },
  "Karma":            { icon: <Blend size={14} />,     color: "#fbbf24", score: 60, labelTr: "Karma",            labelEn: "Mixed",            descTr: "Tutarlı bir format yok ama kasıtlı bir çeşitlilik de değil. Duruma göre değişen doğal bir akış.", descEn: "Natural, evolving flow with a mix of styles depending on the situation." },
};

const FOCUS_META: Record<string, DimMeta> = {
  "Tek Proje":  { icon: <FolderGit2 size={14} />,  color: "#22d3ee", score: 90, labelTr: "Tek Proje",  labelEn: "Single Project", descTr: "Commitlerinin büyük bölümü tek projede yoğunlaşıyor. Derin odak ve süreklilik. Monorepo dostu çalışma tarzı.", descEn: "Most commits concentrate on a single project. Deep focus and continuity. Monorepo friendly." },
  "Çok Ön Yüz": { icon: <LayoutGrid size={14} />, color: "#a78bfa", score: 70, labelTr: "Çok Ön Yüz", labelEn: "Multi-Repo",     descTr: "2-5 repo arasında dengeli dağılım. Birden fazla projeyi aynı anda götürebilen, context-switch yapabilen birisin.", descEn: "Balanced distribution across 2-5 repos. Able to manage multiple projects and context-switch." },
  "Keşifçi":    { icon: <Compass size={14} />,    color: "#f59e0b", score: 60, labelTr: "Keşifçi",    labelEn: "Explorer",       descTr: "6+ farklı repoya commit. Yeni projeleri denemekten çekinmiyorsun, geniş bir teknik yelpaze inşa ediyorsun.", descEn: "Commits across 6+ repos. Not afraid to try new projects, building a wide technical toolkit." },
};

const ALL_META = [WORK_TIME_META, RHYTHM_META, LANG_META, MSG_META, FOCUS_META];

const DIM_LABELS_TR = [
  "Çalışma Zamanı",
  "Commit Ritmi",
  "Dil Profili",
  "Mesaj Stili",
  "Odak Stili",
];

const DIM_LABELS_EN = [
  "Work Time",
  "Commit Rhythm",
  "Language Profile",
  "Message Style",
  "Focus Style",
];

const DIM_KEYS: (keyof DeveloperDNA)[] = [
  "workTime",
  "commitRhythm",
  "langProfile",
  "msgQuality",
  "focusStyle",
];

function translateDeveloperType(typeStr: string, lang: string): string {
  if (lang !== "en") return typeStr;
  return typeStr
    .replace("Gece Çalışan", "Night Owl")
    .replace("Sabah Erken Kalkan", "Early Bird")
    .replace("Akşamcı", "Evening Worker")
    .replace("Öğleden Sonra Üretken", "Afternoon Achiever")
    .replace("Uzmanı", "Specialist")
    .replace("Poliglot Geliştirici", "Polyglot Developer")
    .replace("Yazarı", "Developer")
    .replace("· Proje Gezgini", "· Project Explorer")
    .replace("· Sprint Ustası", "· Sprint Master")
    .replace("· Sürekli Teslimatçı", "· Continuous Shipper")
    .replace("Bağımsız Geliştirici", "Independent Developer");
}

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
  const { lang } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [active, setActive] = useState<number | null>(null);

  function copyShare() {
    const url = `${window.location.origin}/u/${username}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const dimLabels = lang === "en" ? DIM_LABELS_EN : DIM_LABELS_TR;

  const dims = DIM_KEYS.map((k, i) => {
    const val = dna[k] as string;
    const meta = ALL_META[i][val] ?? {
      icon: <Code2 size={14} />,
      color: "#6b7280",
      score: 50,
      labelTr: val,
      labelEn: val,
      descTr: "",
      descEn: "",
    };
    return {
      label: dimLabels[i],
      value: lang === "en" ? meta.labelEn : meta.labelTr,
      desc: lang === "en" ? meta.descEn : meta.descTr,
      meta,
    };
  });

  const devType = translateDeveloperType(dna.developerType, lang);

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
                {devType}
              </p>
            </div>
          </div>
          <button
            onClick={copyShare}
            title={lang === "en" ? "Copy profile link" : "Profil linkini kopyala"}
            className="shrink-0 flex items-center gap-1.5 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-400 transition-all hover:border-zinc-600 hover:text-zinc-200 hover:bg-zinc-800 cursor-pointer"
          >
            {copied ? <Check size={11} className="text-emerald-400" /> : <Share2 size={11} />}
            {copied ? (lang === "en" ? "Copied" : "Kopyalandı") : (lang === "en" ? "Share" : "Paylaş")}
          </button>
        </div>

        {/* Güven skoru */}
        {dna.confidence < 60 && (
          <p className="mt-2.5 text-[10px] text-zinc-600 bg-zinc-800/50 rounded-lg px-2.5 py-1.5">
            {lang === "en"
              ? `Analysis sharpens with more commits — currently ${dna.confidence}% confidence`
              : `Daha fazla commit ile analiz hassaslaşır — şu an %${dna.confidence} güven`}
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
              className="w-full text-left rounded-xl border transition-all duration-200 cursor-pointer"
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
                <div className="px-3 pb-3 pt-0">
                  <p
                    className="text-xs leading-relaxed rounded-lg px-3 py-2"
                    style={{ color: `${dim.meta.color}cc`, backgroundColor: `${dim.meta.color}08`, borderLeft: `2px solid ${dim.meta.color}40` }}
                  >
                    {dim.desc}
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
          {lang === "en" ? "Last 365 days · updates on every sync" : "Son 365 gün · her sync'te güncellenir"}
        </p>
        <div className="flex items-center gap-1">
          <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-zinc-600">{lang === "en" ? "Live" : "Canlı"}</span>
        </div>
      </div>
    </div>
  );
}
