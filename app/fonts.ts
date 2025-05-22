import localFont from 'next/font/local'
import { Inter } from 'next/font/google'

// Загружаем Inter из Google Fonts для основного текста
export const inter = Inter({ 
  subsets: ["latin", "cyrillic"],
  display: 'swap',
  variable: '--font-inter',
})

// Загружаем Bebas Neue локально с поддержкой кириллицы
export const bebasNeue = localFont({
  src: './fonts/bebas-neue-cyrillic.woff2',  // Исправленный путь к шрифту
  display: 'swap',
  variable: '--font-bebas-neue',
})
