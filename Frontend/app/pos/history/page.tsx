"use client";
import React from 'react';
import { PosSidebar } from '../../../src/components/pos/sidebar';
import { TopRightInfo } from '../../../src/components/pos/header/TopRightInfo';
import { SalesHistoryList } from '../../../src/components/pos/history/SalesHistoryList';
import { CartProvider } from '../../../src/pos/cartContext';

export default function SalesHistoryPage() {
  return (
    <CartProvider>
      <div className='h-screen flex pos-pattern overflow-hidden'>
        {/* Sidebar */}
        <aside className='hidden md:flex flex-col h-screen sticky top-0'>
          <PosSidebar />
        </aside>

        {/* Main */}
        <main className='flex-1 flex flex-col px-5 md:px-6 pt-6 gap-4 overflow-hidden h-full min-h-0 box-border'>
          {/* Header row: App brand left + TopRightInfo right */}
          <div className='px-5 relative z-10 mb-0.5 flex items-start justify-between gap-4'>
            <h1 className='font-extrabold tracking-tight text-3xl md:text-4xl leading-tight select-none'>
              <span style={{ color: 'var(--fc-brand-600)' }}>Fila</span>
              <span style={{ color: 'var(--fc-teal-500)' }}>Cero</span>
            </h1>
            <TopRightInfo businessName='Punto de Venta' showLogout />
          </div>

          {/* Panel area */}
          <SalesHistoryList />
        </main>
      </div>
    </CartProvider>
  );
}
