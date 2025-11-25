"use client";
import { useEffect } from 'react';
import { useLanguageStore } from '../state/languageStore';

export default function LanguageInitializer() {
  useEffect(() => {
    // Forzamos siempre el español como predeterminado al iniciar la app.
    // Esto sobrescribe una preferencia previa en localStorage (p.ej. 'en-US').
    useLanguageStore.setState({ locale: 'es-MX' });
    try {
      localStorage.setItem('language-locale', 'es-MX');
    } catch {}
  }, []);

  return null;
}
