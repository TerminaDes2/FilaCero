"use client";
import React from 'react';
import Link from 'next/link';
import { LoginForm } from '../../../src/components/auth/LoginForm';
import { BrandLogo } from '../../../src/components/BrandLogo';
import { AuthDynamicBackground } from '../../../src/components/auth/AuthDynamicBackground';
import { useTranslation } from '../../../src/hooks/useTranslation';
import LanguageSelector from '../../../src/components/LanguageSelector';

export default function LoginPage() {
  const { t } = useTranslation();
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
      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector />
      </div>

      {/* Card de Login */}
      <div className="w-full max-w-sm sm:max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('auth.login.title')}</h1>
            <p className="text-gray-600 text-sm">{t('auth.login.subtitle')}</p>
          </div>
          
          <LoginForm />
        </div>
      </div>
    </div>
    </div>
  );
}