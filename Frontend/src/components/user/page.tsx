// app/user/page.tsx
"use client";
import { useUserStore } from '../../state/userStore';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UserSidebar from './sidebar';
import UserMetrics from './metrics';
import VerificationSection from './verification';

export default function UserProfilePage() {
  const { user, isAuthenticated, loading } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="flex">
        {/* Sidebar */}
        <UserSidebar user={user} />
        
        {/* Contenido principal */}
        <main className="flex-1 lg:pl-64">
          <div className="py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Mi Perfil
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Gestiona tu información personal y preferencias
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Métricas del usuario */}
                <div className="lg:col-span-2">
                  <UserMetrics user={user} />
                </div>

                {/* Verificación */}
                <div className="lg:col-span-1">
                  <VerificationSection user={user} />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}