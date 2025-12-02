"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { Check, Globe2 } from "lucide-react";
import { useLanguageStore } from "../state/languageStore";

type LanguageCode = "es-MX" | "en-US";

interface LanguageSelectorProps {
  variant?: "compact" | "panel";
}

interface LanguageOption {
  code: LanguageCode;
  label: string;
  flag: string;
  helper: string;
}

const languages: LanguageOption[] = [
  { code: "es-MX", label: "Español", flag: "🇲🇽", helper: "Latinoamérica" },
  { code: "en-US", label: "English", flag: "🇺🇸", helper: "North America" }
];

export default function LanguageSelector({ variant = "compact" }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { locale, setLocale } = useLanguageStore();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = useMemo(() => {
    return languages.find((lang) => lang.code === locale) ?? languages[0];
  }, [locale]);

  useEffect(() => {
    if (variant !== "compact") return;
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, variant]);

  const handleSelect = (code: LanguageCode) => {
    setLocale(code);
    setIsOpen(false);
  };

  const ariaLabel = locale?.startsWith("en") ? "Change language" : "Cambiar idioma";

  if (variant === "panel") {
    return (
      <div className="rounded-2xl border border-brand-100/70 bg-white/95 shadow-sm shadow-brand-100/40 dark:border-white/10 dark:bg-slate-950/85 dark:shadow-slate-950/50">
        <div className="flex items-center justify-between px-4 pt-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-brand-500/70 dark:text-brand-200/80">
              {locale?.startsWith("en") ? "Language" : "Idioma"}
            </p>
            <p className="mt-1 text-sm font-semibold text-[var(--fc-text-primary)]">
              {currentLanguage.label}
            </p>
            <p className="text-xs text-[var(--fc-text-secondary)] dark:text-white/65">{currentLanguage.helper}</p>
          </div>
          <span className="grid h-11 w-11 place-items-center rounded-full border border-brand-200/60 bg-gradient-to-br from-white via-white to-brand-50 text-lg shadow-sm dark:border-brand-500/40 dark:from-[rgba(15,23,42,0.9)] dark:via-[rgba(15,23,42,0.82)] dark:to-[rgba(56,226,223,0.18)]">
            {currentLanguage.flag}
          </span>
        </div>
        <div className="mt-3 grid gap-2 px-3 pb-3">
          {languages.map((lang) => {
            const isActive = lang.code === locale;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleSelect(lang.code)}
                className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
                  isActive
                    ? "border-brand-400/60 bg-brand-50/80 text-brand-700 shadow-sm dark:border-brand-400/60 dark:bg-brand-500/15 dark:text-brand-100"
                    : "border-transparent bg-white/90 text-[var(--fc-text-primary)] shadow-sm hover:border-brand-200/60 hover:bg-brand-50/70 dark:bg-[rgba(15,23,42,0.85)] dark:text-[var(--fc-text-primary)] dark:hover:bg-[rgba(15,23,42,0.92)]"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">{lang.flag}</span>
                  <span>{lang.label}</span>
                </span>
                {isActive ? <Check className="h-4 w-4 text-brand-500" aria-hidden /> : null}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 ${
          isOpen
            ? "border-brand-300 bg-white text-brand-600 shadow-md dark:border-brand-400/60 dark:bg-slate-950/70 dark:text-brand-200"
            : "border-brand-200/70 bg-white/85 text-brand-600 shadow-sm hover:border-brand-300 hover:bg-white dark:border-white/15 dark:bg-slate-950/70 dark:text-brand-200 dark:hover:border-brand-400/50"
        }`}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="sr-only">{currentLanguage.label}</span>
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white/90 text-lg shadow-inner dark:bg-slate-900/80">
          {isOpen ? <Globe2 className="h-4 w-4" aria-hidden /> : currentLanguage.flag}
        </span>
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-11 z-50 w-52 rounded-2xl border border-[rgba(255,255,255,0.35)] bg-[rgba(3,7,18,0.96)] px-3 py-3 shadow-xl shadow-[rgba(15,23,42,0.85)] backdrop-blur-md">
          <div className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-[0.38em] text-[rgba(248,250,252,0.7)]">
            {locale?.startsWith("en") ? "Language" : "Idioma"}
          </div>
          <div className="space-y-1.5" role="listbox">
            {languages.map((lang) => {
              const isActive = lang.code === locale;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(244,114,182,0.8)] ${
                    isActive
                      ? "bg-[rgba(136,19,55,0.92)] text-[rgba(252,231,243,0.98)] shadow-sm"
                      : "text-slate-100 hover:bg-[rgba(15,23,42,0.9)] hover:text-white"
                  }`}
                  role="option"
                  aria-selected={isActive}
                >
                  <span className="flex items-center gap-3">
                    <span className={`inline-flex items-center justify-center rounded-md px-2 py-1 text-[11px] font-semibold tracking-wide ${
                      isActive
                        ? "bg-[rgba(30,64,175,0.9)] text-[rgba(219,234,254,0.98)]"
                        : "bg-[rgba(15,23,42,0.9)] text-[rgba(148,163,184,0.95)]"
                    }`}>
                      {lang.code === "es-MX" ? "MX" : "US"}
                    </span>
                    <span className="flex flex-col items-start">
                      <span className="font-medium leading-snug">{lang.label}</span>
                      <span className="text-[11px] text-[rgba(148,163,184,0.9)]">{lang.helper}</span>
                    </span>
                  </span>
                  {isActive ? <Check className="h-4 w-4 text-[rgba(248,187,208,0.95)]" aria-hidden /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
