import { usePathname, useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useCallback } from 'react';
import { locales, Locale, defaultLocale } from '@/i18n';

// Хук для работы с локализацией
export const useLocalization = () => {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale() as Locale;

  // Функция для переключения локали
  const changeLocale = useCallback((newLocale: Locale) => {
    // Перенаправляем на тот же путь, но с новой локалью
    router.push(`/${newLocale}${pathname.replace(/^\/(en|ru)/, '')}`);
  }, [pathname, router]);

  return {
    locale,
    locales,
    defaultLocale,
    changeLocale,
    isCurrentLocale: (checkLocale: Locale) => locale === checkLocale,
  };
};

// Информация о локалях с флагами
export const localeInfo: Record<Locale, { name: string, flag: string }> = {
  en: { name: 'English', flag: '🇬🇧' },
  ru: { name: 'Русский', flag: '🇷🇺' },
};
