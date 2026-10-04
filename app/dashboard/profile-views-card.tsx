"use client";

import { useThemeColors } from "@/components/theme-provider";
import { useLanguage } from "@/lib/i18n";
import { Eye, TrendingUp } from "lucide-react";

type Props = {
  thisWeek: number;
  total: number;
  username: string;
};

export default function ProfileViewsCard({ thisWeek, total, username }: Props) {
  const theme = useThemeColors();
  const { lang } = useLanguage();
  const locale = lang === "en" ? "en-US" : "tr-TR";

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-zinc-500" />
          <h2 className="text-sm font-medium text-zinc-400">
            {lang === "en" ? "Profile Views" : "Profil Görüntülenme"}
          </h2>
        </div>
        <a
          href={`/u/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] px-2 py-1 rounded-lg border transition-colors hover:border-zinc-600"
          style={{ borderColor: theme.accentBorder, color: theme.accent, backgroundColor: theme.accentBg }}
        >
          {lang === "en" ? "View Profile" : "Profili Gör"}
        </a>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-4">
        {/* Bu hafta */}
        <div>
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-1">
            {lang === "en" ? "This Week" : "Bu Hafta"}
          </p>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-black tabular-nums" style={{ color: theme.accent }}>
              {thisWeek.toLocaleString(locale)}
            </span>
            <span className="text-sm text-zinc-600 mb-1">
              {lang === "en" ? (thisWeek === 1 ? "visitor" : "visitors") : "kişi"}
            </span>
          </div>
        </div>

        {/* Toplam */}
        <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-800/30 px-4 py-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-zinc-600" />
            <span className="text-xs text-zinc-500">
              {lang === "en" ? "Total views" : "Toplam görüntülenme"}
            </span>
          </div>
          <span className="text-sm font-semibold text-zinc-300 tabular-nums">
            {total.toLocaleString(locale)}
          </span>
        </div>

        {thisWeek === 0 && (
          <p className="text-xs text-zinc-700 text-center">
            {lang === "en" ? "No visitors yet — share your profile!" : "Henüz ziyaretçi yok — profilini paylaş!"}
          </p>
        )}
      </div>
    </div>
  );
}
