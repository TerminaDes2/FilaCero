"use client";
import BusinessOnboardingWizard from '../../../src/components/onboarding/negocio/BusinessOnboardingWizard'
import { BenefitsSection } from '../../../src/components/auth/registerLayout/BenefitsSection'
import { BackButton } from '../../../src/components/auth/registerLayout/BackButton'
import { BrandLogo } from '../../../src/components/BrandLogo'
import LanguageSelector from '../../../src/components/LanguageSelector'
import { useTranslation } from '../../../src/hooks/useTranslation'

export default function NegocioOnboardingPage() {
  const { t } = useTranslation()
  return (
    <div className="fixed inset-0 w-screen h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Brand badge centrado arriba */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
        <div className="px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-md ring-1 ring-black/5 shadow-sm">
          <BrandLogo withWordmark size={44} asLink={true} />
        </div>
      </div>
      {/* Selector de idioma */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageSelector />
      </div>
      {/* Botón Volver para coherencia visual */}
      <BackButton onBackToSelection={() => history.back()} />

      {/* Columna izquierda: beneficios, igual al registro */}
      <BenefitsSection />

      {/* Columna derecha: formulario onboarding embebido */}
      <div className="h-full flex flex-col justify-center items-center sm:px-6 py-4 lg:py-8 overflow-y-auto">
        <div className="w-full max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto px-2 sm:px-0">
          <div className="mb-4 lg:mb-6 text-center">
            <h1 className="text-lg lg:text-xl font-semibold text-gray-900 tracking-tight mb-1">
              {t('onboarding.business.title')}
            </h1>
            <p className="text-xs text-gray-500">
              {t('onboarding.business.subtitle')}
            </p>
          </div>
          <BusinessOnboardingWizard embed />
        </div>
      </div>
    </div>
  )
}
