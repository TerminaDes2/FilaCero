"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CartProvider } from "../../src/components/shop/CartContext";
import { useUserStore } from "../../src/state/userStore"; // ✅ nuevo hook global
// New layout pieces
// import ShopSidebar from "../../src/components/shop/ShopSidebar"; // removed per new layout
import CartSlide from "../../src/components/shop/CartSlide";
import NavbarStore from "../../src/components/shop/navbarStore";
import { FAQ } from "../../src/components/landing/FAQ";
import ShopHero from "../../src/components/shop/sections/ShopHero";
import StoryRail from "../../src/components/shop/sections/StoryRail";
import Curations from "../../src/components/shop/sections/Curations";
import SortBar from "../../src/components/shop/sections/SortBar";
import ProductsFeed from "../../src/components/shop/sections/ProductsFeed";

const HomePage: React.FC = () => {
  const { isAuthenticated } = useUserStore();
  const [guestMode, setGuestMode] = useState(false); // ✅ modo invitado

  const showShop = isAuthenticated || guestMode;

  return (
    <CartProvider>
      <NavbarStore />

      <main className="pt-16">
        {/* 🧩 Mostrar tarjeta de bienvenida si NO hay sesión ni modo invitado */}
        {!showShop ? (
          <section className="max-w-6xl mx-auto px-6 py-16 flex flex-col md:flex-row items-center gap-10">
            {/* Tarjeta izquierda */}
            <div className="flex-1 bg-white rounded-3xl shadow-glow border border-gray-100 p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Con <span className="text-brand-500">FilaCero</span> las filas no son un problema
              </h2>

              {/* 🔗 Botón de registro */}
              <Link
                href="/auth/register"
                className="inline-block bg-brand-500 hover:bg-brand-600 text-white font-medium px-6 py-3 rounded-lg shadow-md transition-colors"
              >
                Regístrate para empezar
              </Link>

              {/* Botón ingresar como invitado */}
              <p className="text-gray-500 text-sm mt-3 text-center md:text-left">
                o{" "}
                <button
                  onClick={() => setGuestMode(true)}
                  className="underline hover:text-gray-700 transition-colors"
                >
                  ingresar como invitado
                </button>
              </p>
            </div>

            {/* Imagen derecha */}
            <div className="flex-1 flex justify-center">
              <Image
                src="/images/showshop.jpg" // reemplaza por tu imagen real
                alt="Personas evitando filas con FilaCero"
                width={785}
                height={416}
                className="rounded-2xl shadow-md object-cover"
                priority
              />
            </div>
          </section>
        ) : (
          <>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
              <div className="flex gap-6">
                <div className="flex-1 min-w-0">
                  <ShopHero />
                  <StoryRail />
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

        {/* 📘 FAQ siempre visible */}
        <FAQ />
      </main>

      <CartSlide />
    </CartProvider>
  );
};

export default HomePage;