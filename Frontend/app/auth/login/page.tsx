"use client";
import React from 'react';
import Link from 'next/link';
import { AuthCard } from '../../../src/components/auth/AuthCard';
import { LoginForm } from '../../../src/components/auth/LoginForm';
import { BrandLogo } from '../../../src/components/BrandLogo';

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden px-4 py-6">
      <div className="absolute top-4 left-4 flex items-center gap-3 text-sm">
        <BrandLogo withWordmark size={40} />
        <div className="hidden sm:flex flex-col leading-tight">
          <span className="font-semibold text-slate-800 dark:text-white text-[13px]">Inicia sesión</span>
          <span className="text-[11px] text-gray-500 dark:text-slate-400">Accede a tu panel</span>
        </div>
      </div>
      <div className="absolute top-4 right-4 text-[11px] text-gray-600 dark:text-slate-300">
        ¿No tienes cuenta?{' '}
        <Link href="/auth/register" className="font-medium text-brand-600 dark:text-brand-400 hover:underline">Regístrate</Link>
      </div>
      <AuthCard compact>
        <LoginForm />
      </AuthCard>
    </div>
  );
}
