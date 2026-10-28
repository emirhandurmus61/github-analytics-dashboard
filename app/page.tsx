import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import LandingClient from "./landing-client";
import AppShell from "@/components/shell/app-shell";
import { mockDashboard } from "@/lib/demo-data";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  async function handleSignIn() {
    "use server";
    await signIn("github", { redirectTo: "/dashboard" });
  }

  const lang = (await cookies()).get("devboard_lang")?.value === "en" ? "en" : "tr";

  // Only what the demo board renders goes to the client.
  const d = mockDashboard(lang);
  const demo = { ...d, commitTimestamps: [], hourData: [], repoHealth: [], repoList: [], insights: [], recentActivity: [], badges: d.badges.filter((b) => b.earned).slice(0, 6) };

  return (
    <AppShell bleed>
      <LandingClient signInAction={handleSignIn} demo={demo} />
    </AppShell>
  );
}
