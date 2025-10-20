// components/navbar.tsx - VERSIÓN REFACTORIZADA
"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useUserStore } from "../state/userStore";
import UserDropdown from "./UserDropdown";

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: "Inicio", href: "#hero" },
  { label: "Compra ya", href: "shop" },
  { label: "Características", href: "#features" },
  { label: "Flujo", href: "#process" },
  { label: "Beneficios", href: "#benefits" },
  { label: "Precios", href: "#pricing" },
  { label: "Contacto", href: "#cta" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const { isAuthenticated, loading } = useUserStore();

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (loading) {
    return (
      <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-white/70 dark:bg-slate-900/60 shadow">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-gray-800">
            <Image src="/LogoFilaCero.svg" alt="FilaCero" width={36} height={36} className="drop-shadow-sm" />
            <span className="hidden sm:inline text-[2rem] font-extrabold select-none">
              <span style={{ color: 'var(--fc-brand-600)' }}>Fila</span><span style={{ color: 'var(--fc-teal-500)' }}>Cero</span>
            </span>
          </Link>
        </nav>
      </header>
    );
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition ${scrolled ? "backdrop-blur-xl bg-white/70 dark:bg-slate-900/60 shadow" : "bg-transparent"}`}
      role="banner"
    >
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between" aria-label="Main">
        <Link href="/" className="flex items-center gap-2 font-semibold text-gray-800">
          <Image src="/LogoFilaCero.svg" alt="FilaCero" width={36} height={36} className="drop-shadow-sm" />
          <span className="hidden sm:inline text-[2rem] font-extrabold select-none">
            <span style={{ color: 'var(--fc-brand-600)' }}>Fila</span><span style={{ color: 'var(--fc-teal-500)' }}>Cero</span>
          </span>
        </Link>
        
        <div className="hidden md:flex gap-8">
          {navItems.map(item => (
            <a
              key={item.href}
              href={item.href}
              className="relative text-sm font-medium text-gray-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 focus-visible:outline-none rounded after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-0 after:bg-brand-600 dark:after:bg-brand-400 after:transition-all hover:after:w-full"
            >
              {item.label}
            </a>
          ))}
        </div>
        
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            // 👇 AHORA USA EL COMPONENTE UserDropdown
            <UserDropdown />
          ) : (
            // 👇 BOTONES DE LOGIN/REGISTER (no autenticado)
            <>
              <Link
                href="/auth/login"
                className="text-sm font-medium px-4 py-2 rounded-full border border-gray-300/70 dark:border-white/15 text-gray-700 dark:text-slate-200 hover:border-brand-500 hover:text-brand-600 dark:hover:border-brand-400 dark:hover:text-brand-300 transition"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/auth/register"
                className="text-sm font-semibold bg-brand-600 text-white px-4 py-2 rounded-full hover:bg-brand-500 transition shadow-glow"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </div>
        
        <button
          aria-label="Abrir menú"
          className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded border border-gray-300 dark:border-white/15 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-white/10 backdrop-blur"
          onClick={() => setOpen(o => !o)}
        >
          <span className="sr-only">Menú</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
          </svg>
        </button>
      </nav>
      
      {/* Menú móvil */}
      {open && (
        <div className="md:hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 px-4 pb-6 pt-2 space-y-2">
          {navItems.map(item => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block text-sm font-medium text-gray-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400"
            >
              {item.label}
            </a>
          ))}
          
          <div className="pt-2">
            {isAuthenticated ? (
              // 👇 PARA MÓVIL, PODRÍAS CREAR UN UserDropdownMobile O USAR ESTE CÓDIGO SIMPLIFICADO
              <div className="w-full space-y-3">
                <div className="px-2 py-3 border-b border-gray-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center">
                        <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Usuario</p>
                      <p className="text-xs text-gray-500 dark:text-slate-400">Ver perfil</p>
                    </div>
                  </div>
                </div>
                
                <Link 
                  href="/shop" 
                  className="flex items-center gap-2 py-2 text-sm text-gray-700 dark:text-slate-200"
                  onClick={() => setOpen(false)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Ir a Tienda
                </Link>
                
                <Link 
                  href="/user" 
                  className="flex items-center gap-2 py-2 text-sm text-gray-700 dark:text-slate-200"
                  onClick={() => setOpen(false)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Mi Perfil
                </Link>
                
                <button
                  onClick={() => {
                    // Aquí podrías llamar a la función logout del UserStore
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 w-full py-2 text-sm font-medium text-red-600 dark:text-red-400"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Link
                  href="/auth/login"
                  className="flex-1 text-sm font-medium px-4 py-2 rounded-full border border-gray-300/70 dark:border-white/15 text-gray-700 dark:text-slate-200 text-center hover:border-brand-500 hover:text-brand-600 dark:hover:border-brand-400 dark:hover:text-brand-300 transition"
                  onClick={() => setOpen(false)}
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/auth/register"
                  className="flex-1 text-sm font-semibold bg-brand-600 text-white px-4 py-2 rounded-full hover:bg-brand-500 transition shadow"
                  onClick={() => setOpen(false)}
                >
                  Crear cuenta
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}