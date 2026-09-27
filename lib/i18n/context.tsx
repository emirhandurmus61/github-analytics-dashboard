"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { Language, Dictionary } from "./types";
import { dictionaries, tr, en } from "./dictionaries";

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

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("tr");

  // Load language from storage/cookie on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (stored === "tr" || stored === "en") {
        setLangState(stored);
        document.documentElement.lang = stored;
        return;
      }
      // Check browser preference
      if (typeof navigator !== "undefined" && navigator.language?.startsWith("tr")) {
        setLangState("tr");
        document.documentElement.lang = "tr";
      } else if (typeof navigator !== "undefined") {
        setLangState("en");
        document.documentElement.lang = "en";
      }
    } catch {
      // Fallback
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      document.cookie = `${STORAGE_KEY}=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = newLang;
    } catch {
      // Storage unavailable
    }
  };

  const toggleLang = () => {
    setLang(lang === "tr" ? "en" : "tr");
  };

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
