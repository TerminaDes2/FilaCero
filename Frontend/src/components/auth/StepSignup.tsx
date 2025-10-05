'use client'

import React from 'react'
import { useUserStore } from '../../state/userStore';

type StepSignupProps = {
  onOwnerSelect?: () => void
  onCustomerSelect?: () => void
}

export default function StepSignup({ onOwnerSelect, onCustomerSelect }: StepSignupProps) {
  const { setRole } = useUserStore();

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
    <div
      className="fixed inset-0 w-screen h-screen grid grid-cols-1 md:grid-cols-2 select-none"
      role="group"
      aria-label="Selecciona el tipo de cuenta"
    >
      {/* Línea divisoria animada */}
      <div className="absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent pointer-events-none hidden md:block" />

      {/* CLIENTE */}
      <button
        type="button"
        className="relative flex flex-col items-center justify-center w-full h-full overflow-hidden group bg-gray-50 hover:bg-gray-100 transition-colors duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fc-brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.995]"
        onClick={handleCustomerClick}
        aria-label="Seleccionar tipo de cuenta: Cliente"
        aria-describedby="desc-cliente"
      >
        {/* Overlay base */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#D55D7B]/30 to-[#D55D7B]/50 opacity-70 group-hover:opacity-80 transition-opacity duration-500" />
        {/* Blob decorativo */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-[55vw] md:w-[32vw] aspect-square rounded-full blur-3xl opacity-40" style={{ background: 'radial-gradient(closest-side, #D55D7B55, transparent)' }} />
        <img
          src="/images/clienteprueba.jpg"
          alt="Persona disfrutando de un café como cliente"
          className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-all duration-500 transform motion-safe:group-hover:scale-105"
          loading="lazy"
          decoding="async"
          sizes="(min-width: 768px) 50vw, 100vw"
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />

  {/* Contenido */}
        <div className="relative z-10 flex flex-col items-center text-center p-8">
          <span className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-2 text-gray-700/90">Para ti</span>
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/70 backdrop-blur-sm font-extrabold text-[#D55D7B] text-5xl md:text-6xl mb-4 drop-shadow group-hover:scale-110 transition-transform duration-500 motion-safe:group-hover:scale-110">
            {/* Icono taza */}
            <svg aria-hidden viewBox="0 0 24 24" className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8h12v5a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8z"/>
              <path d="M15 9h3a2 2 0 0 1 0 4h-3"/>
            </svg>
            <span>Cliente</span>
          </span>
          <p id="desc-cliente" className="text-gray-900 text-lg md:text-xl max-w-xs opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            Ordena y recoge sin hacer fila
          </p>
        </div>

        {/* Indicador “Seleccionar” */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-all duration-500">
          <div className="flex items-center gap-2 font-medium text-[#D55D7B] bg-white/80 px-4 py-2 rounded-full shadow-md backdrop-blur-sm">
            <span>Seleccionar</span>
            <svg className="w-4 h-4 animate-slide-right" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
        {/* Keyboard hint (visible on focus) */}
        <div className="absolute top-6 right-6 opacity-0 group-focus-visible:opacity-100 transition-opacity duration-300">
          <div className="kbd-hint">Enter para seleccionar</div>
        </div>

        {/* Bordes sutiles para mayor legibilidad del contenido */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/50 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/50 to-transparent" />
      </button>

      {/* DUEÑO */}
      <button
        type="button"
        className="relative flex flex-col items-center justify-center w-full h-full overflow-hidden group bg-emerald-50 hover:bg-emerald-100 transition-colors duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fc-brand-600)] focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-[0.995]"
        onClick={handleOwnerClick}
        aria-label="Seleccionar tipo de cuenta: Dueño de cafetería"
        aria-describedby="desc-dueno"
      >
        {/* Overlay base */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#4CC1AD]/30 to-[#4CC1AD]/50 opacity-70 group-hover:opacity-80 transition-opacity duration-500" />
        {/* Blob decorativo */}
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-[55vw] md:w-[32vw] aspect-square rounded-full blur-3xl opacity-40" style={{ background: 'radial-gradient(closest-side, #4CC1AD55, transparent)' }} />
        <img
          src="/images/dueñoprueba.jpg"
          alt="Dueño de cafetería atendiendo a clientes"
          className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 transition-all duration-500 transform motion-safe:group-hover:scale-105"
          loading="lazy"
          decoding="async"
          sizes="(min-width: 768px) 50vw, 100vw"
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />

        {/* Contenido */}
        <div className="relative z-10 flex flex-col items-center text-center p-8">
          <span className="text-[11px] uppercase tracking-[0.18em] font-semibold mb-2 text-gray-700/90">Para negocios</span>
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/70 backdrop-blur-sm font-extrabold text-[#4CC1AD] text-5xl md:text-6xl mb-4 drop-shadow group-hover:scale-110 transition-transform duration-500 motion-safe:group-hover:scale-110">
            {/* Icono tienda */}
            <svg aria-hidden viewBox="0 0 24 24" className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7h18l-2 5H5L3 7z"/>
              <path d="M5 12v7h14v-7"/>
            </svg>
            <span>Dueño</span>
          </span>
          <p id="desc-dueno" className="text-gray-900 text-lg md:text-xl max-w-xs opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            Gestiona tu cafetería eficientemente
          </p>
        </div>

        {/* Indicador “Seleccionar” */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-all duration-500">
          <div className="flex items-center gap-2 font-medium text-[#4CC1AD] bg-white/80 px-4 py-2 rounded-full shadow-md backdrop-blur-sm">
            <span>Seleccionar</span>
            <svg className="w-4 h-4 animate-slide-right" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {/* Bordes sutiles para mayor legibilidad del contenido */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/50 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/50 to-transparent" />
      </button>
    </div>
  )
}
