"use client";
import { useState, useRef, useEffect } from 'react';
import { useLanguageStore } from '../state/languageStore';

export default function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { locale, setLocale } = useLanguageStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'es-MX' as const, label: 'Español', flag: '🇲🇽' },
    { code: 'en-US' as const, label: 'English', flag: '🇺🇸' }
  ];

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];
  const otherLanguage = languages.find(lang => lang.code !== locale) || languages[1];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (code: 'es-MX' | 'en-US') => {
    setLocale(code);
    setIsOpen(false);
  };

  // small helper for a compact label shown on the button
  const shortLabel = (code: string, label: string) => {
    if (code === 'es-MX') return 'Español';
    if (code === 'en-US') return 'English';
    return label;
  };

  return (
    <nav className="flex justify-center items-center space-x-4">
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/90 px-3 py-1.5 text-[13px] font-medium text-brand-700 shadow-sm hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 transition"
          aria-label="Cambiar idioma"
          aria-expanded={isOpen}
        >
          <span className="text-sm">🌐</span>
          <span className="flex items-center gap-1">
            <span className="text-sm">{currentLanguage.flag}</span>
            <span className="whitespace-nowrap">{shortLabel(currentLanguage.code, currentLanguage.label)}</span>
          </span>
          <svg
            className={`h-4 w-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute left-0 mt-2 w-44 rounded-md shadow-lg z-50">
            {languages.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelect(lang.code)}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-[13px] transition-colors ${
                  lang.code === locale
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-base">{lang.flag}</span>
                <span className="flex-1 text-left">{lang.label}</span>
                {lang.code === locale && (
                  <svg className="h-4 w-4 text-brand-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
