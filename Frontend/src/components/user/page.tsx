"use client";
import { useUserStore } from "../../state/userStore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import UserSidebar from "./sidebar";
import UserMetrics from "./metrics";
import VerificationSection from "./verification";

export default function UserProfilePage() {
  const { user, isAuthenticated, loading, logout } = useUserStore();
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.nombre || "");

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-800 dark:text-gray-100">
      {/* Sidebar fija */}
      <UserSidebar user={user} />

      {/* Contenedor principal con navbar fija */}
      <div className="flex flex-col flex-1 lg:pl-64 h-screen overflow-hidden">
        {/* Navbar */}
        <header className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">
            👤 Mi Perfil
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">{user.nombre}</span>
            <img
              src="/images/profile_picture.png"
              alt="Avatar"
              className="w-8 h-8 rounded-full border border-gray-300 dark:border-slate-600"
            />
            <button
              onClick={logout}
              className="text-sm font-medium bg-brand-500 text-white px-3 py-1.5 rounded-lg hover:bg-brand-600 transition"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        {/* Contenido con scroll interno */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8">
          {/* Encabezado */}
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Información Personal</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm text-brand-600 hover:text-brand-500"
                >
                  ✏️ Editar
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-sm text-gray-500 hover:text-gray-400"
                >
                  Guardar
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">
                  Nombre
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm"
                  />
                ) : (
                  <p className="text-base font-medium">{name}</p>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">
                  Correo electrónico
                </label>
                <p className="text-base font-medium">{user.correo_electronico}</p>
              </div>

              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">
                  Estado
                </label>
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    user.estado === "activo"
                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                  }`}
                >
                  {user.estado || "Activo"}
                </span>
              </div>
            </div>
          </div>

          {/* Métricas y verificación */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Métricas del usuario */}
            <div className="lg:col-span-2">
              <UserMetrics user={user} />
            </div>

            {/* Verificación */}
            <div className="lg:col-span-1">
              <VerificationSection user={user} />
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href="/verification/email"
                  className="w-full bg-brand-500 hover:bg-brand-600 text-white py-2 rounded-lg text-center transition"
                >
                  Verificar Email
                </Link>
                <Link
                  href="/verification/phone"
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-center transition"
                >
                  Verificar Teléfono
                </Link>
                <Link
                  href="/verification/student-id"
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 rounded-lg text-center transition"
                >
                  Verificar Credencial Estudiantil
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
