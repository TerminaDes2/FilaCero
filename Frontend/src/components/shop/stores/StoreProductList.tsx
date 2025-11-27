"use client";
import React from "react";
import Image from "next/image";
import { resolveProductImage } from "../../../lib/media";

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

function formatPrice(value: number | string | null | undefined) {
  if (value === null || value === undefined) return "—";
  const numeric = typeof value === "number" ? value : Number.parseFloat(String(value));
  if (Number.isNaN(numeric)) return "—";
  return currencyFormatter.format(numeric);
}

function groupByCategory(products: any[]) {
  const map = new Map<string, any[]>();
  for (const product of products) {
    const category = product.categoria || product.category || "Especialidades";
    if (!map.has(category)) {
      map.set(category, []);
    }
    map.get(category)!.push(product);
  }
  return map;
}

function sortByAvailability(products: any[]) {
  return [...products].sort((a, b) => {
    const stockA = a.stock ?? 0;
    const stockB = b.stock ?? 0;
    if (stockA === stockB) {
      const priceA = typeof a.precio === "number" ? a.precio : Number(a.precio ?? 0);
      const priceB = typeof b.precio === "number" ? b.precio : Number(b.precio ?? 0);
      return priceA - priceB;
    }
    return stockB - stockA;
  });
}

export default function StoreProductList({ productos }: { productos: any[] }) {
  if (!productos.length) {
    return (
      <section id="menu" className="rounded-3xl border border-dashed border-brand-200/60 bg-white/80 p-10 text-center">
        <div className="mb-4 text-6xl">📦</div>
        <h2 className="text-2xl font-semibold text-gray-900">Menú en preparación</h2>
        <p className="mt-2 text-sm text-gray-500">
          Este negocio aún no ha publicado productos en su catálogo digital.
        </p>
      </section>
    );
  }

  const categoryMap = groupByCategory(productos);
  const categories = Array.from(categoryMap.keys()).sort((a, b) => a.localeCompare(b, "es"));

  return (
    <section id="menu" className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Menú digital</h2>
          <p className="text-sm text-gray-500">{productos.length} productos publicados · Actualizado en tiempo real</p>
        </div>
      </div>

      {categories.map((category) => {
        const items = sortByAvailability(categoryMap.get(category) ?? []);
        return (
          <article key={category} className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-[0_20px_45px_-35px_rgba(15,118,110,0.45)]">
            <header className="flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{category}</h3>
                <p className="text-sm text-gray-500">{items.length} {items.length === 1 ? "platillo" : "platillos"} disponibles</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-brand-600">
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 font-medium">
                  Stock promedio{' '}
                  <strong className="text-brand-700">{Math.max(...items.map((item) => Number(item.stock ?? 0)))} uds</strong>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
                  Ticket desde {formatPrice(items[0]?.precio ?? null)}
                </span>
              </div>
            </header>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((product) => (
                <ProductCard key={product.id_producto ?? product.nombre} product={product} />
              ))}
            </div>
          </article>
        );
      })}
    </section>
  );
}

const ProductCard: React.FC<{ product: any }> = ({ product }) => {
  const price = formatPrice(product.precio);
  const stock = product.stock ?? 0;
  const availabilityLabel = stock > 10 ? "Disponible" : stock > 0 ? "Últimas unidades" : "Agotado";
  const availabilityTone =
    stock > 10 ? "text-emerald-600 bg-emerald-50" : stock > 0 ? "text-amber-600 bg-amber-50" : "text-rose-600 bg-rose-50";
  const imageUrl = resolveProductImage(product);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-brand-50 via-white to-emerald-50">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={product.nombre}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(min-width: 1280px) 240px, (min-width: 768px) 33vw, 100vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-brand-500">
            Imagen próximamente
          </div>
        )}
        <span className={`absolute left-4 top-4 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${availabilityTone}`}>
          {availabilityLabel}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 line-clamp-1">{product.nombre}</h4>
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">{product.descripcion || "Sin descripción por el momento."}</p>
        </div>
        <div className="mt-auto flex items-center justify-between">
          <div className="text-lg font-semibold text-brand-700">{price}</div>
          <span className="text-xs text-gray-400">Stock: {stock}</span>
        </div>
      </div>
    </div>
  );
};
