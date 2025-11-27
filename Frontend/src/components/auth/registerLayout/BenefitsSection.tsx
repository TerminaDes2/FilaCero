"use client";
import React from 'react';
import { useUserStore } from '../../../state/userStore';
import { useTranslation } from '../../../hooks/useTranslation';
import {
  Clock,
  Smartphone,
  ShieldCheck,
  Tag,
  BarChart3,
  Zap,
  LineChart,
  Users,
  Sparkles,
} from 'lucide-react';

interface BenefitsSectionProps {}

export function BenefitsSection({}: BenefitsSectionProps) {
  const { role } = useUserStore();
  const { t } = useTranslation();

  const isOwner = role === 'OWNER';
  const roleColor = isOwner ? '#3CB29A' : '#D45978';
  const accentSurface = isOwner
    ? 'from-emerald-50 via-teal-50 to-cyan-50'
    : 'from-rose-50 via-pink-50 to-orange-50';
  const chipBg = isOwner ? 'bg-teal-100/70 text-teal-700' : 'bg-rose-100/70 text-rose-700';

  // Puntos clave para Clientes
  const clientBenefits = [
    {
      icon: <Clock className="w-6 h-6" strokeWidth={2.5} />,
      title: t('auth.register.benefits.client.0.title'),
      description: t('auth.register.benefits.client.0.description'),
    },
    {
      icon: <Smartphone className="w-6 h-6" strokeWidth={2.5} />,
      title: t('auth.register.benefits.client.1.title'),
      description: t('auth.register.benefits.client.1.description'),
    },
    {
      icon: <ShieldCheck className="w-6 h-6" strokeWidth={2.5} />,
      title: t('auth.register.benefits.client.2.title'),
      description: t('auth.register.benefits.client.2.description'),
    },
    {
      icon: <Tag className="w-6 h-6" strokeWidth={2.5} />,
      title: t('auth.register.benefits.client.3.title'),
      description: t('auth.register.benefits.client.3.description'),
    },
  ];

  // Puntos clave para Dueños
  const ownerBenefits = [
    {
      icon: <BarChart3 className="w-6 h-6" strokeWidth={2.5} />,
      title: t('auth.register.benefits.owner.0.title'),
      description: t('auth.register.benefits.owner.0.description'),
    },
    {
      icon: <Zap className="w-6 h-6" strokeWidth={2.5} />,
      title: t('auth.register.benefits.owner.1.title'),
      description: t('auth.register.benefits.owner.1.description'),
    },
    {
      icon: <LineChart className="w-6 h-6" strokeWidth={2.5} />,
      title: t('auth.register.benefits.owner.2.title'),
      description: t('auth.register.benefits.owner.2.description'),
    },
    {
      icon: <Users className="w-6 h-6" strokeWidth={2.5} />,
      title: t('auth.register.benefits.owner.3.title'),
      description: t('auth.register.benefits.owner.3.description'),
    },
  ];

  const benefits = role === 'OWNER' ? ownerBenefits : clientBenefits;
  const welcomeTitle = role === 'OWNER' ? t('auth.register.benefits.welcomeTitle.owner') : t('auth.register.benefits.welcomeTitle.client');
  const welcomeSubtitle = role === 'OWNER' ? t('auth.register.benefits.welcomeSubtitle.owner') : t('auth.register.benefits.welcomeSubtitle.client');

  return (
    <section
      className={`relative h-full w-full overflow-hidden bg-gradient-to-br ${accentSurface} px-6 sm:px-8 lg:px-10 xl:px-14 py-8 lg:py-10 transition-colors duration-500`}
    >
      <div
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-56 translate-x-1/3 rounded-full blur-3xl opacity-30 sm:block"
        style={{ background: `radial-gradient(circle at center, ${roleColor}, transparent 70%)` }}
      />
      <div
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-40 -translate-x-1/3 rounded-full blur-3xl opacity-20 sm:block"
        style={{ background: `radial-gradient(circle at center, ${roleColor}, transparent 65%)` }}
      />

      <div className="relative z-10 flex h-full w-full flex-col gap-6 lg:gap-8">
        <header className="space-y-3">
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] shadow-sm ${chipBg}`}>
            <Sparkles className="h-4 w-4" strokeWidth={2.5} />
            {isOwner ? 'Modo negocio' : 'Modo cliente'}
          </div>
          <h2 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl lg:text-[2.1rem]" style={{ color: roleColor }}>
            {welcomeTitle}
          </h2>
          <p className="max-w-lg text-sm text-slate-600 sm:text-base">
            {welcomeSubtitle}
          </p>
        </header>

        <ul className="grid gap-3 sm:gap-4">
          {benefits.map((benefit) => (
            <li
              key={benefit.title}
              className="group relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 px-4 py-4 shadow-sm backdrop-blur transition-colors duration-200 hover:border-white hover:bg-white"
            >
              <div className="flex items-start gap-3">
                <span
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-md"
                  style={{ color: roleColor }}
                >
                  {benefit.icon}
                </span>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-slate-900 sm:text-base" style={{ color: roleColor }}>
                    {benefit.title}
                  </h3>
                  <p className="mt-1 text-[13px] text-slate-600 sm:text-sm">
                    {benefit.description}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-xs text-slate-600 shadow-sm backdrop-blur sm:text-sm">
          <div className="flex -space-x-2">
            {[roleColor, `${roleColor}CC`, `${roleColor}AA`].map((tone, index) => (
              <span
                key={tone + index}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white shadow"
                style={{ background: `linear-gradient(135deg, ${tone}, ${tone}99)` }}
              />
            ))}
          </div>
          <p className="font-medium">
            {role === 'OWNER' ? t('auth.register.benefits.join.owner') : t('auth.register.benefits.join.client')}
          </p>
        </div>
      </div>
    </section>
  );
}
