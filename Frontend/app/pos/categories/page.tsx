"use client";
import React, { useMemo, useState } from 'react';
import { PosSidebar } from '../../../src/components/pos/sidebar';
import { TopRightInfo } from '../../../src/components/pos/header/TopRightInfo';
import LanguageSelector from '../../../src/components/LanguageSelector';
import { CategoriesAdminPanel } from '../../../src/components/pos/categories/CategoriesAdminPanel';
import { useCategoriesStore } from '../../../src/pos/categoriesStore';
import { NewCategoryPanel } from '../../../src/components/pos/categories/NewCategoryPanel';

export default function POSCategoriesPage() {
  const { categories } = useCategoriesStore();
  const total = categories.length;
  const subtitle = useMemo(() => total === 0 ? '' : `${total} categoría${total===1?'':'s'}`, [total]);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  return (
    <div className='h-screen flex pos-pattern overflow-hidden'>
      <aside className='hidden md:flex flex-col h-screen sticky top-0'>
        <PosSidebar />
      </aside>
      <main className='flex-1 flex flex-col px-5 md:px-6 pt-6 gap-4 overflow-hidden h-full min-h-0 box-border'>
        {/* Header row */}
        <div className='px-5 relative z-20 mb-4 flex items-start justify-between gap-4'>
          <h1 className='font-extrabold tracking-tight text-3xl md:text-4xl leading-tight select-none'>
            <span style={{ color: 'var(--fc-brand-600)' }}>Fila</span>
            <span style={{ color: 'var(--fc-teal-500)' }}>Cero</span>
          </h1>
          <div className='flex items-center gap-4'>
            <LanguageSelector variant="compact" theme="light" />
            <TopRightInfo showLogout />
          </div>
        </div>

        <div className='flex-1 min-h-0 overflow-hidden rounded-t-2xl px-5 pt-8 pb-3 flex flex-col' style={{ background: 'var(--pos-bg-sand)', boxShadow: '0 2px 4px rgba(0,0,0,0.04), inset 0 0 0 1px var(--pos-border-soft)' }}>
          {/* Categories section */}
          <div className='flex-1 min-h-0 overflow-y-auto pr-1 pb-1 custom-scroll-area'>
            <CategoriesAdminPanel onNewCategory={()=>setIsPanelOpen(true)} />
          </div>
        </div>
        {isPanelOpen && (
          <NewCategoryPanel onClose={()=>setIsPanelOpen(false)} />
        )}
      </main>
    </div>
  );
}
