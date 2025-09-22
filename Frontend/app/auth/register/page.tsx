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
      <AuthCard
        title="Crea tu cuenta"
        subtitle="Configura tu cafetería en minutos"
        brandMark={<BrandLogo withWordmark size={48} />}
        brandFull
        footer={<div>¿Ya tienes cuenta? <Link href="/auth/login" className="text-brand-600 hover:underline dark:text-brand-400">Inicia sesión</Link></div>}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-[11px] font-medium tracking-wide text-gray-600 dark:text-slate-300">Selecciona tu rol</p>
            <RoleSelector compact />
          </div>
          <SignupForm />
        </div>
      </AuthCard>
    </UserProvider>
  );
}
