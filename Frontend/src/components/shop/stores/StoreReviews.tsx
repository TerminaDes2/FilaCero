"use client";
import React, { useEffect, useState } from "react";
import { api } from "../../../lib/api";

type Review = {
  id: number;
  titulo: string | null;
  contenido: string;
  calificacion: number;
  creado_en: string;
  usuario: {
    nombre: string;
    avatar_url?: string | null;
    pedidos: number;
  };
};

export default function StoreReviews({ storeId }: { storeId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const res: any = await api.getBusinessComments(storeId);
        const items = Array.isArray(res) ? res : res.items || [];

        // Adaptamos los nombres de campos
        const mapped = items.map((r: any) => ({
        id: r.id,
        titulo: null, // tu backend no lo usa
        contenido: r.comentario,
        calificacion: r.estrellas,
        creado_en: r.createdAt,
        usuario: {
            nombre: r.user?.nombre || "Anónimo",
            avatar_url: r.user?.avatarUrl || null,
            pedidos: 0, // o puedes quitarlo si no lo usas
        },
        }));

        setReviews(mapped);

      } catch (err) {
        console.error("Error al cargar reseñas:", err);
      } finally {
        setLoading(false);
      }
    };
    loadReviews();
  }, [storeId]);

  if (loading)
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500 animate-pulse">Cargando reseñas...</p>
      </div>
    );

  if (!reviews.length)
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">Aún no hay reseñas de clientes</p>
      </div>
    );

  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <h2 className="text-2xl font-semibold mb-4">Reseñas de Clientes</h2>
      {reviews.map((r) => (
        <div
          key={r.id}
          className="flex gap-4 border rounded-lg p-4 hover:shadow-md transition-all"
          style={{ width: "500px", height: "170px" }}
        >
          <img
            src={r.usuario.avatar_url || "/images/profile_picture.png"}
            alt={r.usuario.nombre}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex justify-between items-center mb-1">
              <h3 className="font-semibold truncate">{r.usuario.nombre}</h3>
              <span className="text-yellow-500 text-sm">
                {"★".repeat(r.calificacion)}{"☆".repeat(5 - r.calificacion)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-1">
              {r.usuario.pedidos} pedidos —{" "}
              {new Date(r.creado_en).toLocaleDateString()}
            </p>
            <h4 className="font-medium text-gray-800 text-sm truncate">
              {r.titulo}
            </h4>
            <p className="text-gray-600 text-sm line-clamp-3">{r.contenido}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
