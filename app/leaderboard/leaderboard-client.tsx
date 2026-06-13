"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trophy, Flame, Award, Users, ChevronRight, Medal, EyeOff, Eye } from "lucide-react";
import { toggleLeaderboardOptIn } from "./actions";
import type { LeaderboardEntry, LeaderboardCategory } from "./page";

const LANG_COLORS: Record<string, string> = {
  TypeScript: "#3178c6", JavaScript: "#f1e05a", Python: "#3572A5",
  Rust: "#dea584", Go: "#00ADD8", CSS: "#563d7c", HTML: "#e34c26",
  Java: "#b07219", "C++": "#f34b7d", "C#": "#178600", C: "#555555",
  Swift: "#F05138", Kotlin: "#7F52FF", Ruby: "#701516",
};

const RANK_COLORS = ["#f59e0b", "#94a3b8", "#cd7c2f"];

const CATEGORIES: { id: LeaderboardCategory; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "weekly", label: "Bu Hafta", icon: <Flame size={15} />, desc: "commit" },
  { id: "streak", label: "Streak", icon: <Trophy size={15} />, desc: "gün" },
  { id: "badges", label: "Rozetler", icon: <Award size={15} />, desc: "rozet" },
];

function EntryRow({
  entry,
  isSelf,
  valueKey,
  valueSuffix,
}: {
  entry: LeaderboardEntry;
  isSelf: boolean;
  valueKey: keyof LeaderboardEntry;
  valueSuffix: string;
}) {
  return (
    <Link
      href={`/u/${entry.username}`}
      className="flex items-center gap-4 rounded-2xl border px-4 py-3 transition-all hover:border-zinc-600 hover:bg-zinc-900/60"
      style={{
        borderColor: isSelf ? `${entry.accentColor}40` : "#27272a",
        backgroundColor: isSelf ? `${entry.accentColor}08` : undefined,
      }}
    >
      {/* Rank */}
      <div className="w-8 shrink-0 text-center flex items-center justify-center">
        {entry.rank <= 3 ? (
          <Medal size={18} style={{ color: RANK_COLORS[entry.rank - 1] }} />
        ) : (
          <span className="text-sm font-bold text-zinc-600">#{entry.rank}</span>
        )}
      </div>

      {/* Avatar */}
      {entry.avatarUrl ? (
        <Image
          src={entry.avatarUrl}
          alt={entry.username}
          width={36}
          height={36}
          className="rounded-full shrink-0"
          style={{ outline: `2px solid ${entry.accentColor}40` }}
        />
      ) : (
        <div
          className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-sm font-bold"
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

  function toggleOptIn() {
    if (!currentUsername) return;
    startTransition(async () => {
      const result = await toggleLeaderboardOptIn(!optedIn);
      if (result.success) setOptedIn(!optedIn);
    });
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users size={18} className="text-zinc-500" />
              <h1 className="text-xl font-bold text-zinc-100">Liderlik Tablosu</h1>
            </div>
            <p className="text-sm text-zinc-500">
              Tüm geliştiriciler arasında sıralama
            </p>
          </div>

          {/* Opt-in toggle */}
          {currentUsername && (
            <button
              onClick={toggleOptIn}
              disabled={isPending}
              className="shrink-0 flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all disabled:opacity-50"
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
              className="flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium transition-all"
              style={{
                borderColor: category === c.id ? "#4f4f5280" : "#27272a",
                backgroundColor: category === c.id ? "#27272a" : "transparent",
                color: category === c.id ? "#f4f4f5" : "#71717a",
              }}
            >
              {c.icon}
              {c.label}
            </button>
          ))}
        </div>

        {/* List */}
        {entries.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <div className="flex justify-center">
              <Trophy size={40} className="text-zinc-700" />
            </div>
            <p className="text-zinc-400 font-medium">Henüz veri yok</p>
            <p className="text-sm text-zinc-600">
              {currentUsername
                ? "Senkronizasyon tamamlandıktan sonra veriler burada görünür."
                : "Giriş yap ve listeye katıl."}
            </p>
            {!currentUsername && (
              <Link
                href="/"
                className="inline-block mt-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-950"
              >
                Giriş Yap
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
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

        {/* Join CTA for non-logged-in */}
        {!currentUsername && entries.length > 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-center space-y-3">
            <p className="text-zinc-300 font-medium">Sıralamaya girmek ister misin?</p>
            <p className="text-sm text-zinc-600">
              Giriş yap, ayarlardan opt-in aç — listede görün.
            </p>
            <Link
              href="/"
              className="inline-block rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-zinc-950"
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
