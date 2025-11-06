"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "../../../lib/api";

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
};

export default function StoresSection() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getPublicBusinesses();

        if (Array.isArray(data) && data.length > 0) {
          setStores(data);
        } else {
          setStores([]);
        }
      } catch (err) {
        console.error("Error cargando negocios", err);
        setError("No se pudieron cargar las tiendas. Intenta nuevamente más tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  if (loading) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-semibold mb-6">Tiendas cerca de ti</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div key={item} className="bg-white rounded-lg border p-4 flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Tiendas cerca de ti</h2>
        <span className="text-sm text-gray-500">
          {stores.length} {stores.length === 1 ? "tienda disponible" : "tiendas disponibles"}
        </span>
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-700">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {stores.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-gray-50 py-12 text-center">
          <div className="mb-4 text-6xl text-gray-400">🏪</div>
          <h3 className="mb-2 text-lg font-medium text-gray-900">No hay tiendas disponibles</h3>
          <p className="text-gray-500">Actualmente no hay tiendas registradas en el sistema.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => {
            const rating = Number(store.estrellas ?? 0).toFixed(1);
            const primaryImage = store.hero_image_url ?? store.logo_url ?? null;

            return (
              <article
                key={store.id_negocio}
                className="flex h-full flex-col rounded-lg border bg-white p-4 shadow-sm transition hover:shadow-lg"
              >
                <div className="relative mb-4 h-40 w-full overflow-hidden rounded-md bg-gray-100">
                  {primaryImage ? (
                    <Image
                      src={primaryImage}
                      alt={store.nombre}
                      fill
                      className="object-cover"
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      unoptimized
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-400">Sin imagen</div>
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{store.nombre}</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {store.direccion || "Dirección no especificada"}
                    </p>
                    {store.telefono && <p className="mt-1 text-sm text-gray-500">📞 {store.telefono}</p>}
                    {store.correo && (
                      <p className="mt-1 truncate text-sm text-gray-500">✉️ {store.correo}</p>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <Link
                      href={`/stores/${store.id_negocio}`}
                      className="inline-flex items-center justify-center rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-600"
                    >
                      Visitar tienda
                    </Link>
                    <div className="flex items-center gap-1 text-sm text-yellow-500">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.402 8.168L12 18.896 4.664 23.165l1.402-8.168L.132 9.21l8.2-1.192z" />
                      </svg>
                      <span className="font-semibold">{rating}</span>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
