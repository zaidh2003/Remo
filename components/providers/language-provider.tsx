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
  const [lang, setLangState] = useState<AppLanguage>(() => {
    // Initialize from localStorage immediately to avoid flash
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("remo_lang") as AppLanguage | null
      if (saved && ["en", "ru", "lv"].includes(saved)) return saved
    }
    return "en"
  })

  // Listen for storage changes and custom language change events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "remo_lang" && e.newValue) {
        const newLang = e.newValue as AppLanguage
        if (["en", "ru", "lv"].includes(newLang)) {
          setLangState(newLang)
        }
      }
    }

    // Custom event for same-tab language changes
    const handleLanguageChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ lang: AppLanguage }>
      if (customEvent.detail?.lang) {
        const newLang = customEvent.detail.lang
        if (["en", "ru", "lv"].includes(newLang)) {
          setLangState(newLang)
        }
      }
    }

    // Also check localStorage when window regains focus (after OAuth redirect)
    const handleFocus = () => {
      const saved = localStorage.getItem("remo_lang") as AppLanguage | null
      if (saved && ["en", "ru", "lv"].includes(saved) && saved !== lang) {
        setLangState(saved)
      }
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("languageChanged", handleLanguageChange)
    window.addEventListener("focus", handleFocus)
    
    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("languageChanged", handleLanguageChange)
      window.removeEventListener("focus", handleFocus)
    }
  }, [lang])

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
