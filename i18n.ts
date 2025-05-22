import {getRequestConfig} from 'next-intl/server';

// List of supported locales
export const locales = ['en', 'ru'] as const;
export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = 'en';

// Function to format date for locale 
export const getDateFormatter = (locale: Locale) => 
  new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

// Configuration for next-intl requests
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
    timeZone: 'Europe/Madrid',
  };
});
