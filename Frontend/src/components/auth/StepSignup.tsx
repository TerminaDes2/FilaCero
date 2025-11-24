'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useUserStore } from '../../state/userStore';

type StepSignupProps = {
  onBusinessSelect?: () => void;
  onCustomerSelect?: () => void;
};

type RoleKey = 'customer' | 'owner';

export default function StepSignup({ onBusinessSelect, onCustomerSelect }: StepSignupProps) {
  const { setRole } = useUserStore();
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
      badge: 'Para personas',
      title: 'Cliente FilaCero',
      copy: 'Crea pedidos en segundos, recibe alertas de recojo y acumula beneficios sin filas.',
      gradient: 'from-[rgba(233,74,111,0.35)] via-[rgba(236,122,149,0.28)] to-transparent',
      accentBg: 'bg-[rgba(233,74,111,0.16)]/80',
      accentBorder: 'border-[rgba(233,74,111,0.35)]/70',
      accentText: 'text-[var(--fc-brand-600)]',
      glow: 'shadow-[0_18px_42px_-18px_rgba(233,74,111,0.42)]',
      ring: 'focus-visible:ring-[var(--fc-brand-500)]',
      glyph: (
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/80 text-[var(--fc-brand-600)] shadow-md shadow-[rgba(233,74,111,0.35)]">
          <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8h12v5a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z" />
            <path d="M15 9h3a2 2 0 0 1 0 4h-3" />
          </svg>
        </span>
      ),
      microCopy: ['Pedidos anticipados', 'Wallet digital', 'Recompensas automáticas'],
      image: {
        src: '/images/clienteprueba.jpg',
        alt: 'Cliente usando FilaCero desde el móvil'
      },
      active: isCustomerActive
    },
    {
      key: 'owner' as RoleKey,
      badge: 'Para negocios',
      title: 'Negocio Inteligente',
      copy: 'Centraliza pedidos, pagos y métricas en vivo con herramientas colaborativas para tu equipo.',
      gradient: 'from-[rgba(76,193,173,0.32)] via-[rgba(107,210,197,0.24)] to-transparent',
      accentBg: 'bg-[rgba(76,193,173,0.14)]/80',
      accentBorder: 'border-[rgba(76,193,173,0.35)]/70',
      accentText: 'text-[var(--fc-teal-600)]',
      glow: 'shadow-[0_18px_42px_-18px_rgba(76,193,173,0.42)]',
      ring: 'focus-visible:ring-[var(--fc-teal-500)]',
      glyph: (
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/80 text-[var(--fc-teal-600)] shadow-md shadow-[rgba(76,193,173,0.35)]">
          <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7h18l-2 5H5L3 7z" />
            <path d="M5 12v7h14v-7" />
          </svg>
        </span>
      ),
      microCopy: ['Dashboard POS', 'Roles y permisos', 'Insights de ventas'],
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
      aria-label="Selecciona el tipo de cuenta"
      className="relative flex min-h-screen w-full flex-col overflow-hidden bg-gradient-to-b from-white via-white to-brand-50 px-4 pb-10 pt-16 sm:px-6 md:pt-20 lg:px-10 lg:pb-16 lg:pt-24"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(233,74,111,0.12),_transparent_55%)]" aria-hidden />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(76,193,173,0.12),_transparent_60%)]" aria-hidden />

      <div className="relative z-10 flex w-full flex-col px-1 sm:px-4 lg:px-10 xl:px-16">
        <div className="flex h-full flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:items-center lg:gap-14">
          <div className="mx-auto w-full text-center lg:mx-0 lg:text-left lg:pr-6 xl:pr-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-brand-600 shadow-sm">
              Tu cuenta FilaCero
            </span>
            <h1 className="mt-4 text-[1.85rem] font-extrabold tracking-tight text-slate-900 sm:text-[2.25rem] lg:text-[2.75rem] lg:leading-[1.12]">
              ¿Cómo quieres comenzar?
            </h1>
            <p className="mt-3 text-sm text-slate-600 sm:text-[0.95rem] lg:text-base lg:text-slate-500">
              Elige el viaje que mejor describe tu rol y prepara una experiencia con interface personalizada, más rápida y totalmente enlazada al ecosistema FilaCero.
            </p>

            <div className="mt-6 hidden lg:grid gap-2.5 text-sm text-slate-500">
              <div className="inline-flex items-center gap-2.5 rounded-full border border-white/60 bg-white/60 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.26em] text-brand-500">
                Selección guiada
              </div>
              <ul className="grid gap-2 text-sm text-slate-600">
                <li className="inline-flex items-center gap-3 rounded-2xl border border-white/70 bg-white/75 px-3.5 py-2.5 shadow-sm">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-brand-500 text-xs font-semibold">1</span>
                  <span className="text-[13px]">Escoge tu rol para activar la experiencia correcta.</span>
                </li>
                <li className="inline-flex items-center gap-3 rounded-2xl border border-white/70 bg-white/75 px-3.5 py-2.5 shadow-sm">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-teal-50 text-teal-500 text-xs font-semibold">2</span>
                  <span className="text-[13px]">Completa un formulario inteligente con bloques adaptados a tu objetivo.</span>
                </li>
                <li className="inline-flex items-center gap-3 rounded-2xl border border-white/70 bg-white/75 px-3.5 py-2.5 shadow-sm">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">3</span>
                  <span className="text-[13px]">Accede a la plataforma con onboarding guiado y recursos curados.</span>
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
                aria-label={card.key === 'customer' ? 'Seleccionar tipo de cuenta: Cliente' : 'Seleccionar tipo de cuenta: Negocio'}
                aria-describedby={card.key === 'customer' ? 'desc-cliente' : 'desc-negocio'}
                onMouseEnter={() => setHovered(card.key)}
                onMouseLeave={() => setHovered((current) => (current === card.key ? null : current))}
                onFocus={() => setFocused(card.key)}
                onBlur={() => setFocused((current) => (current === card.key ? null : current))}
                className={`group relative flex min-h-[210px] flex-col overflow-hidden rounded-[28px] border border-white/70 bg-white/85 px-5 pb-10 pt-9 text-left shadow-lg transition-transform duration-300 hover:-translate-y-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-slate-950/40 sm:min-h-[230px] lg:min-h-[280px] lg:px-6 lg:pb-9 lg:pt-10 ${card.glow} ${card.ring}`}
              >
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-95 transition-opacity duration-500 group-hover:opacity-100`} />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.45),transparent_60%)]" aria-hidden />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(255,255,255,0.35),transparent_60%)]" aria-hidden />

                <Image
                  src={card.image.src}
                  alt={card.image.alt}
                  fill
                  priority={false}
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="pointer-events-none object-cover opacity-20 transition duration-500 group-hover:scale-105 group-hover:opacity-35"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />

                <div className="relative z-10 flex flex-1 flex-col items-start justify-between">
                  <div>
                    <div className={`inline-flex items-center gap-3 rounded-full border ${card.accentBorder} ${card.accentBg} px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-600 shadow-sm backdrop-blur`}
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
                      className={`mt-4 text-sm text-slate-900 transition-opacity duration-300 sm:text-[0.95rem] lg:text-base ${
                        card.active ? 'opacity-100' : 'opacity-80 md:opacity-0 lg:opacity-80'
                      }`}
                    >
                      {card.copy}
                    </p>
                  </div>

                  <div className="mt-5 flex w-full flex-col gap-2.5">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.24em] text-slate-600">
                      Capacidades clave
                      <span className="inline-flex h-1.5 w-1.5 rounded-full bg-slate-300" aria-hidden />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {card.microCopy.map((item) => (
                        <span
                          key={item}
                          className="inline-flex items-center gap-1.5 rounded-full border border-white/70 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-slate-600 shadow-sm backdrop-blur"
                        >
                          <span className={`inline-block h-1.5 w-1.5 rounded-full ${card.key === 'customer' ? 'bg-[var(--fc-brand-500)]' : 'bg-[var(--fc-teal-500)]'}`} />
                          {item}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-600">
                        Comenzar ahora
                        <span className={`inline-flex h-1 w-8 rounded-full ${card.key === 'customer' ? 'bg-[var(--fc-brand-500)]/70' : 'bg-[var(--fc-teal-500)]/70'}`} aria-hidden />
                      </div>
                        <div className={`inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1.5 text-[11px] font-semibold shadow-md transition-opacity duration-300 group-focus-visible:opacity-100 group-hover:opacity-100 md:hidden lg:inline-flex ${card.accentText}`}>
                        <span>Seleccionar</span>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white/60 to-transparent" aria-hidden />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
