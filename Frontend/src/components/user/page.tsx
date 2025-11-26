"use client";
import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { CalendarDays, LogOut, MailCheck, Phone, ShieldCheck, ShieldX } from "lucide-react";
import { useUserStore } from "../../state/userStore";
import UserSidebar from "./sidebar";

type GeneralInfoItem = {
  label: string;
  value: string | null;
  caption?: string;
};

type VerificationDisplay = {
  id: string;
  label: string;
  value: string | null;
  description: string;
  verified: boolean;
  icons: { ok: LucideIcon; pending?: LucideIcon };
};

function formatDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  try {
    return new Intl.DateTimeFormat("es-MX", { dateStyle: "long" }).format(date);
  } catch {
    return date.toLocaleDateString();
  }
}

function normalizeText(value?: string | null) {
  if (!value) return null;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export default function UserProfilePage() {
  const { user, isAuthenticated, loading, logout } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/auth/login");
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[var(--fc-brand-200)] border-t-[var(--fc-brand-600)]" />
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  const initials = (user.nombre || user.correo_electronico || "FC")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "")
    .join("") || "FC";

  const joinedAt = formatDate(user.fecha_registro);
  const birthDate = formatDate(user.fecha_nacimiento);
  const roleName = user.role?.nombre_rol ?? user.role_name ?? (user.id_rol === 2 ? "Administrador" : "Cliente");
  const accountState = normalizeText(user.estado) ?? "Activo";

  const generalInfo: GeneralInfoItem[] = useMemo(
    () => [
      { label: "Nombre completo", value: user.nombre ?? null },
      { label: "Correo electrónico", value: user.correo_electronico ?? null },
      { label: "Número de teléfono", value: user.numero_telefono ?? null },
      {
        label: "Fecha de nacimiento",
        value: birthDate,
        caption: user.fecha_nacimiento && birthDate ? `Dato guardado: ${user.fecha_nacimiento}` : undefined,
      },
      { label: "Rol", value: normalizeText(roleName) },
      { label: "Estado de la cuenta", value: accountState },
      {
        label: "Miembro desde",
        value: joinedAt,
        caption: user.fecha_registro && joinedAt ? `Registrado el ${user.fecha_registro}` : undefined,
      },
      { label: "ID de usuario", value: user.id_usuario ? `#${user.id_usuario}` : null },
    ],
    [user, birthDate, joinedAt, roleName, accountState],
  );

  const emailVerified = Boolean(
    user.correo_verificado ?? user.verifications?.email ?? user.verificado ?? user.verified ?? false,
  );
  const smsVerified = Boolean(user.sms_verificado ?? user.verifications?.sms ?? false);
  const identityVerified = Boolean(user.credencial_verificada ?? user.verifications?.credential ?? false);

  const verificationItems: VerificationDisplay[] = useMemo(
    () => [
      {
        id: "email",
        label: "Correo electrónico",
        value: user.correo_electronico ?? null,
        description: emailVerified ? "Correo confirmado" : "Confirma tu correo para recibir notificaciones",
        verified: emailVerified,
        icons: { ok: MailCheck },
      },
      {
        id: "sms",
        label: "Teléfono móvil",
        value: user.numero_telefono ?? null,
        description: smsVerified
          ? "SMS verificado"
          : user.numero_telefono
            ? "Verificación SMS pendiente"
            : "Registra un número para activar esta verificación",
        verified: smsVerified,
        icons: { ok: Phone },
      },
      {
        id: "identity",
        label: "Identidad",
        value: user.credential_url ? "Credencial subida" : null,
        description: identityVerified
          ? "Identidad confirmada por FilaCero"
          : "Sube tu credencial para desbloquear beneficios",
        verified: identityVerified,
        icons: { ok: ShieldCheck, pending: ShieldX },
      },
    ],
    [user, emailVerified, smsVerified, identityVerified],
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <UserSidebar user={user} />
      <div className="flex flex-1 flex-col overflow-hidden lg:pl-64">
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto flex h-full w-full max-w-6xl flex-col gap-8 px-4 pb-12 pt-8 sm:px-8">
            <section className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-[var(--fc-brand-600)] via-[var(--fc-brand-500)] to-[var(--fc-teal-500)] text-white shadow-[0_48px_120px_-60px_rgba(15,118,110,0.45)]">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-45 blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle at 10% 20%, rgba(255,255,255,0.25), transparent 55%), radial-gradient(circle at 90% 10%, rgba(15,118,110,0.25), transparent 60%), radial-gradient(circle at 50% 90%, rgba(249,115,22,0.2), transparent 55%)",
                }}
              />
              <div className="relative flex flex-col gap-8 px-6 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-10">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 text-3xl font-semibold uppercase tracking-wide shadow-xl backdrop-blur">
                    {initials}
                  </div>
                  <div className="space-y-3">
                    <p className="text-[11px] uppercase tracking-[0.4em] text-white/60">Perfil de cliente</p>
                    <h1 className="text-3xl font-semibold sm:text-[2.25rem]">{user.nombre ?? "Cliente FilaCero"}</h1>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                      <span className="inline-flex items-center rounded-full border border-white/40 bg-white/10 px-3 py-1 tracking-[0.2em] uppercase">
                        {accountState}
                      </span>
                      <span className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1 tracking-[0.2em] uppercase">
                        {normalizeText(roleName)}
                      </span>
                      {joinedAt && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {joinedAt}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-start gap-3 sm:items-end">
                  <span className="rounded-full border border-white/30 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.3em]">
                    {user.id_usuario ? `ID ${user.id_usuario}` : "ID pendiente"}
                  </span>
                  <button
                    onClick={logout}
                    className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2 text-sm font-semibold shadow-sm transition hover:bg-white/20"
                    type="button"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
              <section className="rounded-3xl border border-[var(--fc-border-soft)] bg-white/90 p-6 shadow-sm backdrop-blur">
                <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Datos personales</h2>
                    <p className="text-sm text-slate-500">Información sincronizada directamente desde tu cuenta en FilaCero</p>
                  </div>
                </header>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {generalInfo.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-slate-100/80 bg-white/80 p-4 shadow-sm">
                      <span className="text-[11px] uppercase tracking-[0.35em] text-slate-400">{item.label}</span>
                      <p className="mt-2 text-sm font-semibold text-slate-900">
                        {item.value ? item.value : <span className="text-slate-400 italic">Sin registrar</span>}
                      </p>
                      {item.caption && (
                        <p className="mt-1 text-xs text-slate-400">{item.caption}</p>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-3xl border border-[var(--fc-border-soft)] bg-white/90 p-6 shadow-sm backdrop-blur">
                <header>
                  <h2 className="text-lg font-semibold text-slate-900">Verificación de cuenta</h2>
                  <p className="text-sm text-slate-500">Revisa el estado de cada verificación registrada</p>
                </header>
                <div className="mt-6 grid gap-3">
                  {verificationItems.map((item) => {
                    const Icon = item.verified ? item.icons.ok : item.icons.pending ?? item.icons.ok;
                    const statusClasses = item.verified
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-slate-100 text-slate-600";
                    const chipText = item.verified ? "Verificado" : "Pendiente";

                    return (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 rounded-2xl border border-slate-100/80 bg-slate-50/70 p-4 shadow-sm"
                      >
                        <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-600 shadow">
                          <Icon className="h-[18px] w-[18px]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                          <p className="text-xs text-slate-500">
                            {item.value ?? "Sin registrar"}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">{item.description}</p>
                        </div>
                        <span
                          className={`inline-flex h-fit items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] ${statusClasses}`}
                        >
                          {chipText}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
