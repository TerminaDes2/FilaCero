"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  CircleCheck,
  Mail,
  Phone,
  Sparkles,
  User,
  Wand2,
} from "lucide-react";
import NavbarStore from "../../src/components/shop/navbarStore";
import UserMetrics from "../../src/components/user/metrics";
import VerificationSection from "../../src/components/user/VerificationSection";
import UserOrdersSection from "../../src/components/user/UserOrdersSection";
import { useUserStore } from "../../src/state/userStore";

export default function UserProfilePage() {
  const { user, isAuthenticated, loading } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#FDF6F8] via-white to-[#F2FBF9]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-[var(--fc-brand-100)] border-t-[var(--fc-brand-500)]" />
          <p className="text-sm font-medium text-slate-600">Cargando tu perfil...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  const hydratedUser =
    (user as typeof user & {
      orders?: Array<{ id: number; fecha: string; total: number; estado: string }>;
    }) ?? user;

  const userOrders = hydratedUser.orders ?? [];

  const totalOrders = userOrders.length;
  const lastOrder = userOrders[0];

  const verifications = {
    email: hydratedUser.verifications?.email ?? (hydratedUser as any).correo_verificado ?? false,
    sms: hydratedUser.verifications?.sms ?? (hydratedUser as any).sms_verificado ?? false,
    credential: hydratedUser.verifications?.credential ?? (hydratedUser as any).credencial_verificada ?? false,
  };
  
  const verifiedChannels = (['email', 'sms', 'credential'] as const).filter((key) => verifications[key]).length;

  const formatDate = (value: string | Date | null | undefined) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const registrationDate = formatDate(hydratedUser.fecha_registro);

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#FDF6F8] via-white to-[#F2FBF9] text-slate-800">
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute inset-x-0 top-[-200px] h-[420px] bg-[radial-gradient(circle_at_top,var(--fc-brand-200)_0%,transparent_60%)] opacity-60" />
      <div className="pointer-events-none absolute bottom-[-220px] left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[var(--fc-teal-200)]/40 blur-3xl" />

      <NavbarStore />

      <main className="relative z-10 pt-24 pb-20">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 sm:px-6 lg:px-8">
          {/* Hero Profile Section */}
          <section className="relative overflow-hidden rounded-[32px] border border-white/70 bg-white/95 p-8 shadow-[0_40px_140px_-80px_rgba(222,53,95,0.35)] sm:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(222,53,95,0.08)_0%,transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(38,198,183,0.08)_0%,transparent_60%)]" />
            
            <div className="relative flex flex-col gap-8">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--fc-brand-100)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--fc-brand-600)]">
                  <Sparkles className="h-3.5 w-3.5" /> Mi Perfil
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--fc-brand-200)] px-3 py-1 text-xs font-medium text-[var(--fc-brand-600)]">
                  {hydratedUser.id_rol === 2 ? "Administrador" : "Cliente"}
                </span>
              </div>

              <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex flex-1 flex-col gap-6">
                  <div className="flex flex-wrap items-center gap-6">
                    {hydratedUser.avatar_url ? (
                      <div className="h-20 w-20 overflow-hidden rounded-3xl shadow-lg">
                        <img 
                          src={hydratedUser.avatar_url} 
                          alt={hydratedUser.nombre || "Avatar"} 
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-[var(--fc-brand-200)] to-[var(--fc-teal-200)] text-3xl font-black uppercase text-white shadow-lg">
                        {(hydratedUser.nombre || "U").charAt(0)}
                      </div>
                    )}
                    <div className="space-y-2">
                      <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                        {hydratedUser.nombre || "Usuario FilaCero"}
                      </h1>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <Mail className="h-4 w-4" />
                          {hydratedUser.correo_electronico}
                        </span>
                        {hydratedUser.numero_telefono && (
                          <span className="inline-flex items-center gap-1.5">
                            <Phone className="h-4 w-4" />
                            {hydratedUser.numero_telefono}
                          </span>
                        )}
                        {registrationDate && (
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            Miembro desde {registrationDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
                    <div className="rounded-2xl border border-[var(--fc-brand-100)] bg-white px-4 py-4 shadow-sm transition-all hover:shadow-md">
                      <p className="text-xs uppercase tracking-[0.28em] text-[var(--fc-brand-500)]">Pedidos</p>
                      <p className="mt-1 text-2xl font-semibold text-slate-900">{totalOrders}</p>
                      <p className="text-xs text-slate-500">Órdenes realizadas</p>
                    </div>
                    <div className="rounded-2xl border border-[var(--fc-teal-100)] bg-white px-4 py-4 shadow-sm transition-all hover:shadow-md">
                      <p className="text-xs uppercase tracking-[0.28em] text-[var(--fc-teal-500)]">Verificaciones</p>
                      <p className="mt-1 text-2xl font-semibold text-slate-900">{verifiedChannels}/3</p>
                      <p className="text-xs text-slate-500">
                        {verifiedChannels === 3 ? 'Perfil completo' : 'Email, teléfono, credencial'}
                      </p>
                    </div>
                    {hydratedUser.edad && (
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm transition-all hover:shadow-md">
                        <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Edad</p>
                        <p className="mt-1 text-2xl font-semibold text-slate-900">{hydratedUser.edad}</p>
                        <p className="text-xs text-slate-500">años</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleScrollTo("personal-info")}
                      className="inline-flex items-center gap-2 rounded-full bg-[var(--fc-brand-600)] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[var(--fc-brand-700)] hover:shadow-lg"
                    >
                      <Wand2 className="h-4 w-4" />
                      Editar perfil
                    </button>
                    <button
                      onClick={() => handleScrollTo("verifications")}
                      className="inline-flex items-center gap-2 rounded-full border border-[var(--fc-brand-200)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--fc-brand-600)] transition-all hover:border-[var(--fc-brand-400)] hover:bg-[var(--fc-brand-50)]"
                    >
                      <CircleCheck className="h-4 w-4" />
                      Verificaciones
                    </button>
                  </div>
                </div>

                {lastOrder && (
                  <div className="flex w-full max-w-xs flex-col gap-4 rounded-3xl border border-[var(--fc-brand-100)] bg-gradient-to-br from-white to-[var(--fc-brand-50)] px-5 py-6 text-sm shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--fc-brand-400)]">Último pedido</span>
                      <span className="text-xs font-mono text-slate-400">#{lastOrder.id}</span>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-slate-900">${lastOrder.total.toFixed(2)}</p>
                      <p className="mt-1 text-xs text-slate-500">{new Date(lastOrder.fecha).toLocaleString("es-MX", {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</p>
                    </div>
                    <span className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                      lastOrder.estado.toLowerCase().includes('complet') 
                        ? 'bg-emerald-100 text-emerald-700'
                        : lastOrder.estado.toLowerCase().includes('pend')
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      {lastOrder.estado}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Personal Info and Verification Grid */}
          <section id="personal-info" className="grid gap-6 lg:grid-cols-[minmax(0,1fr),minmax(0,1fr)]">
            <UserMetrics user={hydratedUser} />
            <VerificationSection user={hydratedUser} />
          </section>

          {/* Orders Section */}
          {totalOrders > 0 && (
            <section id="orders">
              <UserOrdersSection orders={userOrders} />
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
