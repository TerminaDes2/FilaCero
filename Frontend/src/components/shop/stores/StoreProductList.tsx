"use client";
import React, { useMemo } from "react";
import Image from "next/image";
import { resolveProductImage } from "../../../lib/media";
import { useCart } from "../CartContext";

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

function formatPrice(value: number | string | null | undefined) {
  if (value === null || value === undefined) return "-";
  const numeric = typeof value === "number" ? value : Number.parseFloat(String(value));
  if (Number.isNaN(numeric)) return "-";
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

type StoreProductListProps = {
  productos: any[];
  storeId: string | number;
  storeName?: string | null;
};

export default function StoreProductList({ productos, storeId, storeName }: StoreProductListProps) {
  const { addToCart } = useCart();

  const categoryMap = useMemo(() => groupByCategory(productos), [productos]);
  const categories = useMemo(
    () => Array.from(categoryMap.keys()).sort((a, b) => a.localeCompare(b, "es")),
    [categoryMap],
  );

  const handleAddToCart = (product: any) => {
    const price = typeof product.precio === "number" ? product.precio : Number(product.precio ?? 0);
    if (!Number.isFinite(price)) return;
    addToCart(
      {
        id: product.id_producto ?? product.id ?? product.nombre,
        nombre: product.nombre ?? "Producto sin nombre",
        precio: price,
        imagen: resolveProductImage(product) ?? undefined,
        id_negocio: storeId,
      },
      1,
    );
  };

  if (!productos.length) {
    return (
      <section
        id="menu"
        className="rounded-3xl border border-dashed border-[var(--fc-brand-200)]/60 bg-white/80 p-10 text-center text-[var(--fc-text-primary)] dark:border-white/15 dark:bg-[color:rgba(10,15,30,0.75)] dark:text-white"
      >
        <div className="mb-4 text-6xl">📦</div>
        <h2 className="text-2xl font-semibold">Menu en preparacion</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-white/70">
          Este negocio aun no ha publicado productos en su catalogo digital.
        </p>
      </section>
    );
  }

  return (
    <section id="menu" className="space-y-8 text-[var(--fc-text-primary)] dark:text-white">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Menu digital</h2>
          <p className="text-sm text-gray-500 dark:text-white/60">
            {productos.length} productos publicados · Actualizado en tiempo real
          </p>
        </div>
      </div>

      {categories.map((category) => {
        const items = sortByAvailability(categoryMap.get(category) ?? []);
        return (
          <article
            key={category}
            className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-[0_20px_45px_-35px_rgba(15,118,110,0.45)] dark:border-white/10 dark:bg-[color:rgba(9,13,26,0.92)]"
          >
            <header className="flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{category}</h3>
                <p className="text-sm text-gray-500 dark:text-white/60">
                  {items.length} {items.length === 1 ? "platillo" : "platillos"} disponibles
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--fc-brand-600)] dark:text-[var(--fc-brand-200)]">
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--fc-brand-50)] px-3 py-1 font-medium dark:bg-[color:rgba(55,48,163,0.18)]">
                  Stock promedio
                  <strong className="text-[var(--fc-brand-700)] dark:text-[var(--fc-brand-200)]">
                    {Math.max(...items.map((item) => Number(item.stock ?? 0)))} uds
                  </strong>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
                  Ticket desde {formatPrice(items[0]?.precio ?? null)}
                </span>
              </div>
            </header>

            <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((product) => (
                <ProductCard
                  key={product.id_producto ?? product.nombre}
                  product={product}
                  onAdd={() => handleAddToCart(product)}
                  storeName={storeName}
                />
              ))}
            </div>
          </article>
        );
      })}
    </section>
  );
}

const ProductCard: React.FC<{ product: any; onAdd: () => void; storeName?: string | null }> = ({ product, onAdd, storeName }) => {
  const price = formatPrice(product.precio);
  const stock = product.stock ?? 0;
  const availabilityLabel = stock > 10 ? "Disponible" : stock > 0 ? "Ultimas unidades" : "Agotado";
  const availabilityTone =
    stock > 10
      ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/15 dark:text-emerald-200"
      : stock > 0
        ? "text-amber-600 bg-amber-50 dark:bg-amber-500/20 dark:text-amber-100"
        : "text-rose-600 bg-rose-50 dark:bg-rose-500/20 dark:text-rose-100";
  const imageUrl = resolveProductImage(product);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-[color:rgba(11,15,28,0.9)]">
      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-[var(--fc-brand-50)] via-white to-emerald-50 dark:from-[color:rgba(37,47,77,0.7)] dark:via-[color:rgba(17,24,39,0.6)] dark:to-[color:rgba(13,148,136,0.35)]">
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
          <div className="flex h-full w-full items-center justify-center text-sm text-[var(--fc-brand-500)] dark:text-[var(--fc-brand-200)]/80">
            Imagen proximamente
          </div>
        )}
        <span className={`absolute left-4 top-4 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${availabilityTone}`}>
          {availabilityLabel}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h4 className="text-lg font-semibold text-gray-900 line-clamp-1 dark:text-white">{product.nombre}</h4>
          <p className="mt-1 text-sm text-gray-500 line-clamp-2 dark:text-white/70">
            {product.descripcion || "Sin descripcion por el momento."}
          </p>
        </div>
        <div className="mt-auto flex items-center justify-between text-sm">
          <div className="text-lg font-semibold text-[var(--fc-brand-700)] dark:text-[var(--fc-brand-200)]">{price}</div>
          <span className="text-xs text-gray-400 dark:text-white/50">Stock: {stock}</span>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--fc-brand-600)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--fc-brand-500)] focus:outline-none focus:ring-2 focus:ring-[var(--fc-brand-200)] focus:ring-offset-1 dark:hover:bg-[var(--fc-brand-400)] dark:focus:ring-[var(--fc-brand-300)]"
        >
          Agregar al carrito
        </button>
        {storeName && (
          <span className="text-xs text-gray-400 dark:text-white/50">{storeName}</span>
        )}
      </div>
    </div>
  );
};
