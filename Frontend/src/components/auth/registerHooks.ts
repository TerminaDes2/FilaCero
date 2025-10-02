import { useState } from 'react';

export type AccountType = 'usuario' | 'dueño';
export type StepType = 'owner' | 'form';

export function useRegisterFlow() {
  const [step, setStep] = useState<StepType>('owner');
  const [accountType, setAccountType] = useState<AccountType>('usuario');

  const handleOwnerSelect = () => {
    setAccountType('dueño');
    setStep('form');
  };

  const handleCustomerSelect = () => {
    setAccountType('usuario');
    setStep('form');
  };

  const handleBackToSelection = () => {
    setStep('owner');
  };

  return {
    step,
    accountType,
    setStep,
    setAccountType,
    handleOwnerSelect,
    handleCustomerSelect,
    handleBackToSelection
  };
}