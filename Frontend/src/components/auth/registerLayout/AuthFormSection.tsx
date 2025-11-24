import React from 'react';
import { SignupForm } from '../../auth/SignupForm';
import { useUserStore } from '../../../state/userStore';

interface AuthFormSectionProps {
  onBackToSelection: () => void;
}

export function AuthFormSection({ onBackToSelection }: AuthFormSectionProps) {
  const { role } = useUserStore();
  
  // Si no hay rol seleccionado, mostrar mensaje de error
  if (!role) {
    return (
      <div className="h-full flex flex-col justify-center items-center px-6 sm:px-8 py-8 lg:py-12 bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-rose-100 to-rose-200 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Error: Tipo de cuenta no seleccionado
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Por favor, vuelve a seleccionar tu tipo de cuenta para continuar con el registro
          </p>
          <button
            onClick={onBackToSelection}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a seleccionar
          </button>
        </div>
      </div>
    );
  }

  const roleColor = role === 'OWNER' ? '#4CC1AD' : '#D55D7B';
  const gradientFrom = role === 'OWNER' ? 'from-emerald-50' : 'from-rose-50';
  const gradientTo = role === 'OWNER' ? 'to-teal-50' : 'to-pink-50';
  
  const subtitle = role === 'OWNER' 
    ? 'Comienza a gestionar tu negocio de manera eficiente' 
    : 'Disfruta de una experiencia sin filas en tus cafeterías favoritas';

  return (
    <div className={`h-full flex flex-col justify-center items-center px-4 sm:px-6 lg:px-10 xl:px-12 py-6 lg:py-8 overflow-y-auto bg-gradient-to-br ${gradientFrom} ${gradientTo}`}>
      <div className="w-full max-w-xl mx-auto">
        {/* Header con diseño mejorado */}
        <div className="mb-5 lg:mb-6 text-center relative">
          {/* Decorative element */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-28 h-[3px] rounded-full opacity-60"
               style={{ background: `linear-gradient(90deg, transparent, ${roleColor}, transparent)` }} />
          
          <div className="inline-flex items-center gap-2 mb-2.5">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shadow-md"
                 style={{ background: `linear-gradient(135deg, ${roleColor}cc, ${roleColor})` }}>
              {role === 'OWNER' ? (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
          </div>
          
          <h1 className="text-[1.65rem] lg:text-[2.1rem] xl:text-[2.35rem] font-bold text-gray-900 tracking-tight mb-2">
            Crea tu cuenta de{' '}
            <span className="bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent"> 
              {role === 'OWNER' ? 'Negocio' : 'Cliente'}
            </span>
          </h1>
          <p className="text-[13px] lg:text-sm text-gray-600 max-w-sm mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>
        
        {/* Progress indicator */}
        <div className="mb-5 lg:mb-6">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-sm">
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-emerald-700">Tipo seleccionado</span>
            </div>
            <div className="w-10 h-0.5 bg-gradient-to-r from-emerald-300 to-brand-300 rounded-full" />
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-brand-400 to-brand-500 flex items-center justify-center shadow-sm">
                <span className="text-white text-[11px] font-semibold">2</span>
              </div>
              <span className="text-brand-700 font-semibold">Completa tus datos</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-3.5 lg:space-y-4">
          {/* Formulario con glassmorphism */}
          <div className="bg-white/65 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-5 sm:p-6 lg:p-7">
            <SignupForm />
          </div>
          
          {/* Sección "¿Ya tienes una cuenta?" con diseño mejorado */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-white/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-sm">
              <p className="text-[13px] text-gray-700">
                ¿Ya tienes una cuenta?
              </p>
              <a 
                href="/login"
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand-600 hover:text-brand-700 transition-colors group"
              > 
                Iniciar sesión
                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
          
          {/* Botón Volver mejorado para mobile */}
          <div className="block lg:hidden pt-2">
            <button
              onClick={onBackToSelection}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[13px] font-medium text-gray-700 bg-white/60 hover:bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 transition-all duration-200 hover:shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Cambiar tipo de cuenta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}