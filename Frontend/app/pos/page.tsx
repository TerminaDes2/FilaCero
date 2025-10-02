"use client";
import React, { useMemo, useState } from 'react';
import { PosSidebar } from '../../src/components/pos/sidebar';
import { CartProvider } from '../../src/pos/cartContext';
import { CategoryFilter } from '../../src/components/pos/filters/CategoryFilter';
import { CategoryTabs } from '../../src/components/pos/filters/CategoryTabs';
import { ViewToggle } from '../../src/components/pos/controls/ViewToggle';
import { SearchBox } from '../../src/components/pos/controls/SearchBox';
import { ProductGrid } from '../../src/components/pos/products/ProductGrid';
import { CartPanel } from '../../src/components/pos/cart/CartPanel';
import { TopRightInfo } from '../../src/components/pos/header/TopRightInfo';
import type { POSProduct } from '../../src/pos/cartContext';

// Mock product dataset (frontend only)
const MOCK_PRODUCTS: POSProduct[] = [
  { id: 'p1', name: 'Café Latte', category: 'bebidas', price: 48, stock: 50, description: 'Shot espresso y leche vaporizada' },
  { id: 'p2', name: 'Café Americano', category: 'bebidas', price: 35, stock: 80, description: 'Espresso diluido' },
  { id: 'p3', name: 'Sandwich Jamón', category: 'alimentos', price: 65, stock: 25, description: 'Jamón, queso y pan artesanal' },
  { id: 'p4', name: 'Galleta Chocochips', category: 'postres', price: 28, stock: 60, description: 'Galleta casera con chispas' },
  { id: 'p5', name: 'Brownie Nuez', category: 'postres', price: 40, stock: 30, description: 'Brownie intenso con nueces' },
  { id: 'p6', name: 'Té Verde', category: 'bebidas', price: 32, stock: 40, description: 'Infusión suave antioxidante' },
  { id: 'p7', name: 'Mollete', category: 'alimentos', price: 42, stock: 15, description: 'Pan, frijol, queso gratinado' },
  { id: 'p8', name: 'Ensalada César', category: 'alimentos', price: 79, stock: 12, description: 'Clásica con aderezo casero' },
  { id: 'p9', name: 'Pay de Limón', category: 'postres', price: 55, stock: 18, description: 'Cremoso y cítrico' },
  { id: 'p10', name: 'Capuccino', category: 'bebidas', price: 46, stock: 40, description: 'Espuma sedosa y espresso' }
];

export default function POSPage() {
  const [category, setCategory] = useState('all');
  const [view, setView] = useState<'grid'|'list'>('grid');
  const [search, setSearch] = useState('');

  const categories = useMemo(()=> Array.from(new Set(MOCK_PRODUCTS.map(p=> p.category))), []);

  return (
    <CartProvider>
  <div className='h-screen flex pos-pattern overflow-hidden'>
        {/* Sidebar (collapsible) */}
        <aside className='hidden md:flex flex-col h-screen sticky top-0'>
          <PosSidebar />
        </aside>
    {/* Main content */}
  <main
    className='flex-1 flex flex-col px-5 md:px-6 pt-6 gap-4 overflow-hidden h-full min-h-0 box-border'
      >
          {/* Header row: Title (left) + TopRightInfo (right) */}
          <div className='px-5 relative z-20 mb-0.5 flex items-start justify-between gap-4'>
            <h1 className='font-extrabold tracking-tight text-3xl md:text-4xl leading-tight select-none'>
              <span style={{ color: 'var(--fc-brand-600)' }}>Fila</span>
              <span style={{ color: 'var(--fc-teal-500)' }}>Cero</span>
            </h1>
            <TopRightInfo employeeName='Juan Pérez' role='Cajero' businessName='Punto de Venta' />
          </div>
          {/* Columns wrapper: products (left) + cart (right) */}
          <div className='flex-1 flex flex-col lg:flex-row gap-5 overflow-hidden min-h-0'>
            {/* Products section */}
            <div className='flex-1 flex flex-col overflow-hidden min-h-0'>
              {/* Tabs outside the panel, aligned to panel padding */}
              <div className='px-5 relative z-20 mb-1.5'>
                <CategoryTabs categories={categories} value={category} onChange={setCategory} />
              </div>
              {/* Panel overlaps up to sit under the tab */}
              <section className='flex flex-col flex-1 min-h-0 overflow-hidden rounded-t-2xl px-5 pt-8 pb-2 -mt-2' style={{background:'var(--pos-bg-sand)', boxShadow:'0 2px 4px rgba(0,0,0,0.04) inset 0 0 0 1px var(--pos-border-soft)'}}>
                <header className='space-y-3 mb-3 flex-none'>
                  <div className='flex flex-col md:flex-row md:items-center gap-3'>
                    <SearchBox value={search} onChange={setSearch} />
                    <div className='flex items-center gap-3'>
                      <ViewToggle value={view} onChange={setView} />
                    </div>
                  </div>
                </header>
                <div className='flex-1 min-h-0 overflow-y-auto py-4 pr-1 custom-scroll-area'>
                  <ProductGrid products={MOCK_PRODUCTS} category={category} search={search} view={view} />
                </div>
              </section>
            </div>
            <section className='w-full lg:w-72 xl:w-80 lg:pl-4 pt-4 lg:pt-0 flex flex-col flex-shrink-0 min-h-0'>
              <div className='flex-1 rounded-t-2xl px-4 pt-4 pb-2 flex flex-col overflow-hidden w-full max-w-sm mx-auto lg:max-w-none lg:mx-0' style={{background:'var(--pos-summary-bg)', boxShadow:'0 2px 4px rgba(0,0,0,0.06)'}}>
                <CartPanel />
              </div>
            </section>
          </div>
        </main>
      </div>
    </CartProvider>
  );
}
