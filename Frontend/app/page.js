"use client";
import { useEffect, useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000/api';

export default function Home() {
  const [health, setHealth] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: '', price: '', stock: '' });

  const fetchHealth = async () => {
    setLoadingHealth(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (!res.ok) throw new Error('Error health');
      setHealth(await res.json());
    } catch (e) { setError(e.message); }
    finally { setLoadingHealth(false); }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/products`);
      if (!res.ok) throw new Error('Error productos');
      setProducts(await res.json());
    } catch (e) { setError(e.message); }
    finally { setLoadingProducts(false); }
  };

  useEffect(() => {
    fetchHealth();
    fetchProducts();
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.stock) return;
    setCreating(true); setError(null);
    try {
      const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
            price: parseFloat(form.price),
            stock: parseInt(form.stock, 10)
        })
      });
      if (!res.ok) throw new Error('Error creando');
      setForm({ name: '', price: '', stock: '' });
      await fetchProducts();
      await fetchHealth();
    } catch (e) { setError(e.message); }
    finally { setCreating(false); }
  };

  return (
    <main className="min-h-screen p-6 max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">FilaCero Frontend (Productos)</h1>

      <section className="p-4 border rounded">
        <h2 className="font-semibold mb-2">Estado Backend</h2>
        {loadingHealth && <p>Cargando health...</p>}
        {health && (
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">{JSON.stringify(health, null, 2)}</pre>
        )}
        <button onClick={fetchHealth} className="mt-2 text-sm underline">Refrescar</button>
      </section>

      <section className="p-4 border rounded space-y-4">
        <h2 className="font-semibold">Agregar producto</h2>
        <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-4">
          <input name="name" value={form.name} onChange={onChange} placeholder="Nombre" className="border p-2 rounded col-span-2" />
          <input name="price" value={form.price} onChange={onChange} placeholder="Precio" type="number" step="0.01" className="border p-2 rounded" />
          <input name="stock" value={form.stock} onChange={onChange} placeholder="Stock" type="number" className="border p-2 rounded" />
          <div className="md:col-span-4">
            <button disabled={creating} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">
              {creating ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
        {error && <p className="text-red-600 text-sm">{error}</p>}
      </section>

      <section className="p-4 border rounded">
        <div className="flex justify-between items-center mb-2">
          <h2 className="font-semibold">Productos</h2>
          <button onClick={fetchProducts} className="text-sm underline">Refrescar</button>
        </div>
        {loadingProducts && <p>Cargando productos...</p>}
        <ul className="divide-y">
          {products.map(p => (
            <li key={p.id || p._id} className="py-2 flex justify-between text-sm">
              <span className="font-medium">{p.name}</span>
              <span>${p.price} · Stock: {p.stock}</span>
            </li>
          ))}
          {!loadingProducts && products.length === 0 && <li className="text-sm text-gray-500">Sin productos</li>}
        </ul>
      </section>
    </main>
  );
}
