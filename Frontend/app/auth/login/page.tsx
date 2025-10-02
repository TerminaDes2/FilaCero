"use client";
import React from 'react';
import Link from 'next/link';
import { LoginForm } from '../../../src/components/auth/LoginForm';
import { BrandLogo } from '../../../src/components/BrandLogo';
import { AuthDynamicBackground } from '../../../src/components/auth/AuthDynamicBackground';

export default function LoginPage() {
  const handleGoogleLogin = () => {
    // Lógica de Google OAuth aquí
    console.log('Login con Google');
  };

  return (
    <div>
    <AuthDynamicBackground />      
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden px-4 py-6">

      <div className="fixed top-4 left-4 z-50">        
        <BrandLogo withWordmark size={40} asLink={true} />
      </div>

      {/* Card de Login */}
      <div className="w-full max-w-sm sm:max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Inicia sesión en tu cuenta</h1>
            <p className="text-gray-600 text-sm">
              Accede a tu cuenta de FilaCero
            </p>
          </div>
          
          <LoginForm />
        </div>
      </div>
    </div>
    </div>
  );
}