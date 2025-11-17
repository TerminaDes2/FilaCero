"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  CircleCheck,
  Mail,
  MapPin,
  Phone,
  Sparkles,
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
      <div className="flex min-h-screen items-center justify-center bg-[var(--fc-brand-50)]">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[var(--fc-brand-100)] border-t-[var(--fc-brand-500)]" />
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
  const verificationTimestamps = hydratedUser.verificationTimestamps ?? {
    email: (hydratedUser as any).correo_verificado_en ?? null,
    sms: (hydratedUser as any).sms_verificado_en ?? null,
    credential: (hydratedUser as any).credencial_verificada_en ?? null,
  };
  const verifiedChannels = (['email', 'sms', 'credential'] as const).filter((key) => verifications[key]).length;

  const formatVerificationDate = (value: string | Date | null | undefined) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const lastVerificationDate = formatVerificationDate(
    verificationTimestamps.credential || verificationTimestamps.sms || verificationTimestamps.email,
  );

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#FDF6F8] via-white to-[#F2FBF9] text-slate-800">
      <div className="pointer-events-none absolute inset-x-0 top-[-200px] h-[420px] bg-[radial-gradient(circle_at_top,var(--fc-brand-200)_0%,transparent_60%)] opacity-60" />
      <div className="pointer-events-none absolute bottom-[-220px] left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[var(--fc-teal-200)]/40 blur-3xl" />

      <NavbarStore />

      <main className="relative z-10 pt-24 pb-20">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 sm:px-6 lg:px-8">
          <section className="relative overflow-hidden rounded-[32px] border border-white/70 bg-white/95 p-8 shadow-[0_40px_140px_-80px_rgba(222,53,95,0.35)] sm:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(222,53,95,0.08)_0%,transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(38,198,183,0.08)_0%,transparent_60%)]" />
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-col gap-6">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[var(--fc-brand-100)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--fc-brand-600)]">
                    <Sparkles className="h-3.5 w-3.5" /> Perfil FilaCero
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[var(--fc-brand-200)] px-3 py-1 text-xs font-medium text-[var(--fc-brand-600)]">
                    {hydratedUser.id_rol === 2 ? "Administrador" : "Usuario"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <div className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-[var(--fc-brand-200)] to-[var(--fc-teal-200)] text-3xl font-black uppercase text-white">
                    {(hydratedUser.nombre || "U").charAt(0)}
                  </div>
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
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        Campus Central
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
                  <div className="rounded-2xl border border-[var(--fc-brand-100)] bg-white px-4 py-4 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.28em] text-[var(--fc-brand-500)]">Pedidos</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">{totalOrders}</p>
                    <p className="text-xs text-slate-500">Historial sincronizado con tu POS</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--fc-teal-100)] bg-white px-4 py-4 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.28em] text-[var(--fc-teal-500)]">Verificaciones</p>
                    <p className="mt-1 text-2xl font-semibold text-slate-900">{verifiedChannels}/3</p>
                    <p className="text-xs text-slate-500">
                      {verifiedChannels === 3
                        ? lastVerificationDate
                          ? `Completadas el ${lastVerificationDate}`
                          : 'Todos los pasos validados'
                        : 'Email, teléfono y credencial'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--fc-brand-100)] bg-white px-4 py-4 shadow-sm">
                    <p className="text-xs uppercase tracking-[0.28em] text-[var(--fc-brand-500)]">Último pedido</p>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {lastOrder
                        ? new Date(lastOrder.fecha).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })
                        : "Sin registros"}
                    </p>
                    <p className="text-xs text-slate-500">Actualización en tiempo real</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => handleScrollTo("personal-info")}
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--fc-brand-600)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--fc-brand-500)]"
                  >
                    <Wand2 className="h-4 w-4" />
                    Editar información
                  </button>
                  <button
                    onClick={() => handleScrollTo("verifications")}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--fc-brand-200)] px-4 py-2 text-sm font-semibold text-[var(--fc-brand-600)] transition hover:border-[var(--fc-brand-300)]"
                  >
                    <CircleCheck className="h-4 w-4" />
                    Estado de verificación
                  </button>
                </div>
              </div>

              {lastOrder && (
                <div className="flex w-full max-w-xs flex-col gap-4 rounded-3xl border border-[var(--fc-brand-100)] bg-white/80 px-5 py-6 text-sm text-slate-600 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.28em] text-slate-400">Pedido #{lastOrder.id}</span>
                    <CalendarClock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-slate-900">${lastOrder.total.toFixed(2)}</p>
                    <p className="text-xs text-slate-500">{new Date(lastOrder.fecha).toLocaleString("es-MX")}</p>
                  </div>
                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--fc-teal-100)] px-3 py-1 text-xs font-semibold capitalize text-[var(--fc-teal-700)]">
                    {lastOrder.estado}
                  </span>
                  <p className="text-xs text-slate-500">Tus ventas conectan directo con la cocina y dashboards de FilaCero.</p>
                </div>
              )}
            </div>
          </section>

          <section id="personal-info" className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr),minmax(0,0.85fr)]">
            <UserMetrics user={hydratedUser} />
            <VerificationSection user={hydratedUser} />
          </section>

          <section id="orders" className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr),minmax(0,1.1fr)]">
            <UserOrdersSection orders={userOrders} />
            <div className="relative overflow-hidden rounded-3xl border border-white/70 bg-white/95 p-6 text-sm text-slate-600 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.25)] xl:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(38,198,183,0.12)_0%,transparent_60%)]" />
              <div className="relative flex flex-col gap-4">
                <div className="flex items-center gap-3 text-[var(--fc-brand-600)]">
                  <Sparkles className="h-5 w-5" />
                  <h3 className="text-base font-semibold">Cómo funciona tu perfil inteligente</h3>
                </div>
                <p className="text-sm">
                  Filtramos tu actividad de pedidos, sincronizamos tus verificaciones y conectamos la información con el POS y la cocina. Cada cambio que hagas aquí viaja en segundos a los tableros operativos.
                </p>
                <ul className="grid gap-2 text-sm text-slate-500">
                  <li className="flex items-start gap-2"><span className="mt-1 inline-block h-2 w-2 rounded-full bg-[var(--fc-brand-400)]" />Sincronización de datos personales y credenciales.</li>
                  <li className="flex items-start gap-2"><span className="mt-1 inline-block h-2 w-2 rounded-full bg-[var(--fc-teal-400)]" />Alertas automáticas cuando falte alguna verificación.</li>
                  <li className="flex items-start gap-2"><span className="mt-1 inline-block h-2 w-2 rounded-full bg-slate-300" />Pedidos recientes listos para reordenar desde el POS.</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
