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
      <div className="h-full flex flex-col justify-center items-center px-4 sm:px-6 py-4 lg:py-8">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Error: Tipo de cuenta no seleccionado
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Por favor, vuelve a seleccionar tu tipo de cuenta
          </p>
          <button
            onClick={onBackToSelection}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
          >
            Volver a seleccionar
          </button>
        </div>
      </div>
    );
  }

  const subtitle = role === 'OWNER' 
    ? 'Comienza a gestionar tu negocio de manera eficiente' 
    : 'Disfruta de una experiencia sin filas en tus cafeterías favoritas';

  return (
    <div className="h-full flex flex-col justify-center items-center px-4 sm:px-6 py-4 lg:py-8 overflow-y-auto">
      <div className="w-full max-w-sm sm:max-w-md mx-auto">
        {/* Header más compacto */}
        <div className="mb-4 lg:mb-6">
          <h1 className="text-lg lg:text-xl font-semibold text-gray-900 tracking-tight mb-1 text-center">
            Crea tu cuenta de <span className="text-brand-600 font-bold"> 
              {role === 'OWNER' ? 'Negocio' : 'Cliente'}
            </span>
          </h1>
          <p className="text-xs text-gray-500 text-center">
            {subtitle}
          </p>
        </div>
        
        <div className="space-y-3 lg:space-y-4">
          {/* Formulario más compacto */}
          <div className="scale-95 transform origin-top">
            <SignupForm />
          </div>
          
          {/* Sección "¿Ya tienes una cuenta?" más compacta */}
          <div className="text-center pt-1">
            <div className="border-t border-gray-200 pt-3">
              <p className="text-xs text-gray-600">
                ¿Ya tienes una cuenta?{' '}
                <a 
                  href="/login"
                  className="text-brand-600 font-medium hover:underline"
                > 
                  Iniciar sesión
                </a>
              </p>
            </div>
          </div>
          
          {/* Botón Volver más compacto */}
          <div className="block lg:hidden pt-2 border-t border-gray-200">
            <button
              onClick={onBackToSelection}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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