"use client";
import React from 'react';
import { LoginForm } from '../../../src/components/auth/LoginForm';
import { BrandLogo } from '../../../src/components/BrandLogo';
import { AuthDynamicBackground } from '../../../src/components/auth/AuthDynamicBackground';
import { useTranslation } from '../../../src/hooks/useTranslation';
import LanguageSelector from '../../../src/components/LanguageSelector';
import { LoginCard } from '../../../src/components/auth/LoginCard';

export default function LoginPage() {
  const { t } = useTranslation();

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-white via-white to-brand-50 transition-colors duration-500 dark:from-slate-950 dark:via-slate-950/95 dark:to-slate-950">
      <AuthDynamicBackground />

      <div className="relative z-10 flex min-h-screen flex-col px-4 py-8 sm:px-6 sm:py-10 lg:px-12 lg:py-12">
        <header className="inline-flex w-fit items-center rounded-full border border-white/60 bg-white/75 px-4 py-2 backdrop-blur-md shadow-sm transition dark:border-slate-800/80 dark:bg-slate-950/80 dark:text-slate-100 dark:shadow-[0_18px_42px_-28px_rgba(2,6,23,0.75)]">
          <BrandLogo withWordmark size={42} asLink={true} />
        </header>

        <div className="mt-10 flex flex-1 items-center justify-center pb-10">
          <div className="grid w-full max-w-6xl gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.92fr)] lg:items-center">
            <div className="hidden lg:flex flex-col gap-10 rounded-3xl border border-white/70 bg-white/65 p-10 shadow-[0_35px_90px_-60px_rgba(233,74,111,0.35)] backdrop-blur-xl transition dark:border-slate-800/80 dark:bg-slate-950/70 dark:text-slate-100 dark:shadow-[0_40px_110px_-70px_rgba(2,6,23,0.9)]">
              <div className="space-y-6">
                <BrandLogo withWordmark size={56} />
                <div className="space-y-4">
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                    {t('auth.login.title')}
                  </h1>
                  <p className="text-base leading-relaxed text-slate-600 dark:text-slate-300/95">
                    {t('auth.login.subtitle')}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 text-sm text-slate-600 dark:text-slate-300">
                {[t('auth.login.hint'), t('auth.login.emailHint'), t('auth.login.passwordHint')].map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/75 px-4 py-3 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/70">
                    <span className="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-400 text-[11px] font-semibold text-white dark:from-brand-400 dark:to-teal-400">•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-6 text-xs uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-4 py-2 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/70">
                  <span className="inline-flex h-2 w-2 rounded-full bg-brand-500" aria-hidden />
                  {t('auth.login.remember')}
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-4 py-2 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/70">
                  <span className="inline-flex h-2 w-2 rounded-full bg-teal-500" aria-hidden />
                  {t('auth.login.newAccount')} {t('auth.login.createAccount')}
                </div>
              </div>
            </div>

            <div className="w-full max-w-md justify-self-center">
              <LoginCard
                title={t('auth.login.title')}
                subtitle={t('auth.login.subtitle')}
                brandMark={<BrandLogo withWordmark={false} size={40} />}
                compact
              >
                <LoginForm />
              </LoginCard>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-6 right-6 z-50">
        <LanguageSelector />
      </div>
    </div>
  );
}