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
  size?: 'default' | 'wide';
}

export function LoginCard({ title, subtitle, children, footer, brandMark, compact, brandFull, size = 'default' }: LoginCardProps) {
  const maxWidthClass = size === 'wide' ? 'max-w-6xl' : 'max-w-md';
  return (
    <div className={`relative w-full ${maxWidthClass} mx-auto text-slate-900 dark:text-slate-100`}>
      {/* Outer ambient glow */}
      <div className="pointer-events-none absolute -inset-0.5 rounded-3xl opacity-40 blur-2xl [background:radial-gradient(circle_at_30%_30%,rgba(233,74,111,0.26),transparent_60%),radial-gradient(circle_at_70%_70%,rgba(76,193,173,0.28),transparent_65%)] dark:opacity-45 dark:[background:radial-gradient(circle_at_28%_32%,rgba(244,114,182,0.2),transparent_60%),radial-gradient(circle_at_72%_68%,rgba(14,165,233,0.2),transparent_62%)]" />
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-10 -right-12 h-48 w-48 rounded-full blur-2xl opacity-35 [background:radial-gradient(closest-side,rgba(233,74,111,0.2),transparent)] dark:opacity-35 dark:[background:radial-gradient(closest-side,rgba(244,114,182,0.22),transparent)]" />
      <div className="pointer-events-none absolute -bottom-10 -left-12 h-56 w-56 rounded-full blur-2xl opacity-35 [background:radial-gradient(closest-side,rgba(76,193,173,0.2),transparent)] dark:opacity-32 dark:[background:radial-gradient(closest-side,rgba(34,211,238,0.2),transparent)]" />

  <div className="relative group overflow-hidden rounded-3xl border border-white/40 bg-white/80 backdrop-blur-xl shadow-sm ring-1 ring-black/5 transition dark:border-slate-900/80 dark:bg-slate-950/92 dark:backdrop-blur-2xl dark:ring-white/5 dark:shadow-[0_36px_90px_-54px_rgba(2,6,23,0.9)]">
        <div className="pointer-events-none absolute inset-0 hidden dark:block" aria-hidden>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/92 via-slate-950/86 to-slate-950/88" />
          <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_65%_20%,rgba(244,114,182,0.22),transparent_62%)]" />
          <div className="absolute inset-0 opacity-55 bg-[radial-gradient(circle_at_15%_80%,rgba(45,212,191,0.18),transparent_60%)]" />
        </div>
        <div className={`relative ${compact ? 'p-6' : 'p-8'} z-10`}>
          {(brandMark || title || subtitle) && (
            <div className="mb-6">
              {brandMark && (
                brandFull ? (
                  <div className="mb-5">
                    {brandMark}
                  </div>
                ) : (
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-400 text-white shadow-md shadow-brand-400/40 dark:from-brand-400 dark:via-brand-300 dark:to-teal-400">
                    {brandMark}
                  </div>
                )
              )}
              {title && (
                <h1 className="mb-1 text-xl font-semibold tracking-tight">
                  <span className="inline-flex items-center gap-2 rounded-xl border border-white/60 bg-white/75 px-3 py-1.5 text-gray-900 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-100 dark:shadow-[0_8px_24px_-18px_rgba(2,6,23,0.8)]">
                    {title}
                  </span>
                </h1>
              )}
              {subtitle && (
                <p className="text-sm leading-relaxed text-gray-600 dark:text-slate-300/95">
                  {subtitle}
                </p>
              )}
            </div>
          )}
          <div className={compact ? 'space-y-4' : 'space-y-5'}>
            {children}
          </div>
        </div>
        {footer && (
          <div className="relative border-t border-black/5 px-8 pb-6 pt-4 text-sm text-gray-600 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80 dark:text-slate-300/95">
            {footer}
          </div>
        )}
        {/* Inner subtle ring */}
        <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/30 dark:ring-white/5" />
        {/* Subtle top/bottom gradients for readability */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-white/40 to-transparent dark:hidden" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white/40 to-transparent dark:hidden" />
        <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-16 bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-transparent dark:block" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-16 bg-gradient-to-t from-slate-950/85 via-slate-950/45 to-transparent dark:block" />
      </div>
    </div>
  );
}