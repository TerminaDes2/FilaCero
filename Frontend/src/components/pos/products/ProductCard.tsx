"use client";
import React, { useState } from 'react';
import Image from 'next/image';
// Asumimos que POSProduct ahora incluye 'imagen_url' y 'media'
// (lo arreglaremos en el Paso 2)
import { POSProduct } from '../../../pos/cartContext'; 
import { useCart } from '../../../pos/cartContext';
import { AddToCartPanel } from './AddToCartPanel';
import { useSettingsStore } from '../../../state/settingsStore';
import { resolveMediaUrl } from '../../../lib/media';

interface ProductCardProps {
  product: POSProduct;
  view?: 'grid' | 'list';
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, view = 'grid' }) => {
  const { add } = useCart();
  const { showStock, locale, currency } = useSettingsStore();
  const [showPanel, setShowPanel] = useState(false);
  const outOfStock = product.stock <= 0;
  const base = 'group relative rounded-2xl border transition overflow-hidden shadow-sm hover:shadow-md';
  type BadgeVariant = 'category' | 'price' | 'stock';

  // Tu componente 'CandyBadge'
  const CandyBadge: React.FC<{
    children: React.ReactNode;
    size?: 'sm' | 'md';
    className?: string;
    variant?: BadgeVariant;
    danger?: boolean;
  }> = ({ children, size = 'sm', className, variant = 'category', danger = false }) => {
    const palettes: Record<BadgeVariant, { bg1: string; bg2: string; text: string; stroke?: string }> = {
      category: { bg1: '#FBECD8', bg2: '#F6E0C6', text: '#604a3c', stroke: 'rgba(0,0,0,0.05)' },
      price: { bg1: '#E6F7EF', bg2: '#D9F1E6', text: '#204E42', stroke: 'rgba(0,0,0,0.05)' },
      stock: { bg1: '#FFE0E6', bg2: '#FFD1DB', text: '#7A3747', stroke: 'rgba(0,0,0,0.06)' },
    };
    const dangerPalette = { bg1: '#F8D9DF', bg2: '#F2C5CE', text: '#7a2c39', stroke: 'rgba(0,0,0,0.06)' };
    const pal = danger ? dangerPalette : palettes[variant];
    return (
      <span className={`relative z-0 inline-flex items-center ${size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-sm'} font-medium rounded-md ${className || ''}`}>
        <span aria-hidden className='absolute inset-0 z-0 rounded-[12px]'
          style={{
            background: `linear-gradient(180deg, ${pal.bg1} 0%, ${pal.bg2} 100%)`,
            boxShadow: `inset 0 0 0 1px ${pal.stroke}`,
            transform: 'rotate(-1.5deg)'
          }} />
        <span className='relative z-[1]' style={{ color: pal.text }}>{children}</span>
      </span>
    );
  };

  // Definimos la URL de la imagen buscando en los campos correctos
  // (Este error desaparecerá después del Paso 2)
  // Determinar la imagen preferida: primero media principal, luego imagen_url, luego fallback
  const principalMedia = product.media?.find(m => m.principal) || product.media?.[0];
  const rawImage = principalMedia?.url || product.imagen_url || (product as any).imagen;
  const imageUrl = resolveMediaUrl(rawImage) ?? '/images/POS-OrdenarMenu.png';

  return (
    <div className={`${base} ${view === 'list' ? 'flex gap-4 p-3 items-center' : ''}`}
      style={{
        background: 'var(--pos-card-bg)',
        borderColor: 'var(--pos-card-border)'
      }}>
      
      {/* Usamos la variable 'imageUrl' en el 'src' */}
      <div className={view === 'grid' ? 'relative w-full h-36 overflow-hidden' : 'relative w-24 h-20 rounded-lg overflow-hidden flex-shrink-0'} style={{ background: '#f2e2c5' }}>
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          unoptimized
          className='object-cover transition-transform duration-500 group-hover:scale-105'
        />
        {outOfStock && (
          <span className='absolute inset-0 bg-[rgba(255,255,255,0.78)] backdrop-blur-sm flex items-center justify-center text-[11px] font-semibold tracking-wide' style={{ color: 'var(--pos-danger-text)' }}>Sin stock</span>
        )}
      </div>

      <div className={`${view === 'grid' ? 'p-3' : 'flex-1 min-w-0'} relative z-0`}>
        <div className='flex items-start justify-between gap-2'>
          <h3 className='text-sm font-semibold leading-tight line-clamp-2' style={{ color: 'var(--pos-text-heading)' }}>{product.name}</h3>
          {view === 'grid' && (
            <CandyBadge size='sm' variant='category'>{product.category || 'General'}</CandyBadge>
          )}
        </div>
        {view === 'list' && (
          <CandyBadge size='sm' variant='category' className='mt-0.5'>{product.category || 'General'}</CandyBadge>
        )}
        {product.description && view === 'grid' && (
          <p className='mt-1 text-[11px] line-clamp-2' style={{ color: 'var(--pos-text-muted)' }}>{product.description}</p>
        )}
        <div className='mt-2 flex items-center justify-between'>
          <div className='flex flex-col'>
            
            {/* --- CORRECCIÓN DEL TYPO --- */}
            <CandyBadge size='md' variant='price' className='w-max'>
              {new Intl.NumberFormat(locale, { style: 'currency', currency }).format(product.price)}
            </CandyBadge>
            {/* --- FIN DE LA CORRECCIÓN --- */}

            {showStock && (
              <CandyBadge size='sm' variant='stock' danger={outOfStock} className='mt-1 w-max'>
                {outOfStock ? 'Sin stock' : `${product.stock} stock`}
              </CandyBadge>
            )}
          </div>
          <button
            disabled={outOfStock}
            onClick={() => setShowPanel(true)}
            aria-label={`Agregar ${product.name}`}
            className='relative inline-flex items-center justify-center w-9 h-9 rounded-full disabled:opacity-40 disabled:cursor-not-allowed shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'
            style={{
              background: 'var(--pos-accent-green)',
              color: '#fff'
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--pos-accent-green-hover)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--pos-accent-green)'; }}
          >
            <svg viewBox='0 0 24 24' className='w-5 h-5' stroke='currentColor' strokeWidth='2' fill='none'><path strokeLinecap='round' strokeLinejoin='round' d='M12 5v14M5 12h14' /></svg>
          </button>
        </div>
      </div>
      {showPanel && (
        <AddToCartPanel product={product} onClose={() => setShowPanel(false)} />
      )}
    </div>
  );
};