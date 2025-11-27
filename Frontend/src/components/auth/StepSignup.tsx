'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useUserStore } from '../../state/userStore';
import { useTranslation } from '../../hooks/useTranslation';

type StepSignupProps = {
  onBusinessSelect?: () => void;
  onCustomerSelect?: () => void;
};

type RoleKey = 'customer' | 'owner';

export default function StepSignup({ onBusinessSelect, onCustomerSelect }: StepSignupProps) {
  const { setRole } = useUserStore();
  const { t } = useTranslation();
  const [hovered, setHovered] = useState<RoleKey | null>(null);
  const [focused, setFocused] = useState<RoleKey | null>(null);

  const isCustomerActive = hovered === 'customer' || focused === 'customer';
  const isOwnerActive = hovered === 'owner' || focused === 'owner';

  const handleSelect = (role: RoleKey) => {
    setRole(role === 'owner' ? 'OWNER' : 'CUSTOMER');

    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedRole', role === 'owner' ? 'OWNER' : 'CUSTOMER');
    }

    if (role === 'owner') {
      onBusinessSelect?.();
    } else {
      onCustomerSelect?.();
    }
  };

  const cards = [
    {
      key: 'customer' as RoleKey,
      badge: t('auth.register.selection.card.customer.badge'),
      title: t('auth.register.selection.card.customer.title'),
      copy: t('auth.register.selection.card.customer.copy'),
      gradient: 'from-[rgba(233,74,111,0.35)] via-[rgba(236,122,149,0.28)] to-transparent dark:from-[rgba(244,114,182,0.22)] dark:via-[rgba(190,24,93,0.18)] dark:to-transparent',
      accentBg: 'bg-[rgba(233,74,111,0.16)]/80 dark:bg-[rgba(244,114,182,0.18)]/45',
      accentBorder: 'border-[rgba(233,74,111,0.35)]/70 dark:border-[rgba(244,114,182,0.32)]/60',
      accentText: 'text-[var(--fc-brand-600)] dark:text-[var(--fc-brand-200)]',
      glow: 'shadow-[0_18px_42px_-18px_rgba(233,74,111,0.42)] dark:shadow-[0_22px_52px_-34px_rgba(244,114,182,0.55)]',
      ring: 'focus-visible:ring-[var(--fc-brand-500)]',
      glyph: (
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/80 text-[var(--fc-brand-600)] shadow-md shadow-[rgba(233,74,111,0.35)] dark:bg-[rgba(15,23,42,0.85)] dark:text-[var(--fc-brand-200)] dark:shadow-[0_18px_36px_-24px_rgba(244,114,182,0.8)]">
          <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8h12v5a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" />
            <path d="M15 9h3a2 2 0 0 1 0 4h-3" />
          </svg>
        </span>
      ),
      microCopy: [
        t('auth.register.selection.card.customer.micro.0'),
        t('auth.register.selection.card.customer.micro.1'),
        t('auth.register.selection.card.customer.micro.2'),
      ],
      image: {
        src: '/images/clienteprueba.jpg',
        alt: 'Cliente usando FilaCero desde el móvil'
      },
      active: isCustomerActive
    },
    {
      key: 'owner' as RoleKey,
      badge: t('auth.register.selection.card.owner.badge'),
      title: t('auth.register.selection.card.owner.title'),
      copy: t('auth.register.selection.card.owner.copy'),
      gradient: 'from-[rgba(76,193,173,0.32)] via-[rgba(107,210,197,0.24)] to-transparent dark:from-[rgba(45,212,191,0.2)] dark:via-[rgba(13,148,136,0.22)] dark:to-transparent',
      accentBg: 'bg-[rgba(76,193,173,0.14)]/80 dark:bg-[rgba(45,212,191,0.2)]/45',
      accentBorder: 'border-[rgba(76,193,173,0.35)]/70 dark:border-[rgba(45,212,191,0.35)]/55',
      accentText: 'text-[var(--fc-teal-600)] dark:text-[var(--fc-teal-200)]',
      glow: 'shadow-[0_18px_42px_-18px_rgba(76,193,173,0.42)] dark:shadow-[0_22px_52px_-34px_rgba(45,212,191,0.52)]',
      ring: 'focus-visible:ring-[var(--fc-teal-500)]',
      glyph: (
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/80 text-[var(--fc-teal-600)] shadow-md shadow-[rgba(76,193,173,0.35)] dark:bg-[rgba(15,23,42,0.85)] dark:text-[var(--fc-teal-200)] dark:shadow-[0_18px_36px_-24px_rgba(45,212,191,0.68)]">
          <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7h18l-2 5H5L3 7z" />
            <path d="M5 12v7h14v-7" />
          </svg>
        </span>
      ),
      microCopy: [
        t('auth.register.selection.card.owner.micro.0'),
        t('auth.register.selection.card.owner.micro.1'),
        t('auth.register.selection.card.owner.micro.2'),
      ],
      image: {
        src: '/images/dueñoprueba.jpg',
        alt: 'Equipo de cafetería gestionando pedidos con FilaCero'
      },
      active: isOwnerActive
    }
  ];

  return (
      <section
      role="group"
      aria-label={t('auth.register.selection.ariaLabel')}
      className="relative flex min-h-screen w-full flex-col overflow-hidden bg-gradient-to-b from-white via-white to-brand-50 px-4 pb-12 pt-20 sm:px-6 md:pt-24 lg:px-10 lg:pb-20 lg:pt-28 dark:bg-slate-950 dark:bg-gradient-to-b dark:from-slate-950 dark:via-slate-950/95 dark:to-slate-950/98 dark:text-slate-100"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(233,74,111,0.12),_transparent_55%)] opacity-90 dark:hidden" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(76,193,173,0.12),_transparent_60%)] opacity-90 dark:hidden" aria-hidden />
      <div className="pointer-events-none absolute inset-0 hidden dark:block" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.08),_transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(244,114,182,0.08),transparent_65%)]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
      </div>

      <div className="relative z-10 flex w-full flex-col px-1 sm:px-4 lg:px-10 xl:px-16">
        <div className="flex h-full flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:items-center lg:gap-14">
          <div className="mx-auto w-full text-center lg:mx-0 lg:text-left lg:pr-6 xl:pr-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-brand-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100">
              {t('auth.register.selection.badge')}
            </span>
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl lg:text-5xl lg:leading-[1.1] dark:text-slate-100">
              {t('auth.register.selection.title')}
            </h1>
            <p className="mt-4 text-sm text-slate-600 sm:text-base lg:text-lg lg:text-slate-500 dark:text-slate-300/90">
              {t('auth.register.selection.subtitle')}
            </p>

            <div className="mt-6 hidden lg:grid gap-3 text-sm text-slate-500">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/60 bg-white/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100">
                {t('auth.register.selection.guideBadge')}
              </div>
              <ul className="grid gap-2 text-sm text-slate-600 dark:text-slate-300">
                <li className="inline-flex items-center gap-3 rounded-2xl border border-white/70 bg-white/75 px-4 py-3 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/80 dark:shadow-[0_22px_48px_-32px_rgba(59,130,246,0.35)]">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-500 font-semibold">1</span>
                  <span>{t('auth.register.selection.steps.0')}</span>
                </li>
                <li className="inline-flex items-center gap-3 rounded-2xl border border-white/70 bg-white/75 px-4 py-3 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/80 dark:shadow-[0_22px_48px_-32px_rgba(34,197,94,0.4)]">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-teal-500 font-semibold">2</span>
                  <span>{t('auth.register.selection.steps.1')}</span>
                </li>
                <li className="inline-flex items-center gap-3 rounded-2xl border border-white/70 bg-white/75 px-4 py-3 shadow-sm dark:border-slate-800/80 dark:bg-slate-900/80 dark:shadow-[0_22px_48px_-32px_rgba(14,165,233,0.35)]">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 font-semibold">3</span>
                  <span>{t('auth.register.selection.steps.2')}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-between gap-4 sm:grid sm:grid-cols-2 sm:gap-3.5 lg:grid lg:grid-cols-2 lg:gap-5">
            {cards.map((card) => (
              <button
                key={card.key}
                type="button"
                onClick={() => handleSelect(card.key)}
                aria-label={card.key === 'customer' ? t('auth.register.selection.aria.customer') : t('auth.register.selection.aria.owner')}
                aria-describedby={card.key === 'customer' ? 'desc-cliente' : 'desc-negocio'}
                onMouseEnter={() => setHovered(card.key)}
                onMouseLeave={() => setHovered((current) => (current === card.key ? null : current))}
                onFocus={() => setFocused(card.key)}
                onBlur={() => setFocused((current) => (current === card.key ? null : current))}
                className={`group relative flex min-h-[210px] flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white/85 px-5 pb-10 pt-9 text-left shadow-lg transition-transform duration-300 hover:-translate-y-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-slate-800/80 dark:bg-slate-900/90 dark:shadow-[0_30px_60px_-32px_rgba(2,6,23,0.9)] dark:focus-visible:ring-offset-slate-950 sm:min-h-[230px] lg:min-h-[280px] lg:px-6 lg:pb-9 lg:pt-10 ${card.glow} ${card.ring}`}
              >
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-95 transition-opacity duration-500 group-hover:opacity-100 dark:opacity-75`} />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.45),transparent_60%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(148,163,184,0.2),transparent_60%)]" aria-hidden />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.35),transparent_60%)] dark:bg-[radial-gradient(circle_at_80%_80%,rgba(100,116,139,0.18),transparent_65%)]" aria-hidden />

                <Image
                  src={card.image.src}
                  alt={card.image.alt}
                  fill
                  priority={false}
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="pointer-events-none object-cover opacity-20 transition duration-500 group-hover:scale-105 group-hover:opacity-35 dark:opacity-30"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />

                <div className="relative z-10 flex flex-1 flex-col items-start justify-between">
                  <div>
                    <div className={`inline-flex items-center gap-3 rounded-full border ${card.accentBorder} ${card.accentBg} px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-600 shadow-sm backdrop-blur dark:text-slate-200/95`}
                    >
                      <span className={`inline-flex h-2.5 w-2.5 rounded-full ${card.key === 'customer' ? 'bg-[var(--fc-brand-500)]' : 'bg-[var(--fc-teal-500)]'}`} />
                      {card.badge}
                    </div>
                    <div className="mt-5 flex items-center gap-3.5">
                      {card.glyph}
                      <h2 className={`text-[1.55rem] font-black tracking-tight sm:text-[1.75rem] lg:text-[2.1rem] drop-shadow-sm ${card.accentText}`}>
                        {card.title}
                      </h2>
                    </div>
                    <p
                      id={card.key === 'customer' ? 'desc-cliente' : 'desc-negocio'}
                      className={`mt-4 text-sm text-slate-900 transition-opacity duration-300 sm:text-[0.95rem] lg:text-base dark:text-slate-200/90 ${
                        card.active ? 'opacity-100' : 'opacity-80 md:opacity-0 lg:opacity-75 dark:opacity-65'
                      }`}
                    >
                      {card.copy}
                    </p>
                  </div>

                  <div className="mt-6 flex w-full flex-col gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.26em] text-slate-600 dark:text-slate-300">
                      {t('auth.register.selection.capabilities')}
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" aria-hidden />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {card.microCopy.map((item) => (
                        <span
                          key={item}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-slate-600 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
                        >
                          <span className={`inline-block h-1.5 w-1.5 rounded-full ${card.key === 'customer' ? 'bg-[var(--fc-brand-500)]' : 'bg-[var(--fc-teal-500)]'}`} />
                          {item}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-600 dark:text-slate-300">
                        {t('auth.register.selection.startNow')}
                        <span className={`inline-flex h-1 w-8 rounded-full ${card.key === 'customer' ? 'bg-[var(--fc-brand-500)]/70' : 'bg-[var(--fc-teal-500)]/70'}`} aria-hidden />
                      </div>
                      <div className={`inline-flex items-center gap-2 rounded-full bg-white/85 px-3.5 py-2 text-xs font-semibold shadow-md transition-opacity duration-300 group-focus-visible:opacity-100 group-hover:opacity-100 md:hidden lg:inline-flex ${card.accentText} dark:bg-slate-900/85 dark:shadow-[0_18px_36px_-30px_rgba(2,6,23,0.92)]`}>
                        <span>{t('auth.register.selection.select')}</span>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white/60 to-transparent dark:from-slate-950/90 dark:via-slate-950/45" aria-hidden />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
