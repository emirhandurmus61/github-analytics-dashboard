import { auth } from "@/lib/auth";
import { cookies, headers } from "next/headers";
import type { Language } from "@/lib/i18n";
import { loadDashboard } from "./data";
import DashboardView from "./dashboard-view";
import type { DateRange } from "./types";

type Props = {
  searchParams: Promise<{ range?: string; hideForks?: string }>;
};

export default async function DashboardPage({ searchParams }: Props) {
  const session = await auth();
  const { range, hideForks } = await searchParams;
  const store = await cookies();
  const lang: Language = store.get("devboard_lang")?.value === "en" ? "en" : "tr";
  const dateRange: DateRange = range === "30" || range === "90" || range === "365" ? range : "365";

  // Guess the grid mode on the server so phones get the 2-column board on the
  // first paint; the client corrects it from the real viewport.
  const ua = (await headers()).get("user-agent") ?? "";
  const initialCompact = /Mobi|Android|iPhone|iPod/i.test(ua);

  const data = await loadDashboard({
    username: session?.user?.username ?? "",
    displayName: session?.user?.name ?? session?.user?.username ?? "",
    lang,
    dateRange,
    hideForks: hideForks === "1",
  });

  return <DashboardView data={data} initialCompact={initialCompact} />;
}
