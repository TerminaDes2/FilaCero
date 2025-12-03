"use client";
import React from 'react';
import Image from 'next/image';
import { useCart } from './CartContext';
import { useTranslation } from '../../hooks/useTranslation';

export type Product = {
  id_producto: number | string;
  nombre: string;
  descripcion?: string | null;
  precio: number;
  imagen?: string | null;
  categoria?: string | null;
  cantidad_actual?: number | null;
};

export default function ProductCard({ product, showPrice = true }: { product: Product; showPrice?: boolean }) {
  const { addToCart } = useCart();
  const { t } = useTranslation();

  const handleAdd = () => {
    addToCart({
      id: product.id_producto,
      nombre: product.nombre,
      precio: Number(product.precio ?? 0),
      imagen: product.imagen ?? undefined,
      id_negocio: undefined,
    }, 1);
  };

  return (
    <article className="bg-pos-card-bg border pos-card-border rounded-lg p-3 shadow-sm card-hover">
      <div className="flex gap-3">
        <div className="w-24 h-24 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 relative">
          {product.imagen ? (
            <Image src={product.imagen} alt={product.nombre} fill className="object-cover" sizes="96px" unoptimized />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">{t("shop.product.noImage")}</div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-pos-text-heading">{product.nombre}</h3>
          {product.descripcion && <p className="text-xs text-pos-text-muted mt-1 line-clamp-2">{product.descripcion}</p>}
          <div className="mt-2 flex items-center justify-between">
            <div>
              <span className="inline-block px-2 py-1 rounded text-xs" style={{ background: 'var(--pos-badge-stock-bg)' }}>
                {t("shop.product.stockLabel", { count: product.cantidad_actual ?? '-' })}
              </span>
              {product.categoria && <span className="ml-2 text-xs text-gray-500">· {product.categoria}</span>}
            </div>
            <div className="flex items-center gap-2">
              {showPrice && <div className="text-sm font-bold text-pos-text-heading">{Number(product.precio).toLocaleString(undefined, { style: 'currency', currency: 'USD' })}</div>}
              <button onClick={handleAdd} className="fc-btn-primary" style={{ background: 'var(--pos-accent-green)' }}>
                {t("shop.product.add")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
