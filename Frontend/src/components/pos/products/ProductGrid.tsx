"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { POSProduct } from '../../../pos/cartContext';
import { ProductCard } from './ProductCard';
import { api } from '../../../lib/api';
import { resolveMediaUrl } from '../../../lib/media';

interface ApiProduct {
  id_producto: string | number;
  nombre: string;
  descripcion: string | null;
  precio: string | number;
  imagen_url?: string | null;
  estado: string | null;
  stock?: number | string | null;
  category?: string | null;
  id_categoria?: string | number | null;
  media?: Array<{ id_media?: string | number; url: string; principal: boolean; tipo?: string | null }>
}

interface ProductGridProps {
  category: string;
  search: string;
  view: 'grid' | 'list';
}

export const ProductGrid: React.FC<ProductGridProps> = ({ category, search, view }) => {
  const [allProducts, setAllProducts] = useState<POSProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEmptyDelay, setShowEmptyDelay] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndAdaptProducts = async () => {
      setLoading(true);
      try {
        const apiProducts: ApiProduct[] = await api.getProducts({ search });
        const adaptedProducts: POSProduct[] = apiProducts.map(p => {
          const idStr = String(p.id_producto);
          const priceNum = typeof p.precio === 'number' ? p.precio : parseFloat(String(p.precio ?? 0));
          let stockValue: number | null = null;
          if (p.stock !== undefined) {
            if (p.stock === null) {
              stockValue = null;
            } else {
              const parsed = typeof p.stock === 'number' ? p.stock : parseFloat(String(p.stock));
              stockValue = Number.isNaN(parsed) ? null : parsed;
            }
          }
          const categoryLabel = (p.category ?? '').trim();
          // Soporte retrocompatibilidad: algunos builds antiguos devolvían 'imagen' en lugar de 'imagen_url'
          const imagenUrl = (p as any).imagen_url ?? (p as any).imagen ?? undefined;
          // Soporte retrocompatibilidad: 'media' o 'producto_media'
          const rawMedia = Array.isArray((p as any).media)
            ? (p as any).media
            : (Array.isArray((p as any).producto_media) ? (p as any).producto_media : undefined);
          // Normalizar URLs (soporta productos antiguos con rutas relativas)
          const normalizedMedia = Array.isArray(rawMedia)
            ? (rawMedia
                .map((m: any) => {
                  const u = resolveMediaUrl(m.url);
                  if (!u) return null;
                  return {
                    id_media: m.id_media !== undefined ? String(m.id_media) : undefined,
                    url: u,
                    principal: !!m.principal,
                  };
                })
                .filter(Boolean) as { id_media?: string; url: string; principal: boolean }[])
            : undefined;
          return {
            id: idStr,
            name: p.nombre,
            price: isNaN(priceNum) ? 0 : priceNum,
            description: p.descripcion || undefined,
            // Mantener compatibilidad con tarjetas que usan imagen_url y media
            imagen_url: resolveMediaUrl(imagenUrl),
            media: normalizedMedia,
            stock: stockValue ?? 0,
            category: categoryLabel || 'Sin categoría',
          };
        });

        setAllProducts(adaptedProducts);
      } catch (err) {
        setError('No se pudieron cargar los productos.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAndAdaptProducts();
  }, [search]); // Se recarga si cambia el término de búsqueda

  // No skeletons: show empty state immediately
  useEffect(() => {
    setShowEmptyDelay(false);
  }, [loading]);

  const filtered = useMemo(() => {
    if (!category || category === 'all') return allProducts;
    const normalized = category.trim().toLowerCase();
    if (!normalized) return allProducts;
    if (normalized === 'uncategorized') {
      return allProducts.filter(p => !p.category || p.category.toLowerCase() === 'sin categoría');
    }
    return allProducts.filter(p => p.category && p.category.trim().toLowerCase() === normalized);
  }, [allProducts, category]);

  if (loading) {
    return <div className='text-center py-10 text-[var(--pos-text-muted)] text-sm'>Cargando productos…</div>;
  }
  if (error) return <div className='text-center py-24 text-red-500'>{error}</div>;
  if (filtered.length === 0) {
    return (
      <div className='text-center py-16 px-4'>
        <svg viewBox='0 0 24 24' className='w-12 h-12 mx-auto text-slate-300' fill='none' stroke='currentColor' strokeWidth='1.4'>
          <circle cx='12' cy='12' r='7' />
          <path d='M8 12h8' />
        </svg>
        <p className='text-sm font-medium text-slate-600 mt-3'>No hay resultados</p>
        <p className='text-[12px] text-slate-500 mt-1'>Ajusta filtros o agrega nuevos elementos.</p>
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