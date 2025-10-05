"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { POSProduct } from '../../../pos/cartContext';
import { ProductCard } from './ProductCard';
import { api } from '../../../lib/api';

interface ApiProduct {
  id_producto: string | number;
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
        // Obtener inventario si tenemos NEGOCIO (no-fatal)
        const negocioId = process.env.NEXT_PUBLIC_NEGOCIO_ID || '';
        let inventory: any[] = [];
        if (negocioId) {
          try {
            inventory = await api.getInventory({ id_negocio: negocioId });
          } catch (invErr) {
            console.warn('Inventario no disponible, mostrando productos sin stock fusionado:', invErr);
          }
        }
        const stockByProduct = new Map<string, number>();
        for (const inv of inventory) {
          if (inv.id_producto && inv.cantidad_actual != null) {
            stockByProduct.set(String(inv.id_producto), Number(inv.cantidad_actual));
          }
        }

        const adaptedProducts: POSProduct[] = apiProducts.map(p => {
          const idStr = String(p.id_producto);
          const priceNum = typeof (p as any).precio === 'number' ? (p as any).precio : parseFloat(String((p as any).precio ?? 0));
          return {
            id: idStr,
            name: p.nombre,
            price: isNaN(priceNum) ? 0 : priceNum,
            description: p.descripcion || undefined,
            image: p.imagen || undefined,
            stock: stockByProduct.get(idStr) ?? p.stock ?? 0,
            category: p.category || 'General',
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

  const filtered = useMemo(() => {
    // Temporal: no filtramos por categoría hasta que el backend envíe categorías reales
    return allProducts;
  }, [allProducts, category]);

  if (loading) return <div className='text-center py-24'>Cargando productos...</div>;
  if (error) return <div className='text-center py-24 text-red-500'>{error}</div>;
  if (filtered.length === 0) {
    return (
      <div className="text-center py-24 text-gray-500">
        No hay productos para mostrar.
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