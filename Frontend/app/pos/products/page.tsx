"use client";
import React, { useEffect, useState } from 'react';
import { PosSidebar } from '../../../src/components/pos/sidebar';
import { SearchBox } from '../../../src/components/pos/controls/SearchBox';
import { ViewToggle } from '../../../src/components/pos/controls/ViewToggle';
import { TopRightInfo } from '../../../src/components/pos/header/TopRightInfo';
import { AdminProductGrid } from '../../../src/components/pos/products/AdminProductGrid';
import { NewProductPanel } from '../../../src/components/pos/products/NewProductPanel';
import { CartProvider } from '../../../src/pos/cartContext';
import { useSettingsStore } from '../../../src/state/settingsStore';

export default function ProductsAdminPage() {
  const settings = useSettingsStore();
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>(settings.defaultView);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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

  // Keyboard: 'n' opens New Product panel when not typing in input
  useEffect(() => {
    const isEditable = (t: EventTarget | null) => {
      const el = t as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName?.toLowerCase();
      return !!(el.isContentEditable || tag === 'input' || tag === 'textarea' || tag === 'select');
    };
    const onKey = (e: KeyboardEvent) => {
      if (!isEditable(e.target) && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsPanelOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const onProductCreated = () => {
    setRefreshKey(k => k + 1);
    setIsPanelOpen(false);
  };

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
          <div className='px-5 relative z-10 mb-4 flex items-start justify-between gap-4'>
            <h1 className='font-extrabold tracking-tight text-3xl md:text-4xl leading-tight select-none'>
              <span style={{ color: 'var(--fc-brand-600)' }}>Fila</span>
              <span style={{ color: 'var(--fc-teal-500)' }}>Cero</span>
            </h1>
            <TopRightInfo businessName='Punto de Venta' showLogout />
          </div>

          {/* Panel area */}
          <section className='flex-1 min-h-0 overflow-hidden rounded-t-2xl px-5 pt-8 pb-3 flex flex-col' style={{ background: 'var(--pos-bg-sand)', boxShadow: '0 2px 4px rgba(0,0,0,0.04), inset 0 0 0 1px var(--pos-border-soft)' }}>
            <header className='space-y-3 mb-3 flex-none'>
              <div className='flex flex-col md:flex-row md:items-center gap-3'>
                <div className='flex-1 min-w-0'>
                  <SearchBox value={search} onChange={setSearch} />
                </div>
                <div className='flex items-center flex-wrap gap-2'>
                  <ViewToggle value={view} onChange={setView} />
                  <div className='ml-0 md:ml-2 flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start'>
                    <button onClick={() => setIsPanelOpen(true)} className='h-9 px-3 rounded-lg text-sm font-semibold focus:outline-none focus-visible:ring-2' style={{ background: 'var(--pos-accent-green)', color: '#fff' }}>Nuevo producto</button>
                  </div>
                </div>
              </div>
            </header>

            <div className='flex-1 min-h-0 overflow-y-auto pr-1 pb-4 custom-scroll-area'>
              <AdminProductGrid key={refreshKey} search={search} view={view} />
            </div>
          </section>
        </main>

        {isPanelOpen && (
          <NewProductPanel onClose={() => setIsPanelOpen(false)} onProductCreated={onProductCreated} />
        )}
      </div>
    </CartProvider>
  );
}
