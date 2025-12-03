"use client";
import React, { useEffect, useMemo, useState } from 'react';
import ProductCard, { Product } from '../ProductCard';
import { api } from '../../../lib/api';

type InventoryItem = {
  id_inventario: number | string;
  cantidad_actual?: number | null;
  producto?: {
    id_producto?: number | string;
    nombre?: string | null;
    descripcion?: string | null;
    precio?: number | null;
    imagen?: string | null;
    categoria?: string | null;
  } | null;
};

const FALLBACK_ITEMS: Product[] = [
  { id_producto: 'popular-mock-1', nombre: 'Combo café y croissant', precio: 58, imagen: null, cantidad_actual: 8, categoria: 'Destacados' },
  { id_producto: 'popular-mock-2', nombre: 'Wrap de pollo', precio: 72, imagen: null, cantidad_actual: 5, categoria: 'Destacados' },
  { id_producto: 'popular-mock-3', nombre: 'Smoothie energético', precio: 49, imagen: null, cantidad_actual: 11, categoria: 'Destacados' },
];

export default function PopularSection() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    const fetchPopularProducts = async () => {
      try {
        setLoading(true);
        const inventoryData = await api.getInventory({ limit: 6 });
        if (cancelled || !Array.isArray(inventoryData)) return;

        const mapped: Product[] = (inventoryData as InventoryItem[])
          .filter((item) => (item?.cantidad_actual ?? 0) > 0)
          .slice(0, 6)
          .map((item) => ({
            id_producto: item.producto?.id_producto ?? item.id_inventario,
            nombre: item.producto?.nombre?.trim() || 'Producto sin nombre',
            descripcion: item.producto?.descripcion ?? null,
            precio: item.producto?.precio ?? 0,
            imagen: item.producto?.imagen ?? null,
            categoria: item.producto?.categoria ?? 'Popular',
            cantidad_actual: item.cantidad_actual ?? null,
          }));

        setItems(mapped.length > 0 ? mapped : FALLBACK_ITEMS);
      } catch (err) {
        console.error('Error fetching popular products:', err);
        if (!cancelled) {
          setItems(FALLBACK_ITEMS);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchPopularProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  const skeleton = useMemo(() => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div key={idx} className="bg-white border rounded-lg p-4">
          <div className="w-24 h-24 bg-gray-200 rounded-md mb-3" />
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      ))}
    </div>
  ), []);

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-semibold">Populares esta semana</h2>
          <p className="text-sm text-gray-500">Los productos con más movimiento según el inventario.</p>
        </div>
      </div>

      {loading ? (
        skeleton
      ) : items.length === 0 ? (
        <div className="border border-dashed bg-gray-50 rounded-lg p-6 text-center text-gray-500">
          No encontramos productos populares aún. Intenta nuevamente más tarde.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((product) => (
            <ProductCard key={product.id_producto} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
