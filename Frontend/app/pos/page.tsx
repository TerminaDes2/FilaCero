"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { PosSidebar } from '../../src/components/pos/sidebar';
import { CartProvider } from '../../src/pos/cartContext';
// Category tabs removed in favor of a compact filter button
import { ViewToggle } from '../../src/components/pos/controls/ViewToggle';
import { SearchBox } from '../../src/components/pos/controls/SearchBox';
import { ProductGrid } from '../../src/components/pos/products/ProductGrid';
import Link from 'next/link';
import CategoryFilterButton from '../../src/components/pos/controls/CategoryFilterButton';
import { usePOSView } from '../../src/state/posViewStore';
import { KitchenBoard } from '../../src/components/pos/kitchen/KitchenBoard';
import { useKitchenBoard } from '../../src/state/kitchenBoardStore';
// Categories CRUD lives on its own page
import { CartPanel } from '../../src/components/pos/cart/CartPanel';
import { TopRightInfo } from '../../src/components/pos/header/TopRightInfo';
import type { POSProduct } from '../../src/pos/cartContext';
import { useSettingsStore } from '../../src/state/settingsStore';
import { useCategoriesStore } from '../../src/pos/categoriesStore';
// Categories store not needed here

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
  const settings = useSettingsStore();
  const [view, setView] = useState<'grid'|'list'>(settings.defaultView);
  const [search, setSearch] = useState('');
  const { categories: storeCategories, selected, setSelected } = useCategoriesStore();
  const fetchCategories = () => useCategoriesStore.getState().fetchCategories();
  const categories = useMemo(() => storeCategories.map(c => c.name), [storeCategories]);
  const { view: posView } = usePOSView();
  const { hydrateFromAPI } = useKitchenBoard();

  // Fetch categories (store handles normalization & business scoping)
  useEffect(() => {
    if (storeCategories.length === 0) {
      fetchCategories().catch(() => {});
    }
  }, [storeCategories.length]);
  // Re-fetch when returning to POS sell view (in case login just happened or business changed)
  useEffect(() => {
    if (posView === 'sell' && storeCategories.length === 0) {
      fetchCategories().catch(() => {});
    }
  }, [posView, storeCategories.length]);
  // Hydrate when switching into kitchen view
  useEffect(() => {
    if (posView === 'kitchen') {
      hydrateFromAPI();
    }
  }, [posView, hydrateFromAPI]);
  
  // Keyboard: 'v' toggles view (grid/list) when not typing in input
  useEffect(() => {
    const isEditable = (t: EventTarget | null) => {
      const el = t as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName?.toLowerCase();
      return !!(el.isContentEditable || tag === 'input' || tag === 'textarea' || tag === 'select');
    };
    const onKey = (e: KeyboardEvent) => {
      if (!isEditable(e.target) && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        setView(v => v === 'grid' ? 'list' : 'grid');
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

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
            <TopRightInfo showLogout />
          </div>
          {/* Dynamic content wrapper */}
          {posView === 'kitchen' ? (
            <div className='flex-1 flex flex-col gap-5 overflow-hidden min-h-0 px-5'>
              <KitchenBoard />
            </div>
          ) : (
            <div className='flex-1 flex flex-col lg:flex-row gap-5 overflow-hidden min-h-0'>
              {/* Products section */}
              <div className='flex-1 flex flex-col overflow-hidden min-h-0'>
                {/* Category filter moved into header controls */}
                <section className='flex flex-col flex-1 min-h-0 overflow-hidden rounded-t-2xl px-5 pt-6 pb-4 -mt-1' style={{background:'var(--pos-bg-sand)', boxShadow:'0 2px 4px rgba(0,0,0,0.04) inset 0 0 0 1px var(--pos-border-soft)'}}>
                  <header className='space-y-3 mb-3 flex-none'>
                    <div className='flex flex-col md:flex-row md:items-center gap-3'>
                      <SearchBox value={search} onChange={setSearch} />
                      <div className='flex items-center gap-2'>
                        <CategoryFilterButton
                          categories={categories}
                          value={selected}
                          onChange={setSelected}
                        />
                        <ViewToggle value={view} onChange={setView} />
                      </div>
                    </div>
                  </header>
                  <div className='flex-1 min-h-0 overflow-y-auto py-4 pr-1 custom-scroll-area'>
                    <ProductGrid category={selected} search={search} view={view} />
                  </div>
                </section>
              </div>
              <section className='w-full lg:w-72 xl:w-80 lg:pl-4 pt-4 lg:pt-0 flex flex-col flex-shrink-0 min-h-0'>
                <div className='flex-1 rounded-t-2xl px-4 pt-4 pb-2 flex flex-col overflow-hidden w-full max-w-sm mx-auto lg:max-w-none lg:mx-0' style={{background:'var(--pos-summary-bg)', boxShadow:'0 2px 4px rgba(0,0,0,0.06)'}}>
                  <CartPanel />
                </div>
              </section>
            </div>
          )}
        </main>
      </div>
    </CartProvider>
  );
}

// Removed stray styled-jsx block; Tailwind classes applied directly on the link.
