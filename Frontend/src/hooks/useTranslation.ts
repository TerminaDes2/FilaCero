"use client";
import { useLanguageStore } from '../state/languageStore';
import esTranslations from '../locales/es-MX.json';
import enTranslations from '../locales/en-US.json';

const translations = {
  'es-MX': esTranslations,
  'en-US': enTranslations,
};

export function useTranslation() {
  const locale = useLanguageStore((state) => state.locale);

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[locale];

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        console.warn(`[useTranslation] Key not found: ${key} for locale ${locale}`);
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
  };

  return { t, locale };
}
