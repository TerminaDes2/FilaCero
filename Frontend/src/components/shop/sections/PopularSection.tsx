import React, { useEffect, useState } from 'react';
import ProductCard, { Product } from '../ProductCard';

export default function PopularSection() {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    fetch('/api/popular')
      .then((r) => r.ok ? r.json() : Promise.reject(r))
      .then((data) => setItems(data))
      .catch(() => {
        setItems([
          { id_producto: 11, nombre: 'Café latte grande', descripcion: 'Espresso con leche aromática', precio: 2.75, imagen: '', categoria: 'Bebida', cantidad_actual: 20 },
          { id_producto: 12, nombre: 'Croissant almendra', descripcion: 'Croissant recién horneado', precio: 1.9, imagen: '', categoria: 'Pastelería', cantidad_actual: 5 },
        ]);
      });
  }, []);

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold mb-4">Lo más popular</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((p) => <ProductCard key={p.id_producto} product={p} />)}
      </div>
    </section>
  );
}
