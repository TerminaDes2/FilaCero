"use client";
import React from 'react';

interface AuthCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  brandMark?: React.ReactNode;
  compact?: boolean;
  brandFull?: boolean;
}

export function AuthCard({ children }: AuthCardProps) {
  return (
    <div className="min-h-screen w-full grid grid-cols-1 md:grid-cols-2">
      {/* Izquierda: puntos clave */}
      <div className="flex flex-col justify-center items-center bg-gradient-to-br from-brand-100 to-brand-50 px-8">
        <div className="max-w-xs">
          <h2 className="text-2xl font-bold mb-6 text-brand-700">¡Te damos la bienvenida a FilaCero!</h2>
          <ul className="space-y-6 text-lg text-gray-700">
            <li>
              <span className="font-semibold text-brand-600">⏱️ Ahorra tiempo:</span> Haz tu pedido y recógelo sin filas.
            </li>
            <li>
              <span className="font-semibold text-brand-600">📱 Todo desde tu móvil:</span> Gestiona tu experiencia en cafeterías fácilmente.
            </li>
            <li>
              <span className="font-semibold text-brand-600">🔒 Seguro y rápido:</span> Tus datos protegidos, tu pedido listo.
            </li>
          </ul>
        </div>
      </div>
      {/* Derecha: AuthCard */}
      <div className="flex flex-col justify-center items-center px-4">
        <div className="w-full max-w-md mx-auto">
          <div className="mb-8">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight mb-2 text-center">
              Inicia sesión o regístrate
            </h1>
          </div>
          <div className="space-y-5">
            {children}
            <button
              type="button"
              className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 shadow hover:bg-gray-50 transition text-gray-700 font-medium"
              onClick={() => {/* lógica de Google Auth */}}
            >
              <img src="/images/google.svg" alt="Google" className="w-5 h-5" />
              Continuar con Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
