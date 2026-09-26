"use client";

import Image from "next/image";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useThemeColors } from "@/components/theme-provider";
import {
  Flame, Zap, Moon, Swords, Eraser, Globe, Rocket, Trophy,
  Star, GitFork, MapPin, Calendar, Activity, Code2, Target,
  Sparkles, Award, ChevronRight, Download, ExternalLink,
  BookOpen, Timer, TrendingUp, Layers, Hash, ArrowRight,
  Link as LinkIcon, MessageCircle, Share2, Check, Copy,
  Sunrise, Sun, Sunset, Clock, GitCommit, Shuffle,
  Compass, AlignLeft, Minus, Blend, FolderGit2, LayoutGrid, Map as MapIcon,
  UserPlus, UserCheck, Users,
  Terminal, FileCode, Info, Lightbulb, AlertTriangle, AlertCircle, ShieldAlert,
  Dna, CheckCircle2, ChevronDown, Pencil,
} from "lucide-react";
import type { Badge } from "@/lib/badges";
import type { DeveloperDNA } from "@/lib/developer-dna";

/* ─── Types ─── */

type DayData = { date: string; commit_count: number };

type RepoData = {
  name: string;
  full_name: string;
  language: string | null;
  stars: number;
  forks: number;
  description?: string | null;
};

type LangData = { lang: string; bytes: number; pct: number; color: string };

type SocialLinks = {
  twitter: string | null;
  linkedin: string | null;
  website: string | null;
  discord: string | null;
};

type ProfileProps = {
  username: string;
  userId: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  profileReadme: string | null;
  readmeSource?: "github" | "custom";
  currentlyWorkingOn: string | null;
  yearlyGoal: string | null;
  techTags: string[];
  stats: { repoCount: number; commitCount: number; languageCount: number; activeDays: number };
  currentStreak: number;
  longestStreak: number;
  earnedBadges: Badge[];
  pinnedRepos: RepoData[];
  topRepos: RepoData[];
  topLanguages: LangData[];
  heatmapData: DayData[];
  widgetOrder: string[];
  widgets: Record<string, boolean>;
  socialLinks?: SocialLinks;
  developerDna?: DeveloperDNA | null;
  recordView: (userId: string) => Promise<void>;
  isOwner?: boolean;
  isLoggedIn?: boolean;
};

/* ─── Badge icon map (lucide icons instead of emojis) ─── */

const BADGE_ICONS: Record<string, typeof Rocket> = {
  first_sync: Rocket,
  streak_7: Flame,
  streak_30: Zap,
  night_owl: Moon,
  weekend_warrior: Swords,
  big_cleanup: Eraser,
  polyglot: Globe,
  open_source: Trophy,
};

const RARITY_STYLES: Record<string, { text: string; bg: string; border: string; glow: string; gradient: string }> = {
  common: {
    text: "#a1a1aa",
    bg: "rgba(161,161,170,0.04)",
    border: "rgba(161,161,170,0.12)",
    glow: "rgba(161,161,170,0.06)",
    gradient: "linear-gradient(135deg, rgba(161,161,170,0.08) 0%, rgba(161,161,170,0.02) 100%)",
  },
  rare: {
    text: "#60a5fa",
    bg: "rgba(96,165,250,0.04)",
    border: "rgba(96,165,250,0.15)",
    glow: "rgba(96,165,250,0.1)",
    gradient: "linear-gradient(135deg, rgba(96,165,250,0.1) 0%, rgba(96,165,250,0.02) 100%)",
  },
  epic: {
    text: "#c084fc",
    bg: "rgba(192,132,252,0.04)",
    border: "rgba(192,132,252,0.18)",
    glow: "rgba(192,132,252,0.12)",
    gradient: "linear-gradient(135deg, rgba(192,132,252,0.12) 0%, rgba(192,132,252,0.02) 100%)",
  },
};

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
  Rust: "#dea584", Go: "#00ADD8", CSS: "#563d7c", HTML: "#e34c26",
  Java: "#b07219", "C++": "#f34b7d", "C#": "#178600", C: "#555555",
  Ruby: "#701516", Swift: "#F05138", Kotlin: "#A97BFF", Dart: "#00B4AB",
  Shell: "#89e051", PHP: "#4F5D95", Lua: "#000080", Scala: "#c22d40",
};

/* ─── Animated number counter ─── */

function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const startTime = performance.now();
    let prev = 0;
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * value);
      if (current !== prev) {
        prev = current;
        setDisplay(current);
      }
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value, duration]);

  return <span>{display.toLocaleString("tr-TR")}</span>;
}

/* ─── Language donut chart ─── */

