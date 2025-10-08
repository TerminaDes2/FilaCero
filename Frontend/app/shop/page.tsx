'use client'

import React, { useEffect, useState } from 'react'
import { ShoppingCart, Star } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Producto = {
  id_producto: number
  nombre: string
  descripcion?: string
  precio: number
  imagen?: string
  categoria?: { nombre: string }
  inventario?: { cantidad_actual: number }[]
}

type Negocio = {
  id_negocio: number
  nombre: string
  direccion?: string
  telefono?: string
  correo?: string
  logo?: string
  inventario?: { cantidad_actual: number }[]
  producto?: Producto[]
}

export default function TiendaPage({ params }: { params: { id_negocio: string } }) {
  const [negocio, setNegocio] = useState<Negocio | null>(null)
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [carrito, setCarrito] = useState<Producto[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/negocios/${params.id_negocio}`)
        if (!res.ok) throw new Error('Error al cargar el negocio')
        const data = await res.json()
        setNegocio(data.negocio)
        setProductos(data.productos)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [params.id_negocio])

  const agregarAlCarrito = (producto: Producto) => {
    setCarrito((prev) => [...prev, producto])
  }

  const totalCarrito = carrito.reduce((acc, p) => acc + Number(p.precio), 0)

  if (loading) return <div className="text-center py-20 text-gray-600">Cargando tienda...</div>

  if (!negocio)
    return (
      <div className="text-center py-20">
        <h1 className="text-3xl font-bold text-gray-700">Tienda no encontrada</h1>
        <p className="text-gray-500 mt-4">El negocio solicitado no existe o fue eliminado.</p>
      </div>
    )

  if (productos.length === 0)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-app-gradient text-center p-8">
        <img src="/images/empty-box.svg" alt="Sin productos" className="w-40 mb-6 opacity-80" />
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Aún no hay productos</h2>
        <p className="text-gray-500 mb-8">
          {negocio.nombre} todavía no ha agregado desayunos o comidas. ¡Vuelve pronto!
        </p>
      </div>
    )

  return (
    <div className="min-h-screen bg-app-gradient">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md shadow-sm flex items-center justify-between px-8 py-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          {negocio.logo && <img src={negocio.logo} alt={negocio.nombre} className="w-12 h-12 rounded-full" />}
          <div>
            <h1 className="text-xl font-bold text-gray-800">{negocio.nombre}</h1>
            <p className="text-sm text-gray-500">{negocio.direccion || 'Dirección no disponible'}</p>
          </div>
        </div>
        <button
          onClick={() => router.push('/carrito')}
          className="relative p-3 bg-[var(--fc-brand-500)] text-white rounded-full hover:bg-[var(--fc-brand-600)] transition"
        >
          <ShoppingCart className="w-6 h-6" />
          {carrito.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-white text-[var(--fc-brand-600)] text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow">
              {carrito.length}
            </span>
          )}
        </button>
      </header>

      {/* Sección de productos */}
      <section className="max-w-7xl mx-auto py-12 px-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Desayunos populares</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {productos.map((p) => (
            <div
              key={p.id_producto}
              className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200 card-hover"
            >
              <img
                src={p.imagen || '/images/placeholder.png'}
                alt={p.nombre}
                className="w-full h-48 object-cover"
              />
              <div className="p-4 flex flex-col gap-2">
                <h3 className="font-semibold text-lg text-[var(--pos-text-heading)]">{p.nombre}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{p.descripcion}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm bg-[var(--pos-badge-stock-bg)] text-gray-700 px-3 py-1 rounded-full">
                    Stock: {p.inventario?.[0]?.cantidad_actual ?? 0}
                  </span>
                  <span className="text-base font-bold text-[var(--fc-brand-600)]">
                    ${Number(p.precio).toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => agregarAlCarrito(p)}
                  className="mt-3 w-full bg-[var(--pos-accent-green)] hover:bg-[var(--pos-accent-green-hover)] text-white rounded-lg py-2 font-medium transition"
                >
                  Agregar al carrito
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Carrito lateral (slide) */}
      {carrito.length > 0 && (
        <aside className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl border-l border-gray-200 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-bold text-lg text-gray-800">Tu carrito</h3>
            <span className="text-sm text-gray-500">{carrito.length} productos</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {carrito.map((item, index) => (
              <div key={index} className="flex gap-3 border-b pb-2">
                <img src={item.imagen || '/images/placeholder.png'} className="w-16 h-16 rounded object-cover" />
                <div className="flex-1">
                  <h4 className="font-medium text-gray-800">{item.nombre}</h4>
                  <p className="text-sm text-gray-600">${Number(item.precio).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-gray-700">Total:</span>
              <span className="font-bold text-[var(--fc-brand-600)]">${totalCarrito.toFixed(2)}</span>
            </div>
            <button
              onClick={() => router.push('/checkout')}
              className="w-full bg-[var(--fc-brand-600)] hover:bg-[var(--fc-brand-700)] text-white rounded-lg py-2 font-semibold transition"
            >
              Verificar compra
            </button>
          </div>
        </aside>
      )}
    </div>
  )
}
