export type Lang = "tr" | "en";

const localeOf = (lang: Lang | string) => (lang === "en" ? "en-US" : "tr-TR");

export function fmtInt(n: number, lang: Lang | string) {
  return Math.round(n).toLocaleString(localeOf(lang));
}

/** 1234 → 1.2k, 2_300_000 → 2.3M (decimal separator follows the locale). */
export function fmtCompact(n: number, lang: Lang | string) {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  const dec = (v: number) =>
    v.toLocaleString(localeOf(lang), { maximumFractionDigits: v < 10 ? 1 : 0 });
  if (abs >= 1_000_000) return `${sign}${dec(abs / 1_000_000)}M`;
  if (abs >= 10_000) return `${sign}${dec(abs / 1_000)}k`;
  if (abs >= 1_000) return `${sign}${dec(abs / 1_000)}k`;
  return `${sign}${Math.round(abs)}`;
}

export function fmtPct(n: number, lang: Lang | string) {
  const v = Math.round(n);
  return lang === "en" ? `${v}%` : `%${v}`;
}

export function timeAgo(iso: string | null | undefined, lang: Lang | string): string {
  if (!iso) return lang === "en" ? "never" : "hiç";
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.max(0, Math.floor(diff / 1000));
  if (s < 45) return lang === "en" ? "just now" : "az önce";
  const m = Math.floor(s / 60);
  if (m < 60) return lang === "en" ? `${Math.max(1, m)}m ago` : `${Math.max(1, m)} dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return lang === "en" ? `${h}h ago` : `${h} sa önce`;
  const d = Math.floor(h / 24);
  if (d < 30) return lang === "en" ? `${d}d ago` : `${d} gün önce`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return lang === "en" ? `${mo}mo ago` : `${mo} ay önce`;
  return lang === "en" ? `${Math.floor(mo / 12)}y ago` : `${Math.floor(mo / 12)} yıl önce`;
}

export const MONTHS_SHORT: Record<Lang, string[]> = {
  tr: ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

export const MONTHS_LONG: Record<Lang, string[]> = {
  tr: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

/** Monday-first short weekday names. */
export const WEEKDAYS_SHORT: Record<Lang, string[]> = {
  tr: ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};

export const WEEKDAYS_MIN: Record<Lang, string[]> = {
  tr: ["P", "S", "Ç", "P", "C", "C", "P"],
  en: ["M", "T", "W", "T", "F", "S", "S"],
};

export function fmtDay(iso: string, lang: Lang | string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) {
  return new Date(iso.length === 10 ? iso + "T00:00:00" : iso).toLocaleDateString(localeOf(lang), opts);
}

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/** ISO timestamp `days` ago. Kept outside components so render stays pure. */
export function daysAgoISO(days: number) {
  return new Date(Date.now() - days * 86400000).toISOString();
}
