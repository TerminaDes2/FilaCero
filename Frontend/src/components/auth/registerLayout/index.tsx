import React from 'react';
import { BrandLogo } from '../../BrandLogo';
import LanguageSelector from '../../LanguageSelector';
import StepSignup from '../StepSignup';
import { BenefitsSection } from './BenefitsSection';
import { AuthFormSection } from './AuthFormSection';
import { BackButton } from './BackButton';
import { StepType } from '../registerHooks';
import { useUserStore } from '../../../state/userStore'; // Importar el store

interface RegisterLayoutProps {
  step: StepType;
  onBusinessSelect: () => void;
  onCustomerSelect: () => void;
  onBackToSelection: () => void;
}

export function RegisterLayout({
  step,
  onBusinessSelect,
  onCustomerSelect,
  onBackToSelection
}: RegisterLayoutProps) {

  return (
    <div className={step === 'form'
      ? "fixed inset-0 w-screen h-screen grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-slate-950"
      : "min-h-screen w-full flex flex-col items-center justify-center overflow-hidden px-0 py-0 bg-white dark:bg-slate-950"}>
      
      {/* Brand badge (centrado arriba, chip translúcido) */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
        <div className="px-3 py-1.5 rounded-full bg-white/70 backdrop-blur-md ring-1 ring-black/5 shadow-sm dark:bg-slate-900/80 dark:ring-white/10">
          <BrandLogo withWordmark size={44} asLink={true} />
        </div>
      </div>

      {/* Selector a la izquierda y botón Volver a la derecha, con separación limpia */}
      <div className="absolute top-4 right-16 z-30 flex items-center gap-8">
        <div className="mr-8 mt-4">
          <LanguageSelector />
        </div>
        {step === 'form' && (
          <div className="ml-20">
            <BackButton onBackToSelection={onBackToSelection} />
          </div>
        )}
      </div>

      {/* Paso 1: Selección de tipo de cuenta */}
      {step === 'role_selection' && (
        <StepSignup
          onBusinessSelect={onBusinessSelect}
          onCustomerSelect={onCustomerSelect}
        />
      )}
      
      {/* Paso 2: Formulario de registro */}
      {step === 'form' && (
        <>
          <BenefitsSection />
          <AuthFormSection 
            onBackToSelection={onBackToSelection} 
          />
        </>
      )}
    </div>
  );
}