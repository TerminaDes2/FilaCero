"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '../../../lib/api';


type Store = {
  id_negocio: number;
  nombre: string;
  descripcion?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  correo?: string | null;
  logo_url?: string | null;
  hero_image_url?: string | null;
  estrellas?: number;
  categorias?: string[];
  fecha_registro?: string;
  owner_id?: number;
};

// Datos mock mejorados
const mockStores: Store[] = [
  {
    id_negocio: 1,
    nombre: 'Restaurante La Esperanza',
    descripcion: 'Cocina tradicional con ingredientes locales.',
    direccion: 'Av. Principal 123, Ciudad',
    telefono: '555-1234',
    correo: 'contacto@laesperanza.com',
    logo: '/api/placeholder/96/96',
    fecha_registro: new Date().toISOString(),
    owner_id: 1
  },
  {
    id_negocio: 2,
    nombre: 'Farmacia San José',
    descripcion: 'Medicamentos y productos de cuidado personal.',
    direccion: 'Calle Secundaria 456, Ciudad',
    telefono: '555-5678',
    correo: 'info@farmaciasanjose.com',
    logo: '/api/placeholder/96/96',
    fecha_registro: new Date().toISOString(),
    owner_id: 2
  },
  {
    id_negocio: 3,
    nombre: 'Supermercado El Ahorro',
    descripcion: 'Despensa completa con promociones diarias.',
    direccion: 'Plaza Central 789, Ciudad',
    telefono: '555-9012',
    correo: 'ventas@elahorro.com',
    logo: '/api/placeholder/96/96',
    fecha_registro: new Date().toISOString(),
    owner_id: 3
  }
];

export default function StoresSection() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log("🔄 Cargando negocios desde la base de datos...");

        // Llamada a la API real
        const data = await api.getPublicBusinesses();

        if (data && data.length > 0) {
          console.log(`✅ ${data.length} negocios cargados correctamente`);
          setStores(data);
        } else {
          console.warn("⚠️ No hay negocios registrados en la base de datos");
          setStores([]);
        }
      } catch (err: any) {
        console.error("❌ Error cargando negocios:", err);
        setError(
          "No se pudieron cargar las tiendas. Por favor, intenta nuevamente más tarde."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  // Función para obtener imagen del logo
  const getStoreLogo = (store: Store) => store.logo;

  if (loading) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-semibold mb-6">Tiendas cerca de ti</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-lg border p-4 flex items-center space-x-4"
            >
              <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">
          Tiendas cerca de ti
        </h2>
        <span className="text-sm text-gray-500">
          {stores.length} {stores.length === 1 ? "tienda" : "tiendas"} disponible
          {stores.length !== 1 ? "s" : ""}
        </span>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-yellow-600">⚠️</span>
            <p className="ml-2 text-sm text-yellow-700">{error}</p>
          </div>
        </div>
      )}

      {stores.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
          <div className="text-gray-400 text-6xl mb-4">🏪</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay tiendas disponibles
          </h3>
          <p className="text-gray-500 mb-4">
            Actualmente no hay tiendas registradas en el sistema.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stores.map((store) => (
            <div
              key={store.id_negocio}
              className="bg-white rounded-lg border hover:shadow-lg transition-all duration-200 p-4 flex flex-col"
            >
              {/* Imagen o logo */}
              <div className="w-full h-40 rounded-md overflow-hidden bg-gray-100 mb-4 flex items-center justify-center">
                {store.logo_url ? (
                  <img
                    src={store.logo_url}
                    alt={store.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-sm text-gray-400">Sin logo</span>
                )}
              </div>

              {/* Información */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">
                    {store.nombre}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {store.direccion || "Dirección no especificada"}
                  </p>
                  {store.telefono && (
                    <p className="text-sm text-gray-500">
                      📞 {store.telefono}
                    </p>
                  )}
                  {store.correo && (
                    <p className="text-sm text-gray-500 truncate">
                      ✉️ {store.correo}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <Link
                    href={`/stores/${store.id_negocio}`}
                    className="inline-block px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Visitar tienda
                  </Link>
                  <div className="flex items-center gap-1 text-yellow-500 text-sm">
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.402 8.168L12 18.896 4.664 23.165l1.402-8.168L.132 9.21l8.2-1.192z" />
                    </svg>
                    <span className="text-sm font-semibold">{Number(store.estrellas ?? 0).toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
