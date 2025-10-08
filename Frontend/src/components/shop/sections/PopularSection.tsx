import { api } from '../../../lib/api';
import React, { useEffect, useState } from 'react';
import ProductCard, { Product } from '../ProductCard';

export default function PopularSection() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

// Dentro del componente
useEffect(() => {
  const fetchPopularProducts = async () => {
    try {
      setLoading(true);
      // Usar tu API existente
      const products = await api.getProducts({ status: 'Activo' });
      // Tomar solo los primeros 6 productos
      setItems(products.slice(0, 6));
    } catch (err) {
      console.error('Error fetching popular products:', err);
      setError('No se pudieron cargar los productos');
      // Datos de fallback...
    } finally {
      setLoading(false);
    }
  };

  fetchPopularProducts();
}, []);

  if (loading) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold mb-4">Lo más popular</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-48 rounded-lg mb-2"></div>
              <div className="bg-gray-200 h-4 rounded w-3/4 mb-2"></div>
              <div className="bg-gray-200 h-3 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error && items.length === 0) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold mb-4">Lo más popular</h2>
        <div className="text-center text-red-500 py-8">
          {error}
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold mb-4">Lo más popular</h2>
      {error && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          {error} (mostrando datos de respaldo)
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((product) => (
          <ProductCard key={product.id_producto} product={product} />
        ))}
      </div>
      {items.length === 0 && !loading && (
        <div className="text-center text-gray-500 py-8">
          No hay productos populares disponibles
        </div>
      )}
    </section>
  );
}