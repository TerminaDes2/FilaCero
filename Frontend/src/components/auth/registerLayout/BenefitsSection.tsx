import React from 'react';
import { useUserStore} from '../../../state/userStore';

interface BenefitsSectionProps {
  // accountType ya no es necesario como prop
}

export function BenefitsSection({ }: BenefitsSectionProps) {
  const { role } = useUserStore();

  // Puntos clave para Clientes
  const clientBenefits = [
    {
      icon: "⏱️",
      title: "Ahorra tiempo:",
      description: "Haz tu pedido y recógelo sin filas."
    },
    {
      icon: "📱",
      title: "Todo desde tu móvil:",
      description: "Gestiona tu experiencia en cafeterías fácilmente."
    },
    {
      icon: "🔒",
      title: "Seguro y rápido:",
      description: "Tus datos protegidos, tu pedido listo."
    },
    {
      icon: "💰",
      title: "Ofertas exclusivas:",
      description: "Accede a promociones solo para usuarios de la app."
    }
  ];

  // Puntos clave para Dueños
  const ownerBenefits = [
    {
      icon: "📈",
      title: "Aumenta tus ventas:",
      description: "Incrementa tu capacidad de servicio sin ampliar tu local."
    },
    {
      icon: "⚡",
      title: "Optimiza tu operación:",
      description: "Reduce tiempos de espera y mejora la experiencia del cliente."
    },
    {
      icon: "📊",
      title: "Analíticas en tiempo real:",
      description: "Monitorea tu negocio con datos detallados de ventas y tendencias."
    },
    {
      icon: "👥",
      title: "Gestiona tu equipo:",
      description: "Coordina a tu staff y optimiza los turnos de trabajo."
    }
  ];

  // Convertir AppRole a formato compatible
  // const accountType = role === 'OWNER' ? 'dueño' : 'cliente';
  
  const benefits = role === 'OWNER' ? ownerBenefits : clientBenefits;
  const welcomeTitle = role === 'OWNER' 
    ? "¡Impulsa tu cafetería con FilaCero!" 
    : "¡Te damos la bienvenida a FilaCero!";

  return (
    <div className="h-full flex flex-col justify-center items-start bg-gradient-to-br from-brand-100 to-brand-50 px-8 lg:px-16 py-8 lg:py-16">
      <div className="max-w-xs lg:max-w-sm">
        <h2 className="text-2xl lg:text-3xl font-bold mb-6 lg:mb-8 text-brand-700">
          {welcomeTitle}
        </h2>
        <ul className="space-y-4 lg:space-y-6 text-base lg:text-lg text-gray-700">
          {benefits.map((benefit, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">{benefit.icon}</span>
              <div>
                <span className="font-semibold text-brand-600 block">
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