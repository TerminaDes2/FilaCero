"use client";
import React from 'react';
import { UserProvider } from '../../../src/state/userStore';
import { RegisterLayout } from '../../../src/components/auth/registerLayout';
import { useRegisterFlow } from '../../../src/components/auth/registerHooks';

export default function RegisterPage() {
  const {
    step,
    accountType,
    handleOwnerSelect,
    handleCustomerSelect,
    handleBackToSelection
  } = useRegisterFlow();

  return (
    <UserProvider>
      <RegisterLayout
        step={step}
        accountType={accountType}
        onOwnerSelect={handleOwnerSelect}
        onCustomerSelect={handleCustomerSelect}
        onBackToSelection={handleBackToSelection}
      />
    </UserProvider>
  );
}