"use client";
import React from "react";

export default function StoreHeader({ store }: { store: any }) {
  return (
    <div className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          {/* Logo */}
          <div className="w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
            {store.logo ? (
              <img
                src={store.logo}
                alt={store.nombre}
                className="w-full h-full object-cover"
                onError={(e) => ((e.target as HTMLImageElement).src = "/api/placeholder/96/96")}
              />
            ) : (
              <div className="bg-gradient-to-br from-green-400 to-green-600 w-full h-full flex items-center justify-center text-white font-bold text-lg">
                {store.nombre.charAt(0)}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{store.nombre}</h1>
            <p className="text-gray-600 mb-4">
              {store.descripcion || "Esta tienda aún no tiene descripción."}
            </p>

            <div className="flex flex-wrap gap-4 items-center">
              {store.estrellas && (
                <div className="flex items-center gap-1 text-yellow-500">
                  ⭐ <span>{store.estrellas.toFixed(1)}</span>
                </div>
              )}
              {store.categorias?.map((c: string, i: number) => (
                <span key={i} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
