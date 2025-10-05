import React from 'react';
import { SignupForm } from '../../auth/SignupForm';
import { AccountType } from '../registerHooks';

interface AuthFormSectionProps {
  accountType: AccountType;
  onBackToSelection: () => void;
}

export function AuthFormSection({ accountType, onBackToSelection }: AuthFormSectionProps) {
  const subtitle = accountType === 'dueño' 
    ? 'Comienza a gestionar tu cafetería de manera eficiente' 
    : 'Disfruta de una experiencia sin filas en tus cafeterías favoritas';

  const handleGoogleSignup = () => {
    // Lógica de autenticación con Google
    console.log('Registro con Google para:', accountType);
    // Aquí iría la integración con Google OAuth
  };

  return (
    <div className="h-full flex flex-col justify-center items-center px-4 sm:px-6 py-4 lg:py-8 overflow-y-auto">
      <div className="w-full max-w-sm sm:max-w-md mx-auto">
        {/* Header más compacto */}
        <div className="mb-4 lg:mb-6">
          <h1 className="text-lg lg:text-xl font-semibold text-gray-900 tracking-tight mb-1 text-center">
            Crea tu cuenta de <span className="text-brand-600 font-bold">{accountType}</span>
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
          
          {/* Separador más pequeño
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-gray-500">o</span>
            </div>
          </div>

          Botón de Google más compacto
          <button
            type="button"
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            <img 
              src="/images/google.svg" 
              alt="Google" 
              className="w-4 h-4"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            Crea tu cuenta con Google
          </button>
           */}
          {/* Sección "¿Ya tienes una cuenta?" más compacta */}
          <div className="text-center pt-1">
            <div className="border-t border-gray-200 pt-3">
              <p className="text-xs text-gray-600">
                ¿Ya tienes una cuenta?{' '}
                <a 
                  href="/auth/login"
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