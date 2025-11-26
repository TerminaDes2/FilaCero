"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useLanguageStore } from "../state/languageStore";
import { useTranslation } from "../hooks/useTranslation";
import LanguageSelector from "./LanguageSelector";

interface NavItem {
  key: string;
  href: string;
}

const navItems: NavItem[] = [
  { key: "navbar.home", href: "#hero" },
  { key: "navbar.shop", href: "/shop" },
  { key: "navbar.features", href: "#features" },
  { key: "navbar.process", href: "#process" },
  { key: "navbar.benefits", href: "#benefits" },
  { key: "navbar.pricing", href: "#pricing" },
  { key: "navbar.contact", href: "#cta" }
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { locale } = useLanguageStore();
  const { t } = useTranslation();
  // Eliminamos máscara y overflow que podían recortar el último botón y el dropdown de idioma.

  return (
    <header className="fixed top-0 left-0 right-0 z-40">
      <nav className="h-16" aria-label="Main">
        <div className="mx-auto w-full max-w-7xl px-4 flex items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-semibold text-gray-800">
            <Image src="/LogoFilaCero.svg" alt="FilaCero" width={36} height={36} className="drop-shadow-sm" />
            <span className="hidden sm:inline text-[2rem] font-extrabold select-none leading-none">
              <span style={{ color: "var(--fc-brand-600)" }}>Fila</span>
              <span style={{ color: "var(--fc-teal-500)" }}>Cero</span>
            </span>
          </Link>

          {/* Grupo unificado centrado (links + selector + auth) */}
          <div className="hidden md:flex flex-1 justify-center">
            <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/40 px-3 py-1 text-sm shadow-sm backdrop-blur-sm max-w-4xl">
              <div className="flex items-center gap-2">
                {navItems.map((item) => (
                  item.href.startsWith("#") ? (
                    <a
                      key={item.href}
                      href={item.href}
                      className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium text-brand-600 hover:bg-white/90 whitespace-nowrap"
                    >
                      {t(item.key)}
                    </a>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium text-brand-600 hover:bg-white/90 whitespace-nowrap"
                    >
                      {t(item.key)}
                    </Link>
                  )
                ))}
              </div>

              {/* Separador sutil antes de acciones */}
              <span className="h-6 w-px bg-white/50 mx-3" aria-hidden="true" />

              <div className="flex items-center gap-2">
                <LanguageSelector />
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold text-brand-700 border border-brand-200 bg-white hover:bg-brand-50 whitespace-nowrap"
                >
                  {t("navbar.login")}
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-500 whitespace-nowrap"
                >
                  {t("navbar.signup")}
                </Link>
              </div>
            </div>
          </div>

          {/* Botón móvil */}
          <div className="flex items-center gap-2 md:hidden ml-auto">
            <div className="flex items-center">
              <LanguageSelector />
            </div>
            <button
              aria-label="Abrir menú"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/80 text-[var(--fc-brand-600)] shadow-sm"
              onClick={() => setMobileOpen((o) => !o)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-[70]">
            <div className="absolute inset-0 bg-white/70 backdrop-blur" onClick={() => setMobileOpen(false)} aria-hidden />
            <div className="relative mx-auto flex h-full w-full max-w-lg flex-col px-4 pb-8 pt-6">
              <div className="relative flex-1 overflow-hidden rounded-3xl border border-white/80 bg-white text-slate-900 shadow-xl">
                <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-brand-100/70">
                  <div className="flex items-center gap-3">
                    <Image src="/LogoFilaCero.svg" alt="FilaCero" width={32} height={32} className="drop-shadow-sm" />
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.38em] text-brand-500/80">Menú</p>
                      <p className="text-base font-semibold text-slate-900">Explora FilaCero</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-brand-200 bg-white text-brand-600 shadow-sm"
                    aria-label="Cerrar menú"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <nav className="relative flex-1 overflow-y-auto px-5 pb-6 pt-4 space-y-3">
                  {navItems.map((item, index) => (
                    item.href.startsWith("#") ? (
                      <a key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="block rounded-2xl border border-brand-100 bg-white px-4 py-3.5 shadow-sm">
                        {t(item.key)}
                      </a>
                    ) : (
                      <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="block rounded-2xl border border-brand-100 bg-white px-4 py-3.5 shadow-sm">
                        {t(item.key)}
                      </Link>
                    )
                  ))}
                  <div className="mt-3">
                    <LanguageSelector />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <Link href="/login" onClick={() => setMobileOpen(false)} className="rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-700">
                      {t("navbar.login")}
                    </Link>
                    <Link href="/register" onClick={() => setMobileOpen(false)} className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white">
                      {t("navbar.signup")}
                    </Link>
                  </div>
                </nav>
              </div>
            </div>
          </div>
        )}
      </header>
  );
}
