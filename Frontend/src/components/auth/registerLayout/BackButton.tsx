"use client";
import React from 'react';
import { useTranslation } from '../../../hooks/useTranslation';

interface BackButtonProps {
  onBackToSelection: () => void;
}

export function BackButton({ onBackToSelection }: BackButtonProps) {
  const { t } = useTranslation();
  return (
    <button
      onClick={onBackToSelection}
      className="group absolute top-4 right-4 z-20 inline-flex items-center gap-2 overflow-hidden rounded-xl border border-gray-200/60 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-y-[1px] hover:text-slate-900 hover:shadow-lg hover:shadow-[#D55D7B]/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-800/70 dark:bg-gradient-to-r dark:from-[#0f172a] dark:via-[#131d36] dark:to-[#0f172a] dark:text-slate-100 dark:shadow-[0_28px_54px_-32px_rgba(2,6,23,0.95)] dark:hover:shadow-[0_32px_62px_-30px_rgba(2,6,23,0.9)] dark:focus-visible:ring-brand-300/70 dark:focus-visible:ring-offset-slate-950"
      aria-label={t('auth.register.back.aria')}
    >
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#D55D7B]/14 via-transparent to-[#42A8C2]/18 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-[#D55D7B]/24 dark:via-[#9864FF]/18 dark:to-[#42A8C2]/26" />
      <span className="pointer-events-none absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/45 to-transparent opacity-0 blur-sm transition-all duration-[1100ms] group-hover:translate-x-[120%] group-hover:opacity-100 dark:via-white/20" />
      <span className="relative z-10 inline-flex items-center gap-2">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="tracking-wide">{t('auth.register.back.label')}</span>
      </span>
    </button>
  );
}