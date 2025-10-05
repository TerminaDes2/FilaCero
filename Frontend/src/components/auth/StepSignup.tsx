'use client'

import React from 'react'
import { useUserStore } from '../../state/userStore';

type StepSignupProps = {
  onOwnerSelect?: () => void
  onCustomerSelect?: () => void
}

export default function StepSignup({ onOwnerSelect, onCustomerSelect }: StepSignupProps) {
  const { setRole, role } = useUserStore();
  
  console.log('🔍 StepSignup: Current role in store:', role);

  const handleOwnerClick = () => {
    console.log('🟢 StepSignup: Setting role to OWNER');
    setRole('OWNER');
    
    // Backup adicional en localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedRole', 'OWNER');
      console.log('💾 StepSignup: Backup saved to localStorage: OWNER');
    }
    
    onOwnerSelect?.();
  };

  const handleCustomerClick = () => {
    console.log('🟢 StepSignup: Setting role to CUSTOMER');
    setRole('CUSTOMER');
    
    // Backup adicional en localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedRole', 'CUSTOMER');
      console.log('💾 StepSignup: Backup saved to localStorage: CUSTOMER');
    }
    
    onCustomerSelect?.();
  };

  return (
    <div className="fixed inset-0 w-screen h-screen grid grid-cols-1 md:grid-cols-2">
      {/* Línea divisoria animada */}
      <div className="absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent pointer-events-none hidden md:block" />

      {/* CLIENTE */}
      <button
        type="button"
        className="relative flex flex-col items-center justify-center w-full h-full overflow-hidden group bg-gray-50 hover:bg-gray-100 transition-colors duration-500"
        onClick={handleCustomerClick}
        aria-label="Seleccionar tipo de cuenta: Cliente"
      >
        {/* Overlay base */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#D55D7B]/30 to-[#D55D7B]/50 opacity-70 group-hover:opacity-80 transition-opacity duration-500" />
        <img
          src="/images/clienteprueba.jpg"
          alt="Persona disfrutando de un café como cliente"
          className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-all duration-500 transform group-hover:scale-105"
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />

        {/* Contenido */}
        <div className="relative z-10 flex flex-col items-center text-center p-8">
          <span className="font-bold text-[#D55D7B] text-5xl md:text-6xl mb-4 drop-shadow-lg group-hover:scale-110 transition-transform duration-500">
            Cliente
          </span>
          <p className="text-gray-800 text-lg md:text-xl max-w-xs opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            Ordena y recoge sin hacer fila
          </p>
        </div>

        {/* Indicador “Seleccionar” */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500">
          <div className="flex items-center gap-2 font-medium text-[#D55D7B] bg-white/80 px-4 py-2 rounded-full shadow-md backdrop-blur-sm">
            <span>Seleccionar</span>
            <svg className="w-4 h-4 animate-slide-right" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </button>

      {/* DUEÑO */}
      <button
        type="button"
        className="relative flex flex-col items-center justify-center w-full h-full overflow-hidden group bg-emerald-50 hover:bg-emerald-100 transition-colors duration-500"
        onClick={handleOwnerClick}
        aria-label="Seleccionar tipo de cuenta: Dueño de cafetería"
      >
        {/* Overlay base */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#4CC1AD]/30 to-[#4CC1AD]/50 opacity-70 group-hover:opacity-80 transition-opacity duration-500" />
        <img
          src="/images/dueñoprueba.jpg"
          alt="Dueño de cafetería atendiendo a clientes"
          className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-all duration-500 transform group-hover:scale-105"
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />

        {/* Contenido */}
        <div className="relative z-10 flex flex-col items-center text-center p-8">
          <span className="font-bold text-[#4CC1AD] text-5xl md:text-6xl mb-4 drop-shadow-lg group-hover:scale-110 transition-transform duration-500">
            Dueño
          </span>
          <p className="text-gray-800 text-lg md:text-xl max-w-xs opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            Gestiona tu cafetería eficientemente
          </p>
        </div>

        {/* Indicador “Seleccionar” */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500">
          <div className="flex items-center gap-2 font-medium text-[#4CC1AD] bg-white/80 px-4 py-2 rounded-full shadow-md backdrop-blur-sm">
            <span>Seleccionar</span>
            <svg className="w-4 h-4 animate-slide-right" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </button>
    </div>
  )
}
