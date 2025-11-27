import React, { useEffect, useState } from 'react';
import ProductCard, { Product } from '../ProductCard';
import { api } from '../../../lib/api';

export default function DesayunosSection() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDesayunos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 Cargando productos de desayuno...');
        
        // Usa la función getProducts de tu API con el parámetro de categoría
        const data = await api.getProducts({ categoria: 'ALimentos', status: 'activo' });
        
        if (data && data.length > 0) {
          console.log(`✅ ${data.length} productos de desayuno cargados desde API`);
          setItems(data);
        } else {
          console.log('ℹ️ No hay productos de desayuno en la API');
          setItems([]);
        }
        
      } catch (err: any) {
        console.error('❌ Error cargando productos de desayuno:', err);
        setError('No se pudieron cargar los productos de desayuno.');
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDesayunos();
  }, []);

  if (loading) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-semibold mb-4">Desayunos populares</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
              <div className="w-full h-48 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold mb-4">Desayunos populares</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-yellow-600">⚠️</span>
            <p className="ml-2 text-sm text-yellow-700">{error}</p>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
          <div className="text-gray-400 text-4xl mb-2">🥐</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay desayunos disponibles</h3>
          <p className="text-gray-500">Próximamente añadiremos productos de desayuno.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((product) => (
            <ProductCard 
              key={product.id_producto} 
              product={product} 
              showPrice={false} 
            />
          ))}
        </div>
      )}
    </section>
  );
}