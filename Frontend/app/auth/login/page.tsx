"use client";
import React from 'react';
import Link from 'next/link';
import { AuthCard } from '../../../src/components/auth/AuthCard';
import { LoginForm } from '../../../src/components/auth/LoginForm';
import { BrandLogo } from '../../../src/components/BrandLogo';

export default function LoginPage() {
  return (
    <AuthCard
      title="Inicia sesión"
      subtitle="Accede a tu panel de control"
      brandMark={<BrandLogo withWordmark size={48} />}
      brandFull
      footer={<div>¿No tienes cuenta? <Link href="/auth/register" className="text-brand-600 hover:underline dark:text-brand-400">Regístrate</Link></div>}
    >
      <LoginForm />
    </AuthCard>
  );
}
