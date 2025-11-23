"use client";

import React from "react";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api, BusinessSummary, BusinessProductSummary } from "../../../lib/api";
import { resolveMediaUrl, resolveProductImage } from "../../../lib/media";

const formatNumber = (value: number) =>
  new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 }).format(value ?? 0);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric" }).format(date);
};

const BusinessShowcase: React.FC = () => {
  const [businesses, setBusinesses] = useState<BusinessSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getPublicBusinesses();
        if (!active) return;
        setBusinesses(data);
      } catch (err) {
        console.error("[BusinessShowcase]", err);
        if (!active) return;
        setError("No pudimos cargar los negocios disponibles.");
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const stateView = useMemo(() => {
    if (loading) {
      return (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={`skeleton-${idx}`}
              className="flex flex-col rounded-3xl border border-gray-100 bg-white/70 p-6 shadow-sm animate-pulse"
            >
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-gray-200" />
                  <div className="h-3 w-1/2 rounded bg-gray-200" />
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((slot) => (
                  <div key={slot} className="space-y-2">
                    <div className="h-3 w-1/2 rounded bg-gray-200" />
                    <div className="h-4 w-2/3 rounded bg-gray-200" />
                  </div>
                ))}
              </div>
              <div className="mt-6 space-y-3">
                {[1, 2, 3].map((slot) => (
                  <div key={slot} className="h-12 rounded-2xl border border-gray-100 bg-gray-100" />
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-6 text-sm text-yellow-700">
          {error}
        </div>
      );
    }

    if (!businesses.length) {
      return (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white/60 p-10 text-center">
          <div className="text-4xl">🏪</div>
          <h3 className="mt-3 text-lg font-semibold text-gray-900">Aún no hay negocios publicados</h3>
          <p className="mt-2 text-sm text-gray-500">
            En cuanto los negocios activen su catálogo los verás listados aquí con sus productos destacados.
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {businesses.map((business) => {
          const logoUrl = resolveMediaUrl(business.logo_url);
          const heroUrl = resolveMediaUrl(business.hero_image_url);
          return (
          <article
            key={business.id_negocio}
            className="group flex h-full flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white/80 p-6 shadow-sm transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl"
          >
            <header className="flex items-start gap-4">
              <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-brand-50 ring-1 ring-brand-100">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={business.nombre}
                    fill
                    className="object-cover"
                    sizes="56px"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-brand-600">
                    {business.nombre.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-lg font-semibold text-gray-900">{business.nombre}</h3>
                {business.direccion && (
                  <p className="mt-1 truncate text-sm text-gray-500">{business.direccion}</p>
                )}
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                  <div>
                    <dt className="uppercase tracking-wide">Desde</dt>
                    <dd className="font-medium text-gray-700">{formatDate(business.fecha_registro)}</dd>
                  </div>
                  <div>
                    <dt className="uppercase tracking-wide">Contacto</dt>
                    <dd className="font-medium text-gray-700">
                      {business.telefono || business.correo || "No definido"}
                    </dd>
                  </div>
                </dl>
              </div>
            </header>

            {heroUrl && (
              <div className="relative mt-5 h-32 overflow-hidden rounded-2xl border border-gray-100">
                <Image
                  src={heroUrl}
                  alt={`Portada de ${business.nombre}`}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1280px) 320px, (min-width: 1024px) 280px, 100vw"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white via-white/10 to-transparent" />
              </div>
            )}

            {business.categorias.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {business.categorias.slice(0, 4).map((categoria) => (
                  <span
                    key={categoria}
                    className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
                  >
                    {categoria}
                  </span>
                ))}
                {business.categorias.length > 4 && (
                  <span className="text-xs text-gray-500">
                    +{business.categorias.length - 4} más
                  </span>
                )}
              </div>
            )}

            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <dt className="font-medium text-gray-500">Productos activos</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {formatNumber(business.resumen.totalProductos)}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Pedidos registrados</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {formatNumber(business.resumen.totalPedidos)}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Valoración promedio</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {business.resumen.promedioEstrellas !== null
                    ? business.resumen.promedioEstrellas.toFixed(1)
                    : "—"}
                  <span className="ml-1 text-xs text-gray-400">
                    ({formatNumber(business.resumen.totalResenas)} reseñas)
                  </span>
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-500">Ingresos históricos</dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {formatCurrency(business.resumen.ingresosAcumulados)}
                </dd>
              </div>
            </dl>

            <section className="mt-6 rounded-2xl border border-gray-100 bg-white/70 p-4">
              <header className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">Productos destacados</h4>
                <span className="text-xs font-medium text-brand-600">
                  {business.productosDestacados.length} items
                </span>
              </header>

              {business.productosDestacados.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {business.productosDestacados.map((product: BusinessProductSummary) => {
                    const productImage = resolveProductImage(product);
                    return (
                      <li
                        key={`${business.id_negocio}-${product.id_producto}`}
                        className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-3 py-2"
                      >
                        {productImage && (
                          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-brand-50">
                            <Image
                              src={productImage}
                              alt={product.nombre}
                              fill
                              className="object-cover"
                              sizes="48px"
                              unoptimized
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900">{product.nombre}</p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                            {(product.categoria ?? "Sin categoría") + " · Stock " + product.stock}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-brand-600">
                          {formatCurrency(product.precio)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-gray-500">
                  Este negocio aún no ha publicado productos en la tienda digital.
                </p>
              )}
            </section>

            <div className="mt-6 flex justify-end">
              <Link
                href={`/stores/${business.id_negocio}`}
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--fc-brand-600)] px-5 py-2 text-sm font-semibold text-white shadow-sm transition group-hover:bg-[var(--fc-brand-500)]"
              >
                Visitar tienda
              </Link>
            </div>
          </article>
        );
        })}
      </div>
    );
  }, [businesses, error, loading]);

  return (
    <section className="mt-14 rounded-3xl border border-white/40 bg-white/70 px-6 py-10 shadow-[0_20px_55px_-35px_rgba(18,52,77,0.45)] backdrop-blur">
      <header className="mx-auto mb-8 max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-brand-600">
          Ecosistema local
        </span>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-900">
          Negocios que ya venden con FilaCero
        </h2>
        <p className="mt-3 text-base text-gray-600">
          Descubre la foto completa de cada tienda: catálogo disponible, desempeño de ventas y los productos que más se llevan los clientes.
        </p>
      </header>
      {stateView}
    </section>
  );
};

export default BusinessShowcase;
