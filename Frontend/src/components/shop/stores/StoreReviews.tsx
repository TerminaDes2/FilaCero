"use client";
import React, { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { Trash2, Star } from "lucide-react";

type Review = {
  id: number;
  titulo: string | null;
  contenido: string;
  calificacion: number;
  creado_en: string;
  usuario: {
    id?: string;
    nombre: string;
    avatar_url?: string | null;
  };
};

export default function StoreReviews({
  storeId,
  currentUserId,
}: {
  storeId: string;
  currentUserId?: string; // pasas el ID del usuario logueado
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const res: any = await api.getBusinessComments(storeId);
        const items = Array.isArray(res) ? res : res.items || [];

        const mapped = items.map((r: any) => ({
          id: r.id,
          titulo: null,
          contenido: r.comentario,
          calificacion: r.estrellas,
          creado_en: r.createdAt,
          usuario: {
            id: r.user?.id,
            nombre: r.user?.nombre || "Anónimo",
            avatar_url: r.user?.avatarUrl || null,
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

// 🗑️ Eliminar reseña
const handleDelete = async (id: number) => {
  if (!confirm("¿Seguro que deseas eliminar esta reseña?")) return;
  try {
    await api.deleteBusinessComment(storeId, id);
    setReviews((prev) => prev.filter((r) => r.id !== id));
  } catch (err) {
    console.error("Error al eliminar reseña:", err);
  }
};

// ✍️ Enviar nueva reseña
const handleSubmit = async () => {
  if (!newComment.trim() || rating === 0)
    return alert("Completa la reseña y la calificación");
  setSubmitting(true);
  try {
    const newReview = await api.createBusinessComment(storeId, {
      estrellas: rating,
      comentario: newComment,
    });

    setReviews((prev) => [
      ...prev,
      {
        id: newReview.id,
        titulo: null,
        contenido: newReview.comentario,
        calificacion: newReview.estrellas,
        creado_en: newReview.createdAt,
        usuario: {
          id: currentUserId,
          nombre: newReview.user?.nombre || "Tú",
          avatar_url: newReview.user?.avatarUrl || null,
        },
      },
    ]);
    setNewComment("");
    setRating(0);
  } catch (err) {
    console.error("Error al enviar reseña:", err);
  } finally {
    setSubmitting(false);
  }
};


   if (loading)
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500 animate-pulse">Cargando reseñas...</p>
      </div>
    );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-semibold mb-4">Reseñas de Clientes</h2>

      {/* Scroll horizontal */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {reviews.length > 0 ? (
          reviews.map((r) => (
            <div
              key={r.id}
              className="relative flex-shrink-0 w-80 border rounded-xl p-4 shadow-sm hover:shadow-md bg-gray-50 transition-transform transform hover:scale-[1.02]"
            >
              {/* Botón eliminar */}
              {currentUserId === r.usuario.id && (
                <button
                  onClick={() => handleDelete(r.id)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}

              <div className="flex items-center gap-3 mb-3">
                <img
                  src={r.usuario.avatar_url || "/images/profile_picture.png"}
                  alt={r.usuario.nombre}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold">{r.usuario.nombre}</h3>
                  <p className="text-xs text-gray-500">
                    {new Date(r.creado_en).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <p className="text-yellow-500 mb-2">
                {"★".repeat(r.calificacion)}{"☆".repeat(5 - r.calificacion)}
              </p>
              <p className="text-gray-700 text-sm">{r.contenido}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center">Aún no hay reseñas</p>
        )}

        {/* 📝 Tarjeta para agregar reseña */}
        <div className="flex-shrink-0 w-80 border-2 border-dashed rounded-xl p-4 flex flex-col justify-center items-center bg-gray-50 hover:shadow-md transition-transform transform hover:scale-[1.02]">
          <h4 className="text-lg font-medium mb-2">Agregar reseña</h4>
          <div className="flex mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <svg
                key={s}
                onClick={() => setRating(s)}
                xmlns="http://www.w3.org/2000/svg"
                fill={s <= rating ? "currentColor" : "none"}
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke={s <= rating ? "#FACC15" : "#D1D5DB"}
                className="w-6 h-6 cursor-pointer text-yellow-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.262 4.582a.563.563 0 00.424.308l5.061.736a.562.562 0 01.312.959l-3.664 3.57a.563.563 0 00-.162.498l.865 5.044a.562.562 0 01-.816.592L12 17.347l-4.527 2.379a.562.562 0 01-.816-.592l.865-5.044a.563.563 0 00-.162-.498l-3.664-3.57a.562.562 0 01.312-.959l5.061-.736a.563.563 0 00.424-.308L11.48 3.5z"
                />
              </svg>
            ))}
          </div>

          <textarea
            className="w-full p-2 border rounded-md text-sm resize-none focus:ring focus:ring-yellow-200"
            rows={3}
            placeholder="Escribe tu reseña..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm px-4 py-2 rounded-md transition disabled:opacity-50"
          >
            {submitting ? "Enviando..." : "Publicar"}
          </button>
        </div>
      </div>
    </div>
  );
}