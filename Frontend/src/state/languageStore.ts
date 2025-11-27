"use client";
import { create } from 'zustand';

export type LocaleCode = 'es-MX' | 'en-US';

interface LanguageState {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
  toggleLocale: () => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  locale: 'es-MX',
  setLocale: (locale) => {
    set({ locale });
    if (typeof window !== 'undefined') {
      localStorage.setItem('language-locale', locale);
    }
  },
  toggleLocale: () => {
    set((state) => {
      const next = state.locale === 'es-MX' ? 'en-US' : 'es-MX';
      if (typeof window !== 'undefined') {
        localStorage.setItem('language-locale', next);
      }
      return { locale: next };
    });
  }
}));
