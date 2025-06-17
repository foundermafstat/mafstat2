"use client"

import { ReactNode } from "react"
import { NextIntlClientProvider } from "next-intl"
import { useLocale } from "next-intl"

type Props = {
  children: ReactNode
}

/**
 * Провайдер для клиентской локализации next-intl
 * Загружает сообщения для текущей локали на стороне клиента
 */
export function I18nProvider({ children }: Props) {
  const locale = useLocale()

  return (
    <NextIntlClientProvider locale={locale} messages={{}}>
      {children}
    </NextIntlClientProvider>
  )
}
