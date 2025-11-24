"use client";
import React from 'react';
import { useUserStore } from '../../../state/userStore';
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
      title: 'Ahorra tiempo',
      description: 'Haz tu pedido y recógelo sin hacer filas. Tu tiempo es valioso.',
    },
    {
      icon: <Smartphone className="w-6 h-6" strokeWidth={2.5} />,
      title: 'Todo desde tu móvil',
      description: 'Gestiona tu experiencia en cafeterías de forma fácil y rápida.',
    },
    {
      icon: <ShieldCheck className="w-6 h-6" strokeWidth={2.5} />,
      title: 'Seguro y rápido',
      description: 'Tus datos protegidos y tu pedido listo cuando lo necesites.',
    },
    {
      icon: <Tag className="w-6 h-6" strokeWidth={2.5} />,
      title: 'Ofertas exclusivas',
      description: 'Accede a promociones especiales solo para usuarios de FilaCero.',
    },
  ];

  // Puntos clave para Dueños
  const ownerBenefits = [
    {
      icon: <BarChart3 className="w-6 h-6" strokeWidth={2.5} />,
      title: 'Aumenta tus ventas',
      description: 'Incrementa tu capacidad de servicio sin necesidad de ampliar tu local.',
    },
    {
      icon: <Zap className="w-6 h-6" strokeWidth={2.5} />,
      title: 'Optimiza tu operación',
      description: 'Reduce tiempos de espera y mejora la experiencia de tus clientes.',
    },
    {
      icon: <LineChart className="w-6 h-6" strokeWidth={2.5} />,
      title: 'Analíticas en tiempo real',
      description: 'Monitorea tu negocio con datos detallados de ventas y tendencias.',
    },
    {
      icon: <Users className="w-6 h-6" strokeWidth={2.5} />,
      title: 'Gestiona tu equipo',
      description: 'Coordina a tu staff y optimiza los turnos de trabajo eficientemente.',
    },
  ];

  const benefits = role === 'OWNER' ? ownerBenefits : clientBenefits;
  const welcomeTitle =
    role === 'OWNER'
      ? '¡Impulsa tu negocio con FilaCero!'
      : '¡Te damos la bienvenida a FilaCero!';
  const welcomeSubtitle =
    role === 'OWNER'
      ? 'La plataforma definitiva para gestionar tu negocio'
      : 'Tu experiencia sin filas comienza aquí';

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
            Únete a <span className="font-bold" style={{ color: roleColor }}>+1,000</span> {role === 'OWNER' ? 'negocios' : 'usuarios'} satisfechos
          </p>
        </div>
      </div>
    </div>
  );
}
