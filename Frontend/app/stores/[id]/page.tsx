"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api } from "../../../src/lib/api";
import StoreHeader from "../../../src/components/shop/stores/StoreHeader";
import StoreProductList from "../../../src/components/shop/stores/StoreProductList";
import StoreLoading from "../../../src/components/shop/stores/StoreLoading";
import NavbarStore from "../../../src/components/shop/navbarStore";
import StoreReviews from "../../../src/components/shop/stores/StoreReviews";
import { resolveProductImage } from "../../../src/lib/media";
import { useCart } from "../../../src/components/shop/CartContext";

type Product = {
  id_producto: number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  imagen?: string | null;
  imagen_url?: string | null;
  media?: Array<{ url?: string | null; principal?: boolean | null }> | null;
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

const moneyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function StorePage() {
  const params = useParams();
  const storeId = params.id as string;
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStore = async () => {
      if (!storeId) {
        setError("ID de tienda no valido");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await api.getBusinessById(storeId);
        if (!data.productos) {
          const productos = await api.getProducts({ id_negocio: storeId });
          data.productos = productos;
        }
        setStore(data);
      } catch (err: any) {
        console.error("Error al cargar tienda:", err);
        setError("No se pudo cargar la tienda");
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [storeId]);

  const productos = store?.productos ?? [];

  const categories = useMemo(() => {
    if (!productos.length) {
      return store?.categorias ?? [];
    }
    const all = new Set<string>();
    productos.forEach((product) => {
      const category = product.categoria || "Especialidades";
      all.add(category);
    });
    return Array.from(all).sort((a, b) => a.localeCompare(b, "es"));
  }, [productos, store?.categorias]);

  const averagePrice = useMemo(() => {
    if (!productos.length) return null;
    const sum = productos.reduce((acc, product) => acc + Number(product.precio ?? 0), 0);
    return sum / productos.length;
  }, [productos]);

  const topCategory = useMemo(() => {
    if (!productos.length) return categories[0] ?? null;
    const counts = new Map<string, number>();
    productos.forEach((product) => {
      const category = product.categoria || "Especialidades";
      counts.set(category, (counts.get(category) ?? 0) + 1);
    });
    let winner: string | null = null;
    let max = 0;
    counts.forEach((count, key) => {
      if (count > max) {
        max = count;
        winner = key;
      }
    });
    return winner;
  }, [productos, categories]);

  const metrics = useMemo(
    () => ({
      rating: store?.estrellas != null ? Number(store.estrellas) : null,
      productCount: productos.length,
      categories,
      averagePrice,
      topCategory,
    }),
    [store?.estrellas, productos.length, categories, averagePrice, topCategory]
  );

  const signatureProducts = useMemo(() => {
    if (!productos.length) return [] as Product[];
    return [...productos]
      .sort((a, b) => {
        const stockA = a.stock ?? 0;
        const stockB = b.stock ?? 0;
        if (stockA === stockB) {
          return Number(b.precio ?? 0) - Number(a.precio ?? 0);
        }
        return stockB - stockA;
      })
      .slice(0, 3);
  }, [productos]);

  if (loading) return <StoreLoading />;

  if (error || !store) {
    return (
      <div className="min-h-screen bg-[var(--fc-surface-base)] text-[var(--fc-text-primary)] dark:bg-[color:rgba(3,6,16,1)] dark:text-white">
        <NavbarStore />
        <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-6 text-center">
          <div className="mb-4 text-5xl" aria-hidden>
            :(
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{error || "Tienda no encontrada"}</h1>
          <p className="mt-3 text-sm text-gray-500 dark:text-white/70">
            La tienda que buscas no existe o no esta disponible.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-[var(--fc-brand-600)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--fc-brand-500)] dark:hover:bg-[var(--fc-brand-400)]"
          >
            Volver a la tienda en linea
          </Link>
        </div>
      </div>
    );
  }

  const businessId = store.id_negocio.toString();

  return (
    <div className="relative min-h-screen bg-[var(--fc-surface-base)] text-[var(--fc-text-primary)] dark:bg-[color:rgba(3,6,16,1)] dark:text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,var(--fc-brand-100)_0%,transparent_60%)] opacity-60 dark:bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18)_0%,transparent_65%)]" />
      <NavbarStore />
      <StoreHeader store={store} metrics={metrics} />

      <div className="relative z-10 -mt-16 pb-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr),320px]">
            <main className="space-y-10">
              <SignatureShowcase products={signatureProducts} storeId={businessId} storeName={store.nombre} />
              <StoreProductList productos={productos} storeId={businessId} storeName={store.nombre} />
              <StoreReviews storeId={businessId} />
            </main>

            <aside className="space-y-6">
              <ContactPanel store={store} />
              <InfoBadge metrics={metrics} />
              <SharePanel store={store} />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

const SignatureShowcase: React.FC<{ products: Product[]; storeId: string; storeName: string }> = ({ products, storeId, storeName }) => {
  const { addToCart } = useCart();
  if (!products.length) return null;

  const handleAdd = (product: Product) => {
    addToCart(
      {
        id: product.id_producto,
        nombre: product.nombre,
        precio: Number(product.precio ?? 0),
        imagen: resolveProductImage(product) ?? undefined,
        id_negocio: storeId,
      },
      1,
    );
  };

  return (
    <section className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-[0_24px_48px_-32px_rgba(15,118,110,0.35)] dark:border-white/10 dark:bg-[color:rgba(10,14,28,0.92)]">
      <header className="flex flex-col gap-2 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Favoritos de la casa</h2>
          <p className="text-sm text-gray-500 dark:text-white/70">Lo mas vendido del inventario en vivo</p>
        </div>
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--fc-brand-600)] dark:text-[var(--fc-brand-200)]">
          Curado automaticamente
        </span>
      </header>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {products.map((product) => {
          const imageUrl = resolveProductImage(product);
          return (
            <div
              key={product.id_producto}
              className="relative overflow-hidden rounded-2xl border border-[var(--fc-brand-100)] bg-gradient-to-br from-[var(--fc-brand-50)] via-white to-emerald-50 p-5 shadow-sm transition hover:-translate-y-0.5 dark:border-white/10 dark:from-[color:rgba(46,56,96,0.55)] dark:via-[color:rgba(17,24,39,0.75)] dark:to-[color:rgba(16,185,129,0.15)]"
            >
              <div className="relative mb-4 h-32 w-full overflow-hidden rounded-2xl bg-white/60 dark:bg-[color:rgba(15,23,42,0.65)]">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={product.nombre}
                    fill
                    className="object-cover"
                    sizes="(min-width: 768px) 220px, 100vw"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-[var(--fc-brand-500)] dark:text-[var(--fc-brand-200)]/80">
                    Imagen no disponible
                  </div>
                )}
                <span className="absolute right-4 top-4 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[var(--fc-brand-600)] dark:bg-[color:rgba(17,24,39,0.8)] dark:text-[var(--fc-brand-200)]">
                  {product.categoria || "Especial"}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-1 dark:text-white">{product.nombre}</h3>
              <p className="mt-2 text-sm text-gray-600 line-clamp-3 dark:text-white/70">
                {product.descripcion || "Este producto esta ganando popularidad entre los clientes."}
              </p>
              <div className="mt-6 flex items-center justify-between text-sm text-gray-500 dark:text-white/60">
                <span className="font-semibold text-[var(--fc-brand-700)] dark:text-[var(--fc-brand-200)]">
                  {moneyFormatter.format(Number(product.precio ?? 0))}
                </span>
                <span>Stock: {product.stock ?? 0}</span>
              </div>
              <button
                type="button"
                onClick={() => handleAdd(product)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--fc-brand-600)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--fc-brand-500)] focus:outline-none focus:ring-2 focus:ring-[var(--fc-brand-200)] focus:ring-offset-1 dark:hover:bg-[var(--fc-brand-400)]"
              >
                Agregar al carrito
              </button>
              <span className="mt-2 block text-xs text-gray-400 dark:text-white/50">{storeName}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const ContactPanel: React.FC<{ store: Store }> = ({ store }) => {
  const address = store.direccion;
  const encodedAddress = address ? `https://maps.google.com/?q=${encodeURIComponent(address)}` : null;

  return (
    <section className="rounded-3xl border border-white/70 bg-white/95 p-5 shadow-sm dark:border-white/10 dark:bg-[color:rgba(15,19,34,0.92)]">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Contacto directo</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-white/70">Conecta con el equipo antes de tu visita.</p>
      <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-white/70">
        {address && (
          <div className="rounded-2xl bg-gray-50 px-4 py-3 dark:bg-white/5">
            <p className="font-semibold text-gray-900 dark:text-white">Ubicacion</p>
            <p className="text-gray-500 dark:text-white/70">{address}</p>
            {encodedAddress && (
              <a
                href={encodedAddress}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex text-xs font-semibold text-[var(--fc-brand-600)] hover:text-[var(--fc-brand-500)] dark:text-[var(--fc-brand-200)] dark:hover:text-[var(--fc-brand-100)]"
              >
                Abrir en Maps ↗
              </a>
            )}
          </div>
        )}
        {store.telefono && (
          <div className="rounded-2xl bg-gray-50 px-4 py-3 dark:bg-white/5">
            <p className="font-semibold text-gray-900 dark:text-white">Telefono</p>
            <a
              href={`tel:${store.telefono}`}
              className="text-[var(--fc-brand-600)] hover:text-[var(--fc-brand-500)] dark:text-[var(--fc-brand-200)] dark:hover:text-[var(--fc-brand-100)]"
            >
              {store.telefono}
            </a>
          </div>
        )}
        <div className="rounded-2xl bg-gray-50 px-4 py-3 dark:bg-white/5">
          <p className="font-semibold text-gray-900 dark:text-white">Correo electronico</p>
          <a
            href={`mailto:${store.correo ?? "contacto@filacero.com"}`}
            className="text-[var(--fc-brand-600)] hover:text-[var(--fc-brand-500)] dark:text-[var(--fc-brand-200)] dark:hover:text-[var(--fc-brand-100)]"
          >
            {store.correo ?? "contacto@filacero.com"}
          </a>
        </div>
      </div>
    </section>
  );
};

const InfoBadge: React.FC<{
  metrics: {
    productCount: number;
    averagePrice: number | null;
    categories: string[];
    topCategory: string | null;
  };
}> = ({ metrics }) => (
  <section className="rounded-3xl border border-white/70 bg-gradient-to-br from-emerald-500/10 via-white to-white/80 p-5 shadow-sm dark:border-white/10 dark:from-[color:rgba(21,94,117,0.28)] dark:via-[color:rgba(15,23,42,0.8)] dark:to-[color:rgba(15,118,110,0.15)]">
    <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--fc-brand-600)] dark:text-[var(--fc-brand-200)]">
      Resumen del catalogo
    </h3>
    <dl className="mt-4 space-y-3">
      <div className="flex items-center justify-between">
        <dt className="text-sm text-gray-500 dark:text-white/60">Productos activos</dt>
        <dd className="text-base font-semibold text-gray-900 dark:text-white">{metrics.productCount}</dd>
      </div>
      <div className="flex items-center justify-between">
        <dt className="text-sm text-gray-500 dark:text-white/60">Categorias</dt>
        <dd className="text-base font-semibold text-gray-900 dark:text-white">{metrics.categories.length}</dd>
      </div>
      <div className="flex items-center justify-between">
        <dt className="text-sm text-gray-500 dark:text-white/60">Favorito</dt>
        <dd className="text-base font-semibold text-gray-900 dark:text-white">{metrics.topCategory ?? "Por definir"}</dd>
      </div>
      <div className="flex items-center justify-between">
        <dt className="text-sm text-gray-500 dark:text-white/60">Ticket promedio</dt>
        <dd className="text-base font-semibold text-gray-900 dark:text-white">
          {metrics.averagePrice != null ? moneyFormatter.format(metrics.averagePrice) : "—"}
        </dd>
      </div>
    </dl>
  </section>
);

const SharePanel: React.FC<{ store: Store }> = ({ store }) => (
  <section className="rounded-3xl border border-white/70 bg-white/95 p-5 text-sm text-gray-600 shadow-sm dark:border-white/10 dark:bg-[color:rgba(15,19,34,0.92)] dark:text-white/70">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Comparte la tienda</h3>
    <p className="mt-2 text-sm text-gray-500 dark:text-white/70">
      Invita a tus clientes a pre-ordenar desde la tienda digital y evita filas en mostrador.
    </p>
    <div className="mt-4 flex flex-col gap-2">
      <button
        type="button"
        onClick={() => {
          if (typeof window !== "undefined") {
            navigator.clipboard
              .writeText(window.location.href)
              .then(() => alert("Enlace copiado"))
              .catch(() => alert("No se pudo copiar el enlace"));
          }
        }}
        className="inline-flex items-center justify-center rounded-lg bg-[var(--fc-brand-600)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--fc-brand-500)] focus:outline-none focus:ring-2 focus:ring-[var(--fc-brand-200)] focus:ring-offset-1 dark:hover:bg-[var(--fc-brand-400)]"
      >
        Copiar enlace
      </button>
      <span className="text-xs text-gray-400 dark:text-white/50">{store.nombre}</span>
    </div>
  </section>
);