import { auth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { ThemeProvider } from "@/components/theme-provider";
import { isValidTheme, DEFAULT_THEME } from "@/lib/themes";
import Navbar from "@/components/navbar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  // Kullanıcının tema tercihini DB'den al
  const { data: dbUser } = await supabaseAdmin
    .from("users")
    .select("theme_accent")
    .eq("username", session.user?.username ?? "")
    .single();

  const accent = isValidTheme(dbUser?.theme_accent) ? dbUser.theme_accent : DEFAULT_THEME;

  return (
    <ThemeProvider accent={accent}>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1 px-3 py-4 sm:px-6 sm:py-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </div>
      </div>
    </ThemeProvider>
  );
}
