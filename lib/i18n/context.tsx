"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { Language, Dictionary } from "./types";
import { dictionaries, tr } from "./dictionaries";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "tr",
  setLang: () => {},
  toggleLang: () => {},
  t: tr,
});

const STORAGE_KEY = "devboard_lang";
const noop = () => () => {};

function detectLang(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "tr" || stored === "en") return stored;
    return navigator.language?.toLowerCase().startsWith("tr") ? "tr" : "en";
  } catch {
    return "tr";
  }
}

function persist(lang: Language) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* storage unavailable */
  }
  try {
    document.cookie = `${STORAGE_KEY}=${lang}; path=/; max-age=31536000; SameSite=Lax`;
    document.documentElement.lang = lang;
  } catch {
    /* cookies unavailable */
  }
}

/**
 * `initialLang` comes from the cookie read on the server. When it is missing
 * (first visit) we fall back to localStorage, then the browser language.
 */
export function LanguageProvider({
  children,
  initialLang,
}: {
  children: ReactNode;
  initialLang?: Language;
}) {
  // First visit (no cookie): read localStorage / the browser language on the client.
  const detected = useSyncExternalStore(noop, detectLang, () => "tr" as Language);
  const [override, setOverride] = useState<Language | null>(null);
  const lang: Language = override ?? initialLang ?? detected;

  useEffect(() => {
    if (!initialLang) persist(detected);
  }, [initialLang, detected]);

  const setLang = useCallback((newLang: Language) => {
    setOverride(newLang);
    persist(newLang);
  }, []);

  const toggleLang = useCallback(() => {
    const next = lang === "tr" ? "en" : "tr";
    setOverride(next);
    persist(next);
  }, [lang]);

  const t = dictionaries[lang] ?? tr;

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
