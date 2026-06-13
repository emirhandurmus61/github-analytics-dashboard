"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trophy, Flame, Award, Users, ChevronRight, EyeOff, Eye, Crown } from "lucide-react";
import { toggleLeaderboardOptIn } from "./actions";
import type { LeaderboardEntry, LeaderboardCategory } from "./page";

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
  Rust: "#dea584", Go: "#00ADD8", CSS: "#563d7c", HTML: "#e34c26",
  Java: "#b07219", "C++": "#f34b7d", "C#": "#178600", C: "#555555",
  Swift: "#F05138", Kotlin: "#7F52FF", Ruby: "#701516",
};

const RANK_META = [
  { color: "#f59e0b", glow: "#f59e0b30", bg: "#f59e0b10", label: "1", crown: true },
  { color: "#94a3b8", glow: "#94a3b830", bg: "#94a3b808", label: "2", crown: false },
  { color: "#cd7c2f", glow: "#cd7c2f30", bg: "#cd7c2f08", label: "3", crown: false },
];

const CATEGORIES: { id: LeaderboardCategory; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "weekly", label: "Bu Hafta", icon: <Flame size={16} />, desc: "commit" },
  { id: "streak", label: "Streak", icon: <Trophy size={16} />, desc: "gün" },
  { id: "badges", label: "Rozetler", icon: <Award size={16} />, desc: "rozet" },
];

function PodiumCard({ entry, isSelf, valueKey, valueSuffix }: {
  entry: LeaderboardEntry;
  isSelf: boolean;
  valueKey: keyof LeaderboardEntry;
  valueSuffix: string;
}) {
  const meta = RANK_META[entry.rank - 1];
  const isFirst = entry.rank === 1;

  return (
    <Link
      href={`/u/${entry.username}`}
      className="relative flex items-center gap-4 rounded-2xl border px-5 py-4 transition-all hover:scale-[1.01] hover:brightness-110"
      style={{
        borderColor: meta.color + "60",
        backgroundColor: meta.bg,
        boxShadow: `0 0 20px ${meta.glow}, inset 0 0 1px ${meta.color}30`,
      }}
    >
      {/* Rank badge */}
      <div
        className="shrink-0 flex items-center justify-center rounded-xl font-black text-lg"
        style={{
          width: isFirst ? 52 : 44,
          height: isFirst ? 52 : 44,
          background: `linear-gradient(135deg, ${meta.color}30, ${meta.color}10)`,
          border: `2px solid ${meta.color}60`,
          color: meta.color,
          boxShadow: `0 0 12px ${meta.glow}`,
        }}
      >
        {isFirst ? <Crown size={22} style={{ color: meta.color }} /> : entry.rank}
      </div>

      {/* Avatar */}
      {entry.avatarUrl ? (
        <Image
          src={entry.avatarUrl}
          alt={entry.username}
          width={isFirst ? 52 : 44}
          height={isFirst ? 52 : 44}
          className="rounded-full shrink-0"
          style={{
            outline: `3px solid ${meta.color}70`,
            outlineOffset: 2,
            boxShadow: `0 0 12px ${meta.glow}`,
          }}
        />
      ) : (
        <div
          className="rounded-full shrink-0 flex items-center justify-center font-bold"
          style={{
            width: isFirst ? 52 : 44,
            height: isFirst ? 52 : 44,
            backgroundColor: `${entry.accentColor}20`,
            color: entry.accentColor,
            fontSize: isFirst ? 22 : 18,
          }}
        >
          {entry.displayName[0]?.toUpperCase()}
        </div>
      )}

      {/* Name + lang */}
      <div className="flex-1 min-w-0">
        <p
          className="font-bold truncate"
          style={{ fontSize: isFirst ? 17 : 15, color: "#f4f4f5" }}
        >
          {entry.displayName}
          {isSelf && (
            <span className="ml-2 text-xs font-normal" style={{ color: entry.accentColor }}>
              (sen)
            </span>
          )}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-zinc-500">@{entry.username}</span>
          {entry.topLang && (
            <>
              <span className="text-zinc-700">·</span>
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: LANG_COLORS[entry.topLang] ?? "#6b7280" }}
              />
              <span className="text-xs text-zinc-500">{entry.topLang}</span>
            </>
          )}
        </div>
      </div>

      {/* Value */}
      <div className="text-right shrink-0">
        <p
          className="font-black"
          style={{ fontSize: isFirst ? 26 : 20, color: meta.color, lineHeight: 1 }}
        >
          {(entry[valueKey] as number).toLocaleString("tr-TR")}
        </p>
        <p className="text-xs text-zinc-600 mt-0.5">{valueSuffix}</p>
      </div>

      <ChevronRight size={15} className="text-zinc-600 shrink-0" />
    </Link>
  );
}

