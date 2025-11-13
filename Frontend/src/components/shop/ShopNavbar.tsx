"use client";
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

type Mode = 'delivery' | 'pickup';

export default function ShopNavbar() {
  const [query, setQuery] = React.useState('');
  const [mode, setMode] = React.useState<Mode>('delivery');

  const clear = () => setQuery('');

  return (
    <header className="w-full border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
        <div className="h-14 flex items-center gap-3">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Image src="/LogoFilaCero.svg" alt="FilaCero" width={28} height={28} priority />
            <span className="hidden sm:inline text-[15px] font-semibold tracking-tight text-slate-800">FilaCero</span>
          </Link>

          {/* Search */}
          <div className="flex-1 min-w-0">
            <div className="relative w-full">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">
                {/* magnifier icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="restaurants"
                className="w-full h-10 pl-8 pr-8 rounded-full bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200 focus:border-slate-300 outline-none text-sm text-slate-800 placeholder:text-slate-400 transition"
              />
              {query && (
                <button onClick={clear} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {/* X icon */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              )}
            </div>
          </div>

          {/* Mode toggle */}
          <div className="hidden sm:flex items-center bg-slate-100 rounded-full p-0.5">
            <button
              onClick={() => setMode('delivery')}
              className={`px-3 h-9 rounded-full text-sm font-medium transition ${mode==='delivery' ? 'bg-slate-900 text-white shadow' : 'text-slate-700 hover:text-slate-900'}`}
            >
              Delivery
            </button>
            <button
              onClick={() => setMode('pickup')}
              className={`px-3 h-9 rounded-full text-sm font-medium transition ${mode==='pickup' ? 'bg-slate-900 text-white shadow' : 'text-slate-700 hover:text-slate-900'}`}
            >
              Pickup
            </button>
          </div>

          {/* Actions */}
          <div className="ml-1 flex items-center gap-2">
            {/* Bell */}
            <button aria-label="Notifications" className="hidden md:inline-flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 5 3 9H3c0-4 3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            </button>
            {/* Cart */}
            <Link href="/cart" className="relative inline-flex items-center gap-2 pl-3 pr-3 h-10 rounded-full bg-red-600 text-white hover:bg-red-700">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 12.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              <span className="text-sm font-semibold">0</span>
            </Link>
            {/* Auth */}
            <Link href="/login" className="hidden sm:inline-flex h-10 items-center px-3 rounded-full text-sm font-medium text-slate-700 hover:bg-slate-50 border border-slate-200">Sign In</Link>
            <Link href="/register" className="inline-flex h-10 items-center px-3 rounded-full text-sm font-semibold text-slate-800 bg-slate-200/60 hover:bg-slate-300">Sign Up</Link>
          </div>
        </div>
      </div>
    </header>
  );
}
