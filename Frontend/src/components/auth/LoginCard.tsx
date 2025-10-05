"use client";
import React from 'react';

interface LoginCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  brandMark?: React.ReactNode; // optional small logo/icon
  compact?: boolean;
  brandFull?: boolean; // if true, render brandMark as-is (wordmark + icon)
}

export function LoginCard({ title, subtitle, children, footer, brandMark, compact, brandFull }: LoginCardProps) {
  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Outer ambient glow */}
      <div className="pointer-events-none absolute -inset-0.5 rounded-3xl opacity-50 blur-2xl" style={{background:"radial-gradient(circle at 30% 30%, rgba(233,74,111,0.28), transparent 60%), radial-gradient(circle at 70% 70%, rgba(76,193,173,0.30), transparent 65%)"}} />
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-10 -right-12 w-48 h-48 rounded-full blur-2xl opacity-40" style={{ background: 'radial-gradient(closest-side, rgba(233,74,111,0.22), transparent)' }} />
      <div className="pointer-events-none absolute -bottom-10 -left-12 w-56 h-56 rounded-full blur-2xl opacity-40" style={{ background: 'radial-gradient(closest-side, rgba(76,193,173,0.22), transparent)' }} />

      <div className="relative group rounded-3xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm ring-1 ring-black/5 dark:ring-white/10 overflow-hidden transition">
        <div className={`relative ${compact ? 'p-6' : 'p-8'} z-10`}> 
          {(brandMark || title || subtitle) && (
            <div className="mb-6">
              {brandMark && (
                brandFull ? (
                  <div className="mb-5">
                    {brandMark}
                  </div>
                ) : (
                  <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500 to-brand-400 text-white shadow-md">
                    {brandMark}
                  </div>
                )
              )}
              {title && (
                <h1 className="text-xl font-semibold tracking-tight mb-1">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/70 dark:bg-white/10 backdrop-blur text-gray-900 dark:text-white shadow-sm">
                    {title}
                  </span>
                </h1>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
          )}
          <div className="space-y-5">
            {children}
          </div>
        </div>
        {footer && (
          <div className="relative px-8 pb-6 pt-4 border-t border-black/5 dark:border-white/10 bg-white/65 dark:bg-slate-900/55 text-sm text-gray-600 dark:text-slate-300 backdrop-blur-md">
            {footer}
          </div>
        )}
        {/* Inner subtle ring */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/40 dark:ring-white/5" />
        {/* Subtle top/bottom gradients for readability */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/50 dark:from-slate-900/40 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white/50 dark:from-slate-900/40 to-transparent" />
      </div>
    </div>
  );
}