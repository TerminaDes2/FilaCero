"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { POSProduct } from '../../../pos/cartContext';
import { ProductCard } from './ProductCard';
import { api } from '../../../lib/api';

interface ApiProduct {
  id_producto: number;
  nombre: string;
  descripcion: string | null;
  precio: string;
  imagen: string | null;
  estado: string | null;
  stock?: number;
  category?: string;
}

interface ProductGridProps {
  category: string;
  search: string;
  view: 'grid' | 'list';
}

export const ProductGrid: React.FC<ProductGridProps> = ({ category, search, view }) => {
  const [allProducts, setAllProducts] = useState<POSProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndAdaptProducts = async () => {
      setLoading(true);
      try {
        const apiProducts: ApiProduct[] = await api.getProducts({ search });
        
        const adaptedProducts: POSProduct[] = apiProducts.map(p => ({
          id: p.id_producto.toString(),
          name: p.nombre,
          price: parseFloat(p.precio),
          description: p.descripcion || undefined,
          image: p.imagen || undefined,
          stock: p.stock || 0,
          category: p.category || 'General',
        }));
        
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

  const filtered = useMemo(() => {
    return allProducts.filter(p => {
      const inCat = category === 'all' || p.category === category;
      return inCat; // El filtro de búsqueda ya lo hace la API
    });
  }, [allProducts, category]);

  if (loading) return <div className='text-center py-24'>Cargando productos...</div>;
  if (error) return <div className='text-center py-24 text-red-500'>{error}</div>;
  if (filtered.length === 0) { /* ... tu JSX para "Sin resultados" ... */ }

  return (
    <div className={view === 'grid' ? 'grid gap-4 lg:gap-5 grid-cols-2 md:grid-cols-3 xl:grid-cols-4' : 'space-y-3'}>
      {filtered.map(p => (
        <ProductCard key={p.id} product={p} view={view} />
      ))}
    </div>
  );
};