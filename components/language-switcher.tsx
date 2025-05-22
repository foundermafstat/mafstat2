"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Locale, locales } from "@/i18n.config"
import { useLocaleContext } from "@/providers/locale-provider"
import { Globe } from "lucide-react"

// Информация о локалях с флагами
const localeInfo: Record<Locale, { name: string, flag: string }> = {
  en: { name: 'English', flag: '🇬🇧' },
  ru: { name: 'Русский', flag: '🇷🇺' },
}

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocaleContext()
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Globe className="h-5 w-5" />
          <span className="absolute right-0 bottom-0 -translate-y-1/2 translate-x-1/4 text-xs">
            {localeInfo[locale].flag}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {locales.map((localeKey) => (
          <DropdownMenuItem 
            key={localeKey}
            onClick={() => setLocale(localeKey)}
            className={locale === localeKey ? "bg-accent font-medium" : ""}
          >
            <span className="mr-2">{localeInfo[localeKey].flag}</span>
            <span>{localeInfo[localeKey].name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
