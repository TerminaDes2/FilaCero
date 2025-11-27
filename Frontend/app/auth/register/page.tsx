"use client";
import React, { useCallback } from 'react';
import { useUserStore } from '../../../src/state/userStore';
import { RegisterLayout } from '../../../src/components/auth/registerLayout';
import LanguageSelector from '../../../src/components/LanguageSelector';
import { useRegisterFlow } from '../../../src/components/auth/registerHooks';

// Componente interno que ya vive dentro del provider y puede tocar el contexto
function RegisterPageWithRole() {
  const { setRole, reset } = useUserStore();
  const {
    step,
    handleOwnerSelect,
    handleCustomerSelect,
    handleBackToSelection
  } = useRegisterFlow();

  // Wrap de handlers para sincronizar el rol global
  const onBusiness = useCallback(() => {
    handleOwnerSelect();
    setRole('OWNER');
  }, [handleOwnerSelect, setRole]);

  const onCustomer = useCallback(() => {
    handleCustomerSelect();
    setRole('CUSTOMER');
  }, [handleCustomerSelect, setRole]);

  const onBack = useCallback(() => {
    reset();
    handleBackToSelection();
  }, [reset, handleBackToSelection]);

  return (
    <RegisterLayout
      step={step}
      onBusinessSelect={onBusiness}
      onCustomerSelect={onCustomer}
      onBackToSelection={onBack}
    />
  );
}

export default function RegisterPage() {
  return (
    <>
      <div className="fixed top-4 left-4 z-50">
        {/* keep brand if layout centers it; RegisterLayout already renders brand chip, but keep left spot reserved */}
      </div>
      <div className="fixed bottom-4 right-4 z-[130] sm:bottom-6 sm:right-6">
        <LanguageSelector />
      </div>
      <RegisterPageWithRole />
    </>
  );
}