// app/user/page.tsx
"use client";
import { useUserStore } from '../../src/state/userStore';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UserSidebar from '../../src/components/user/sidebar';
import UserMetrics from '../../src/components/user/metrics';
import VerificationSection from '../../src/components/user/verification';

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
              {/* Header de la página */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Mi Perfil
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Gestiona tu información personal y preferencias
                </p>
              </div>

              {/* Grid de contenido */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sección de métricas - Ocupa 2/3 en desktop */}
                <div className="lg:col-span-2">
                  <UserMetrics user={user} />
                </div>

                {/* Sección de verificación - Ocupa 1/3 en desktop */}
                <div className="lg:col-span-1">
                  <VerificationSection user={user} />
                </div>
              </div>

              {/* Información adicional de la cuenta */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información de la cuenta */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Información de la Cuenta
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                        ID de Usuario
                      </label>
                      <p className="text-gray-900 dark:text-white font-mono text-sm">
                        {user.id_usuario}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                        Fecha de Registro
                      </label>
                      <p className="text-gray-900 dark:text-white text-sm">
                        {user.fecha_registro 
                          ? new Date(user.fecha_registro).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          : 'No disponible'
                        }
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                        Estado
                      </label>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        user.estado === 'activo' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {user.estado || 'Activo'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Acciones rápidas */}
                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Acciones Rápidas
                  </h3>
                  <div className="space-y-3">
                    <button className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                      <div className="text-blue-600 dark:text-blue-400 font-medium text-sm">
                        Cambiar Contraseña
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Actualiza tu contraseña de acceso
                      </div>
                    </button>

                    <button className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                      <div className="text-green-600 dark:text-green-400 font-medium text-sm">
                        Configurar Notificaciones
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Gestiona tus preferencias de notificación
                      </div>
                    </button>

                    <button className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                      <div className="text-purple-600 dark:text-purple-400 font-medium text-sm">
                        Descargar Datos
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Exporta tu información personal
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}