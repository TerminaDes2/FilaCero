import React from 'react';
import { BrandLogo } from '../../BrandLogo';
import StepSignup from '../StepSignup';
import { BenefitsSection } from './BenefitsSection';
import { AuthFormSection } from './AuthFormSection';
import { BackButton } from './BackButton';
import { StepType } from '../registerHooks';
import { useUserStore } from '../../../state/userStore'; // Importar el store

interface RegisterLayoutProps {
  step: StepType;
  onOwnerSelect: () => void;
  onCustomerSelect: () => void;
  onBackToSelection: () => void;
}

export function RegisterLayout({
  step,
  onOwnerSelect,
  onCustomerSelect,
  onBackToSelection
}: RegisterLayoutProps) {

  return (
    <div className={step === 'form'
      ? "fixed inset-0 w-screen h-screen grid grid-cols-1 lg:grid-cols-2"
      : "min-h-screen w-full flex flex-col items-center justify-center overflow-hidden px-0 py-0"}>
      
      {/* Logo */}
      <div className="absolute top-4 left-4 flex-col items-center gap-3 text-sm z-10">
        <BrandLogo withWordmark 
        size={40}
        asLink={true}
        
        />  
      </div>

      {/* Botón Volver - Solo en paso form */}
      {step === 'form' && <BackButton onBackToSelection={onBackToSelection} />}

      {/* Paso 1: Selección de tipo de cuenta */}
      {step === 'role_selection' && (
        <StepSignup
          onOwnerSelect={onOwnerSelect}
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