"use client";
import React from 'react';
import Link from 'next/link';
import { AuthCard } from '../../../src/components/auth/AuthCard';
import { SignupForm } from '../../../src/components/auth/SignupForm';
import { BrandLogo } from '../../../src/components/BrandLogo';
import { UserProvider } from '../../../src/state/userStore';
import { RoleSelector } from '../../../src/components/auth/RoleSelector';

export default function RegisterPage() {
  return (
    <UserProvider>
      <div className="min-h-screen w-full flex flex-col items-center justify-center overflow-hidden px-4 py-6">
        {/* Floating brand & meta (extracted) */}
        <div className="absolute top-4 left-4 flex-col items-center gap-3 text-sm">
          <BrandLogo withWordmark size={40} />
          
        </div>
        <div className="absolute bottom-4 left-4 hidden sm:flex flex-col leading-tight pt-10">
            <span className="font-semibold text-slate-800 dark:text-white text-[20px]">Crea tu cuenta</span>
            <span className="text-[14px] text-gray-500 dark:text-slate-400">Configura tu cafetería en minutos</span>
          </div>
        <div className="absolute bottom-4 right-4 text-[12px] text-gray-600 dark:text-slate-300">
          ¿Ya tienes cuenta?{' '}
          <Link href="/auth/login" className="font-medium text-brand-600 dark:text-brand-400 hover:underline">Inicia sesión</Link>
        </div>
        <AuthCard compact>
          <div className="space-y-1">
            <div className="grid grid-cols-2 gap-2">
              <div className="col-span-2">
                <p className="text-[11px] font-medium tracking-wide text-gray-600 dark:text-slate-300">Rol</p>
              </div>
              <div className="col-span-2">
                <RoleSelector compact />
              </div>
            </div>
            <SignupForm />
          </div>
        </AuthCard>
      </div>
    </UserProvider>
  );
}
