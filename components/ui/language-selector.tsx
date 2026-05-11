"use client"

import { Globe } from "lucide-react"
import { useLang } from "@/components/providers/language-provider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

const languages = [
  { code: "en" as const, name: "English", flag: "🇬🇧" },
  { code: "ru" as const, name: "Русский", flag: "🇷🇺" },
  { code: "lv" as const, name: "Latviešu", flag: "🇱🇻" },
]

export function LanguageSelector() {
  const { lang, setLang } = useLang()
  
  const currentLanguage = languages.find(l => l.code === lang) || languages[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Globe className="h-5 w-5" />
          <span className="sr-only">Select language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => setLang(language.code)}
            className={`cursor-pointer ${
              lang === language.code ? "bg-accent" : ""
            }`}
          >
            <span className="mr-2 text-lg">{language.flag}</span>
            <span className="flex-1">{language.name}</span>
            {lang === language.code && (
              <span className="ml-2 text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
