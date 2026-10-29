import type { ComponentType, CSSProperties } from "react";

export type SettingsSectionId =
  | "gorunum"
  | "profil"
  | "sosyal"
  | "profil-sayfasi"
  | "badge"
  | "readme-widgets"
  | "bildirimler"
  | "gizlilik";


export const VALID_SECTION_IDS: SettingsSectionId[] = [
  "gorunum",
  "profil",
  "sosyal",
  "profil-sayfasi",
  "badge",
  "readme-widgets",
  "bildirimler",
  "gizlilik",
];


export interface NavItem {
  id: SettingsSectionId;
  label: string;
  shortDesc: string;
  badgeText?: string;
  icon: ComponentType<{ className?: string; style?: CSSProperties }>;
  group: "ozellestirme" | "entegrasyon" | "tercihler";
}

export const SEARCH_HINTS: Record<SettingsSectionId, string> = {
  gorunum: "tema theme renk color şema scheme arayüz interface terminal editör editor stüdyo studio yazı font dil language yoğunluk density koyu açık dark light",
  profil: "bio biyografi tag etiket pinned sabit repo hedef goal",
  sosyal: "twitter x linkedin website discord sosyal social link",
  "profil-sayfasi": "readme markdown widget profil sayfası page",
  badge: "badge rozet shield markdown html embed",
  "readme-widgets": "readme widget svg embed github stats",
  bildirimler: "push bildirim notification",
  gizlilik: "privacy gizlilik leaderboard sıralama opt-in",
};
