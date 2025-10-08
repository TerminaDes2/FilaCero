import React, { useEffect, useState } from 'react';
import ProductCard, { Product } from '../ProductCard';

export default function DesayunosSection() {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    fetch('/api/products?categoria=desayuno')
      .then((r) => r.ok ? r.json() : Promise.reject(r))
      .then((data) => setItems(data))
      .catch(() => {
        // fallback mock
        setItems([
          { id_producto: 1, nombre: 'Pan con huevo', precio: 2.5, imagen: '', categoria: 'Desayuno', cantidad_actual: 12 },
          { id_producto: 2, nombre: 'Tostada con jamón', precio: 3.2, imagen: '', categoria: 'Desayuno', cantidad_actual: 8 },
        ]);
      });
  }, []);

  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold mb-4">Desayunos populares</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((p) => <ProductCard key={p.id_producto} product={p} showPrice={false} />)}
      </div>
    </section>
  );
}
