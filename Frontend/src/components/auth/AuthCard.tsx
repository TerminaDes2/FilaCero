"use client";
import React from 'react';

interface AuthCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Glow backdrop */}
      <div className="pointer-events-none absolute -inset-0.5 rounded-2xl opacity-60 blur-xl" style={{background:"radial-gradient(circle at 30% 30%, rgba(233,74,111,0.25), transparent 60%), radial-gradient(circle at 70% 70%, rgba(76,193,173,0.25), transparent 65%)"}} />
      <div className="relative rounded-2xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-300/30 via-brand-500 to-brand-400/60" />
        <div className="p-7">
          {title && (
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight mb-1">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-6">
              {subtitle}
            </p>
          )}
          <div className="space-y-5">
            {children}
          </div>
        </div>
        {footer && (
          <div className="px-7 pb-6 pt-4 border-t border-black/5 dark:border-white/10 bg-white/60 dark:bg-slate-900/50 text-sm text-gray-600 dark:text-slate-300">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
