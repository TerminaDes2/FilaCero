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
} from 'lucide-react';

interface BenefitsSectionProps {}

export function BenefitsSection({}: BenefitsSectionProps) {
  const { role } = useUserStore();

  // Colores según el rol (mismos que StepSignup)
  const roleColor = role === 'OWNER' ? '#4CC1AD' : '#D55D7B';
  const bgGradient =
    role === 'OWNER'
      ? 'bg-gradient-to-br from-[#4CC1AD]/20 to-[#4CC1AD]/10'
      : 'bg-gradient-to-br from-[#D55D7B]/20 to-[#D55D7B]/10';

  // Puntos clave para Clientes
  const clientBenefits = [
    {
      icon: <Clock className="w-6 h-6" strokeWidth={2} />,
      title: 'Ahorra tiempo:',
      description: 'Haz tu pedido y recógelo sin filas.',
    },
    {
      icon: <Smartphone className="w-6 h-6" strokeWidth={2} />,
      title: 'Todo desde tu móvil:',
      description: 'Gestiona tu experiencia en cafeterías fácilmente.',
    },
    {
      icon: <ShieldCheck className="w-6 h-6" strokeWidth={2} />,
      title: 'Seguro y rápido:',
      description: 'Tus datos protegidos, tu pedido listo.',
    },
    {
      icon: <Tag className="w-6 h-6" strokeWidth={2} />,
      title: 'Ofertas exclusivas:',
      description: 'Accede a promociones solo para usuarios de la app.',
    },
  ];

  // Puntos clave para Dueños
  const ownerBenefits = [
    {
      icon: <BarChart3 className="w-6 h-6" strokeWidth={2} />,
      title: 'Aumenta tus ventas:',
      description: 'Incrementa tu capacidad de servicio sin ampliar tu local.',
    },
    {
      icon: <Zap className="w-6 h-6" strokeWidth={2} />,
      title: 'Optimiza tu operación:',
      description: 'Reduce tiempos de espera y mejora la experiencia del cliente.',
    },
    {
      icon: <LineChart className="w-6 h-6" strokeWidth={2} />,
      title: 'Analíticas en tiempo real:',
      description: 'Monitorea tu negocio con datos detallados de ventas y tendencias.',
    },
    {
      icon: <Users className="w-6 h-6" strokeWidth={2} />,
      title: 'Gestiona tu equipo:',
      description: 'Coordina a tu staff y optimiza los turnos de trabajo.',
    },
  ];

  const benefits = role === 'OWNER' ? ownerBenefits : clientBenefits;
  const welcomeTitle =
    role === 'OWNER'
      ? '¡Impulsa tu negocio con FilaCero!'
      : '¡Te damos la bienvenida a FilaCero!';

  return (
    <div
      className={`h-full flex flex-col justify-center items-start ${bgGradient} px-8 lg:px-16 py-8 lg:py-16 transition-colors duration-700`}
    >
      <div className="max-w-xs lg:max-w-sm">
        <h2
          className="text-2xl lg:text-3xl font-bold mb-6 lg:mb-8"
          style={{ color: roleColor }}
        >
          {welcomeTitle}
        </h2>
        <ul className="space-y-4 lg:space-y-6 text-base lg:text-lg text-gray-700">
          {benefits.map((benefit, index) => (
            <li key={index} className="flex items-start gap-3">
              <div
                className="flex-shrink-0 mt-1"
                style={{ color: roleColor }}
              >
                {benefit.icon}
              </div>
              <div>
                <span
                  className="font-semibold block"
                  style={{ color: roleColor }}
                >
                  {benefit.title}
                </span>
                <span className="text-gray-600 text-sm lg:text-base">
                  {benefit.description}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
