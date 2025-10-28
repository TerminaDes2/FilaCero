"use client";
import React, { useEffect, useState, useMemo } from "react";
import { api, API_BASE } from "../../../lib/api";
import { ProductCard } from "./ProductCard";
import { POSProduct } from "../../../pos/cartContext"; // Tipo de producto

// Estructura que devuelve la API
interface ApiProduct {
  id_producto: number;
  nombre: string;
  descripcion: string | null;
  precio: string; // Prisma envía Decimal como string
  imagen: string | null;
  categoria: { nombre: string } | null;
  inventario: { cantidad_actual: number | null }[];
}

interface ProductGridProps {
  search?: string;
  category?: string;
  view?: "grid" | "list";
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  search = "",
  category = "all",
  view = "grid",
}) => {
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndAdaptProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        const params: Record<string, string> = {};
        if (search) params.search = search;

        const apiProducts: ApiProduct[] = await api.getProducts(params);

        // Adaptamos los productos
        const adaptedProducts = apiProducts
          .map((p): POSProduct | null => {
            if (!p || !p.nombre || !p.precio) return null;

            const backendBaseUrl = API_BASE.replace("/api", "");
            const imageUrl = p.imagen
              ? `${backendBaseUrl}${p.imagen}`
              : undefined;

            const priceNum = parseFloat(p.precio);
            if (isNaN(priceNum)) return null;

            return {
              id: String(p.id_producto),
              name: p.nombre,
              price: priceNum,
              description: p.descripcion || undefined,
              image: imageUrl,
              stock: p.inventario?.[0]?.cantidad_actual ?? 0,
              category: p.categoria?.nombre || "General",
            };
          })
          .filter((item): item is POSProduct => item !== null); // 🔹 Asegura el tipo correcto

        setProducts(adaptedProducts);
      } catch (err) {
        console.error("[ProductGrid] Error fetching products", err);
        setError("No se pudieron cargar los productos.");
      } finally {
        setLoading(false);
      }
    };

    fetchAndAdaptProducts();
  }, [search]);

  // Filtrado por categoría
  const filteredProducts = useMemo(() => {
    if (category === "all") return products;
    return products.filter(
      (p) => p.category?.toLowerCase() === category.toLowerCase()
    );
  }, [products, category]);

  return (
    <div
      className={
        view === "grid"
          ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          : "flex flex-col space-y-3"
      }
    >
      {loading && (
        <p className="col-span-full text-center p-8">Cargando productos...</p>
      )}
      {error && (
        <p className="col-span-full text-center p-8 text-red-500">{error}</p>
      )}

      {!loading &&
        !error &&
        filteredProducts.map((product) => (
          <ProductCard key={product.id} product={product} view={view} />
        ))}

      {!loading &&
        !error &&
        filteredProducts.length === 0 && (
          <p className="col-span-full text-center p-8">
            No se encontraron productos.
          </p>
        )}
    </div>
  );
};
