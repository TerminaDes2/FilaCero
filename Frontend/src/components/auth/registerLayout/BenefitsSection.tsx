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

  // Colores según el rol (mismos que StepSignup)
  const roleColor = role === 'OWNER' ? '#4CC1AD' : '#D55D7B';
  const bgGradient =
    role === 'OWNER'
      ? 'bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50'
      : 'bg-gradient-to-br from-rose-50 via-pink-50 to-red-50';

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
    <div
      className={`relative h-full flex flex-col justify-center items-start ${bgGradient} px-6 sm:px-8 lg:px-12 xl:px-16 py-8 lg:py-12 transition-colors duration-700 overflow-hidden`}
    >
      {/* Decorative blobs */}
      <div className="absolute top-10 right-10 w-64 h-64 rounded-full blur-3xl opacity-20 animate-blob"
           style={{ background: `radial-gradient(circle, ${roleColor}, transparent)` }} />
      <div className="absolute bottom-10 left-10 w-48 h-48 rounded-full blur-3xl opacity-15 animate-blob-lazy"
           style={{ background: `radial-gradient(circle, ${roleColor}, transparent)` }} />
      
      <div className="max-w-xl lg:max-w-lg xl:max-w-xl relative z-10">
        {/* Header section with icon */}
        <div className="mb-8 lg:mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform"
                 style={{ background: `linear-gradient(135deg, ${roleColor}ee, ${roleColor})` }}>
              <Sparkles className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
          </div>
          
          <h2
            className="text-3xl lg:text-4xl xl:text-5xl font-extrabold mb-3 leading-tight"
            style={{ color: roleColor }}
          >
            {welcomeTitle}
          </h2>
          <p className="text-base lg:text-lg text-gray-700 font-medium">
            {welcomeSubtitle}
          </p>
        </div>
        
        {/* Benefits list with enhanced cards */}
        <ul className="space-y-5 lg:space-y-6">
          {benefits.map((benefit, index) => (
            <li 
              key={index} 
              className="group relative bg-white/60 backdrop-blur-sm rounded-2xl p-5 shadow-md hover:shadow-xl border border-white/80 transition-all duration-300 hover:scale-[1.02]"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Hover gradient effect */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                   style={{ background: `linear-gradient(135deg, ${roleColor}10, transparent)` }} />
              
              <div className="flex items-start gap-4 relative z-10">
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110"
                  style={{ background: `linear-gradient(135deg, ${roleColor}dd, ${roleColor})` }}
                >
                  <span className="text-white">
                    {benefit.icon}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="font-bold text-lg lg:text-xl mb-1.5 group-hover:translate-x-1 transition-transform"
                    style={{ color: roleColor }}
                  >
                    {benefit.title}
                  </h3>
                  <p className="text-gray-700 text-sm lg:text-base leading-relaxed">
                    {benefit.description}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
        
        {/* Trust badge */}
        <div className="mt-8 lg:mt-10 flex items-center gap-3 text-sm text-gray-600">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div 
                key={i}
                className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                style={{ background: `linear-gradient(135deg, ${roleColor}${90 - i * 10}, ${roleColor}${70 - i * 10})` }}
              />
            ))}
          </div>
          <p className="font-medium">
            {role === 'OWNER' ? t('auth.register.benefits.join.owner') : t('auth.register.benefits.join.client')}
          </p>
        </div>
      </div>
    </div>
  );
}
