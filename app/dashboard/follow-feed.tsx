"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Rss, Flame, Award, TrendingUp, GitCommitHorizontal, Clock, RefreshCw, Users } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { Panel } from "@/components/ui/primitives";
import { useWidgetSize } from "@/components/ui/widget-size";
import { timeAgo, cn, type Lang } from "@/lib/ui/format";

type User = { id: string; username: string; name: string; avatar_url: string | null };
type Item = {
  id: string;
  type: "streak_milestone" | "badge_earned" | "new_record" | "active_today" | "recent_sync";
  payload: Record<string, unknown>;
  created_at: string;
  user: User | null;
};

const KIND = {
  streak_milestone: { icon: Flame, color: "var(--hue-orange)" },
  badge_earned: { icon: Award, color: "var(--hue-purple)" },
  new_record: { icon: TrendingUp, color: "var(--hue-green)" },
  active_today: { icon: GitCommitHorizontal, color: "var(--hue-cyan)" },
  recent_sync: { icon: Clock, color: "var(--ink-3)" },
} as const;

function describe(t: Item["type"], p: Record<string, unknown>, l: Lang) {
  if (l === "en") {
    switch (t) {
      case "streak_milestone": return `hit a ${p.days}-day streak`;
      case "badge_earned": return `earned “${p.badge}”`;
      case "new_record": return `set a record: ${p.value} commits`;
      case "active_today": return "committed today";
      case "recent_sync": return `${p.commitCount} active days this month`;
    }
  }
  switch (t) {
    case "streak_milestone": return `${p.days} günlük seriye ulaştı`;
    case "badge_earned": return `“${p.badge}” rozetini aldı`;
    case "new_record": return `rekor kırdı: ${p.value} commit`;
    case "active_today": return "bugün commit attı";
    case "recent_sync": return `bu ay ${p.commitCount} aktif gün`;
  }
}

function Av({ u, size = 24 }: { u: User; size?: number }) {
  return u.avatar_url ? (
    <Image src={u.avatar_url} alt="" width={size} height={size} unoptimized className="rounded-full ring-2 ring-[var(--bg-1)] shrink-0" style={{ width: size, height: size }} />
  ) : (
    <span className="grid shrink-0 place-items-center rounded-full bg-raised text-[10px] text-ink-3 ring-2 ring-[var(--bg-1)]" style={{ width: size, height: size }}>
      {u.username[0]?.toUpperCase()}
    </span>
  );
}

export default function FollowFeed() {
  const { lang } = useLanguage();
  const l = lang as Lang;
  const { shape } = useWidgetSize();
  const [items, setItems] = useState<Item[] | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFeed = async () => {
    try {
      const res = await fetch("/api/follow/feed");
      const data = await res.json();
      setItems((data.activities ?? []).filter((a: Item) => a.user));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };
  const load = () => {
    setLoading(true);
    void fetchFeed();
  };
  useEffect(() => {
    let alive = true;
    fetch("/api/follow/feed")
      .then((r) => r.json())
      .then((data) => alive && setItems((data.activities ?? []).filter((a: Item) => a.user)))
      .catch(() => alive && setItems([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const title = l === "en" ? "Following" : "Takip akışı";
  const refresh = (
    <button type="button" className="btn btn-ghost btn-sm btn-icon" onClick={load} aria-label={l === "en" ? "Refresh" : "Yenile"}>
      <RefreshCw className={cn(loading && "animate-spin")} />
    </button>
  );

  if (items === null) {
    return (
      <Panel title={title} icon={Rss}>
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skel h-8" />
          ))}
        </div>
      </Panel>
    );
  }

  if (!items.length) {
    return (
      <Panel title={title} icon={Rss} actions={shape !== "glance" ? refresh : undefined}>
        <div className="flex h-full flex-col items-start justify-center gap-1.5">
          <Users size={18} className="text-ink-4" />
          <p className="text-[12.5px] text-ink-2">{l === "en" ? "You are not following anyone." : "Henüz kimseyi takip etmiyorsun."}</p>
          {shape !== "glance" && (
            <p className="text-[12px] text-ink-3">
              {l === "en" ? "Find developers on the " : "Geliştiricileri "}
              <Link href="/leaderboard" className="text-accent hover:underline">{l === "en" ? "leaderboard" : "sıralamada"}</Link>
              {l === "en" ? " and follow them from their profile." : " bul, profillerinden takip et."}
            </p>
          )}
        </div>
      </Panel>
    );
  }

  const uniq = Array.from(new Map(items.map((a) => [a.user!.id, a.user!])).values());

  return (
    <Panel title={title} icon={Rss} meta={`${items.length}`} actions={shape !== "glance" ? refresh : undefined}>
      {shape === "glance" && (
        <div className="flex h-full flex-col">
          <div className="flex -space-x-2">
            {uniq.slice(0, 5).map((u) => (
              <Av key={u.id} u={u} size={28} />
            ))}
          </div>
          <p className="mt-2 text-[12px] leading-snug text-ink-2 line-clamp-2">
            <span className="font-medium text-ink">{items[0].user!.name || items[0].user!.username}</span> {describe(items[0].type, items[0].payload, l)}
          </p>
          <p className="mt-auto font-mono text-[10.5px] text-ink-4">{timeAgo(items[0].created_at, l)}</p>
        </div>
      )}
      {shape !== "glance" && (
        <ul className={cn("h-full overflow-y-auto", shape === "strip" && "grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))] content-center overflow-hidden")}>
          {items.slice(0, shape === "strip" ? 4 : 30).map((a) => {
            const k = KIND[a.type];
            const I = k.icon;
            return (
              <li key={a.id} className={cn("flex items-start gap-2.5", shape !== "strip" && "py-2 border-b border-line last:border-0")}>
                <Link href={`/u/${a.user!.username}`} className="relative shrink-0">
                  <Av u={a.user!} size={26} />
                  <span className="absolute -bottom-1 -right-1 grid size-4 place-items-center rounded-full bg-surface" style={{ color: k.color }}>
                    <I size={10} />
                  </span>
                </Link>
                <div className="min-w-0">
                  <p className="text-[12.5px] leading-snug text-ink-2">
                    <Link href={`/u/${a.user!.username}`} className="font-medium text-ink hover:text-accent">
                      {a.user!.name || a.user!.username}
                    </Link>{" "}
                    {describe(a.type, a.payload, l)}
                  </p>
                  <p className="font-mono text-[10.5px] text-ink-4">{timeAgo(a.created_at, l)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
