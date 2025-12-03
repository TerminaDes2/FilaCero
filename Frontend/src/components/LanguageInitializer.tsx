"use client";
import { useEffect } from 'react';
import { useLanguageStore } from '../state/languageStore';

export default function LanguageInitializer() {
  useEffect(() => {
    // After mount, restore user's saved preference if any
    try {
      const stored = localStorage.getItem('language-locale');
      if (stored === 'es-MX' || stored === 'en-US') {
        useLanguageStore.setState({ locale: stored });
      } else {
        // If no valid stored value, set default
        localStorage.setItem('language-locale', 'es-MX');
      }
    } catch {}
  }, []);

  return null;
}
