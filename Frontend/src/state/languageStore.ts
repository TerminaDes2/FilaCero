"use client";
import { create } from 'zustand';

export type LocaleCode = 'es-MX' | 'en-US';

interface LanguageState {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
  toggleLocale: () => void;
}

function getInitialLocale(): LocaleCode {
  // Always return 'es-MX' for SSR to match the client initial render
  // Client-side hydration will preserve this until useEffect runs
  if (typeof window === 'undefined') {
    return 'es-MX';
  }
  // On client, also start with 'es-MX' to avoid hydration mismatch
  // The actual stored value will be applied after mount
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
