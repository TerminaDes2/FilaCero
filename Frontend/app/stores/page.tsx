// app/stores/[id]/page.tsx
"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type Product = {
  id_producto: number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  imagen?: string | null;
  stock: number;
  stock_minimo: number;
};

type Store = {
  id_negocio: number;
  nombre: string;
  descripcion?: string | null;
  logo?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  correo?: string | null;
  estrellas?: number;
  categorias?: string[];
  productos?: Product[];
};

export default function StorePage() {
  const params = useParams();
  const storeId = params.id;
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStore = async () => {
      if (!storeId) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/stores/${storeId}`);
        if (!response.ok) throw new Error('Tienda no encontrada');
        const data = await response.json();
        setStore(data);
      } catch (err) {
        console.error('Error cargando tienda:', err);
        setError('No se pudo cargar la tienda');
        setStore(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [storeId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="md:col-span-2">
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Tienda no encontrada</h1>
          <p className="text-gray-600 mb-8">{error || 'La tienda que buscas no existe o ha sido removida.'}</p>
          <Link
            href="/shop"
            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
          >
            Volver a tiendas
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Header de la tienda */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
              {store.logo ? (
                <img 
                  src={store.logo} 
                  alt={store.nombre} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-sm">Logo</span>
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{store.nombre}</h1>
              <p className="text-gray-600 mb-4">{store.descripcion || 'Sin descripción'}</p>
              
              <div className="flex flex-wrap gap-4 items-center">
                {store.estrellas && (
                  <div className="flex items-center gap-1">
                    <svg className="w-5 h-5 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.402 8.168L12 18.896 4.664 23.165l1.402-8.168L.132 9.21l8.2-1.192z" />
                    </svg>
                    <span className="font-semibold">{(store.estrellas ?? 0).toFixed(1)}</span>
                  </div>
                )}
                
                {store.categorias && store.categorias.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {store.categorias.map((categoria, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {categoria}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Información de contacto */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border p-6 sticky top-24">
              <h2 className="text-xl font-semibold mb-4">Información de contacto</h2>
              <div className="space-y-3">
                {store.direccion && (
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-600">{store.direccion}</span>
                  </div>
                )}
                
                {store.telefono && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-gray-600">{store.telefono}</span>
                  </div>
                )}
                
                {store.correo && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-600">{store.correo}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Productos */}
          <div className="lg:col-span-3">
            <h2 className="text-2xl font-semibold mb-6">Productos</h2>
            
            {store.productos && store.productos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {store.productos.map((producto) => (
                  <div
                    key={producto.id_producto}
                    className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="w-full h-48 rounded-md overflow-hidden bg-gray-100 mb-4 flex items-center justify-center">
                      {producto.imagen ? (
                        <img
                          src={producto.imagen}
                          alt={producto.nombre}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-400">Sin imagen</span>
                      )}
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-2">{producto.nombre}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {producto.descripcion || 'Sin descripción'}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-green-600">
                        ${producto.precio.toFixed(2)}
                      </span>
                      <span className={`text-sm ${
                        producto.stock > 0 
                          ? producto.stock <= producto.stock_minimo 
                            ? 'text-yellow-600' 
                            : 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {producto.stock > 0 
                          ? producto.stock <= producto.stock_minimo 
                            ? `Stock bajo (${producto.stock})`
                            : `En stock (${producto.stock})`
                          : 'Agotado'
                        }
                      </span>
                    </div>
                    
                    <button
                      disabled={producto.stock === 0}
                      className={`w-full mt-4 px-4 py-2 rounded-lg font-medium transition-colors ${
                        producto.stock > 0
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {producto.stock > 0 ? 'Agregar al carrito' : 'Agotado'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-dashed">
                <p className="text-gray-500 text-lg">No hay productos disponibles en esta tienda</p>
                <p className="text-gray-400 text-sm mt-2">Vuelve más tarde</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}