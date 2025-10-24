import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';

type Store = {
  id_negocio: number;
  nombre: string;
  descripcion?: string | null;
  direccion?: string | null;
  telefono?: string | null;
  correo?: string | null;
  logo?: string | null;
  hero_image_url?: string | null;
  estrellas?: number;
  categorias?: string[];
  fecha_registro?: string;
  owner_id?: number;
};
  fecha_registro?: string;
  owner_id?: number;
};

// Datos mock mejorados
const mockStores: Store[] = [
  {
    id_negocio: 1,
    nombre: 'Restaurante La Esperanza',
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
        
        console.log('🔄 Cargando negocios públicos...');
        
        // Intenta con la API real
        const data = await api.getPublicBusinesses();
        
        if (data && data.length > 0) {
          console.log(`✅ ${data.length} negocios cargados desde API`);
          setStores(data);
        } else {
          console.log('ℹ️ No hay negocios en la API');
          setStores([]);
        }
        
      } catch (err: any) {
        console.error('❌ Error cargando negocios:', err);
        setError('No se pudieron cargar las tiendas. Por favor, intenta más tarde.');
        setStores([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  // Función para obtener imagen del logo
  const getStoreLogo = (store: Store) => {
      return store.logo;
  };

  if (loading) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Tiendas cerca de ti</h2>
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg border p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-8 bg-gray-200 rounded w-24 mt-2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Tiendas cerca de ti</h2>
        <span className="text-sm text-gray-500">
          {stores.length} {stores.length === 1 ? 'tienda' : 'tiendas'} disponible{stores.length !== 1 ? 's' : ''}
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay tiendas disponibles</h3>
          <p className="text-gray-500 mb-4">Actualmente no hay tiendas registradas en el sistema.</p>
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
              className="bg-white rounded-lg border hover:shadow-md transition-all duration-200 p-4"
            >
              <div className="w-24 h-24 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                {store.logo ? (
                  <img src={store.logo} alt={store.nombre} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm text-gray-400">Logo</span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{store.nombre}</h3>
                <p className="text-sm text-gray-600">Próximamente más detalles.</p>
                <h3 className="font-semibold">{store.nombre}</h3>
                <p className="text-sm text-gray-600">{store.descripcion || store.direccion || 'Próximamente más detalles.'}</p>

                <a
                  href={`/shop/${store.id_negocio}`}
                  className="inline-block mt-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Visitar tienda
                </a>

                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
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