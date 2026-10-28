import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import {
  Recursive,
  Geist,
  Geist_Mono,
  IBM_Plex_Sans,
  IBM_Plex_Mono,
  JetBrains_Mono,
  Fira_Code,
} from "next/font/google";
import "./globals.css";
import { LanguageProvider, type Language } from "@/lib/i18n";
import { UIPrefsProvider } from "@/components/ui-prefs";
import { buildSchemeCss, htmlAttributes, parsePrefs, UI_COOKIE } from "@/lib/ui/prefs";
import { SCHEMES } from "@/lib/ui/schemes";

// Recursive is the house face: one family that is both the UI sans (MONO 0)
// and the code mono (MONO 1). The alternates load only when picked.
const recursive = Recursive({
  subsets: ["latin", "latin-ext"],
  variable: "--font-recursive",
  axes: ["MONO", "CASL", "slnt"],
  display: "swap",
});
const geist = Geist({ subsets: ["latin", "latin-ext"], variable: "--font-geist", preload: false });
const plex = IBM_Plex_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-plex", preload: false });
const geistMono = Geist_Mono({ subsets: ["latin", "latin-ext"], variable: "--font-geist-mono", preload: false });
const plexMono = IBM_Plex_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-mono",
  preload: false,
});
const jetbrains = JetBrains_Mono({ subsets: ["latin", "latin-ext"], variable: "--font-jetbrains", preload: false });
const fira = Fira_Code({ subsets: ["latin", "latin-ext"], variable: "--font-fira", preload: false });

const fontVars = [recursive, geist, plex, geistMono, plexMono, jetbrains, fira]
  .map((f) => f.variable)
  .join(" ");

export const metadata: Metadata = {
  title: "Devboard — GitHub activity for developers",
  description: "Your commits, streaks, languages and repos in one workspace you can rearrange.",
};

export async function generateViewport(): Promise<Viewport> {
  const store = await cookies();
  const prefs = parsePrefs(store.get(UI_COOKIE)?.value);
  const scheme = SCHEMES[prefs.mode === "light" ? prefs.light : prefs.dark];
  return {
    themeColor: scheme.bg[0],
    colorScheme: prefs.mode === "system" ? "dark light" : prefs.mode,
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const store = await cookies();
  const prefs = parsePrefs(store.get(UI_COOKIE)?.value);
  const langCookie = store.get("devboard_lang")?.value;
  const lang: Language | undefined = langCookie === "en" || langCookie === "tr" ? langCookie : undefined;

  return (
    <html
      lang={lang ?? "tr"}
      className={`${fontVars} h-full`}
      {...htmlAttributes(prefs)}
      suppressHydrationWarning
    >
      <head>
        <style id="ui-scheme" dangerouslySetInnerHTML={{ __html: buildSchemeCss(prefs) }} />
      </head>
      <body className="min-h-full">
        <UIPrefsProvider initial={prefs}>
          <LanguageProvider initialLang={lang}>{children}</LanguageProvider>
        </UIPrefsProvider>
      </body>
    </html>
  );
}
