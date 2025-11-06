"use client";
import React from "react";
import Image from "next/image";

export default function StoreHeader({ store }: { store: any }) {
  return (
    <div className="bg-white border-b">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          {/* Logo */}
          <div className="relative h-24 w-24 overflow-hidden rounded-lg bg-gray-100">
            {store.logo ? (
              <Image
                src={store.logo}
                alt={store.nombre}
                fill
                className="object-cover"
                sizes="96px"
                unoptimized
                onError={(event) => {
                  event.currentTarget.src = "/api/placeholder/96/96";
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-green-400 to-green-600 text-lg font-bold text-white">
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
