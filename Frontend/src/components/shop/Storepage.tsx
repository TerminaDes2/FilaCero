'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ShoppingCart } from 'lucide-react'
import { api } from '../../lib/api' // ajusta esta ruta según tu proyecto

export default function TiendaPage() {
  const { id_negocio } = useParams()
  const [negocio, setNegocio] = useState<any>(null)
  const [productos, setProductos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id_negocio) return
        setLoading(true)

        // 🔹 1. Obtener información del negocio
        const negocioRes = await apiFetch<any>(`negocios/${id_negocio}`)
        setNegocio(negocioRes)

        // 🔹 2. Obtener inventario y productos del negocio
        const inventory = await api.getInventory({ id_negocio: String(id_negocio) })

        const productIds = inventory.map((i) => i.id_producto)
        const productsData = await Promise.all(
          productIds.map(async (id: string) => {
            try {
              const product = await apiFetch<any>(`products/${id}`)
              const stock = inventory.find((inv) => inv.id_producto === id)
              return { ...product, stock: stock?.cantidad_actual ?? 0 }
            } catch {
              return null
            }
          })
        )

        setProductos(productsData.filter(Boolean))
      } catch (err: any) {
        console.error(err)
        setError('Error al cargar los datos de la tienda')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id_negocio])

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Cargando tienda...
      </div>
    )

  if (error)
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-red-600 mb-4">{error}</h2>
        <p className="text-gray-500">Por favor, intenta de nuevo más tarde.</p>
      </div>
    )

  if (!productos.length)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-8">
        <img src="/images/empty-box.svg" alt="Sin productos" className="w-40 mb-6 opacity-80" />
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Aún no hay productos</h2>
        <p className="text-gray-500 mb-8">
          {negocio?.nombre || 'Este negocio'} todavía no ha agregado desayunos o comidas. ¡Vuelve pronto!
        </p>
      </div>
    )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header de la tienda */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md shadow-sm flex items-center justify-between px-8 py-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          {negocio?.logo && (
            <img src={negocio.logo} alt={negocio.nombre} className="w-12 h-12 rounded-full" />
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-800">{negocio?.nombre}</h1>
            <p className="text-sm text-gray-500">{negocio?.direccion || 'Dirección no disponible'}</p>
          </div>
        </div>
        <button className="relative p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition">
          <ShoppingCart className="w-6 h-6" />
        </button>
      </header>

      {/* Lista de productos */}
      <section className="max-w-7xl mx-auto py-12 px-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Productos disponibles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {productos.map((p) => (
            <div key={p.id_producto} className="bg-white rounded-xl shadow hover:shadow-md transition p-4">
              <img
                src={p.imagen || '/images/placeholder.png'}
                alt={p.nombre}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <h3 className="font-semibold text-lg">{p.nombre}</h3>
              <p className="text-gray-600 text-sm mb-2">{p.descripcion}</p>
              <div className="flex items-center justify-between">
                <span className="text-gray-700 font-semibold">${p.precio}</span>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  Stock: {p.stock}
                </span>
              </div>
              <button className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 font-medium transition">
                Agregar al carrito
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

// 🔹 Función auxiliar temporal (puedes moverla a api.ts si quieres unificar)
async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3000/api'}/${path}`
  const res = await fetch(url, init)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}
