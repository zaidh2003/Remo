"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { translations, type AppLanguage } from "@/lib/translations"

interface LanguageContextType {
  lang: AppLanguage
  setLang: (l: AppLanguage) => void
  t: typeof translations["en"]
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: translations.en,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<AppLanguage>("en")

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("remo_lang") as AppLanguage | null
    if (saved && ["en", "ru", "lv"].includes(saved)) setLangState(saved)
  }, [])

  const setLang = (l: AppLanguage) => {
    setLangState(l)
    localStorage.setItem("remo_lang", l)
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLang = () => useContext(LanguageContext)
