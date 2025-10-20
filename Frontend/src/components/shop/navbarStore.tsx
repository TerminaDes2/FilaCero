// components/navbarStore.tsx - VERSIÓN SIMPLIFICADA
"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useUserStore } from "../../state/userStore";
import { usePathname, useRouter } from "next/navigation";
import { useCart } from "./CartContext";
import { Store, Home } from "lucide-react";
import UserDropdown from "./UserDropdown";
import AuthButtons from "../AuthButtons";

export default function NavbarStore() {
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { open, toggleOpen, items } = useCart();
  
  const { isAuthenticated, loading } = useUserStore();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleGoHome = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 shadow-lg border-b border-gray-200 dark:border-slate-700">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-gray-800">
            <Image src="/LogoFilaCero.svg" alt="FilaCero" width={36} height={36} className="drop-shadow-sm" />
            <span className="text-[2rem] font-extrabold select-none">
              <span style={{ color: 'var(--fc-brand-600)' }}>Fila</span><span style={{ color: 'var(--fc-teal-500)' }}>Cero</span>
            </span>
            <span className="text-sm font-medium text-gray-500 ml-2">Tienda</span>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 shadow-lg border-b border-gray-200 dark:border-slate-700"
      role="banner"
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between" aria-label="Main">
        {/* Logo y título de la tienda */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 font-semibold text-gray-800">
            <Image src="/LogoFilaCero.svg" alt="FilaCero" width={36} height={36} className="drop-shadow-sm" />
            <span className="text-[2rem] font-extrabold select-none">
              <span style={{ color: 'var(--fc-brand-600)' }}>Fila</span><span style={{ color: 'var(--fc-teal-500)' }}>Cero</span>
            </span>
          </Link>
          <div className="h-6 w-px bg-gray-300 dark:bg-slate-600"></div>
          <span className="text-sm font-medium text-gray-600 dark:text-slate-300 flex items-center gap-1">
            <Store className="w-4 h-4" />
            Tienda
          </span>
        </div>
        
        {/* Navegación central - Solo botón Inicio */}
        <div className="hidden md:flex items-center gap-6">
          <button
            onClick={handleGoHome}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/10 transition"
          >
            <Home className="w-4 h-4" />
            Volver al Inicio
          </button>
        </div>
        
        {/* Lado derecho - Carrito y autenticación */}
        <div className="flex items-center gap-4">
          {/* Botón del carrito rosa */}
          <button 
            className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-full transition-colors"
            onClick={() => toggleOpen(true)}
            aria-expanded={open}
          >
            {/* Icono del carrito */}
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="10" cy="20" r="1" />
              <circle cx="18" cy="20" r="1" />
            </svg>
            
            {/* Número de items */}
            {items.length > 0 && (
              <span className="bg-white text-pink-500 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                {items.length}
              </span>
            )}
          </button>
          
          {/* 👇 COMPONENTES SEPARADOS PARA AUTENTICACIÓN */}
          {isAuthenticated ? (
            <UserDropdown />
          ) : (
            <AuthButtons />
          )}
        </div>
      </nav>
    </header>
  );
}