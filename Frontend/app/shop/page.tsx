"use client";
import React from 'react';
import { CartProvider } from '../../src/components/shop/CartContext';
import DesayunosSection from '../../src/components/shop/sections/DesayunosSection';
import PopularSection from '../../src/components/shop/sections/PopularSection';
import StoresSection from '../../src/components/shop/sections/StoresSection';
import CartSlide from '../../src/components/shop/CartSlide';
import NavbarStore from '../../src/components/shop/navbarStore';

export default function HomePage() {
  return (
    <CartProvider>

        <NavbarStore />
              <main className="pt-16"> {/* Añade padding-top para compensar el navbar fijo */}

          <DesayunosSection />
          <PopularSection />
          <StoresSection />
        </main>
        <CartSlide />
    </CartProvider>
  );
}
