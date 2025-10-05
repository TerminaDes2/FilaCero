"use client";
import React, { useCallback } from 'react';
import { UserProvider, useUserStore } from '../../../src/state/userStore';
import { RegisterLayout } from '../../../src/components/auth/registerLayout';
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
  const onOwner = useCallback(() => {
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
      onOwnerSelect={onOwner}
      onCustomerSelect={onCustomer}
      onBackToSelection={onBack}
    />
  );
}

export default function RegisterPage() {
  return (
    <UserProvider>
      <RegisterPageWithRole />
    </UserProvider>
  );
}