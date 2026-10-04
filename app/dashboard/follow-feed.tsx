"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Users, Flame, Award, TrendingUp, RefreshCw, GitCommit, Clock } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

type ActivityUser = {
  id: string;
  username: string;
  name: string;
  avatar_url: string | null;
};

type Activity = {
  id: string;
  type: "streak_milestone" | "badge_earned" | "new_record" | "active_today" | "recent_sync";
  payload: Record<string, unknown>;
  created_at: string;
  user: ActivityUser | null;
};

function timeAgo(iso: string, lang: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return lang === "en" ? `${minutes}m ago` : `${minutes}dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return lang === "en" ? `${hours}h ago` : `${hours}sa önce`;
  return lang === "en" ? `${Math.floor(hours / 24)}d ago` : `${Math.floor(hours / 24)}g önce`;
}

function getActivityLabel(type: Activity["type"], payload: Record<string, unknown>, lang: string): string {
  if (lang === "en") {
    switch (type) {
      case "streak_milestone": return `${payload.days}-day streak`;
      case "badge_earned":     return `earned "${payload.badge}" badge`;
      case "new_record":       return `New record: ${payload.value} commits`;
      case "active_today":     return "committed today";
      case "recent_sync":      return `${payload.commitCount} active days this month`;
    }
  } else {
    switch (type) {
      case "streak_milestone": return `${payload.days} günlük streak`;
      case "badge_earned":     return `"${payload.badge}" rozetini kazandı`;
      case "new_record":       return `Yeni rekor: ${payload.value} commit`;
      case "active_today":     return "bugün commit attı";
      case "recent_sync":      return `bu ay ${payload.commitCount} aktif gün`;
    }
  }
}

const TYPE_ICONS = {
  streak_milestone: { icon: Flame, color: "#f97316" },
  badge_earned:     { icon: Award, color: "#c084fc" },
  new_record:       { icon: TrendingUp, color: "#34d399" },
  active_today:     { icon: GitCommit, color: "#22d3ee" },
  recent_sync:      { icon: Clock, color: "#a1a1aa" },
};

export default function FollowFeed() {
  const { lang } = useLanguage();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/follow/feed");
      const data = await res.json();
      const list: Activity[] = data.activities ?? [];
      setActivities(list);
      setEmpty(list.length === 0);
    } catch {
      setEmpty(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-zinc-500" />
          <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
            {lang === "en" ? "Follow Feed" : "Takip Akışı"}
          </h2>
        </div>
        <button
          onClick={load}
          className="text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
          title={lang === "en" ? "Refresh" : "Yenile"}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-5 h-5 rounded-full border-2 border-zinc-700 border-t-zinc-400 animate-spin" />
        </div>
      ) : empty ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-4">
          <Users className="w-8 h-8 text-zinc-700" />
          <p className="text-xs text-zinc-600">
            {lang === "en" ? "You're not following anyone yet." : "Henüz kimseyi takip etmiyorsun."}
          </p>
          <p className="text-[11px] text-zinc-700">
            {lang === "en" ? "Follow developers from their profile pages." : "Profil sayfalarından geliştiricileri takip et."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2 overflow-y-auto flex-1 custom-scroll">
          {activities.map((a) => {
            if (!a.user) return null;
            const meta = TYPE_ICONS[a.type];
            const Icon = meta.icon;
            return (
              <div key={a.id} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-800/40 hover:bg-zinc-800/70 transition-colors">
                <Link href={`/u/${a.user.username}`} className="shrink-0">
                  {a.user.avatar_url ? (
                    <Image
                      src={a.user.avatar_url}
                      alt={a.user.username}
                      width={28}
                      height={28}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] text-zinc-400">
                      {a.user.username[0]?.toUpperCase()}
                    </div>
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Link
                      href={`/u/${a.user.username}`}
                      className="text-xs font-semibold text-zinc-300 hover:text-white transition-colors truncate"
                    >
                      {a.user.name || a.user.username}
                    </Link>
                    <Icon className="w-3 h-3 shrink-0" style={{ color: meta.color }} />
                    <span className="text-[11px] text-zinc-500 truncate">
                      {getActivityLabel(a.type, a.payload, lang)}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-700 mt-0.5">{timeAgo(a.created_at, lang)}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
