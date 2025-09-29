"use client";
import React from 'react';
import Image from 'next/image';
import { POSProduct } from '../../../pos/cartContext';
import { useCart } from '../../../pos/cartContext';

interface ProductCardProps {
  product: POSProduct;
  view?: 'grid' | 'list';
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, view='grid' }) => {
  const { add } = useCart();
  const outOfStock = product.stock <= 0;
  const base = 'group relative rounded-2xl border transition overflow-hidden shadow-sm hover:shadow-md';
  return (
    <div className={`${base} ${view === 'list' ? 'flex gap-4 p-3 items-center' : ''}`}
         style={{
          background:'var(--pos-card-bg)',
          borderColor:'var(--pos-card-border)'
         }}>
      <div className={view==='grid' ? 'relative w-full h-36 overflow-hidden' : 'relative w-24 h-20 rounded-lg overflow-hidden flex-shrink-0'} style={{background:'#f2e2c5'}}>
        <Image src={product.image || '/images/POS-OrdenarMenu.png'} alt={product.name} fill className='object-cover transition-transform duration-500 group-hover:scale-105' />
        {outOfStock && (
          <span className='absolute inset-0 bg-[rgba(255,255,255,0.78)] backdrop-blur-sm flex items-center justify-center text-[11px] font-semibold tracking-wide' style={{color:'#8c2e3b'}}>Sin stock</span>
        )}
      </div>
      <div className={`${view==='grid' ? 'p-3' : 'flex-1 min-w-0'}`}>
        <div className='flex items-start justify-between gap-2'>
          <h3 className='text-sm font-semibold leading-tight line-clamp-2' style={{color:'var(--pos-text-heading)'}}>{product.name}</h3>
          {view==='grid' && (
            <span className='text-[11px] px-2 py-0.5 rounded-full font-medium' style={{background:'var(--pos-badge-stock-bg)', color:'#604a3c'}}>{product.category}</span>
          )}
        </div>
        {view==='list' && (
          <span className='inline-block text-[11px] mt-0.5 px-1.5 py-0.5 rounded font-medium' style={{background:'var(--pos-badge-stock-bg)', color:'#604a3c'}}>{product.category}</span>
        )}
        {product.description && view==='grid' && (
          <p className='mt-1 text-[11px] line-clamp-2' style={{color:'var(--pos-text-muted)'}}>{product.description}</p>
        )}
        <div className='mt-2 flex items-center justify-between'>
          <div className='flex flex-col'>
            <span className='text-sm font-semibold' style={{color:'#4a3327'}}>${product.price}</span>
            <span className='text-[10px]' style={{color:'var(--pos-text-muted)'}}>{product.stock} stock</span>
          </div>
          <button
            disabled={outOfStock}
            onClick={()=>add(product)}
            aria-label={`Agregar ${product.name}`}
            className='relative inline-flex items-center justify-center w-9 h-9 rounded-full disabled:opacity-40 disabled:cursor-not-allowed shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
            style={{
              background:'var(--pos-accent-green)',
              color:'#fff'
            }}
            onMouseEnter={(e)=>{ (e.currentTarget as HTMLButtonElement).style.background='var(--pos-accent-green-hover)'; }}
            onMouseLeave={(e)=>{ (e.currentTarget as HTMLButtonElement).style.background='var(--pos-accent-green)'; }}
          >
            <svg viewBox='0 0 24 24' className='w-5 h-5' stroke='currentColor' strokeWidth='2' fill='none'><path strokeLinecap='round' strokeLinejoin='round' d='M12 5v14M5 12h14' /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};
