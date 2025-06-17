"use client"

import { useEffect, useState, createContext, useContext, type ReactNode } from 'react'
import { NextIntlClientProvider } from 'next-intl'
import { defaultLocale, type Locale, locales } from '@/i18n.config'
import { useLocalStorage } from '@/hooks/use-local-storage'

// Type for locale context
type LocaleContextType = {
  locale: Locale
  setLocale: (locale: Locale) => void
  isLoading: boolean
}

// Type for locale messages
type LocaleMessages = Record<string, Record<string, string> | string>

// Create locale context
const LocaleContext = createContext<LocaleContextType | null>(null)

// Locale provider
export function LocaleProvider({ children }: { children: ReactNode }) {
  // Load messages for each locale
  const [messages, setMessages] = useState<Record<Locale, LocaleMessages>>({} as Record<Locale, LocaleMessages>)
  const [isLoading, setIsLoading] = useState(true)
  
  // Use localStorage to save the selected locale
  const [locale, setLocaleValue] = useLocalStorage<Locale>('locale', defaultLocale)
  
  // Function to change the locale
  const setLocale = (newLocale: Locale) => {
    if (locales.includes(newLocale)) {
      setLocaleValue(newLocale)
    }
  }

  // Load messages when component mounts
  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true)
      const newMessages: Record<Locale, LocaleMessages> = {} as Record<Locale, LocaleMessages>
      
      // Load messages for all supported locales
      for (const localeKey of locales) {
        newMessages[localeKey] = (await import(`@/messages/${localeKey}/index.ts`)).default
      }

      setMessages(newMessages)
      setIsLoading(false)
    }

    loadMessages()
  }, [])

  // Show loading spinner while messages are loading
  if (isLoading || !messages[locale as Locale]) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <LocaleContext.Provider value={{ locale: locale as Locale, setLocale, isLoading }}>
      <NextIntlClientProvider locale={locale} messages={messages[locale as Locale]}>
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  )
}

// Hook for using locale context inside components
export function useLocaleContext() {
  const context = useContext(LocaleContext)
  
  if (!context) {
    throw new Error('useLocaleContext must be used inside LocaleProvider')
  }
  
  return context
}
