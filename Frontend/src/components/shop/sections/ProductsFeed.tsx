"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { api } from "../../../lib/api";
import { resolveProductImage } from "../../../lib/media";
import { useCart } from "../CartContext";

type Media = { url?: string; principal?: boolean; tipo?: string | null };
type Product = {
  id_producto: string;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  category?: string | null;
  id_categoria?: string | null;
  imagen_url?: string | null;
  media?: Media[];
  popularity?: number;
  stock?: number | null;
};

type CatalogCategorySnapshot = {
  id: string | null;
  nombre: string;
  totalProductos: number;
  value: string;
};

function principalImage(p: Product): string | undefined {
  return resolveProductImage(p);
}

function priceLabel(v: number) {
  try {
    return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(v);
  } catch {
    return `$${Number(v ?? 0).toFixed(2)}`;
  }
}

function buildCategorySnapshot(products: Product[]): CatalogCategorySnapshot[] {
  const bucket = new Map<string, { id: string | null; nombre: string; total: number }>();
  for (const product of products) {
    const id = product.id_categoria ?? null;
    const key = id ?? "__none__";
    const nombre = product.category?.trim() || "Sin categoría";
    const existing = bucket.get(key);
    if (existing) {
      existing.total += 1;
    } else {
      bucket.set(key, { id, nombre, total: 1 });
    }
  }

  return Array.from(bucket.values())
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.nombre.localeCompare(b.nombre);
    })
    .map((item) => ({
      id: item.id,
      nombre: item.nombre,
      totalProductos: item.total,
      value: item.id ?? "__none__",
    }));
}

