"use client";
import React, { useMemo } from 'react';
import { POSProduct } from '../../../pos/cartContext';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: POSProduct[];
  category: string;
  search: string;
  view: 'grid' | 'list';
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, category, search, view }) => {
  const filtered = useMemo(()=> {
    return products.filter(p => {
      const inCat = category === 'all' || p.category === category;
      const term = search.trim().toLowerCase();
      const matches = !term || p.name.toLowerCase().includes(term) || p.description?.toLowerCase().includes(term);
      return inCat && matches;
    });
  }, [products, category, search]);

  if(filtered.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-dashed border-rose-300/40 dark:border-rose-300/20 bg-white/40 dark:bg-slate-900/40'>
        <svg viewBox='0 0 24 24' className='w-10 h-10 mb-4 text-rose-400' stroke='currentColor' strokeWidth='1.5' fill='none'>
          <path strokeLinecap='round' strokeLinejoin='round' d='M3 3h18M3 9h18M9 14h12M9 19h12' />
        </svg>
        <p className='text-sm font-medium text-slate-700 dark:text-slate-200'>Sin resultados</p>
        <p className='text-[12px] text-slate-500 dark:text-slate-400 mt-1'>Prueba con otro término o categoría</p>
      </div>
    );
  }

  return (
    <div className={view === 'grid' ? 'grid gap-4 lg:gap-5 grid-cols-2 md:grid-cols-3 xl:grid-cols-4' : 'space-y-3'}>
      {filtered.map(p => (
        <ProductCard key={p.id} product={p} view={view} />
      ))}
    </div>
  );
};
