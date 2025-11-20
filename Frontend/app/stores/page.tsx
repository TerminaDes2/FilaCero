"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "../../src/lib/api";
import StoreHeader from "../../src/components/shop/stores/StoreHeader";
import StoreSidebar from "../../src/components/shop/stores/StoreSidebar";
import StoreProductList from "../../src/components/shop/stores/StoreProductList";
import StoreLoading from "../../src/components/shop/stores/StoreLoading";
import NavbarStore from "../../src/components/shop/navbarStore";
type Product = {
  id_producto: number;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  imagen?: string | null;
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

export default function StorePage() {
  const params = useParams();
  const storeId = params.id as string;
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStore = async () => {
      if (!storeId) return setError("ID de tienda no válido");

      try {
        setLoading(true);
        const data = await api.getBusinessById(storeId);

        if (!data.productos) {
          const productos = await api.getProducts({ id_negocio: storeId });
          data.productos = productos;
        }

        setStore(data);
      } catch (err: any) {
        console.error("❌ Error al cargar tienda:", err);
        setError("No se pudo cargar la tienda");
      } finally {
        setLoading(false);
      }
    };

    fetchStore();
  }, [storeId]);

  if (loading)
    return (
      <>
        <NavbarStore />
        <StoreLoading />
      </>
    );

  if (error || !store)
    return (
      <>
        <NavbarStore />
        <div className="min-h-screen bg-gray-50 pt-16">
          <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 text-6xl">😞</div>
            <h1 className="mb-4 text-2xl font-bold">{error || "Tienda no encontrada"}</h1>
            <p className="mb-6 text-gray-600">La tienda que buscas no existe o no está disponible.</p>
            <Link
              href="/shop"
              className="rounded-lg bg-green-500 px-6 py-3 font-medium text-white transition hover:bg-green-600"
            >
              Volver a tiendas
            </Link>
          </div>
        </div>
      </>
    );

  return (
    <>
      <NavbarStore />
      <div className="min-h-screen bg-gray-50 pt-16">
        <StoreHeader store={store} />
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-8 lg:grid-cols-4">
          <StoreSidebar store={store} />
          <StoreProductList productos={store.productos || []} />
        </div>
      </div>
    </>
  );
}
