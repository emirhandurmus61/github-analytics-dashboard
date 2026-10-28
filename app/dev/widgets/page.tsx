import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import type { Language } from "@/lib/i18n";
import { mockDashboard } from "@/lib/demo-data";
import Gallery from "./gallery";

// Dev-only: every overview card at every size it supports.
export default async function WidgetsPage({ searchParams }: { searchParams: Promise<{ only?: string; mobile?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { only, mobile } = await searchParams;
  const store = await cookies();
  const lang: Language = store.get("devboard_lang")?.value === "en" ? "en" : "tr";
  return <Gallery data={mockDashboard(lang)} only={only?.split(",")} mobile={mobile === "1"} />;
}
