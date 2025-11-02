// app/stores/[id]/page.tsx
"use client";
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../src/lib/api';

type Product = {
  id_producto: number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  imagen?: string | null;
  stock: number;
  stock_minimo: number;
  categoria?: string;
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
  hero_image_url?: string | null;
  fecha_registro?: string;
};

export default function StorePage() {
  const params = useParams();
  const storeId = params.id as string;
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchStore = async () => {
    if (!storeId) {
      setError('ID de tienda no válido');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log(`🔄 Cargando tienda ID: ${storeId}`);
      
      // Usa tu API para obtener la tienda - ahora con string
      const storeData = await api.getBusinessById(storeId);
      
      // Si la API no devuelve productos, intenta cargarlos por separado
      if (!storeData.prodffuctos || storeData.productos.length === 0) {
        try {
          console.log('🔄 Cargando productos de la tienda...');
          const productos = await api.getProducts({ 
            id_negocio: storeId,
            status: 'active'
          });
          storeData.productos = productos;
        } catch (productError) {
          console.log('ℹ️ No se pudieron cargar los productos:', productError);
          storeData.productos = [];
        }
      }
      
      setStore(storeData);
      console.log('✅ Tienda cargada exitosamente:', storeData);
      
    } catch (err: any) {
      console.error('❌ Error cargando tienda:', err);
      
      if (err.status === 404) {
        setError('Tienda no encontrada');
      } else if (err.status === 401) {
        setError('No tienes permisos para ver esta tienda');
      } else {
        setError('No se pudo cargar la tienda. Por favor, intenta más tarde.');
      }
      
      setStore(null);
    } finally {
      setLoading(false);
    }
  };

  fetchStore();
}, [storeId]);
  // Función para manejar agregar al carrito
  const handleAddToCart = (producto: Product) => {
    console.log('🛒 Agregando al carrito:', producto);
    // Aquí puedes implementar la lógica del carrito
    alert(`"${producto.nombre}" agregado al carrito`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            {/* Header loading */}
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center mb-8">
              <div className="w-24 h-24 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
            
            {/* Content loading */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              <div className="lg:col-span-1">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="lg:col-span-3">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-lg border p-4">
                      <div className="w-full h-48 bg-gray-200 rounded-md mb-4"></div>
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-3"></div>
                      <div className="flex justify-between">
                        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    </div>
                  ))}
                </div>
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
          <div className="text-6xl mb-4">😞</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Tienda no encontrada'}
          </h1>
          <p className="text-gray-600 mb-8">
            La tienda que buscas no existe o no está disponible en este momento.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/"
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
            >
              Volver al inicio
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
            >
              Reintentar
            </button>
          </div>
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
            {/* Logo */}
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
              {store.logo ? (
                <img 
                  src={store.logo} 
                  alt={store.nombre} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/api/placeholder/96/96';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {store.nombre.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            
            {/* Información de la tienda */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{store.nombre}</h1>
              <p className="text-gray-600 mb-4">
                {store.descripcion || 'Esta tienda aún no tiene descripción.'}
              </p>
              
              <div className="flex flex-wrap gap-4 items-center">
                {/* Rating */}
                {store.estrellas && store.estrellas > 0 && (
                  <div className="flex items-center gap-1">
                    <svg className="w-5 h-5 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.402 8.168L12 18.896 4.664 23.165l1.402-8.168L.132 9.21l8.2-1.192z" />
                    </svg>
                    <span className="font-semibold">{(store.estrellas ?? 0).toFixed(1)}</span>
                  </div>
                )}
                
                {/* Categorías */}
                {store.categorias && store.categorias.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {store.categorias.map((categoria, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium"
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
          {/* Sidebar - Información de contacto */}
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
                    <span className="text-gray-600 text-sm">{store.direccion}</span>
                  </div>
                )}
                
                {store.telefono && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-gray-600 text-sm">{store.telefono}</span>
                  </div>
                )}
                
                {store.correo && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-600 text-sm break-all">{store.correo}</span>
                  </div>
                )}
              </div>
              
              {/* Botón volver */}
              <div className="mt-6 pt-6 border-t">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Volver a tiendas
                </Link>
              </div>
            </div>
          </div>

          {/* Productos */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Productos</h2>
              <span className="text-sm text-gray-500">
                {store.productos?.length || 0} producto(s) disponible(s)
              </span>
            </div>
            
            {store.productos && store.productos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {store.productos.map((producto) => (
                  <div
                    key={producto.id_producto}
                    className="bg-white rounded-lg border p-4 hover:shadow-md transition-all duration-200"
                  >
                    {/* Imagen del producto */}
                    <div className="w-full h-48 rounded-md overflow-hidden bg-gray-100 mb-4 flex items-center justify-center">
                      {producto.imagen ? (
                        <img
                          src={producto.imagen}
                          alt={producto.nombre}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/api/placeholder/300/300';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-sm">Sin imagen</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Información del producto */}
                    <h3 className="font-semibold text-lg mb-2 line-clamp-1">{producto.nombre}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {producto.descripcion || 'Sin descripción disponible'}
                    </p>
                    
                    {/* Categoría */}
                    {producto.categoria && (
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs mb-3">
                        {producto.categoria}
                      </span>
                    )}
                    
                    {/* Precio y stock */}
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xl font-bold text-green-600">
                        ${producto.precio.toFixed(2)}
                      </span>
                      <span className={`text-sm font-medium ${
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
                    
                    {/* Botón agregar al carrito */}
                    <button
                      onClick={() => handleAddToCart(producto)}
                      disabled={producto.stock === 0}
                      className={`w-full mt-4 px-4 py-2 rounded-lg font-medium transition-colors ${
                        producto.stock > 0
                          ? 'bg-green-500 hover:bg-green-600 text-white shadow-sm hover:shadow-md'
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
                <div className="text-gray-400 text-6xl mb-4">📦</div>
                <p className="text-gray-500 text-lg mb-2">No hay productos disponibles</p>
                <p className="text-gray-400 text-sm">Esta tienda aún no tiene productos publicados</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}