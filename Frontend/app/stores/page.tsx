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

  if (loading) return <StoreLoading />;
  if (error || !store)
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex flex-col items-center justify-center text-center px-6">
        <div className="text-6xl mb-4">😞</div>
        <h1 className="text-2xl font-bold mb-4">{error || "Tienda no encontrada"}</h1>
        <p className="text-gray-600 mb-6">
          La tienda que buscas no existe o no está disponible.
        </p>
        <Link
          href="/shop"
          className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
        >
          Volver a tiendas
        </Link>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <StoreHeader store={store} />
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <StoreSidebar store={store} />
        <StoreProductList productos={store.productos || []} />
      </div>
    </div>
  );
}
