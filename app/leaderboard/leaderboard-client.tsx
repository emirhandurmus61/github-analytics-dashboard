"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Trophy,
  Flame,
  Award,
  ChevronRight,
  EyeOff,
  Eye,
  Crown,
  Sparkles,
} from "lucide-react";
import { toggleLeaderboardOptIn } from "./actions";
import type { LeaderboardEntry, LeaderboardCategory } from "./page";

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  CSS: "#563d7c",
  HTML: "#e34c26",
  Java: "#b07219",
  "C++": "#f34b7d",
  "C#": "#178600",
  C: "#555555",
  Swift: "#F05138",
  Kotlin: "#7F52FF",
  Ruby: "#701516",
};

const CATEGORIES: {
  id: LeaderboardCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
  metricLabel: string;
}[] = [
  {
    id: "weekly",
    label: "Bu Hafta",
    icon: Flame,
    desc: "commit",
    metricLabel: "Haftalık Commit",
  },
  {
    id: "streak",
    label: "Streak",
    icon: Trophy,
    desc: "gün",
    metricLabel: "Kesintisiz Gün",
  },
  {
    id: "badges",
    label: "Rozetler",
    icon: Award,
    desc: "rozet",
    metricLabel: "Kazanılan Rozet",
  },
];

export default function LeaderboardClient({
  weekly,
  streaks,
  badges,
  currentUsername,
  isOptedIn: initialOptedIn,
}: {
  weekly: LeaderboardEntry[];
  streaks: LeaderboardEntry[];
  badges: LeaderboardEntry[];
  currentUsername: string | null;
  isOptedIn: boolean;
}) {
  const [category, setCategory] = useState<LeaderboardCategory>("weekly");
  const [optedIn, setOptedIn] = useState(initialOptedIn);
  const [isPending, startTransition] = useTransition();

  const entries =
    category === "weekly" ? weekly : category === "streak" ? streaks : badges;
  const currentCat = CATEGORIES.find((c) => c.id === category)!;

  const valueKey: keyof LeaderboardEntry =
    category === "weekly"
      ? "weeklyCommits"
      : category === "streak"
      ? "currentStreak"
      : "badgeCount";

  // Mevcut kullanıcının sıralamadaki yeri
  const userEntry = currentUsername
    ? entries.find((e) => e.username === currentUsername)
    : null;

  function toggleOptIn() {
    if (!currentUsername) return;
    startTransition(async () => {
      const result = await toggleLeaderboardOptIn(!optedIn);
      if (result.success) setOptedIn(!optedIn);
    });
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-24">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 space-y-8">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800/80">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400 shadow-lg shadow-amber-500/10">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-100">
                  Liderlik Tablosu
                </h1>
                <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400">
                  Canlı Sıralama
                </span>
              </div>
              <p className="mt-0.5 text-xs sm:text-sm text-zinc-400">
                Topluluktaki en aktif geliştiriciler ve haftalık performans liderleri
              </p>
            </div>
          </div>

          {currentUsername && (
            <button
              onClick={toggleOptIn}
              disabled={isPending}
              className="self-start sm:self-center flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer active:scale-95"
              style={{
                borderColor: optedIn ? "#3f3f46" : "#ef444450",
                backgroundColor: optedIn ? "rgba(24, 24, 27, 0.6)" : "rgba(239, 68, 68, 0.08)",
                color: optedIn ? "#a1a1aa" : "#f87171",
              }}
              title={optedIn ? "Sıralamadan gizlen" : "Sıralamada tekrar görün"}
            >
              {isPending ? (
                <span className="h-3.5 w-3.5 border-2 border-current rounded-full border-t-transparent animate-spin" />
              ) : optedIn ? (
                <Eye className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <EyeOff className="h-3.5 w-3.5" />
              )}
              <span>
                {isPending
                  ? "Güncelleniyor..."
                  : optedIn
                  ? "Listede Görünüyorsun"
                  : "Sıralamada Gizlisin"}
              </span>
            </button>
          )}
        </div>

        {/* ── Kategori Sekmeleri ── */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 backdrop-blur-md overflow-x-auto custom-scroll">
          {CATEGORIES.map((c) => {
            const isSelected = category === c.id;
            const Icon = c.icon;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer"
                style={
                  isSelected
                    ? {
                        backgroundColor: "rgba(245, 158, 11, 0.15)",
                        borderColor: "rgba(245, 158, 11, 0.4)",
                        borderWidth: "1px",
                        borderStyle: "solid",
                        color: "#fbbf24",
                        boxShadow: "0 0 16px rgba(245, 158, 11, 0.15)",
                      }
                    : {
                        color: "#a1a1aa",
                        backgroundColor: "transparent",
                        borderWidth: "1px",
                        borderStyle: "solid",
                        borderColor: "transparent",
                      }
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{c.label}</span>
                <span
                  className="rounded-md px-1.5 py-0.5 text-[10px] font-mono"
                  style={{
                    backgroundColor: isSelected ? "rgba(245, 158, 11, 0.2)" : "rgba(39, 39, 42, 0.6)",
                    color: isSelected ? "#fef3c7" : "#71717a",
                  }}
                >
                  {c.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Giriş Yapmış Kullanıcı Konum Özeti ── */}
        {userEntry && (
          <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-zinc-900/60 to-zinc-900/40 p-4 sm:p-5 flex items-center justify-between gap-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black text-sm">
                #{userEntry.rank}
              </div>
              <div>
                <p className="text-xs text-zinc-400 font-medium">Bu Kategorideki Sıralamanız</p>
                <p className="text-sm font-bold text-zinc-100">
                  {userEntry.rank === 1
                    ? "Tebrikler, 1. sıradasınız! Zirveyi koruyorsunuz."
                    : `${userEntry.rank}. sıradasınız — ${((userEntry[valueKey] as number) || 0).toLocaleString("tr-TR")} ${currentCat.desc}`}
                </p>
              </div>
            </div>
            <Link
              href={`/u/${currentUsername}`}
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-zinc-700/80 bg-zinc-800/60 px-3.5 py-2 text-xs font-semibold text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors"
            >
              <span>Profilin</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* ── Sıralama Listesi (Alt alta dikey kompozisyon, asla yan yana değil) ── */}
        {entries.length === 0 ? (
          <div className="text-center py-20 space-y-4 rounded-3xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-sm p-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800 border border-zinc-700">
              <Trophy className="h-7 w-7 text-zinc-500" />
            </div>
            <p className="text-base font-bold text-zinc-200">Henüz sıralama verisi bulunmuyor</p>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
              Kullanıcılar senkronize oldukça ve GitHub aktiviteleri toplandıkça sıralama otomatik güncellenecektir.
            </p>
            {!currentUsername && (
              <Link
                href="/"
                className="inline-block mt-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-zinc-950 transition-all hover:bg-emerald-400"
              >
                Giriş Yap ve Katıl
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => {
              const isSelf = entry.username === currentUsername;
              const value = (entry[valueKey] as number) || 0;

              return (
                <RankCard
                  key={entry.username}
                  entry={entry}
                  rank={entry.rank}
                  isSelf={isSelf}
                  value={value}
                  valueSuffix={currentCat.desc}
                />
              );
            })}
          </div>
        )}

        {/* ── Sıralamaya Katıl Banner (Giriş Yapmamış Kullanıcılar İçin) ── */}
        {!currentUsername && entries.length > 0 && (
          <div className="rounded-3xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/80 to-zinc-900/40 p-8 text-center space-y-4 backdrop-blur-md shadow-xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <p className="text-base font-bold text-zinc-100">Siz de Liderlik Tablosunda Yer Alın</p>
              <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto leading-relaxed">
                GitHub hesabınızla bağlanın, commit verilerinizi senkronize edin ve topluluk geliştiricileri arasındaki yerinizi görün.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-6 py-2.5 text-xs font-bold text-zinc-950 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
            >
              GitHub ile Giriş Yap
            </Link>
          </div>
        )}

        {/* Bilgilendirme Alt Notu */}
        <p className="text-center text-xs text-zinc-600 leading-relaxed">
          Liderlik tablosuna katılım tamamen isteğe bağlıdır. Ayarlar → Gizlilik bölümünden istediğiniz zaman sıralamadan ayrılabilirsiniz.
        </p>
      </div>
    </div>
  );
}

// ── Dikey Sıralama Kartı (1, 2, 3 ve diğerleri tek birleşik hiyerarşide alt alta) ─────────────────────────

function RankCard({
  entry,
  rank,
  isSelf,
  value,
  valueSuffix,
}: {
  entry: LeaderboardEntry;
  rank: number;
  isSelf: boolean;
  value: number;
  valueSuffix: string;
}) {
  // Sıralama basamağına göre renk ve stil konfigürasyonu
  const isFirst = rank === 1;
  const isSecond = rank === 2;
  const isThird = rank === 3;

  let containerStyle: React.CSSProperties = {
    borderColor: isSelf ? "rgba(52, 211, 153, 0.4)" : "#27272a",
    backgroundColor: isSelf ? "rgba(52, 211, 153, 0.04)" : "rgba(24, 24, 27, 0.45)",
  };

  let badgeElement = null;
  let valueColor = "#f4f4f5";

  if (isFirst) {
    containerStyle = {
      borderColor: "rgba(245, 158, 11, 0.45)",
      background:
        "linear-gradient(90deg, rgba(245, 158, 11, 0.12) 0%, rgba(24, 24, 27, 0.85) 45%, rgba(24, 24, 27, 0.6) 100%)",
      boxShadow: "0 0 24px rgba(245, 158, 11, 0.12)",
    };
    valueColor = "#fbbf24";
    badgeElement = (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-zinc-950 font-black text-sm shadow-md shadow-amber-500/30 ring-1 ring-amber-300">
        <Crown className="h-5 w-5 fill-zinc-950" />
      </div>
    );
  } else if (isSecond) {
    containerStyle = {
      borderColor: "rgba(203, 213, 225, 0.35)",
      background:
        "linear-gradient(90deg, rgba(203, 213, 225, 0.08) 0%, rgba(24, 24, 27, 0.85) 45%, rgba(24, 24, 27, 0.6) 100%)",
      boxShadow: "0 0 20px rgba(203, 213, 225, 0.08)",
    };
    valueColor = "#e2e8f0";
    badgeElement = (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 text-zinc-950 font-black text-sm shadow-md shadow-slate-300/20 ring-1 ring-slate-100">
        <span className="font-mono text-base font-black">2</span>
      </div>
    );
  } else if (isThird) {
    containerStyle = {
      borderColor: "rgba(180, 83, 9, 0.35)",
      background:
        "linear-gradient(90deg, rgba(180, 83, 9, 0.08) 0%, rgba(24, 24, 27, 0.85) 45%, rgba(24, 24, 27, 0.6) 100%)",
      boxShadow: "0 0 20px rgba(180, 83, 9, 0.08)",
    };
    valueColor = "#f59e0b";
    badgeElement = (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-600 via-amber-700 to-amber-800 text-amber-100 font-black text-sm shadow-md shadow-amber-700/20 ring-1 ring-amber-600">
        <span className="font-mono text-base font-black">3</span>
      </div>
    );
  } else {
    badgeElement = (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-zinc-400 font-bold text-xs font-mono">
        #{rank}
      </div>
    );
  }

  return (
    <Link
      href={`/u/${entry.username}`}
      className="group relative flex items-center gap-3.5 sm:gap-5 rounded-2xl border p-4 sm:p-5 transition-all duration-200 hover:scale-[1.008] hover:border-zinc-500 backdrop-blur-sm"
      style={containerStyle}
    >
      {/* ── Sol: Sıralama Rozeti ── */}
      <div className="shrink-0 flex items-center justify-center">{badgeElement}</div>

      {/* ── Avatar ── */}
      <div className="relative shrink-0">
        {entry.avatarUrl ? (
          <Image
            src={entry.avatarUrl}
            alt={entry.username}
            width={isFirst ? 48 : 42}
            height={isFirst ? 48 : 42}
            className="rounded-full object-cover transition-transform group-hover:scale-105"
            style={{
              outline: isFirst
                ? "2px solid #fbbf24"
                : isSecond
                ? "2px solid #cbd5e1"
                : isThird
                ? "2px solid #b45309"
                : "1px solid #3f3f46",
              outlineOffset: 2,
            }}
          />
        ) : (
          <div
            className="flex items-center justify-center rounded-full font-bold uppercase transition-transform group-hover:scale-105"
            style={{
              width: isFirst ? 48 : 42,
              height: isFirst ? 48 : 42,
              backgroundColor: `${entry.accentColor}25`,
              color: entry.accentColor,
              outline: isFirst
                ? "2px solid #fbbf24"
                : isSecond
                ? "2px solid #cbd5e1"
                : isThird
                ? "2px solid #b45309"
                : "1px solid #3f3f46",
              outlineOffset: 2,
            }}
          >
            {entry.displayName[0] ?? entry.username[0] ?? "?"}
          </div>
        )}
      </div>

      {/* ── İsim, Kullanıcı Adı ve Dil Etiketi ── */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-bold text-sm sm:text-base text-zinc-100 truncate group-hover:text-white transition-colors">
            {entry.displayName}
          </p>

          {isFirst && (
            <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold text-amber-300">
              Lider
            </span>
          )}

          {isSecond && (
            <span className="rounded-full bg-slate-300/15 border border-slate-300/30 px-2 py-0.5 text-[10px] font-semibold text-slate-300">
              2. Sıra
            </span>
          )}

          {isThird && (
            <span className="rounded-full bg-amber-700/20 border border-amber-700/40 px-2 py-0.5 text-[10px] font-semibold text-amber-500">
              3. Sıra
            </span>
          )}

          {isSelf && (
            <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              Sen
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
          <span className="font-mono text-zinc-400 truncate">@{entry.username}</span>
          {entry.topLang && (
            <>
              <span className="text-zinc-700">·</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: LANG_COLORS[entry.topLang] ?? "#71717a" }}
                />
                <span className="text-zinc-400 text-[11px] font-medium">{entry.topLang}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Sağ: İstatistik Değeri ve Birim ── */}
      <div className="text-right shrink-0 pr-1">
        <p
          className="font-black text-xl sm:text-2xl tabular-nums leading-none tracking-tight"
          style={{ color: valueColor }}
        >
          {value.toLocaleString("tr-TR")}
        </p>
        <p className="mt-1 text-[11px] text-zinc-500 font-medium">{valueSuffix}</p>
      </div>

      {/* ── Sağ Ok ── */}
      <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all shrink-0" />
    </Link>
  );
}
