"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useUserStore } from "../../state/userStore";
import UserDropdown from "../UserDropdown";
import { useCart } from "./CartContext";

interface NavbarStoreProps {
  onToggleCart?: (open: boolean) => void;
}

export default function NavbarStore({ onToggleCart }: NavbarStoreProps) {
  const [scrolled, setScrolled] = useState(false);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<'delivery' | 'pickup'>("delivery");
  const { isAuthenticated, loading } = useUserStore();
  const { toggleOpen, items } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const clear = () => setQuery("");
  const openCart = () => {
    toggleOpen(true);
    onToggleCart?.(true);
  };

  if (loading) return null;

  return (
    <header className={`fixed top-0 left-0 right-0 z-40 border-b border-slate-200/80 ${scrolled ? "bg-white/95 shadow" : "bg-white/80"} backdrop-blur bg-[radial-gradient(1200px_160px_at_10%_-60px,rgba(233,74,111,0.08),transparent_60%),radial-gradient(900px_140px_at_90%_-70px,rgba(76,193,173,0.08),transparent_60%)]`}> 
      <nav className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 h-14 flex items-center gap-3">
        {/* Left: Brand */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/LogoFilaCero.svg"
            alt="FilaCero"
            width={28}
            height={28}
            priority
            className="w-7 h-7"
          />
          <span className="hidden sm:inline text-[1.25rem] leading-none font-extrabold select-none">
            <span style={{ color: 'var(--fc-brand-600)' }}>Fila</span>
            <span style={{ color: 'var(--fc-teal-500)' }}>Cero</span>
          </span>
        </Link>

        {/* Middle: Search */}
        <div className="flex-1 min-w-0">
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            )}
          </div>
        </div>

        {/* Mode segmented control (innovative slider) */}
        <div className="hidden sm:flex items-center">
          <div className="relative h-9 w-[180px] bg-slate-100 rounded-full p-0.5">
            <span
              className={`absolute top-0.5 left-0.5 h-8 w-[calc(50%-4px)] rounded-full transition-transform duration-300 ease-out shadow-sm bg-gradient-to-r from-[var(--fc-brand-600)] to-[var(--fc-teal-500)] ${mode==='pickup' ? 'translate-x-[calc(100%+8px)]' : 'translate-x-0'}`}
            />
            <div className="relative z-[1] grid grid-cols-2 text-sm font-medium h-full">
              <button onClick={() => setMode('delivery')} className={`rounded-full ${mode==='delivery' ? 'text-white' : 'text-slate-700 hover:text-slate-900'}`}>Delivery</button>
              <button onClick={() => setMode('pickup')} className={`rounded-full ${mode==='pickup' ? 'text-white' : 'text-slate-700 hover:text-slate-900'}`}>Pickup</button>
            </div>
          </div>
        </div>

        {/* Right: actions */}
        <div className="ml-1 flex items-center gap-2">
          {/* Bell */}
          <button aria-label="Notifications" className="hidden md:inline-flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 5 3 9H3c0-4 3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          </button>
          {/* Cart */}
          <button onClick={openCart} className="relative inline-flex items-center gap-2 pl-3 pr-3 h-10 rounded-full bg-[var(--fc-brand-600)] text-white hover:bg-[var(--fc-brand-500)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 12.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            <span className="text-sm font-semibold">{items.length}</span>
            {items.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-[11px] font-bold text-[var(--fc-brand-600)] grid place-items-center shadow-sm">
                {items.length}
              </span>
            )}
          </button>
          {/* Auth */}
          {isAuthenticated ? (
            <UserDropdown />
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth/login" className="hidden sm:inline-flex h-10 items-center px-3 rounded-full text-sm font-medium text-slate-700 hover:bg-slate-50 border border-slate-200">Sign In</Link>
              <Link href="/auth/register" className="inline-flex h-10 items-center px-3 rounded-full text-sm font-semibold text-white bg-[var(--fc-brand-600)] hover:bg-[var(--fc-brand-500)] shadow-sm">Sign Up</Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
