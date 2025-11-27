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

  const t = (key: string, variables?: Record<string, string | number>): string => {
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

    if (typeof value === 'string') {
      // Interpolación de variables: reemplaza {{variable}} con el valor
      if (variables) {
        return value.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
          return variables[varName]?.toString() ?? match;
        });
      }
      return value;
    }

    return key;
  };

  return { t, locale };
}