function LanguageDonut({ languages, size = 160 }: { languages: LangData[]; size?: number }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const theme = useThemeColors();
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 14;
  const strokeWidth = 16;

  let cumulative = 0;
  const arcs = languages.map((lang, i) => {
    const startAngle = cumulative * 360;
    cumulative += lang.pct / 100;
    const endAngle = cumulative * 360;
    const gap = 2;
    const actualStart = startAngle + gap / 2;
    const actualEnd = endAngle - gap / 2;
    const largeArc = actualEnd - actualStart > 180 ? 1 : 0;
    const startRad = ((actualStart - 90) * Math.PI) / 180;
    const endRad = ((actualEnd - 90) * Math.PI) / 180;
    return {
      ...lang,
      index: i,
      d: `M ${cx + r * Math.cos(startRad)} ${cy + r * Math.sin(startRad)} A ${r} ${r} 0 ${largeArc} 1 ${cx + r * Math.cos(endRad)} ${cy + r * Math.sin(endRad)}`,
    };
  });

  return (
    <div className="flex items-center gap-6">
      <svg width={size} height={size} className="shrink-0">
        {arcs.map((arc) => (
          <path
            key={arc.lang}
            d={arc.d}
            fill="none"
            stroke={arc.color}
            strokeWidth={hovered === arc.index ? strokeWidth + 4 : strokeWidth}
            strokeLinecap="round"
            opacity={hovered !== null && hovered !== arc.index ? 0.25 : 1}
            className="transition-all duration-300 cursor-pointer"
            onMouseEnter={() => setHovered(arc.index)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
        <Code2
          className="transition-colors duration-200"
          x={cx - 10}
          y={cy - 16}
          width={20}
          height={20}
          stroke={hovered !== null ? languages[hovered].color : "#52525b"}
        />
        <text x={cx} y={cy + 10} textAnchor="middle" className="text-[11px] font-medium" fill={hovered !== null ? languages[hovered].color : "#71717a"}>
          {hovered !== null ? `${languages[hovered].pct.toFixed(1)}%` : `${languages.length} dil`}
        </text>
      </svg>
      <div className="flex flex-col gap-1.5 min-w-0">
        {languages.map((lang, i) => (
          <button
            key={lang.lang}
            className="flex items-center gap-2 text-xs transition-all group text-left"
            style={{ opacity: hovered !== null && hovered !== i ? 0.3 : 1 }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="h-2.5 w-2.5 rounded-sm shrink-0 transition-transform group-hover:scale-125" style={{ backgroundColor: lang.color }} />
            <span className="text-zinc-300 truncate">{lang.lang}</span>
            <span className="text-zinc-600 tabular-nums ml-auto">{lang.pct.toFixed(1)}%</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ─── Mini contribution grid ─── */

function MiniHeatmap({ data }: { data: DayData[] }) {
  const theme = useThemeColors();
  const mapEntries = data.map((d): [string, number] => [d.date, d.commit_count]);
  const map = new Map(mapEntries);
  const max = Math.max(...data.map((d) => d.commit_count), 1);

  const today = new Date();
  const endDate = new Date(today);
  const dow = (today.getDay() + 6) % 7;
  endDate.setDate(endDate.getDate() + (6 - dow));
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 22 * 7 + 1);
  const sd = (startDate.getDay() + 6) % 7;
  startDate.setDate(startDate.getDate() - sd);

  const weeks: { date: string; count: number }[][] = [];
  const cursor = new Date(startDate);
  while (cursor <= endDate) {
    const week: { date: string; count: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const key = cursor.toISOString().slice(0, 10);
      week.push({ date: key, count: map.get(key) ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }

  function getColor(count: number) {
    if (count === 0) return "rgba(255,255,255,0.03)";
    const t = count / max;
    if (t < 0.25) return theme.shades[0];
    if (t < 0.5) return theme.shades[1];
    if (t < 0.75) return theme.shades[2];
    return theme.shades[3];
  }

  return (
    <div className="flex gap-[3px]">
      {weeks.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-[3px]">
          {week.map((day) => (
            <div
              key={day.date}
              className="rounded-[2px] transition-all hover:scale-150 hover:z-10 relative"
              style={{ width: 10, height: 10, backgroundColor: getColor(day.count) }}
              title={`${day.date}: ${day.count} commit`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/* ─── Stat card ─── */

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  delay = 0,
}: {
  icon: typeof Activity;
  label: string;
  value: number;
  sub?: string;
  accent?: string;
  delay?: number;
}) {
  return (
    <div
      className="animate-profile-slide-up group rounded-2xl border border-zinc-800/40 p-5 flex flex-col gap-3 relative overflow-hidden transition-all hover:border-zinc-700/60"
      style={{
        animationDelay: `${delay}ms`,
        background: "linear-gradient(145deg, rgba(24,24,27,0.8) 0%, rgba(9,9,11,0.9) 100%)",
      }}
    >
      {/* Subtle glow on hover */}
      {accent && (
        <div
          className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl"
          style={{ backgroundColor: accent }}
        />
      )}
      <div className="flex items-center gap-2 relative z-10">
        <Icon className="w-3.5 h-3.5 text-zinc-600" />
        <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-medium">{label}</p>
      </div>
      <div className="relative z-10">
        <p className="text-3xl sm:text-4xl font-black tabular-nums tracking-tight" style={{ color: accent ?? "#fafafa" }}>
          <AnimatedNumber value={value} />
        </p>
        {sub && <p className="text-[10px] text-zinc-600 mt-0.5 uppercase tracking-wider">{sub}</p>}
      </div>
    </div>
  );
}

/* ─── Developer DNA section ─── */

type DimMeta = {
  icon: React.ReactNode;
  color: string;
  score: number;
  badge: string;
  desc: string;
  superpower: string;
};

const DNA_DIM_META: Record<string, DimMeta> = {
  "Gece Kuşu": {
    icon: <Moon className="w-4 h-4" />,
    color: "#818cf8",
    score: 85,
    badge: "22:00 – 06:00 Zirve",
    desc: "Gece yarısı ve sabaha karşı en yüksek konsantrasyona ulaşıyorsun. Dış uyaranların kesildiği sessiz saatlerde derin mimari ve karmaşık kod bloklarına odaklanıyorsun.",
    superpower: "Gürültüsüz saatlerde kesintisiz odaklanma ve yüksek kaliteli kod üretimi.",
  },
  "Sabahçı": {
    icon: <Sunrise className="w-4 h-4" />,
    color: "#fb923c",
    score: 80,
    badge: "06:00 – 12:00 Zirve",
    desc: "Günü kod yazarak başlatıyor, zihnin en taze olduğu erken sabah saatlerinde en kritik teslimatlarını yapıyorsun.",
    superpower: "Günün başında kritik görevleri tamamlayarak takıma erken ivme kazandırma.",
  },
  "Öğleden Sonracı": {
    icon: <Sun className="w-4 h-4" />,
    color: "#fbbf24",
    score: 65,
    badge: "12:00 – 17:00 Zirve",
    desc: "Öğleden sonra doruk noktasına ulaşıyorsun. Sabah planlama ve toplantıları tamamlandıktan sonra asıl geliştirme ritmine giriyorsun.",
    superpower: "Toplantı ve planlama sonrası taze kararlarla yüksek hacimli üretim.",
  },
  "Akşamcı": {
    icon: <Sunset className="w-4 h-4" />,
    color: "#f97316",
    score: 75,
    badge: "17:00 – 22:00 Zirve",
    desc: "İş günü bittikten sonra gerçek üretkenliğin başlıyor. Akşam saatlerinde kesintisiz akış moduna girerek commit hacmini katlıyorsun.",
    superpower: "Günün son saatlerinde biriken fikirleri hızlıca çalışan koda dönüştürme.",
  },
  "Her Saatte": {
    icon: <Clock className="w-4 h-4" />,
    color: "#94a3b8",
    score: 55,
    badge: "24 Saat Dengeli",
    desc: "Commitlerin gün boyunca dengeli dağılmış. Belirli bir kalıba sıkışmadan, ihtiyaç duydukça ve problem olgunlaştıkça çözüm üretiyorsun.",
    superpower: "Zaman kısıtlamalarından bağımsız, yüksek esneklik ve her an hazır olma.",
  },

  "Küçük & Sık": {
    icon: <GitCommit className="w-4 h-4" />,
    color: "#34d399",
    score: 85,
    badge: "CI/CD & PR Dostu",
    desc: "Sık sık küçük ve anlamlı değişiklikler gönderiyorsun. CI/CD dostu, geri alması kolay ve ekip üyeleri için incelenmesi son derece rahat bir stil.",
    superpower: "Düşük riskli deploymentlar, kolay merge süreçleri ve hızlı iterasyon.",
  },
  "Büyük & Seyrek": {
    icon: <Zap className="w-4 h-4" />,
    color: "#60a5fa",
    score: 70,
    badge: "Büyük Özellik Teslimatı",
    desc: "Az sayıda ama kapsamlı commitler. Büyük özellikleri yerel ortamında eksiksiz tamamlayıp tek seferde sağlam adımlarla göndermeyi tercih ediyorsun.",
    superpower: "Bütünsel düşünme, kapsamlı mimari değişiklikleri tek hamlede bitirme.",
  },
  "Patlama Yapan": {
    icon: <TrendingUp className="w-4 h-4" />,
    color: "#f43f5e",
    score: 90,
    badge: "Sprint & Hackathon",
    desc: "Kısa sürede çok yüksek sayıda commit: sprint veya hackathon tarzı yoğun çalışma. Enerjini biriktirip yüksek yoğunluklu teslimat patlamaları yapıyorsun.",
    superpower: "Kritik teslim tarihlerinde ve kriz anlarında devasa çıktı üretme gücü.",
  },
  "Dengeli": {
    icon: <Shuffle className="w-4 h-4" />,
    color: "#a78bfa",
    score: 60,
    badge: "Esnek Ritim",
    desc: "Küçük düzeltmeler ile büyük modüller arasında doğal bir denge. Görevin kapsamına göre esneyebilen, pragmatik bir teslimat stili.",
    superpower: "Farklı görev gereksinimlerine hızla adapte olabilen çok yönlü ritim.",
  },

  "Uzman": {
    icon: <Code2 className="w-4 h-4" />,
    color: "#22d3ee",
    score: 95,
    badge: "Derin Uzmanlık",
    desc: "Tek bir birincil dilde derin uzmanlık. Dilin ekosistemini, tasarım kalıplarını, idiomlarını ve performans inceliklerini içselleştirmişsin.",
    superpower: "Karmaşık dil dinamiklerinde ve mimari kararlarda referans mühendis rolü.",
  },
  "Poliglot": {
    icon: <Globe className="w-4 h-4" />,
    color: "#4ade80",
    score: 88,
    badge: "5+ Çoklu Dil",
    desc: "Birden fazla farklı dili aktif olarak kullanıyorsun. Yeni teknolojilere hızlı adaptasyon, geniş teknik bakış açısı ve platform bağımsız vizyon.",
    superpower: "Farklı dil paradigmalarını (fonksiyonel, OOP, sistem) birleştirme ustalığı.",
  },
  "Geçiş Aşamasında": {
    icon: <Layers className="w-4 h-4" />,
    color: "#fb923c",
    score: 65,
    badge: "Aktif Dönüşüm",
    desc: "Birincil dilinden yeni bir teknoloji yığınına geçiş yapıyorsun. Sürekli öğrenme, dönüşüm ve kendini yenileme sürecindesin.",
    superpower: "Eski alışkanlıkları yeni paradigmalarla harmanlayarak hızla büyüme.",
  },
  "Keşifçi": {
    icon: <Compass className="w-4 h-4" />,
    color: "#f59e0b",
    score: 72,
    badge: "Teknoloji Kaşifi",
    desc: "Farklı diller ve projeler arasında dengeli dağılım. Teknoloji dünyasındaki yenilikleri denemekten ve çok yönlü araçlar geliştirmekten keyif alıyorsun.",
    superpower: "Doğru iş için doğru aracı seçebilen geniş vizyon ve cesur denemeler.",
  },

  "Konvansiyonalist": {
    icon: <AlignLeft className="w-4 h-4" />,
    color: "#a78bfa",
    score: 92,
    badge: "Conventional Commits",
    desc: "feat:, fix:, chore:, refactor: gibi semantik commit standartlarını titizlikle uyguluyorsun. Otomatik changelog ve sürümleme için mükemmel.",
    superpower: "Ekip standartlarına kusursuz uyum ve otomatik sürümleme altyapısı.",
  },
  "Minimalist": {
    icon: <Minus className="w-4 h-4" />,
    color: "#94a3b8",
    score: 45,
    badge: "Kısa & Öz Mesajlar",
    desc: "Kısa ve doğrudan mesajlar yazıyorsun. Kodun kendisini konuşturmayı tercih eden, hıza ve pratikliğe odaklı bir yaklaşım.",
    superpower: "Bürokrasiden uzak, hızlı ve pragmatik geliştirme döngüsü.",
  },
  "Anlatıcı": {
    icon: <BookOpen className="w-4 h-4" />,
    color: "#34d399",
    score: 85,
    badge: "Ayrıntılı Dokümantasyon",
    desc: "Sadece ne yapıldığını değil, 'neden' yapıldığını da anlatan ayrıntılı commit mesajları. Gelecekteki geliştiriciler ve kod arkeolojisi için altın değerinde.",
    superpower: "Kod geçmişini yaşayan bir dokümantasyona dönüştürerek bilgi kaybını önleme.",
  },
  "Karma": {
    icon: <Blend className="w-4 h-4" />,
    color: "#fbbf24",
    score: 62,
    badge: "Doğal Akış",
    desc: "Katı kalıplara bağlı kalmadan duruma göre şekillenen doğal bir mesaj akışı. Acil durumlarda hızlı, kritik yerlerde açıklayıcı.",
    superpower: "Durumun ciddiyetine ve ihtiyacına göre serbestçe şekil alan esneklik.",
  },

  "Tek Proje": {
    icon: <FolderGit2 className="w-4 h-4" />,
    color: "#22d3ee",
    score: 90,
    badge: "Derin Odaklanma",
    desc: "Commitlerinin büyük çoğunluğu ana projende toplanıyor. Monorepo dostu, yüksek süreklilik ve derin ürün sahiplenmesi göstergesi.",
    superpower: "Ürünü baştan sona avucunun içi gibi bilme ve derin konsantrasyon.",
  },
  "Çok Ön Yüz": {
    icon: <LayoutGrid className="w-4 h-4" />,
    color: "#a78bfa",
    score: 75,
    badge: "Multi-Repo Yönetimi",
    desc: "2-5 farklı repo arasında dengeli dağılım. Birden fazla mikroservisi veya kütüphaneyi eşzamanlı yürütebilen, yüksek context-switch kapasitesi.",
    superpower: "Bölünmüş sistemlerde ve çoklu projelerde yüksek koordinasyon yeteneği.",
  },
};

function DeveloperDNASection({
  dna,
  accent,
  accentBorder,
  username,
}: {
  dna: import("@/lib/developer-dna").DeveloperDNA;
  accent: string;
  accentBorder: string;
  username: string;
}) {
  const [selectedDim, setSelectedDim] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  const dims = [
    { label: "Çalışma Zamanı", key: "workTime", value: dna.workTime },
    { label: "Commit Ritmi", key: "commitRhythm", value: dna.commitRhythm },
    { label: "Dil Profili", key: "langProfile", value: dna.langProfile },
    { label: "Mesaj Stili", key: "msgQuality", value: dna.msgQuality },
    { label: "Odak Stili", key: "focusStyle", value: dna.focusStyle },
  ];

  const currentMeta = DNA_DIM_META[dims[selectedDim].value] ?? {
    icon: <Code2 className="w-4 h-4" />,
    color: accent,
    score: 70,
    badge: "Özel Profil",
    desc: "",
    superpower: "",
  };

  const handleShare = () => {
    const text = `${username} · Developer DNA: ${dna.developerType} (%${dna.confidence} Doğruluk)`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <section className="animate-profile-slide-up space-y-4" style={{ animationDelay: "550ms" }}>
      {/* Bölüm Başlığı */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${accent}15`, color: accent }}
          >
            <Dna className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              Developer DNA & Mühendislik Karakteri
            </h2>
            <p className="text-[11px] text-zinc-500">
              Git geçmişi, saat dağılımı ve teslimat ritminin yapay zeka analizi
            </p>
          </div>
        </div>

        <button
          onClick={handleShare}
          type="button"
          className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-medium">DNA Kopyalandı</span>
            </>
          ) : (
            <>
              <Share2 className="w-3 h-3 text-zinc-400" />
              <span>DNA Paylaş</span>
            </>
          )}
        </button>
      </div>

      {/* Hero Archetype Banner */}
      <div
        className="relative rounded-2xl border p-6 overflow-hidden transition-all duration-300"
        style={{
          borderColor: accentBorder,
          background: `radial-gradient(ellipse at 15% 0%, ${accent}20 0%, transparent 60%), linear-gradient(145deg, rgba(24,24,27,0.85) 0%, rgba(9,9,11,0.95) 100%)`,
          boxShadow: `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`,
        }}
      >
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            {/* Glowing avatar icon */}
            <div
              className="relative flex h-14 w-14 items-center justify-center rounded-2xl shrink-0"
              style={{
                backgroundColor: `${accent}18`,
                color: accent,
                border: `1px solid ${accent}35`,
                boxShadow: `0 0 24px ${accent}30`,
              }}
            >
              <Dna className="w-7 h-7" />
              <div
                className="absolute inset-0 rounded-2xl animate-pulse opacity-40"
                style={{ boxShadow: `0 0 16px ${accent}` }}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                  Geliştirici Arketipi
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                  style={{ backgroundColor: `${accent}15`, color: accent, border: `1px solid ${accent}30` }}
                >
                  Yapay Zeka Analizi
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {dna.developerType}
              </h3>

              <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
                Bu profil; derin odaklanma dönemlerinde yüksek verimle çalışan, sürdürülebilir mimariyi ve sürekli teslimat ritmini benimsemiş bir yazılım mühendisini temsil eder.
              </p>

              {/* Trait pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {dims.map((d) => {
                  const m = DNA_DIM_META[d.value];
                  return (
                    <span
                      key={d.label}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium border"
                      style={{
                        borderColor: m ? `${m.color}25` : "#27272a",
                        backgroundColor: m ? `${m.color}08` : "transparent",
                        color: m ? m.color : "#a1a1aa",
                      }}
                    >
                      {m?.icon}
                      <span>{d.value}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Confidence pill */}
          <div className="shrink-0 flex flex-col items-start lg:items-end gap-1.5 bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-3.5 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-zinc-200">
                %{dna.confidence} Analiz Doğruluğu
              </span>
            </div>
            <p className="text-[10px] text-zinc-500">
              Son 365 günlük Git geçmişine dayanır
            </p>
          </div>
        </div>
      </div>

      {/* 5 Boyut Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {dims.map(({ label, value }, idx) => {
          const meta = DNA_DIM_META[value] ?? {
            icon: <Code2 className="w-4 h-4" />,
            color: "#6b7280",
            score: 50,
            badge: "Standart",
            desc: "",
            superpower: "",
          };
          const isSelected = selectedDim === idx;

          return (
            <button
              key={label}
              type="button"
              onClick={() => setSelectedDim(idx)}
              className="group relative flex flex-col justify-between rounded-xl border p-4 text-left transition-all duration-200 hover:scale-[1.01]"
              style={{
                borderColor: isSelected ? meta.color : `${meta.color}30`,
                backgroundColor: isSelected ? `${meta.color}12` : "rgba(24,24,27,0.6)",
                boxShadow: isSelected ? `0 0 20px ${meta.color}20` : "none",
              }}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
                    >
                      {meta.icon}
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                      {label}
                    </span>
                  </div>

                  <span
                    className="rounded-full px-1.5 py-0.5 text-[8px] font-bold tracking-wide uppercase"
                    style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
                  >
                    {meta.badge}
                  </span>
                </div>

                {/* Trait Value */}
                <h4
                  className="text-sm font-bold mt-1 tracking-tight"
                  style={{ color: meta.color }}
                >
                  {value}
                </h4>

                {/* Progress Intensity bar */}
                <div className="my-2.5 h-1 w-full rounded-full bg-zinc-800/80 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${meta.score}%`,
                      background: `linear-gradient(90deg, ${meta.color}60, ${meta.color})`,
                    }}
                  />
                </div>

                {/* Description */}
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {meta.desc}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px]">
                <span className="text-zinc-500">Mühendislik Etkisi</span>
                <span className="font-semibold" style={{ color: meta.color }}>
                  Detay →
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Seçilen Boyutun Süper Gücü & Takım Avantajı */}
      <div
        className="rounded-xl border p-4 flex items-start gap-3 transition-all duration-300"
        style={{
          borderColor: `${currentMeta.color}35`,
          backgroundColor: `${currentMeta.color}08`,
        }}
      >
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0 mt-0.5"
          style={{ backgroundColor: `${currentMeta.color}20`, color: currentMeta.color }}
        >
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-bold" style={{ color: currentMeta.color }}>
            {dims[selectedDim].label}: {dims[selectedDim].value} — Süper Güç & Ekip Avantajı
          </p>
          <p className="text-xs text-zinc-300 leading-relaxed">
            {currentMeta.superpower}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─── Badge card ─── */

function BadgeCard({ badge, index }: { badge: Badge; index: number }) {
  const style = RARITY_STYLES[badge.rarity] ?? RARITY_STYLES.common;
  const Icon = BADGE_ICONS[badge.id] ?? Award;

  return (
    <div
      className="animate-profile-badge-pop group relative rounded-xl border p-4 flex items-start gap-3.5 cursor-default transition-all hover:scale-[1.02]"
      style={{
        animationDelay: `${index * 80 + 400}ms`,
        borderColor: style.border,
        background: style.gradient,
      }}
    >
      {/* Icon container */}
      <div
        className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ backgroundColor: `${style.text}12`, border: `1px solid ${style.text}20` }}
      >
        <Icon className="w-5 h-5" style={{ color: style.text }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold truncate" style={{ color: style.text }}>{badge.name}</p>
          <span
            className="shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider"
            style={{ color: style.text, backgroundColor: `${style.text}12`, border: `1px solid ${style.text}15` }}
          >
            {badge.rarity === "common" ? "C" : badge.rarity === "rare" ? "R" : "E"}
          </span>
        </div>
        <p className="text-[11px] text-zinc-500 mt-0.5 leading-relaxed">{badge.description}</p>
      </div>
    </div>
  );
}

/* ─── Repo card (premium showcase) ─── */

function RepoCard({ repo, pinned, index = 0 }: { repo: RepoData; pinned?: boolean; index?: number }) {
  const theme = useThemeColors();
  const langColor = repo.language ? (LANG_COLORS[repo.language] ?? "#6b7280") : null;

  return (
    <a
      href={`https://github.com/${repo.full_name}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col justify-between rounded-xl border p-4 transition-all duration-200 hover:scale-[1.02] overflow-hidden"
      style={{
        animationDelay: `${index * 60 + 200}ms`,
        borderColor: pinned ? `${theme.accent}35` : "rgba(39,39,42,0.6)",
        background: pinned
          ? `linear-gradient(145deg, ${theme.accentBg} 0%, rgba(9,9,11,0.95) 100%)`
          : "linear-gradient(145deg, rgba(24,24,27,0.7) 0%, rgba(9,9,11,0.9) 100%)",
        boxShadow: pinned ? `0 4px 20px ${theme.accent}12` : "none",
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-3xl pointer-events-none"
        style={{ backgroundColor: langColor ?? theme.accent }}
      />

      <div className="space-y-2 relative z-10">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            {pinned ? (
              <FolderGit2 className="w-4 h-4 shrink-0" style={{ color: theme.accent }} />
            ) : (
              <GitFork className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
            )}
            <span className="text-sm font-bold text-zinc-100 truncate group-hover:text-white transition-colors">
              {repo.name}
            </span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0" />
        </div>

        {repo.description ? (
          <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
            {repo.description}
          </p>
        ) : (
          <p className="text-xs text-zinc-600 italic">Açıklama bulunmuyor.</p>
        )}
      </div>

      <div className="mt-3 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500 relative z-10">
        <div className="flex items-center gap-3">
          {repo.language && (
            <span className="flex items-center gap-1.5 font-medium text-zinc-400">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: langColor ?? "#71717a" }}
              />
              {repo.language}
            </span>
          )}
          <span className="flex items-center gap-1 hover:text-amber-400 transition-colors">
            <Star className="w-3.5 h-3.5 text-amber-500/80" />
            <span>{repo.stars}</span>
          </span>
          <span className="flex items-center gap-1">
            <GitFork className="w-3.5 h-3.5 text-zinc-500" />
            <span>{repo.forks}</span>
          </span>
        </div>

        <span className="text-[11px] font-medium opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: theme.accent }}>
          İncele →
        </span>
      </div>
    </a>
  );
}

/* ─── Markdown Alert / Callout Parser ─── */

const ALERT_CONFIG: Record<string, {
  label: string;
  icon: React.ReactNode;
  border: string;
  bg: string;
  text: string;
  titleColor: string;
}> = {
  NOTE: {
    label: "NOTE",
    icon: <Info className="w-4 h-4 text-sky-400 shrink-0" />,
    border: "border-sky-500/40",
    bg: "bg-sky-500/[0.07]",
    text: "text-sky-200",
    titleColor: "text-sky-400",
  },
  TIP: {
    label: "TIP",
    icon: <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0" />,
    border: "border-emerald-500/40",
    bg: "bg-emerald-500/[0.07]",
    text: "text-emerald-200",
    titleColor: "text-emerald-400",
  },
  IMPORTANT: {
    label: "IMPORTANT",
    icon: <AlertCircle className="w-4 h-4 text-purple-400 shrink-0" />,
    border: "border-purple-500/40",
    bg: "bg-purple-500/[0.07]",
    text: "text-purple-200",
    titleColor: "text-purple-400",
  },
  WARNING: {
    label: "WARNING",
    icon: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
    border: "border-amber-500/40",
    bg: "bg-amber-500/[0.07]",
    text: "text-amber-200",
    titleColor: "text-amber-400",
  },
  CAUTION: {
    label: "CAUTION",
    icon: <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />,
    border: "border-rose-500/40",
    bg: "bg-rose-500/[0.07]",
    text: "text-rose-200",
    titleColor: "text-rose-400",
  },
};

function renderBlockquote(children: React.ReactNode, themeAccent: string) {
  const arr = React.Children.toArray(children);
  if (arr.length > 0) {
    const firstChild = arr[0];
    if (React.isValidElement(firstChild) && (firstChild.props as { children?: React.ReactNode })?.children) {
      const pChildren = React.Children.toArray((firstChild.props as { children?: React.ReactNode }).children);
      const firstText = typeof pChildren[0] === "string" ? pChildren[0] : "";
      const match = firstText.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\s*\n|\s+)?(.*)/i);

      if (match) {
        const type = match[1].toUpperCase();
        const alert = ALERT_CONFIG[type] ?? ALERT_CONFIG.NOTE;
        const inlineAfter = match[2];

        const newPChildren = [
          inlineAfter ? inlineAfter : null,
          ...pChildren.slice(1),
        ].filter(Boolean);

        const newFirstChild = React.cloneElement(
          firstChild as React.ReactElement<{ children?: React.ReactNode }>,
          {
            children:
              newPChildren.length === 1 && typeof newPChildren[0] === "string"
                ? newPChildren[0]
                : newPChildren,
          }
        );

        return (
          <div className={`my-4 rounded-xl border-l-4 p-4 ${alert.border} ${alert.bg} shadow-sm backdrop-blur-sm`}>
            <div className="flex items-center gap-2 mb-2 font-bold tracking-wider text-xs">
              {alert.icon}
              <span className={alert.titleColor}>{alert.label}</span>
            </div>
            <div className="text-zinc-300 leading-relaxed text-xs sm:text-sm pl-6 space-y-2">
              {newPChildren.length > 0 && newFirstChild}
              {arr.slice(1)}
            </div>
          </div>
        );
      }
    }
  }

  return (
    <blockquote
      className="border-l-4 pl-4 pr-3 py-1.5 my-4 italic rounded-r-xl"
      style={{
        borderColor: themeAccent,
        backgroundColor: `${themeAccent}08`,
        color: "#d4d4d8",
      }}
    >
      {children}
    </blockquote>
  );
}

/* ─── Code Block with Copy ─── */

function CodeBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false);
  const langMatch = /language-(\w+)/.exec(className || "");
  const lang = langMatch ? langMatch[1] : "";

  const extractText = (node: React.ReactNode): string => {
    if (typeof node === "string") return node;
    if (typeof node === "number") return String(node);
    if (Array.isArray(node)) return node.map(extractText).join("");
    if (React.isValidElement(node) && (node.props as { children?: React.ReactNode })?.children) {
      return extractText((node.props as { children?: React.ReactNode }).children);
    }
    return "";
  };

  const codeText = extractText(children).replace(/\n$/, "");

  const handleCopy = () => {
    navigator.clipboard.writeText(codeText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="relative my-4 rounded-xl border border-zinc-800/90 bg-[#0d0d10] overflow-hidden group shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/70 bg-zinc-900/60 text-xs select-none">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-zinc-500" />
          <span className="font-mono text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            {lang || "code"}
          </span>
        </div>
        <button
          onClick={handleCopy}
          type="button"
          title="Kodu Kopyala"
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Kopyalandı</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-zinc-500" />
              <span>Kopyala</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto custom-scroll text-xs sm:text-[13px] font-mono leading-relaxed text-zinc-200">
        <code>{children}</code>
      </pre>
    </div>
  );
}

/* ─── Markdown README renderer ─── */

function ProfileReadme({
  content,
  username,
  isOwner,
  source = "github",
}: {
  content: string;
  username: string;
  isOwner?: boolean;
  source?: "github" | "custom";
}) {
  const theme = useThemeColors();
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const words = useMemo(() => content.trim().split(/\s+/).length, [content]);
  const readingTime = useMemo(() => Math.max(1, Math.ceil(words / 180)), [words]);
  const isLong = content.length > 1200;

  const handleCopyRaw = () => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <section className="animate-profile-slide-up space-y-2.5" style={{ animationDelay: "500ms" }}>
      {/* Bölüm Başlığı */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${theme.accent}15`, color: theme.accent }}
          >
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-zinc-100">
                Geliştirici Manifestosu
              </h2>
              {source === "github" ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-zinc-700/60 bg-zinc-800/80 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                  <FolderGit2 className="w-3 h-3 text-zinc-400" />
                  GitHub README
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  Özel README
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500">
              Kişisel README, teknik hedefler ve yazılım felsefesi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOwner && (
            <Link
              href="/dashboard/settings#profil-sayfasi"
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
            >
              <Pencil className="w-3 h-3" />
              <span>README Düzenle</span>
            </Link>
          )}

          <button
            onClick={handleCopyRaw}
            type="button"
            title="Ham Markdown Metnini Kopyala"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Kopyalandı</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Markdown Kopyala</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor / Terminal Card Container */}
      <div
        className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 overflow-hidden shadow-2xl backdrop-blur-md"
        style={{
          boxShadow: `0 12px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)`,
        }}
      >
        {/* macOS / Editor Chrome Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/80 bg-zinc-900/60 select-none">
          <div className="flex items-center gap-3">
            {/* Window control dots */}
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
            </div>

            {/* Tab pill */}
            <div className="flex items-center gap-1.5 rounded-md bg-zinc-800/60 px-2.5 py-1 border border-zinc-700/50">
              <FileCode className="w-3 h-3 text-zinc-400" />
              <span className="text-xs font-mono font-medium text-zinc-200">
                README.md
              </span>
              <span
                className="text-[9px] font-bold uppercase tracking-wider rounded px-1"
                style={{ backgroundColor: `${theme.accent}18`, color: theme.accent }}
              >
                MD
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-zinc-500 font-mono">
            <span>{words} kelime</span>
            <span>·</span>
            <span>~{readingTime} dk okuma</span>
          </div>
        </div>

        {/* Markdown Render Area */}
        <div className="relative">
          <div
            className={`p-6 sm:p-8 prose-profile transition-all duration-300 ${
              isLong && !isExpanded ? "max-h-[500px] overflow-hidden" : ""
            }`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                div: ({ className, align, children, ...props }: any) => (
                  <div
                    className={`${className || ""} ${align === "center" ? "text-center" : ""}`}
                    {...props}
                  >
                    {children}
                  </div>
                ),
                h1: ({ children }) => (
                  <h1 className="text-2xl font-black text-white mt-6 mb-3 pb-2 border-b border-zinc-800 flex items-center gap-2 first:mt-0">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-bold text-zinc-100 mt-6 mb-2.5 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: theme.accent }} />
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-base font-semibold text-zinc-200 mt-4 mb-2">
                    {children}
                  </h3>
                ),
                p: ({ children, align, className, ...props }: any) => (
                  <p
                    className={`text-sm sm:text-[14px] text-zinc-300 leading-relaxed mb-3.5 ${
                      className || ""
                    } ${align === "center" ? "text-center" : ""}`}
                    {...props}
                  >
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="text-sm text-zinc-300 space-y-1.5 mb-4 list-disc pl-5">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="text-sm text-zinc-300 space-y-1.5 mb-4 list-decimal pl-5">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed pl-1 marker:text-zinc-500">
                    {children}
                  </li>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold text-zinc-100">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="text-zinc-200 italic">{children}</em>
                ),
                pre: ({ children }) => <div className="not-prose my-3">{children}</div>,
                code: ({ className, children }) => {
                  const match = /language-(\w+)/.exec(className || "");
                  const isBlock = Boolean(match) || (typeof children === "string" && children.includes("\n"));

                  if (isBlock) {
                    return <CodeBlock className={className}>{children}</CodeBlock>;
                  }
                  return (
                    <code
                      className="rounded-md px-1.5 py-0.5 text-xs font-mono font-medium border border-zinc-700/50 bg-zinc-800/80 text-zinc-200"
                      style={{ color: theme.accent }}
                    >
                      {children}
                    </code>
                  );
                },
                a: ({ children, href, className, ...props }: any) => {
                  // Görsel içeren bağlantılarda alt çizgi ve ikon koyma
                  const hasImage = React.Children.toArray(children).some(
                    (child: any) =>
                      React.isValidElement(child) &&
                      (child.type === "img" || (child.props as any)?.src)
                  );

                  if (hasImage) {
                    return (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block transition-opacity hover:opacity-85"
                        {...props}
                      >
                        {children}
                      </a>
                    );
                  }

                  return (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 underline underline-offset-4 font-medium transition-colors hover:opacity-80"
                      style={{ color: theme.accent }}
                      {...props}
                    >
                      <span>{children}</span>
                      <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-70" />
                    </a>
                  );
                },
                blockquote: ({ children }) => renderBlockquote(children, theme.accent),
                table: ({ children }) => (
                  <div className="my-4 w-full overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-950/70 custom-scroll shadow-md">
                    <table className="w-full text-left text-xs border-collapse">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-zinc-900/90 text-zinc-300 font-semibold border-b border-zinc-800 uppercase text-[11px] tracking-wider">
                    {children}
                  </thead>
                ),
                th: ({ children }) => (
                  <th className="px-4 py-3 font-semibold text-zinc-200 border-b border-zinc-800">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-4 py-2.5 border-b border-zinc-800/40 text-zinc-300">
                    {children}
                  </td>
                ),
                tr: ({ children }) => (
                  <tr className="hover:bg-zinc-800/25 transition-colors border-b border-zinc-800/30 last:border-b-0">
                    {children}
                  </tr>
                ),
                input: ({ type, checked }) => {
                  if (type === "checkbox") {
                    return (
                      <span className="inline-flex items-center justify-center mr-2 align-middle">
                        {checked ? (
                          <span className="flex h-4 w-4 items-center justify-center rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-bold">
                            ✓
                          </span>
                        ) : (
                          <span className="h-4 w-4 rounded border border-zinc-700 bg-zinc-800/50" />
                        )}
                      </span>
                    );
                  }
                  return <input type={type} />;
                },
                img: ({ src, alt, ...props }: any) => {
                  const srcStr = typeof src === "string" ? src : "";
                  const isBadge =
                    srcStr.includes("shields.io") ||
                    srcStr.includes("badgen.net") ||
                    srcStr.includes("/api/badge") ||
                    srcStr.includes("badge.svg");

                  const isStatCard =
                    srcStr.includes("github-readme-stats") ||
                    srcStr.includes("streak-stats") ||
                    srcStr.includes("readme-typing-svg") ||
                    srcStr.includes("github-profile-trophy") ||
                    srcStr.includes("capsule-render");

                  if (isBadge) {
                    return (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={srcStr}
                        alt={alt ?? ""}
                        loading="lazy"
                        className="inline-block align-middle my-1 mr-1.5 max-h-7 rounded transition-transform hover:scale-105"
                        {...props}
                      />
                    );
                  }

                  if (isStatCard) {
                    return (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={srcStr}
                        alt={alt ?? ""}
                        loading="lazy"
                        className="inline-block align-middle my-2 mx-1 max-w-full rounded-xl transition-all duration-200 hover:scale-[1.01]"
                        {...props}
                      />
                    );
                  }

                  return (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={srcStr}
                      alt={alt ?? ""}
                      loading="lazy"
                      className="rounded-xl max-w-full h-auto my-4 border border-zinc-800/60 shadow-lg"
                      style={{ maxHeight: 520 }}
                      {...props}
                    />
                  );
                },
                hr: () => <hr className="border-zinc-800/60 my-6" />,
              }}
            >
              {content}
            </ReactMarkdown>
          </div>

          {/* Fade out mask & Expand button when long */}
          {isLong && !isExpanded && (
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent flex items-end justify-center pb-4">
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="flex items-center gap-2 rounded-xl border border-zinc-700/80 bg-zinc-900/90 px-4 py-2 text-xs font-semibold text-zinc-200 shadow-xl backdrop-blur-md transition-all hover:bg-zinc-800 hover:border-zinc-600"
              >
                <span>Tüm README'yi Gör ({words} kelime)</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {isLong && isExpanded && (
            <div className="flex justify-center py-4 border-t border-zinc-800/60 bg-zinc-900/40">
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <span>Daha Az Göster</span>
                <ChevronDown className="w-3.5 h-3.5 rotate-180 transition-transform" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─── Focus & Featured Repositories Section ─── */

function FocusAndShowcaseSection({
  currentlyWorkingOn,
  yearlyGoal,
  pinnedRepos,
  topRepos,
  currentYear,
  isOwner,
  username,
  theme,
}: {
  currentlyWorkingOn: string | null;
  yearlyGoal: string | null;
  pinnedRepos: RepoData[];
  topRepos: RepoData[];
  currentYear: number;
  isOwner?: boolean;
  username: string;
  theme: ReturnType<typeof useThemeColors>;
}) {
  const hasFocus = Boolean(currentlyWorkingOn || yearlyGoal);
  const featuredRepos = pinnedRepos.length > 0 ? pinnedRepos : [];

  if (!hasFocus && featuredRepos.length === 0 && !isOwner) {
    return null;
  }

  return (
    <section className="animate-profile-slide-up space-y-4" style={{ animationDelay: "450ms" }}>
      {/* Bölüm Başlığı */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${theme.accent}15`, color: theme.accent }}
          >
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              Aktif Odak & 2026 Vizyonu
            </h2>
            <p className="text-[11px] text-zinc-500">
              Üzerinde çalışılan güncel teknolojiler, yıllık hedef ve öne çıkan projeler
            </p>
          </div>
        </div>

        {isOwner && (
          <Link
            href="/dashboard/settings#profil"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
          >
            <Pencil className="w-3 h-3" />
            <span>Hedef & Repo Düzenle</span>
          </Link>
        )}
      </div>

      {/* Odak Kartları: Şu an üzerinde & 2026 Hedefi */}
      {hasFocus ? (
        <div className={`grid gap-3.5 ${currentlyWorkingOn && yearlyGoal ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
          {currentlyWorkingOn && (
            <div
              className="group relative rounded-2xl border p-5 overflow-hidden transition-all duration-300 hover:border-emerald-500/40"
              style={{
                borderColor: `${theme.accent}30`,
                background: `linear-gradient(145deg, ${theme.accentBg} 0%, rgba(9,9,11,0.95) 100%)`,
              }}
            >
              {/* Radial glow */}
              <div
                className="absolute -top-12 -right-12 w-36 h-36 rounded-full opacity-10 group-hover:opacity-20 transition-opacity blur-2xl"
                style={{ backgroundColor: theme.accent }}
              />

              <div className="relative z-10 flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  {/* Pulsing live beacon */}
                  <div className="relative flex h-2.5 w-2.5">
                    <span
                      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{ backgroundColor: theme.accent }}
                    />
                    <span
                      className="relative inline-flex rounded-full h-2.5 w-2.5"
                      style={{ backgroundColor: theme.accent }}
                    />
                  </div>
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: theme.accent }}
                  >
                    Şu An Üzerinde Çalışıyor
                  </span>
                </div>
                <span className="rounded-full bg-zinc-900/80 border border-zinc-800/80 px-2 py-0.5 text-[9px] font-medium text-zinc-400 uppercase tracking-wider">
                  Aktif Sprint
                </span>
              </div>

              <p className="relative z-10 text-sm sm:text-base text-zinc-100 font-medium leading-relaxed">
                {currentlyWorkingOn}
              </p>
            </div>
          )}

          {yearlyGoal && (
            <div
              className="group relative rounded-2xl border border-amber-500/25 p-5 overflow-hidden transition-all duration-300 hover:border-amber-500/50"
              style={{
                background: "linear-gradient(145deg, rgba(245,158,11,0.08) 0%, rgba(9,9,11,0.95) 100%)",
              }}
            >
              <div
                className="absolute -top-12 -right-12 w-36 h-36 rounded-full opacity-10 group-hover:opacity-20 transition-opacity blur-2xl bg-amber-500"
              />

              <div className="relative z-10 flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
                    <Target className="w-3 h-3" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                    {currentYear} Yılı Hedefi
                  </span>
                </div>
                <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[9px] font-bold text-amber-400 uppercase tracking-wider">
                  {currentYear} VİZYONU
                </span>
              </div>

              <p className="relative z-10 text-sm sm:text-base text-zinc-100 font-medium leading-relaxed">
                {yearlyGoal}
              </p>
            </div>
          )}
        </div>
      ) : isOwner ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-6 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800/60 text-zinc-400 mb-3">
            <Target className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200">2026 Hedefini ve Aktif Çalışmanı Paylaş</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
            Ziyaretçilerine şu an ne geliştirdiğini ve bu yılki hedeflerini göstererek profilini öne çıkar.
          </p>
          <Link
            href="/dashboard/settings#profil"
            className="mt-3.5 inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold"
            style={{ backgroundColor: theme.accent, color: "#09090b" }}
          >
            <Pencil className="w-3.5 h-3.5" />
            Hedef Ekle
          </Link>
        </div>
      ) : null}

      {/* Öne Çıkan Vitrin Repoları */}
      {featuredRepos.length > 0 && (
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderGit2 className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Öne Çıkan Vitrin Repoları
              </span>
            </div>
            <span className="text-[10px] text-zinc-600 font-medium">
              {featuredRepos.length} Seçilmiş Proje
            </span>
          </div>

          <div
            className={`grid gap-3.5 ${
              featuredRepos.length === 1
                ? "grid-cols-1"
                : featuredRepos.length === 2
                ? "grid-cols-1 md:grid-cols-2"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {featuredRepos.map((repo, i) => (
              <RepoCard key={repo.name} repo={repo} pinned index={i} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/* ─── Activity sparkline ─── */

function ActivitySparkline({ data }: { data: DayData[] }) {
  const theme = useThemeColors();
  const last90 = data.slice(-90);
  if (last90.length === 0) return null;

  const max = Math.max(...last90.map((d) => d.commit_count), 1);
  const w = 100;
  const h = 36;
  const step = w / (last90.length - 1 || 1);

  const points = last90.map((d, i) => ({
    x: i * step,
    y: h - (d.commit_count / max) * (h - 4) - 2,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${h} L 0 ${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-10" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={theme.accent} stopOpacity="0.25" />
          <stop offset="100%" stopColor={theme.accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkGrad)" />
      <path d={linePath} fill="none" stroke={theme.accent} strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Follow button ─── */

function FollowButton({ username }: { username: string }) {
  const theme = useThemeColors();
  const [following, setFollowing] = useState<boolean | null>(null);
  const [followerCount, setFollowerCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/follow/${username}`)
      .then((r) => r.json())
      .then((d) => {
        setFollowing(d.following ?? false);
        setFollowerCount(d.followerCount ?? 0);
      })
      .catch(() => setFollowing(false));
  }, [username]);

  async function toggle() {
    if (following === null || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/follow/${username}`, { method: "POST" });
      if (res.status === 401) {
        window.location.href = "/api/auth/signin";
        return;
      }
      if (res.status === 429) {
        alert("Günlük takip limitine ulaştınız (20).");
        return;
      }
      const data = await res.json();
      setFollowing(data.following);
      setFollowerCount(data.followerCount ?? followerCount);
    } finally {
      setLoading(false);
    }
  }

  if (following === null) return null;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggle}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        style={
          following
            ? { borderColor: "rgba(39,39,42,0.6)", color: "#a1a1aa", backgroundColor: "rgba(39,39,42,0.3)" }
            : { borderColor: `${theme.accent}30`, color: theme.accent, backgroundColor: `${theme.accent}10` }
        }
      >
        {following ? (
          <>
            <UserCheck className="w-3 h-3" />
            Takip Ediliyor
          </>
        ) : (
          <>
            <UserPlus className="w-3 h-3" />
            Takip Et
          </>
        )}
      </button>
      {followerCount > 0 && (
        <span className="flex items-center gap-1 text-xs text-zinc-600">
          <Users className="w-3 h-3" />
          {followerCount.toLocaleString("tr-TR")}
        </span>
      )}
    </div>
  );
}

/* ─── Profile share buttons ─── */

function ProfileShareButtons({ username }: { username: string }) {
  const theme = useThemeColors();
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const cardUrl = `/api/card/${username}?format=og`;
  const tweetText = encodeURIComponent(
    `GitHub istatistiklerime bakın! 🚀 Dev Analytics`
  );
  const profileUrl = typeof window !== "undefined"
    ? `${window.location.origin}/u/${username}`
    : `/u/${username}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(profileUrl)}`;

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(cardUrl);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${username}-devcard.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    } finally {
      setDownloading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2 animate-profile-slide-up" style={{ animationDelay: "200ms" }}>
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ borderColor: `${theme.accent}30`, color: theme.accent, backgroundColor: `${theme.accent}10` }}
        title="Developer Card'ı PNG olarak indir"
      >
        <Download className="w-3 h-3" />
        {downloading ? "İndiriliyor..." : "Kartı İndir"}
      </button>

      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all hover:scale-105 hover:border-zinc-600"
        style={{ borderColor: "#27272a", color: "#71717a" }}
        title="Twitter'da paylaş"
      >
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.726-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        Paylaş
      </a>

      <button
        onClick={handleCopy}
        className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all hover:scale-105 hover:border-zinc-600"
        style={{ borderColor: "#27272a", color: "#71717a" }}
        title="Profil linkini kopyala"
      >
        {copied ? (
          <>
            <Check className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-400">Kopyalandı!</span>
          </>
        ) : (
          <>
            <Share2 className="w-3 h-3" />
            Link Kopyala
          </>
        )}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PROFILE COMPONENT
   ═══════════════════════════════════════════════════ */

export default function ProfileClient(props: ProfileProps) {
  const theme = useThemeColors();
  const {
    username, userId, name, avatarUrl, bio, profileReadme, readmeSource,
    currentlyWorkingOn, yearlyGoal, techTags,
    stats, currentStreak, longestStreak,
    earnedBadges, pinnedRepos, topRepos,
    topLanguages, heatmapData,
    widgets,
    socialLinks,
    developerDna,
    recordView,
    isOwner,
    isLoggedIn,
  } = props;

  // Ziyareti bir kez kaydet
  const recorded = useRef(false);
  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    recordView(userId).catch(() => {/* sessiz hata */});
  }, [userId, recordView]);

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-zinc-950 overflow-hidden">
      {/* ═══ HERO ═══ */}
      <div className="relative">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-1/2 -left-1/4 w-[150%] h-[200%] animate-profile-gradient opacity-20"
            style={{
              background: `radial-gradient(ellipse at 20% 30%, ${theme.accent}25 0%, transparent 50%),
                           radial-gradient(ellipse at 80% 60%, ${theme.accentMid}15 0%, transparent 45%),
                           radial-gradient(ellipse at 40% 80%, ${theme.accentDim}30 0%, transparent 50%)`,
            }}
          />
          {/* Dot grid */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)`,
              backgroundSize: "24px 24px",
            }}
          />
        </div>

        {/* Header bar — Navbar server component olarak page.tsx'den render ediliyor */}

        {/* Hero content */}
        <div className="relative z-10 mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
            {/* Avatar */}
            <div className="relative animate-profile-slide-up shrink-0">
              <div
                className="absolute -inset-1 rounded-full animate-profile-pulse-ring opacity-40"
                style={{ background: `radial-gradient(circle, ${theme.accent}30 0%, transparent 70%)` }}
              />
              {avatarUrl && (
                <Image
                  src={avatarUrl}
                  alt={username}
                  width={110}
                  height={110}
                  className="relative rounded-full"
                  style={{ boxShadow: `0 0 0 2px rgba(9,9,11,1), 0 0 0 4px ${theme.accent}40` }}
                />
              )}
              {/* Activity indicator */}
              <div className="absolute bottom-1 right-1 flex items-center justify-center">
                <div className="absolute h-5 w-5 rounded-full border-[3px] border-zinc-950" style={{ backgroundColor: theme.accent }} />
                <Activity className="relative h-2.5 w-2.5 text-zinc-950" strokeWidth={3} />
              </div>
            </div>

            {/* Identity */}
            <div className="text-center sm:text-left flex-1 min-w-0 animate-profile-slide-up" style={{ animationDelay: "80ms" }}>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">{name}</h1>
              <p className="text-sm text-zinc-500 mt-1.5 flex items-center justify-center sm:justify-start gap-1">
                <Hash className="w-3 h-3" />
                {username}
              </p>
              {bio && <p className="text-sm text-zinc-400 mt-3 max-w-lg leading-relaxed">{bio}</p>}
              {techTags.length > 0 && (
                <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 mt-3">
                  {techTags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md px-2 py-0.5 text-[10px] font-medium border transition-all hover:scale-105"
                      style={{ borderColor: `${theme.accent}20`, color: `${theme.accent}cc`, backgroundColor: `${theme.accent}08` }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              {/* Sosyal linkler */}
              {socialLinks && (socialLinks.twitter || socialLinks.linkedin || socialLinks.website || socialLinks.discord) && (
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                  {socialLinks.twitter && (
                    <a
                      href={`https://x.com/${socialLinks.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-all hover:scale-105 hover:border-zinc-600"
                      style={{ borderColor: "#27272a", color: "#71717a" }}
                      title={`@${socialLinks.twitter}`}
                    >
                      {/* X / Twitter icon */}
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      <span className="hidden sm:inline">@{socialLinks.twitter}</span>
                    </a>
                  )}
                  {socialLinks.linkedin && (
                    <a
                      href={`https://linkedin.com/in/${socialLinks.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-all hover:scale-105 hover:border-zinc-600"
                      style={{ borderColor: "#27272a", color: "#71717a" }}
                      title={socialLinks.linkedin}
                    >
                      {/* LinkedIn icon */}
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                      <span className="hidden sm:inline">{socialLinks.linkedin}</span>
                    </a>
                  )}
                  {socialLinks.website && (
                    <a
                      href={socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-all hover:scale-105 hover:border-zinc-600"
                      style={{ borderColor: "#27272a", color: "#71717a" }}
                      title={socialLinks.website}
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span className="hidden sm:inline">{socialLinks.website.replace(/^https?:\/\//, "")}</span>
                    </a>
                  )}
                  {socialLinks.discord && (
                    <div
                      className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs cursor-default"
                      style={{ borderColor: "#27272a", color: "#71717a" }}
                      title={socialLinks.discord}
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span className="hidden sm:inline">{socialLinks.discord}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Developer Card paylaşım butonları + Takip Et */}
            <div className="flex flex-col items-center sm:items-end gap-2">
              {!isOwner && <FollowButton username={username} />}
              <ProfileShareButtons username={username} />
            </div>

            {/* Sparkline (desktop) */}
            <div className="hidden lg:block w-48 animate-profile-slide-up shrink-0" style={{ animationDelay: "160ms" }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <TrendingUp className="w-3 h-3 text-zinc-600" />
                <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-600 font-medium">Son 90 gun</p>
              </div>
              <ActivitySparkline data={heatmapData} />
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 pb-16 space-y-6 -mt-1">

        {/* ── Bento stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={Layers} label="Repolar" value={stats.repoCount} delay={200} />
          <StatCard icon={Activity} label="Commitler" value={stats.commitCount} sub="son 1 yil" accent={theme.accent} delay={280} />
          <StatCard icon={Calendar} label="Aktif Gun" value={stats.activeDays} sub="son 1 yil" delay={360} />
          <StatCard icon={Code2} label="Diller" value={stats.languageCount} delay={440} />
        </div>

        {/* ── Streaks ── */}
        {widgets.streak && (currentStreak > 0 || longestStreak > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              className="animate-profile-slide-up group rounded-2xl border border-zinc-800/40 p-5 relative overflow-hidden transition-all hover:border-zinc-700/50"
              style={{ animationDelay: "400ms", background: "linear-gradient(145deg, rgba(24,24,27,0.8) 0%, rgba(9,9,11,0.9) 100%)" }}
            >
              <div className="absolute -top-6 -right-6 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity">
                <Flame className="w-28 h-28" style={{ color: theme.accent }} />
              </div>
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <Flame className="w-4 h-4" style={{ color: theme.accent }} />
                <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-medium">Mevcut Streak</p>
              </div>
              <p className="text-4xl sm:text-5xl font-black tabular-nums relative z-10" style={{ color: theme.accent }}>
                <AnimatedNumber value={currentStreak} />
                <span className="text-base font-normal text-zinc-600 ml-1">gun</span>
              </p>
            </div>
            <div
              className="animate-profile-slide-up group rounded-2xl border border-zinc-800/40 p-5 relative overflow-hidden transition-all hover:border-zinc-700/50"
              style={{ animationDelay: "460ms", background: "linear-gradient(145deg, rgba(24,24,27,0.8) 0%, rgba(9,9,11,0.9) 100%)" }}
            >
              <div className="absolute -top-6 -right-6 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity">
                <Zap className="w-28 h-28 text-zinc-400" />
              </div>
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <Timer className="w-4 h-4 text-zinc-500" />
                <p className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-medium">En Uzun Streak</p>
              </div>
              <p className="text-4xl sm:text-5xl font-black tabular-nums text-zinc-100 relative z-10">
                <AnimatedNumber value={longestStreak} />
                <span className="text-base font-normal text-zinc-600 ml-1">gun</span>
              </p>
            </div>
          </div>
        )}

        {/* ── 1. Aktif Odak, 2026 Hedefleri & Vitrin Projeleri ── */}
        <FocusAndShowcaseSection
          currentlyWorkingOn={currentlyWorkingOn}
          yearlyGoal={yearlyGoal}
          pinnedRepos={pinnedRepos}
          topRepos={topRepos}
          currentYear={currentYear}
          isOwner={isOwner}
          username={username}
          theme={theme}
        />

        {/* ── 2. Geliştirici Manifestosu (README.md) ── */}
        {profileReadme ? (
          <ProfileReadme
            content={profileReadme}
            username={username}
            isOwner={isOwner}
            source={readmeSource}
          />
        ) : isOwner ? (
          <section className="animate-profile-slide-up" style={{ animationDelay: "500ms" }}>
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-6 sm:p-8 text-center backdrop-blur-sm">
              <div
                className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl mb-3.5"
                style={{ backgroundColor: `${theme.accent}15`, color: theme.accent }}
              >
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-zinc-100">Profil README'si Ekleyin</h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto leading-relaxed">
                GitHub profilinizi Markdown, tablolar, kod blokları ve özel rozetler ile zenginleştirerek ziyaretçilerinize kendinizi en iyi şekilde tanıtın.
              </p>
              <Link
                href="/dashboard/settings#profil-sayfasi"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold shadow-lg transition-transform hover:scale-105"
                style={{ backgroundColor: theme.accent, color: "#09090b" }}
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>README Oluştur</span>
              </Link>
            </div>
          </section>
        ) : null}

        {/* ── 3. Developer DNA & Mühendislik Karakteri ── */}
        {developerDna && (
          <DeveloperDNASection
            dna={developerDna}
            accent={theme.accent}
            accentBorder={theme.accentBorder}
            username={username}
          />
        )}

        {/* ── 4. Rozetler ── */}
        {earnedBadges.length > 0 && (
          <div className="animate-profile-slide-up" style={{ animationDelay: "600ms" }}>
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-zinc-500" />
              <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-500">Kazanılan Rozetler</h2>
              <span className="text-[10px] text-zinc-700 tabular-nums">{earnedBadges.length} rozet</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {earnedBadges.map((badge, i) => (
                <BadgeCard key={badge.id} badge={badge} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* ── Languages + Heatmap ── */}
        {(widgets.languages || widgets.heatmap) && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 animate-profile-slide-up" style={{ animationDelay: "700ms" }}>
            {widgets.languages && topLanguages.length > 0 && (
              <div
                className="lg:col-span-2 rounded-2xl border border-zinc-800/40 p-5"
                style={{ background: "linear-gradient(145deg, rgba(24,24,27,0.6) 0%, rgba(9,9,11,0.8) 100%)" }}
              >
                <div className="flex items-center gap-2 mb-5">
                  <Code2 className="w-3.5 h-3.5 text-zinc-500" />
                  <h2 className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-medium">Dil Dagilimi</h2>
                </div>
                <LanguageDonut languages={topLanguages} />
              </div>
            )}
            {widgets.heatmap && (
              <div
                className={`${widgets.languages && topLanguages.length > 0 ? "lg:col-span-3" : "lg:col-span-5"} rounded-2xl border border-zinc-800/40 p-5`}
                style={{ background: "linear-gradient(145deg, rgba(24,24,27,0.6) 0%, rgba(9,9,11,0.8) 100%)" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-zinc-500" />
                    <h2 className="text-[10px] uppercase tracking-[0.15em] text-zinc-500 font-medium">Contributions</h2>
                  </div>
                  <span className="text-xs text-zinc-600 tabular-nums">{stats.commitCount.toLocaleString("tr-TR")} commit</span>
                </div>
                <div className="overflow-x-auto custom-scroll pb-1">
                  <MiniHeatmap data={heatmapData} />
                </div>
                <div className="mt-3 flex items-center justify-end gap-1.5">
                  <span className="text-[10px] text-zinc-600">Az</span>
                  {["rgba(255,255,255,0.03)", ...theme.shades].map((c, i) => (
                    <div key={i} className="rounded-[2px]" style={{ width: 10, height: 10, backgroundColor: c }} />
                  ))}
                  <span className="text-[10px] text-zinc-600">Cok</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Top repos ── */}
        {widgets.repos && topRepos.length > 0 && (
          <div className="animate-profile-slide-up" style={{ animationDelay: "800ms" }}>
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-zinc-500" />
              <h2 className="text-xs font-medium uppercase tracking-[0.15em] text-zinc-500">En Yildizli Repolar</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {topRepos.map((repo, i) => (
                <RepoCard key={repo.name} repo={repo} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* ── Wrapped links ── */}
        <div className="flex flex-wrap justify-center gap-2 pt-4 animate-profile-slide-up" style={{ animationDelay: "900ms" }}>
          {[currentYear, currentYear - 1].map((yr) => (
            <Link
              key={yr}
              href={`/u/${username}/${yr}`}
              className="group flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-all hover:scale-105 active:scale-95"
              style={{ borderColor: `${theme.accent}25`, backgroundColor: `${theme.accent}06`, color: theme.accent }}
            >
              <Sparkles className="w-3 h-3" />
              {yr} Wrapped
              <ArrowRight className="w-3 h-3 text-zinc-600 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ))}
        </div>

        {/* ── Footer ── */}
        <footer className="text-center pt-6 pb-2 animate-profile-slide-up" style={{ animationDelay: "1000ms" }}>
          <div className="inline-flex items-center gap-2.5 rounded-full border border-zinc-800/30 bg-zinc-900/20 px-4 py-2">
            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: theme.accent }} />
            <p className="text-xs text-zinc-600">
              <Link href="/" className="text-zinc-500 hover:text-zinc-300 transition-colors">
                Dev Analytics
              </Link>{" "}
              ile olusturuldu
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
