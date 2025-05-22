import {getRequestConfig} from 'next-intl/server';

// List of supported locales
export const locales = ['en', 'ru'] as const;
export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = 'en';

export default getRequestConfig(async ({locale}) => {
  // Set default locale if not defined or not supported
  const currentLocale = locale && locales.includes(locale as Locale) 
    ? locale 
    : defaultLocale;
  
  // Load messages for requested locale
  const messages = (await import(`./messages/${currentLocale}/index.ts`)).default;

  return {
    locale: currentLocale,
    messages,
    timeZone: 'Europe/Moscow',
  };
});
