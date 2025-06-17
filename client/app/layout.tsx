import type React from "react"
import type { Metadata } from "next"
import "@/styles/globals.css"
import { AuthProvider } from "@/components/session-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { AppSidebar } from "@/components/app-sidebar"
import { LocaleProvider } from "@/providers/locale-provider"

// Импортируем шрифты из модуля fonts
import { inter, bebasNeue } from "./fonts"

export const metadata: Metadata = {
  title: "MAFSTAT - Mafia Game Statistics",
  description: "Statistics for mafia games",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${inter.className} ${bebasNeue.variable}`}>
        <LocaleProvider>
          <AuthProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <AppSidebar>
                {children}
              </AppSidebar>
            </ThemeProvider>
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  )
}