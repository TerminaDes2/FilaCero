"use client";
import BusinessOnboardingWizard from '../../../src/components/onboarding/negocio/BusinessOnboardingWizard'
import { BenefitsSection } from '../../../src/components/auth/registerLayout/BenefitsSection'
import { BackButton } from '../../../src/components/auth/registerLayout/BackButton'
import { BrandLogo } from '../../../src/components/BrandLogo'

export default function NegocioOnboardingPage() {
  return (
    <div className="fixed inset-0 w-screen h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Brand badge centrado arriba */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
        <div className="px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-md ring-1 ring-black/5 shadow-sm">
          <BrandLogo withWordmark size={44} asLink={true} />
        </div>
      </div>
      {/* Botón Volver para coherencia visual */}
      <BackButton onBackToSelection={() => history.back()} />

      {/* Columna izquierda: beneficios, igual al registro */}
      <BenefitsSection />

      {/* Columna derecha: formulario onboarding embebido */}
      <div className="h-full flex flex-col justify-center items-center px-4 sm:px-6 py-4 lg:py-8 overflow-y-auto">
        <div className="w-full max-w-sm sm:max-w-md mx-auto">
          <div className="mb-4 lg:mb-6 text-center">
            <h1 className="text-lg lg:text-xl font-semibold text-gray-900 tracking-tight mb-1">
              Continúa con tu <span className="text-brand-600 font-bold">Negocio</span>
            </h1>
            <p className="text-xs text-gray-500">
              Completa estos pasos para finalizar tu registro
            </p>
          </div>
          <BusinessOnboardingWizard embed />
        </div>
      </div>
    </div>
  )
}
