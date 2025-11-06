"use client";
import { useUserStore } from "../../src/state/userStore";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import NavbarStore from "../../src/components/shop/navbarStore";
import UserSidebar from "../../src/components/user/sidebar";
import UserMetrics from "../../src/components/user/metrics";
import VerificationSection from "../../src/components/user/VerificationSection";
import UserOrdersSection from "../../src/components/user/UserOrdersSection";
export default function UserProfilePage() {
  const { user, isAuthenticated, loading } = useUserStore();
  const router = useRouter();

  // 🔐 Redirección si no hay sesión
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
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
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col">
      {/* Navbar fija superior */}
      <NavbarStore />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar lateral */}
        <UserSidebar user={user} />

        {/* Contenido principal con scroll interno */}
        <main className="flex-1 overflow-y-auto lg:pl-64 pt-20 pb-16 px-4 sm:px-6 lg:px-10">
          <div className="max-w-7xl mx-auto space-y-10">
            {/* Encabezado */}
            <header className="border-b border-gray-200 dark:border-slate-700 pb-4">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Mi Perfil
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Gestiona tu información personal, verifica tus datos y configura tus preferencias.
              </p>
            </header>

            {/* Sección principal */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Métricas (2/3) */}
              <div className="lg:col-span-2">
                <UserMetrics user={user} />
              </div>

              {/* Verificación (1/3) */}
              <div className="lg:col-span-1">
                <VerificationSection user={user} />
              </div>
            </section>

          
          </div>
          <section className="mt-8">
            <UserOrdersSection orders={user.orders || []} />
          </section>

        </main>
      </div>
    </div>
  );
}
