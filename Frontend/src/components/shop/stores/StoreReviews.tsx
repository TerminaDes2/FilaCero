"use client";
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { api } from "../../../lib/api";
import { Trash2, Star } from "lucide-react";

type Review = {
  id: number;
  contenido: string;
  calificacion: number;
  creado_en: string;
  usuario: {
    id?: string;
    nombre: string;
    avatar_url?: string | null;
  };
};

const skeletonArray = Array.from({ length: 3 });

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
    let active = true;
    const loadReviews = async () => {
      try {
        setLoading(true);
        const res: any = await api.getBusinessComments(storeId);
        const items = Array.isArray(res) ? res : res?.items ?? [];
        const mapped: Review[] = items.map((review: any) => ({
          id: review.id ?? review.id_rating ?? Math.random(),
          contenido: review.comentario ?? review.contenido ?? "",
          calificacion: Number(review.estrellas ?? review.calificacion ?? 0),
          creado_en: review.createdAt ?? review.creado_en ?? new Date().toISOString(),
          usuario: {
            nombre: review.user?.nombre ?? review.usuario?.nombre ?? "Anónimo",
            avatar_url: review.user?.avatarUrl ?? review.usuario?.avatar_url ?? null,
          },
        }));
        if (active) {
          setReviews(mapped);
        }
      } catch (error) {
        console.error("Error al cargar reseñas:", error);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadReviews();
    return () => {
      active = false;
    };
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


  const averageRating = useMemo(() => {
    if (!reviews.length) return null;
    const sum = reviews.reduce((acc, review) => acc + review.calificacion, 0);
    return Number((sum / reviews.length).toFixed(1));
  }, [reviews]);

  if (loading) {
    return (
      <section className="rounded-3xl border border-white/70 bg-white/90 p-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Experiencia de clientes</h2>
            <p className="text-sm text-gray-500">Estamos trayendo los comentarios más recientes…</p>
          </div>
        </header>
        <div className="space-y-4">
          {skeletonArray.map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      </section>
    );
  }

  if (!reviews.length) {
    return (
      <section className="rounded-3xl border border-white/70 bg-white/90 p-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-2xl">💬</div>
        <h2 className="mt-4 text-xl font-semibold text-gray-900">Sé la primera reseña</h2>
        <p className="mt-2 text-sm text-gray-500">
          Este negocio recién está empezando su historial de reseñas.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white/70 bg-white/95 p-6">
      <header className="flex flex-col gap-4 border-b border-gray-100 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Experiencia de clientes</h2>
          <p className="text-sm text-gray-500">
            {reviews.length} {reviews.length === 1 ? "reseña publicada" : "reseñas publicadas"}
          </p>
        </div>
        {averageRating != null && (
          <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            ⭐ {averageRating}
            <span className="text-xs font-medium text-emerald-500">Promedio</span>
          </div>
        )}
      </header>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {reviews.map((review) => (
          <article
            key={review.id}
            className="flex flex-col gap-4 rounded-3xl border border-gray-100 bg-white/95 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-brand-50">
                <Image
                  src={review.usuario.avatar_url || "/images/profile_picture.png"}
                  alt={review.usuario.nombre}
                  fill
                  className="object-cover"
                  sizes="48px"
                  unoptimized
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{review.usuario.nombre}</p>
                <p className="text-xs text-gray-500">{formatDate(review.creado_en)}</p>
              </div>
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-600">
                {review.calificacion.toFixed(1)} ★
              </span>
            </div>

            <p className="text-sm leading-relaxed text-gray-700">{review.contenido}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
}