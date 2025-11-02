"use client";
import { useUserStore } from "../../src/state/userStore";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import UserSidebar from "../../src/components/user/sidebar";
import UserMetrics from "../../src/components/user/metrics";
import VerificationSection from "../../src/components/user/VerificationSection";
import UserInfoSection from "../../src/components/user/UserInfoSection";
import UserActions from "../../src/components/user/UserActions";
import NavbarStore from "../../src/components/shop/navbarStore";

export default function UserProfilePage() {
  const { user, isAuthenticated, loading } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );

  if (!isAuthenticated || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 overflow-y-auto">
      <NavbarStore />

      <div className="flex">
        {/* Sidebar */}
        <UserSidebar user={user} />

        {/* Contenido principal */}
        <main className="flex-1 lg:pl-64">
          <div className="py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Mi Perfil
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Gestiona tu información personal y preferencias
                </p>
              </div>

              {/* Métricas y verificación */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                  <UserMetrics user={user} />
                </div>
                <div className="lg:col-span-1">
                  <VerificationSection user={user} />
                </div>
              </div>

              {/* Información de cuenta y acciones rápidas */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <UserInfoSection user={user} />
                <UserActions />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
