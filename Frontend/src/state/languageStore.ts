"use client";
import { create } from 'zustand';

export type LocaleCode = 'es-MX' | 'en-US';

interface LanguageState {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
  toggleLocale: () => void;
}

function getInitialLocale(): LocaleCode {
  if (typeof window === 'undefined') {
    return 'es-MX';
  }
  const stored = window.localStorage.getItem('language-locale') as LocaleCode | null;
  if (stored === 'es-MX' || stored === 'en-US') return stored;
  return 'es-MX';
}

export const useLanguageStore = create<LanguageState>((set) => ({
  locale: getInitialLocale(),
  setLocale: (locale) => {
    set({ locale });
    if (typeof window !== 'undefined') {
      localStorage.setItem('language-locale', locale);
    }
  },
  toggleLocale: () => {
    set((state) => {
      const next: LocaleCode = state.locale === 'es-MX' ? 'en-US' : 'es-MX';
      if (typeof window !== 'undefined') {
        localStorage.setItem('language-locale', next);
      }
      return { locale: next };
    });
  }
}));
