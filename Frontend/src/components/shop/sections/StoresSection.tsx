import React, { useEffect, useState } from 'react';

type Store = {
  id_negocio: number | string;
  nombre: string;
  descripcion?: string | null;
  logo?: string | null;
  hero_image_url?: string | null;
  telefono?: string | null;
  correo?: string | null;
  estrellas?: number;
  categorias?: string[];
};

export default function StoresSection() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/stores')
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => setStores(data))
      .catch(() => setStores([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold mb-4">Tiendas cerca de ti</h2>

      {loading ? (
        <p className="text-gray-500 animate-pulse">Cargando tiendas...</p>
      ) : stores.length === 0 ? (
        <div className="text-center text-gray-500 bg-gray-50 border border-dashed rounded-lg py-10">
          <p className="text-lg font-medium mb-2">No hay tiendas disponibles por ahora</p>
          <p className="text-sm">Vuelve más tarde o explora otros productos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stores.map((s) => (
            <div
              key={s.id_negocio}
              className="flex gap-4 p-4 bg-white rounded-lg border hover:shadow-md transition-all"
              style={{ borderColor: 'var(--fc-border-soft)' }}
            >
              <div className="w-24 h-24 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                {s.logo ? (
                  <img src={s.logo} alt={s.nombre} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm text-gray-400">Logo</span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{s.nombre}</h3>
                <p className="text-sm text-gray-600">{s.descripcion || 'Próximamente más detalles.'}</p>

                <a
                  href={`/shop/${s.id_negocio}`}
                  className="inline-block mt-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Visitar tienda
                </a>

                <div className="mt-2 flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.402 8.168L12 18.896 4.664 23.165l1.402-8.168L.132 9.21l8.2-1.192z" />
                    </svg>
                    <span className="text-sm font-semibold">{Number(s.estrellas ?? 0).toFixed(1)}</span>
                  </div>
                  <div className="text-xs text-gray-500">{s.categorias?.join(' · ')}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
