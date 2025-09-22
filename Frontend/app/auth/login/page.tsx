"use client";
import React from 'react';
import Link from 'next/link';
import { AuthCard } from '../../../src/components/auth/AuthCard';

export default function LoginPage() {
  return (
    <AuthCard
      title="Inicia sesión"
      subtitle="Accede a tu panel de control"
      footer={<div>¿No tienes cuenta? <Link href="/auth/register" className="text-brand-600 hover:underline">Regístrate</Link></div>}
    >
      <form className="space-y-5" onSubmit={(e)=>e.preventDefault()}>
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-slate-200">Correo electrónico</label>
          <input id="email" type="email" required className="w-full rounded-lg border border-gray-300/70 dark:border-slate-600/60 bg-white/70 dark:bg-slate-800/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 transition" placeholder="tucorreo@ejemplo.com" />
        </div>
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-slate-200">Contraseña</label>
          <input id="password" type="password" required className="w-full rounded-lg border border-gray-300/70 dark:border-slate-600/60 bg-white/70 dark:bg-slate-800/60 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 transition" placeholder="••••••••" />
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 select-none cursor-pointer">
            <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" />
            <span className="text-gray-600 dark:text-slate-300">Recordarme</span>
          </label>
          <button type="button" className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 transition">¿Olvidaste tu contraseña?</button>
        </div>
        <button type="submit" className="w-full inline-flex justify-center items-center gap-2 rounded-lg bg-gradient-to-r from-brand-500 to-brand-400 text-white text-sm font-medium px-4 py-2.5 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-400 transition">
          Entrar
        </button>
      </form>
    </AuthCard>
  );
}
