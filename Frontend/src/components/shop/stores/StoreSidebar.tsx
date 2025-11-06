"use client";
import React from "react";
import Link from "next/link";

export default function StoreSidebar({ store }: { store: any }) {
  return (
    <aside className="bg-white rounded-lg border p-6 sticky top-24 h-fit">
      <h2 className="text-xl font-semibold mb-4">Información de contacto</h2>

      <div className="space-y-3 text-sm text-gray-600">
        {store.direccion && <p>📍 {store.direccion}</p>}
        {store.telefono && <p>📞 {store.telefono}</p>}
        {store.correo && <p>✉️ {store.correo}</p>}
      </div>

      <div className="mt-6 pt-6 border-t">
        <Link
          href="/shop"
          className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
        >
          ← Volver a tiendas
        </Link>
      </div>
    </aside>
  );
}