function EntryRow({ entry, isSelf, valueKey, valueSuffix }: {
  entry: LeaderboardEntry;
  isSelf: boolean;
  valueKey: keyof LeaderboardEntry;
  valueSuffix: string;
}) {
  return (
    <Link
      href={`/u/${entry.username}`}
      className="flex items-center gap-4 rounded-xl border px-5 py-3.5 transition-all hover:border-zinc-600 hover:bg-zinc-900/60"
      style={{
        borderColor: isSelf ? `${entry.accentColor}40` : "#27272a",
        backgroundColor: isSelf ? `${entry.accentColor}08` : undefined,
      }}
    >
      {/* Rank */}
      <div className="w-8 shrink-0 text-center">
        <span className="text-sm font-bold text-zinc-500">#{entry.rank}</span>
      </div>

      {/* Avatar */}
      {entry.avatarUrl ? (
        <Image
          src={entry.avatarUrl}
          alt={entry.username}
          width={40}
          height={40}
          className="rounded-full shrink-0"
          style={{ outline: `2px solid ${entry.accentColor}30` }}
        />
      ) : (
        <div
          className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-sm font-bold"
          style={{ backgroundColor: `${entry.accentColor}20`, color: entry.accentColor }}
        >
          {entry.displayName[0]?.toUpperCase()}
        </div>
      )}

      {/* Name + lang */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-100 truncate">
          {entry.displayName}
          {isSelf && (
            <span className="ml-2 text-xs font-normal" style={{ color: entry.accentColor }}>
              (sen)
            </span>
          )}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-xs text-zinc-600">@{entry.username}</span>
          {entry.topLang && (
            <>
              <span className="text-zinc-800">·</span>
              <div
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: LANG_COLORS[entry.topLang] ?? "#6b7280" }}
              />
              <span className="text-xs text-zinc-600">{entry.topLang}</span>
            </>
          )}
        </div>
      </div>

      {/* Value */}
      <div className="text-right shrink-0">
        <p className="text-base font-bold" style={{ color: entry.accentColor }}>
          {(entry[valueKey] as number).toLocaleString("tr-TR")}
        </p>
        <p className="text-xs text-zinc-600">{valueSuffix}</p>
      </div>

      <ChevronRight size={14} className="text-zinc-700 shrink-0" />
    </Link>
  );
}

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

  const entries = category === "weekly" ? weekly : category === "streak" ? streaks : badges;
  const cat = CATEGORIES.find((c) => c.id === category)!;

  const valueKey: keyof LeaderboardEntry =
    category === "weekly" ? "weeklyCommits"
    : category === "streak" ? "currentStreak"
    : "badgeCount";

  const top3 = entries.filter((e) => e.rank <= 3);
  const rest = entries.filter((e) => e.rank > 3);

  function toggleOptIn() {
    if (!currentUsername) return;
    startTransition(async () => {
      const result = await toggleLeaderboardOptIn(!optedIn);
      if (result.success) setOptedIn(!optedIn);
    });
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Trophy size={22} className="text-amber-400" />
              </div>
              <h1 className="text-2xl font-black text-zinc-100 tracking-tight">Liderlik Tablosu</h1>
            </div>
            <p className="text-sm text-zinc-500 ml-1">
              Tüm geliştiriciler arasında sıralama
            </p>
          </div>

          {currentUsername && (
            <button
              onClick={toggleOptIn}
              disabled={isPending}
              className="shrink-0 flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all disabled:opacity-50"
              style={{
                borderColor: optedIn ? "#3f3f46" : "#ef444440",
                backgroundColor: optedIn ? "transparent" : "#ef444408",
                color: optedIn ? "#71717a" : "#ef4444",
              }}
            >
              {isPending ? (
                <span className="w-3.5 h-3.5 border border-current rounded-full border-t-transparent animate-spin" />
              ) : optedIn ? (
                <EyeOff size={14} />
              ) : (
                <Eye size={14} />
              )}
              {isPending ? "..." : optedIn ? "Listeden çıkar" : "Listeye geri dön"}
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className="flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition-all"
              style={{
                borderColor: category === c.id ? "#f59e0b60" : "#27272a",
                backgroundColor: category === c.id ? "#f59e0b10" : "transparent",
                color: category === c.id ? "#f59e0b" : "#71717a",
                boxShadow: category === c.id ? "0 0 12px #f59e0b18" : undefined,
              }}
            >
              {c.icon}
              {c.label}
            </button>
          ))}
        </div>

        {/* List */}
        {entries.length === 0 ? (
          <div className="text-center py-24 space-y-4">
            <div className="flex justify-center">
              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800">
                <Trophy size={44} className="text-zinc-700" />
              </div>
            </div>
            <p className="text-zinc-400 font-semibold text-lg">Henüz veri yok</p>
            <p className="text-sm text-zinc-600">
              {currentUsername
                ? "Senkronizasyon tamamlandıktan sonra veriler burada görünür."
                : "Giriş yap ve listeye katıl."}
            </p>
            {!currentUsername && (
              <Link
                href="/"
                className="inline-block mt-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-950"
              >
                Giriş Yap
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top 3 podium */}
            {top3.length > 0 && (
              <div className="space-y-2.5">
                {top3.map((entry) => (
                  <PodiumCard
                    key={entry.username}
                    entry={entry}
                    isSelf={entry.username === currentUsername}
                    valueKey={valueKey}
                    valueSuffix={cat.desc}
                  />
                ))}
              </div>
            )}

            {/* Divider */}
            {top3.length > 0 && rest.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-zinc-800" />
                <span className="text-xs text-zinc-700 font-medium">Diğerleri</span>
                <div className="flex-1 h-px bg-zinc-800" />
              </div>
            )}

            {/* Rest */}
            {rest.length > 0 && (
              <div className="space-y-2">
                {rest.map((entry) => (
                  <EntryRow
                    key={entry.username}
                    entry={entry}
                    isSelf={entry.username === currentUsername}
                    valueKey={valueKey}
                    valueSuffix={cat.desc}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Join CTA for non-logged-in */}
        {!currentUsername && entries.length > 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 text-center space-y-3">
            <p className="text-zinc-200 font-semibold text-lg">Sıralamaya girmek ister misin?</p>
            <p className="text-sm text-zinc-500">
              Giriş yap, ayarlardan opt-in aç — listede görün.
            </p>
            <Link
              href="/"
              className="inline-block rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-zinc-950"
            >
              GitHub ile Giriş Yap
            </Link>
          </div>
        )}

        {/* Opt-in explanation */}
        <p className="text-center text-xs text-zinc-700">
          Liderlik tablosuna katılım tamamen isteğe bağlıdır.
          Ayarlar → Gizlilik bölümünden istediğin zaman çıkabilirsin.
        </p>
      </div>
    </div>
  );
}
