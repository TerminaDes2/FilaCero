"use client";
import React, { useState } from "react";
import Link from "next/link";
import { CartProvider } from "../../src/components/shop/CartContext";
import { useUserStore } from "../../src/state/userStore"; // ✅ nuevo hook global
// New layout pieces
// import ShopSidebar from "../../src/components/shop/ShopSidebar"; // removed per new layout
import CartSlide from "../../src/components/shop/CartSlide";
import NavbarStore from "../../src/components/shop/navbarStore";
import { Footer } from "../../src/components/landing/Footer";
import ShopHero from "../../src/components/shop/sections/ShopHero";
import StoryRail from "../../src/components/shop/sections/StoryRail";
import Curations from "../../src/components/shop/sections/Curations";
import BusinessShowcase from "../../src/components/shop/sections/BusinessShowcase";
import SortBar from "../../src/components/shop/sections/SortBar";
import ProductsFeed from "../../src/components/shop/sections/ProductsFeed";
import { api, activeBusiness } from "../../src/lib/api";

const GuestExperience: React.FC<{ onGuest: () => void; loading?: boolean }> = ({ onGuest, loading = false }) => {
  const capsule =
    "inline-flex items-center gap-2 rounded-full border border-brand-200/70 bg-white/90 px-3 py-1 text-xs font-semibold text-brand-600 dark:border-white/15 dark:bg-white/5 dark:text-[var(--fc-brand-200)]";
  const steps = [
    {
      title: "Explora el menú publicado",
      body: "Consulta productos reales del negocio sin necesidad de crear una cuenta antes."
    },
    {
      title: "Arma y confirma tu pedido",
      body: "Añade artículos al carrito, deja notas y confirma cuando estés listo."
    },
    {
      title: "Sigue el estado en cocina",
      body: "El equipo marca cada etapa (pendiente, en preparación, listo) y llegas solo cuando toca retirar."
    }
  ];

  return (
    <section className="relative overflow-hidden bg-app-gradient pb-24 pt-20 text-gray-900 dark:bg-[color:rgba(3,6,16,1)] dark:text-white">
      <div className="pointer-events-none absolute inset-x-0 top-20 flex justify-center" aria-hidden>
        <div className="h-48 w-[36rem] rounded-full bg-brand-200/35 blur-3xl dark:bg-[color:rgba(59,130,246,0.28)]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid gap-12 lg:grid-cols-[1.05fr,0.95fr] lg:items-center">
          <div className="space-y-8">
            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-brand-600 dark:border-white/20 dark:bg-white/10 dark:text-[var(--fc-brand-200)]">
                Tienda digital
              </span>
              <h1 className="text-4xl font-black tracking-tight text-gray-900 sm:text-[2.9rem] dark:text-white">
                Haz tu pedido antes de llegar y retira sin esperar
              </h1>
              <p className="text-lg leading-relaxed text-gray-600 dark:text-white/70">
                Diseñamos la experiencia de compra para tus clientes: visualizan el menú, añaden artículos al carrito y confirman el pedido antes de llegar para recoger sin esperas.
              </p>
            </div>

            <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg backdrop-blur dark:border-white/12 dark:bg-[color:rgba(8,12,22,0.9)] dark:text-white/80">
              <div className="grid gap-5 sm:grid-cols-3">
                {steps.map((step, index) => (
                  <article key={step.title} className="flex flex-col gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700 dark:bg-[var(--fc-brand-500)]/20 dark:text-[var(--fc-brand-200)]">
                      0{index + 1}
                    </span>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-gray-600 dark:text-white/70">{step.body}</p>
                  </article>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-medium text-brand-600 dark:text-[var(--fc-brand-200)]">
                <span className={capsule}>Ordena sin registro previo</span>
                <span className={capsule}>Menú actualizado por el negocio</span>
                <span className={capsule}>Estados sincronizados con el POS</span>
                <span className={capsule}>Listo para operar en recreos</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={onGuest}
                disabled={loading}
                className={`inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[rgba(222,53,95,0.25)] transition ${loading
                    ? "bg-[var(--fc-brand-400)] opacity-70 cursor-wait dark:bg-[var(--fc-brand-500)]/80"
                    : "bg-[var(--fc-brand-600)] hover:bg-[var(--fc-brand-500)] dark:bg-[var(--fc-brand-500)] dark:hover:bg-[var(--fc-brand-400)]"
                  }`}
              >
                {loading ? "Abriendo tienda…" : "Probar la tienda ahora"}
              </button>
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center rounded-xl border border-brand-200/70 bg-white px-5 py-3 text-sm font-semibold text-brand-700 transition hover:border-brand-300/80 dark:border-white/15 dark:bg-[color:rgba(9,13,22,0.92)] dark:text-white dark:hover:border-[var(--fc-brand-200)]/60"
              >
                Registrar mi negocio
              </Link>
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium text-brand-600 underline decoration-brand-400 underline-offset-4 hover:text-brand-700 dark:text-[var(--fc-brand-200)] dark:hover:text-[var(--fc-brand-100)]"
              >
                Ingresar con mi cuenta
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-6 top-6 h-24 w-24 rounded-full bg-white/80 shadow-2xl dark:bg-white/10" aria-hidden />
            <div className="absolute -right-3 bottom-10 h-16 w-32 rounded-full bg-gradient-to-r from-brand-200/55 to-teal-100/55 blur-lg dark:from-[rgba(59,130,246,0.28)] dark:to-[rgba(45,212,191,0.25)]" aria-hidden />

            <div className="relative mx-auto max-w-md rounded-[42px] border border-white/70 bg-white/90 p-6 shadow-[0_50px_90px_-45px_rgba(222,53,95,0.45)] backdrop-blur dark:border-white/15 dark:bg-[color:rgba(8,12,24,0.92)] dark:shadow-[0_60px_120px_-60px_rgba(2,6,23,0.82)]">
              <div className="mb-5 flex items-center justify-between text-xs text-gray-500 dark:text-white/60">
                <span className="font-semibold text-gray-700 dark:text-white">Vista previa del flujo real</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-gray-600 dark:bg-white/10 dark:text-white/70">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Sincronizado
                </span>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-brand-100 bg-gradient-to-r from-white via-white to-brand-50/70 p-4 shadow-sm dark:border-white/12 dark:from-[color:rgba(35,25,64,0.45)] dark:via-[color:rgba(16,23,42,0.7)] dark:to-[color:rgba(14,20,35,0.85)]">
                  <header className="flex items-center justify-between text-xs font-semibold text-brand-700 dark:text-[var(--fc-brand-200)]">
                    <span>Menú publicado</span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-brand-600 dark:text-[var(--fc-brand-200)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                      En vivo
                    </span>
                  </header>
                  <ul className="mt-3 space-y-2 text-[12px] text-gray-600 dark:text-white/70">
                    <li className="flex items-center justify-between gap-2">
                      <span className="truncate">Producto disponible</span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-brand-600 dark:bg-white/10 dark:text-[var(--fc-brand-200)]">Publicado</span>
                    </li>
                    <li className="flex items-center justify-between gap-2">
                      <span className="truncate">Categoría destacada</span>
                      <span className="text-[11px] text-gray-500 dark:text-white/60">Actualizada hoy</span>
                    </li>
                    <li className="flex items-center justify-between gap-2">
                      <span className="truncate">Disponibilidad visible</span>
                      <span className="text-[11px] text-gray-500 dark:text-white/60">Según stock</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-4 text-xs text-brand-700 dark:border-white/12 dark:bg-[color:rgba(16,26,44,0.82)] dark:text-[var(--fc-brand-200)]">
                  <header className="flex items-center justify-between text-[11px] font-semibold text-brand-700 dark:text-[var(--fc-brand-200)]">
                    <span>Pedido en curso</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-brand-600 dark:bg-white/10 dark:text-[var(--fc-brand-200)]">Estado: en preparación</span>
                  </header>
                  <div className="mt-3 space-y-1 text-[12px] text-gray-600 dark:text-white/70">
                    <p>• 2 artículos confirmados desde la tienda.</p>
                    <p>• Notas internas registradas junto al pedido.</p>
                    <p>• El equipo marca &quot;Listo&quot; y el cliente pasa a recoger.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="relative mt-16 overflow-hidden rounded-3xl border border-white/70 bg-white/85 px-6 py-6 shadow-sm backdrop-blur dark:border-white/12 dark:bg-[color:rgba(8,12,22,0.9)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600 dark:text-white/70">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-brand-600 dark:text-[var(--fc-brand-200)]">Recursos rapidos</p>
              <p className="mt-1">Sigue descubriendo negocios publicados o escribe al equipo para habilitar tu tienda.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 rounded-full border border-brand-200/70 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:border-brand-300 hover:text-brand-800 dark:border-white/15 dark:text-[var(--fc-brand-200)] dark:hover:border-[var(--fc-brand-200)]/60"
              >
                Ver negocios publicados
              </Link>
              <a
                href="mailto:contacto@filacero.app"
                className="inline-flex items-center gap-2 rounded-full border border-white/60 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-brand-300 hover:text-brand-700 dark:border-white/15 dark:text-white/80 dark:hover:text-[var(--fc-brand-100)]"
              >
                Escribir a soporte
              </a>
            </div>
          </div>
        </footer>
      </div>
    </section>
  );
};

const HomePage: React.FC = () => {
  const { isAuthenticated } = useUserStore();
  const [guestMode, setGuestMode] = useState(false); // ✅ modo invitado
  const [initializingGuest, setInitializingGuest] = useState(false);

  const showShop = isAuthenticated || guestMode;

  const handleGuestMode = React.useCallback(async () => {
    if (initializingGuest) return;
    setInitializingGuest(true);
    try {
      let negocioId = activeBusiness.get() ?? undefined;
      if (!negocioId) {
        const envBiz = (globalThis as any).process?.env?.NEXT_PUBLIC_NEGOCIO_ID as string | undefined;
        if (envBiz && envBiz.trim()) {
          negocioId = envBiz.trim();
        } else {
          try {
            const businesses = await api.getPublicBusinesses();
            const first = Array.isArray(businesses) ? businesses[0] : undefined;
            const candidate = first?.id_negocio ?? (first && (first as any).id) ?? (first && (first as any).idNegocio);
            if (candidate != null) {
              negocioId = String(candidate);
            }
          } catch (err) {
            console.error("[Shop] No se pudieron cargar negocios públicos", err);
          }
        }
        if (negocioId) {
          activeBusiness.set(negocioId);
        }
      }
      setGuestMode(true);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("shop:catalog-refresh"));
      }
    } finally {
      setInitializingGuest(false);
    }
  }, [initializingGuest]);

  return (
    <CartProvider>
      <NavbarStore />

      <main className="pt-16">
        {/* 🧩 Mostrar tarjeta de bienvenida si NO hay sesión ni modo invitado */}
        {!showShop ? (
          <GuestExperience onGuest={handleGuestMode} loading={initializingGuest} />
        ) : (
          <>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex gap-6">
                <div className="flex-1 min-w-0">
                  <ShopHero />
                  <StoryRail />
                  <BusinessShowcase />
                  <Curations />
                </div>
              </div>
            </div>

            {/* Sticky sort bar tied to scroll context */}
            <SortBar />

            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
              <ProductsFeed />
            </div>
          </>
        )}

      </main>

      <Footer />
      <CartSlide />
    </CartProvider>
  );
};

export default HomePage;