import { useState } from 'react';
import { useUserStore } from '../../state/userStore'; // Importar el store

export type StepType = 'role_selection' | 'form';

export function useRegisterFlow() {
  const [step, setStep] = useState<StepType>('role_selection');
  const { setRole, role } = useUserStore();

  const handleOwnerSelect = () => {
    setRole('OWNER'); // Guardar en el store global
    setStep('form');
    console.log('Selected role: OWNER', role);
  };

  const handleCustomerSelect = () => {
    setRole('CUSTOMER'); // Guardar en el store global
    setStep('form');
    console.log('Selected role: customer', role);

  };

  const handleBackToSelection = () => {
    setStep('role_selection');
  };

  return {
    step,
    setStep,
    handleOwnerSelect,
    handleCustomerSelect,
    handleBackToSelection
  };
}