"use client";
import React from "react";
import Image from "next/image";

export default function StoreProductList({ productos }: { productos: any[] }) {
  const handleAddToCart = (p: any) => alert(`🛒 "${p.nombre}" agregado al carrito`);

  if (!productos.length)
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-dashed">
        <div className="text-gray-400 text-6xl mb-4">📦</div>
        <p className="text-gray-500 text-lg mb-2">No hay productos disponibles</p>
        <p className="text-gray-400 text-sm">Esta tienda aún no tiene productos publicados</p>
      </div>
    );

  return (
    <div className="lg:col-span-3">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Productos</h2>
        <span className="text-sm text-gray-500">{productos.length} productos</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {productos.map((p) => (
          <div
            key={p.id_producto}
            className="bg-white rounded-lg border p-4 hover:shadow-md transition-all duration-200 flex flex-col"
          >
            <div className="relative mb-4 flex h-48 w-full items-center justify-center overflow-hidden rounded-md bg-gray-100">
              {p.imagen ? (
                <Image
                  src={p.imagen}
                  alt={p.nombre}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                  unoptimized
                  onError={(event) => {
                    event.currentTarget.src = "/api/placeholder/300/300";
                  }}
                />
              ) : (
                <span className="text-gray-400 text-sm">Sin imagen</span>
              )}
            </div>

            <h3 className="font-semibold text-lg mb-2 line-clamp-1">{p.nombre}</h3>
            <p className="text-gray-600 text-sm mb-3 line-clamp-2">{p.descripcion || "Sin descripción"}</p>

            <div className="flex items-center justify-between mt-auto">
              <span className="text-xl font-bold text-green-600">${p.precio.toFixed(2)}</span>
              <button
                onClick={() => handleAddToCart(p)}
                disabled={p.stock === 0}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  p.stock > 0
                    ? "bg-green-500 hover:bg-green-600 text-white"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {p.stock > 0 ? "Agregar" : "Agotado"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
