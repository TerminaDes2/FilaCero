"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { resolveMediaUrl } from "../../../lib/media";

export interface StoreMetrics {
  rating: number | null;
  productCount: number;
  categories: string[];
  averagePrice: number | null;
  topCategory: string | null;
}

interface StoreHeaderProps {
  store: any;
  metrics: StoreMetrics;
}

const priceFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

function formatPrice(value: number | null) {
  if (value == null || Number.isNaN(value)) return "—";
  return priceFormatter.format(value);
}

export default function StoreHeader({ store, metrics }: StoreHeaderProps) {
  const heroImage = resolveMediaUrl(store.hero_image_url || (store as any).heroImageUrl || store.logo || store.logo_url || null);
  const logoImage = resolveMediaUrl(store.logo || store.logo_url || null);
  const averageTicket = formatPrice(metrics.averagePrice);

  return (
    <header className="relative overflow-hidden">
      {heroImage && (
        <Image
          src={heroImage}
          alt={`Portada de ${store.nombre}`}
          fill
          priority
          className="absolute inset-0 h-full w-full object-cover opacity-70"
          sizes="100vw"
          unoptimized
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/55" />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 text-sm text-brand-600">
          <Link href="/shop" className="inline-flex items-center gap-2 text-brand-600/80 transition hover:text-brand-700">
            <span className="hidden sm:inline">Tienda en línea</span>
            <span className="text-brand-400">/</span>
            <span className="font-medium">{store.nombre}</span>
          </Link>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.25fr,0.75fr] lg:items-center">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-100 via-white to-emerald-50 shadow-lg">
                {logoImage ? (
                  <Image
                    src={logoImage}
                    alt={store.nombre}
                    fill
                    className="object-cover"
                    sizes="96px"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-semibold text-brand-600">
                    {store.nombre?.slice(0, 2)?.toUpperCase() ?? "FC"}
                  </div>
                )}
              </div>
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-brand-600">
                  Negocio verificado
                </span>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-gray-900 sm:text-[3.1rem]">
                  {store.nombre}
                </h1>
              </div>
            </div>

            <p className="max-w-2xl text-lg leading-relaxed text-gray-700">
              {store.descripcion ||
                "Este negocio todavía está preparando su historia. Mientras tanto, explora su menú disponible y descubre qué lo hace único."}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {metrics.rating != null && (
                <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-yellow-600 shadow-sm">
                  ⭐ {metrics.rating.toFixed(1)}{' '}
                  <span className="text-gray-500">/ 5</span>
                </div>
              )}
              {metrics.categories.slice(0, 6).map((category) => (
                <span
                  key={category}
                  className="inline-flex items-center gap-2 rounded-full border border-brand-200/60 bg-white/80 px-3 py-1 text-xs font-medium text-brand-600"
                >
                  {category}
                </span>
              ))}
              {metrics.categories.length > 6 && (
                <span className="text-sm text-gray-500">
                  +{metrics.categories.length - 6} categorías
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="#menu"
                className="inline-flex items-center justify-center rounded-xl bg-[var(--fc-brand-600)] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-[rgba(18,101,101,0.25)] transition hover:bg-[var(--fc-brand-500)]"
              >
                Ver menú digital
              </Link>
              <a
                href={`mailto:${store.correo ?? 'contacto@filacero.com'}`}
                className="inline-flex items-center justify-center rounded-xl border border-brand-200 bg-white px-5 py-3 text-sm font-semibold text-brand-700 transition hover:border-brand-300"
              >
                Contactar negocio
              </a>
            </div>
          </div>

          <div className="grid gap-3 rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl backdrop-blur">
            <MetricRow label="Productos activos" value={metrics.productCount.toString()} hint="Actualizados desde el POS" />
            <MetricRow
              label="Ticket promedio"
              value={averageTicket}
              hint="Basado en los precios actuales"
            />
            <MetricRow
              label="Categoría destacada"
              value={metrics.topCategory ?? 'Por descubrir'}
              hint="Mayor número de publicaciones"
            />
            <MetricRow
              label="Última actualización"
              value={formatLastUpdated(store.fecha_registro)}
              hint="Sincronizado con el panel de negocio"
            />
          </div>
        </div>
      </div>
    </header>
  );
}

function formatLastUpdated(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-MX', { month: 'long', day: 'numeric', year: 'numeric' });
}

const MetricRow: React.FC<{ label: string; value: string; hint: string }> = ({ label, value, hint }) => (
  <div className="flex items-start justify-between gap-4 rounded-2xl bg-white/70 px-4 py-3 shadow-sm">
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-500">{label}</p>
      <p className="text-sm text-gray-500">{hint}</p>
    </div>
    <span className="text-lg font-semibold text-gray-900">{value}</span>
  </div>
);