export default function ProductsFeed() {
  const params = useSearchParams();
  const { addToCart } = useCart();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(12);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleRefresh = () => setRefreshKey((value) => value + 1);
    window.addEventListener("shop:catalog-refresh", handleRefresh);
    return () => window.removeEventListener("shop:catalog-refresh", handleRefresh);
  }, []);

  // Fetch products when filters change
  useEffect(() => {
    let active = true;
    const search = params.get("search") ?? undefined;
    const status = params.get("status") ?? undefined;
    const categoria = params.get("categoria") ?? undefined;
    setLoading(true);
    setVisible(12);

    api
      .getProducts({ search, status, categoria })
      .then((data) => {
        if (!active) return;
        const normalized = (data as Product[]) ?? [];
        setItems(normalized);
        setError(null);
        try {
          const snapshot = buildCategorySnapshot(normalized);
          window.dispatchEvent(new CustomEvent<CatalogCategorySnapshot[]>("shop:categories-snapshot", { detail: snapshot }));
        } catch (eventError) {
          console.debug("[ProductsFeed] No se pudo emitir snapshot de categorías", eventError);
        }
      })
      .catch((e: any) => {
        if (!active) return;
        setError(e?.message ?? "Error al cargar productos");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [params, refreshKey]);

  // Infinite scroll sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const ob = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible((v) => v + 12);
          }
        }
      },
      { rootMargin: "400px 0px 400px 0px" },
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, [sentinelRef.current]);

  const cards = useMemo(() => {
    const offers = params.get("offers") === "1";
    const sortKey = params.get("sort") ?? "relevancia";
    let arr = [...items];

    if (offers) {
      const hasOffer = (s?: string | null) => (s ? /ofert|promo/i.test(s) : false);
      arr = arr.filter((p) => hasOffer(p.nombre) || hasOffer(p.descripcion));
    }

    arr.sort((a, b) => {
      if (sortKey === "price-asc") {
        return a.precio - b.precio;
      }
      if (sortKey === "price-desc") {
        return b.precio - a.precio;
      }
      if (sortKey === "stock") {
        const stockA = typeof a.stock === "number" ? a.stock : -1;
        const stockB = typeof b.stock === "number" ? b.stock : -1;
        if (stockB !== stockA) return stockB - stockA;
        return (b.popularity ?? 0) - (a.popularity ?? 0);
      }
      const pa = a.popularity ?? 0;
      const pb = b.popularity ?? 0;
      if (pb !== pa) return pb - pa;
      return a.nombre.localeCompare(b.nombre);
    });

    return arr.map((p) => {
      const cover = principalImage(p);
      const stockLabel =
        typeof p.stock === "number"
          ? p.stock > 0
            ? `${p.stock} en inventario`
            : "Sin stock"
          : "Stock por confirmar";

      return {
        id: p.id_producto,
        name: p.nombre,
        cover,
        category: p.category ?? undefined,
        price: Number(p.precio ?? 0),
        stock: p.stock,
        description: p.descripcion ?? "",
        stockLabel,
        data: p,
      };
    });
  }, [items, params]);

  const handleAdd = useCallback(
    (card: (typeof cards)[number]) => {
      if (typeof card.stock === "number" && card.stock <= 0) {
        return;
      }

      addToCart(
        {
          id: card.id,
          nombre: card.name,
          precio: card.price,
          imagen: card.cover,
        },
        1,
      );
    },
    [addToCart],
  );

  if (loading) {
    return (
      <section className="mt-6" aria-label="Productos">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-3xl bg-slate-100 dark:bg-white/8"
            />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-6" aria-label="Productos">
        <div className="text-sm text-red-600">{error}</div>
      </section>
    );
  }

  if (cards.length === 0) {
    return (
      <section className="mt-6" aria-label="Productos">
        <div className="text-sm text-[var(--fc-text-secondary)] dark:text-white/60">
          No hay productos disponibles.
        </div>
      </section>
    );
  }

  return (
    <section className="mt-6" aria-label="Productos">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.slice(0, visible).map((c) => {
          const isOutOfStock = typeof c.stock === "number" && c.stock <= 0;

          return (
            <article
              key={c.id}
              className="rounded-3xl border border-[var(--fc-border-soft)] bg-white/95 shadow-sm transition hover:shadow-md dark:border-white/12 dark:bg-[color:rgba(15,23,42,0.82)] dark:shadow-[0_28px_60px_-45px_rgba(10,15,35,0.9)] dark:hover:shadow-[0_32px_72px_-40px_rgba(12,20,50,0.85)]"
            >
              <div className="relative h-44 overflow-hidden rounded-t-3xl bg-slate-100 dark:bg-white/8">
                {c.cover ? (
                  <Image src={c.cover} alt={c.name} fill className="object-cover" sizes="(min-width: 1280px) 25vw, (min-width: 640px) 40vw, 100vw" unoptimized />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-sm text-slate-400 dark:text-white/40">Sin imagen</div>
                )}
                {c.category && (
                  <span className="absolute left-3 top-3 inline-flex items-center rounded-full border border-white/60 bg-white/90 px-2 py-1 text-[11px] font-medium text-slate-700 shadow-sm dark:border-white/15 dark:bg-white/10 dark:text-[var(--fc-text-primary)]">
                    {c.category}
                  </span>
                )}
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-[var(--fc-text-strong)] dark:text-white">
                    {c.name}
                  </h3>
                  <span className="whitespace-nowrap text-sm font-semibold text-[var(--fc-text-strong)] dark:text-white">
                    {priceLabel(c.price)}
                  </span>
                </div>
                {c.description && (
                  <p className="line-clamp-2 text-[12px] leading-relaxed text-[var(--fc-text-secondary)] dark:text-white/70">
                    {c.description}
                  </p>
                )}
                <div className="flex items-center justify-between gap-3 pt-1">
                  <span className="inline-flex items-center rounded-full border border-slate-200/80 bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600 dark:border-white/18 dark:bg-[color:rgba(148,163,184,0.16)] dark:text-white/80">
                    {c.stockLabel}
                  </span>
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    aria-disabled={isOutOfStock}
                    onClick={() => handleAdd(c)}
                    className={`inline-flex items-center justify-center rounded-full px-4 py-1.5 text-[12px] font-semibold shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fc-brand-300)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 ${
                      isOutOfStock
                        ? "cursor-not-allowed bg-slate-200 text-slate-500 dark:bg-white/8 dark:text-white/35"
                        : "bg-[var(--fc-brand-600)] text-white hover:bg-[var(--fc-brand-500)] dark:bg-[var(--fc-brand-500)] dark:hover:bg-[var(--fc-brand-400)]"
                    }`}
                  >
                    {isOutOfStock ? "Sin stock" : "Añadir"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <div ref={sentinelRef} />
    </section>
  );
}
