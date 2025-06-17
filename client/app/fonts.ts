import { Inter } from 'next/font/google'
import localFont from 'next/font/local'

// Load Inter font from Google Fonts
export const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  display: 'swap',
  variable: '--font-inter',
})

// Load Bebas Neue font locally
export const bebasNeue = localFont({
  src: [
    {
      path: './fonts/bebas-neue-cyrillic.woff2',
      weight: '400',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-bebas-neue',
})