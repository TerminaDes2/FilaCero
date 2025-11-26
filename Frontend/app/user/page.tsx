"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  CalendarDays,
  ChevronRight,
  IdCard,
  Loader2,
  LogOut,
  Mail,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCircle,
  Lock,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import NavbarStore from "../../src/components/shop/navbarStore";
import UserOrdersSection from "../../src/components/user/UserOrdersSection";
import { api, type UserInfo } from "../../src/lib/api";
import { useUserStore } from "../../src/state/userStore";

type UserOrder = {
  id: number;
  fecha: string;
  total: number;
  estado: string;
};

type UserBusiness = {
  id_negocio: number;
  nombre: string;
  direccion?: string | null;
  telefono?: string | null;
  correo?: string | null;
  logo_url?: string | null;
  hero_image_url?: string | null;
  fecha_registro?: string | null;
  descripcion?: string | null;
};

type ProfileFormState = {
  name: string;
  phoneNumber: string;
  accountNumber: string;
  age: string;
  avatarUrl: string;
  credentialUrl: string;
};

const ORDER_SECTION_ID = "orders-section";
const FORM_SECTION_ID = "profile-form-section";
const VERIFICATION_SECTION_ID = "verification-section";
const BUSINESS_SECTION_ID = "business-section";

function formatDate(value?: string | null, options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" }) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("es-MX", options);
}

function formatDateTime(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function stripDiacritics(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function capitalize(value: string | null | undefined) {
  if (!value) return "";
  const lower = value.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function maskAccountNumber(value?: string | null) {
  if (!value) return "Sin registrar";
  if (value.length <= 4) return value;
  const visible = value.slice(-4);
  return `**** ${visible}`;
}

function getInitials(source?: string | null, fallback = "FC") {
  if (!source) return fallback;
  const segments = source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase() ?? "");
  const value = segments.join("");
  return value || fallback;
}

function pickFirst<T>(...values: Array<T | null | undefined>): T | null {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string") {
      if (value.trim() === "") continue;
    }
    return value;
  }
  return null;
}

export default function UserProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading, logout, checkAuth, role } = useUserStore();

  const [businesses, setBusinesses] = useState<UserBusiness[]>([]);
  const [businessLoading, setBusinessLoading] = useState(false);
  const [businessError, setBusinessError] = useState<string | null>(null);

  const [formState, setFormState] = useState<ProfileFormState>({
    name: "",
    phoneNumber: "",
    accountNumber: "",
    age: "",
    avatarUrl: "",
    credentialUrl: "",
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saveFeedback, setSaveFeedback] = useState<"success" | "error" | null>(null);
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isAuthenticated, loading, router]);

  const avatarUrl = pickFirst(user?.avatar_url, user?.avatarUrl);
  const credentialUrl = pickFirst(user?.credential_url, user?.credentialUrl);
  const accountNumberValue = pickFirst(user?.numero_cuenta, user?.accountNumber);
  const ageValue = pickFirst(user?.edad, user?.age);
  const accountState = capitalize(stripDiacritics(user?.estado ?? "")) || "Activo";

  const normalizedRole = (user?.role?.nombre_rol ?? user?.role_name ?? "").toLowerCase();
  const normalizedRoleAscii = stripDiacritics(normalizedRole);
  const isOwner = useMemo(
    () =>
      role === "OWNER" ||
      user?.id_rol === 2 ||
      normalizedRole.includes("admin") ||
      normalizedRole.includes("owner") ||
      normalizedRoleAscii.includes("dueno"),
    [normalizedRole, normalizedRoleAscii, role, user?.id_rol],
  );

  const roleLabel = isOwner ? "Dueno de negocio" : capitalize(stripDiacritics(user?.role?.nombre_rol ?? user?.role_name ?? "Cliente"));

  const joinedAt = formatDate(user?.fecha_registro, { day: "2-digit", month: "long", year: "numeric" });
  const birthDate = formatDate(user?.fecha_nacimiento, { day: "2-digit", month: "long", year: "numeric" });

  const emailVerified = Boolean(user?.verifications?.email ?? user?.correo_verificado ?? user?.verified ?? user?.verificado ?? false);
  const smsVerified = Boolean(user?.verifications?.sms ?? user?.sms_verificado ?? false);
  const credentialVerified = Boolean(user?.verifications?.credential ?? user?.credencial_verificada ?? false);
  const verificationTimestamps = user?.verificationTimestamps ?? {
    email: user?.correo_verificado_en ?? null,
    sms: user?.sms_verificado_en ?? null,
    credential: user?.credencial_verificada_en ?? null,
  };
  const verificationCount = [emailVerified, smsVerified, credentialVerified].filter(Boolean).length;
  const lastVerificationDate = formatDateTime(
    verificationTimestamps.credential || verificationTimestamps.sms || verificationTimestamps.email,
  );

  const userOrders: UserOrder[] = Array.isArray((user as UserInfo & { orders?: UserOrder[] })?.orders)
    ? ((user as UserInfo & { orders?: UserOrder[] })?.orders ?? [])
    : [];
  const totalOrders = userOrders.length;
  const lastOrder = userOrders[0];
  const lastOrderDate = lastOrder ? formatDateTime(lastOrder.fecha) : null;

  const initials = getInitials(user?.nombre ?? user?.correo_electronico ?? null);

  const initialSnapshot = useMemo<ProfileFormState>(
    () => ({
      name: user?.nombre ?? "",
      phoneNumber: user?.numero_telefono ?? "",
      accountNumber: accountNumberValue ?? "",
      age: ageValue !== null && ageValue !== undefined ? String(ageValue) : "",
      avatarUrl: avatarUrl ?? "",
      credentialUrl: credentialUrl ?? "",
    }),
    [accountNumberValue, ageValue, avatarUrl, credentialUrl, user?.nombre, user?.numero_telefono],
  );

  useEffect(() => {
    setFormState(initialSnapshot);
  }, [initialSnapshot]);

  useEffect(() => {
    if (!isOwner || !isAuthenticated) {
      setBusinesses([]);
      return;
    }
    let cancelled = false;
    setBusinessLoading(true);
    setBusinessError(null);
    api
      .listMyBusinesses()
      .then((data) => {
        if (cancelled) return;
        const normalized: UserBusiness[] = Array.isArray(data)
          ? data.map((item: any) => ({
              id_negocio: Number(item.id_negocio ?? item.id ?? 0),
              nombre: item.nombre ?? "Negocio sin nombre",
              direccion: item.direccion ?? null,
              telefono: item.telefono ?? null,
              correo: item.correo ?? null,
              logo_url: item.logo_url ?? item.logo ?? null,
              hero_image_url: item.hero_image_url ?? null,
              fecha_registro:
                typeof item.fecha_registro === "string"
                  ? item.fecha_registro
                  : item.fecha_registro?.toString?.() ?? null,
              descripcion: item.descripcion ?? null,
            }))
          : [];
        setBusinesses(normalized);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : "No se pudieron cargar tus negocios.";
        setBusinessError(message);
        setBusinesses([]);
      })
      .finally(() => {
        if (!cancelled) setBusinessLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isOwner]);

  const scrollTo = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const handleFormChange = useCallback(
    (field: keyof ProfileFormState, value: string) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const handleReset = useCallback(() => {
    setFormState(initialSnapshot);
    setFormError(null);
    setSaveFeedback(null);
  }, [initialSnapshot]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!user) return;

      const trimmedName = formState.name.trim();
      if (!trimmedName) {
        setFormError("El nombre no puede estar vacio.");
        return;
      }

      const trimmedPhone = formState.phoneNumber.trim();
      const trimmedAccount = formState.accountNumber.trim();
      const trimmedAvatar = formState.avatarUrl.trim();
      const trimmedCredential = formState.credentialUrl.trim();
      const ageInput = formState.age.trim();

      let ageNumber: number | null = null;
      if (ageInput) {
        const parsed = Number(ageInput);
        if (Number.isNaN(parsed) || parsed < 0) {
          setFormError("La edad debe ser un numero valido.");
          return;
        }
        ageNumber = parsed;
      }

      setSaving(true);
      setFormError(null);

      try {
        await api.updateUserProfile(user.id_usuario, {
          name: trimmedName,
          phoneNumber: trimmedPhone || null,
          accountNumber: trimmedAccount || null,
          age: ageNumber,
          avatarUrl: trimmedAvatar || null,
          credentialUrl: trimmedCredential || null,
        });
        await checkAuth();
        setSaveFeedback("success");
        setTimeout(() => setSaveFeedback(null), 4000);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "No se pudo guardar el perfil.";
        setFormError(message);
        setSaveFeedback("error");
        setTimeout(() => setSaveFeedback(null), 6000);
      } finally {
        setSaving(false);
      }
    },
    [checkAuth, formState, user],
  );

  const handleLogout = useCallback(() => {
    logout();
    router.push("/");
  }, [logout, router]);

  const heroMetrics = useMemo(() => {
    const metrics: Array<{ label: string; value: string; hint: string; tone: "brand" | "teal" | "neutral" }> = [
      {
        label: "Verificaciones activas",
        value: `${verificationCount}/3`,
        hint: verificationCount === 3 ? "Todas las verificaciones completadas" : "Completa los pasos pendientes",
        tone: "brand",
      },
      isOwner
        ? {
            label: "Negocios vinculados",
            value: businessLoading ? "..." : String(businesses.length),
            hint: businessLoading
              ? "Sincronizando negocios"
              : businesses.length === 0
                ? "Crea tu primer negocio"
                : `${businesses.length} negocio${businesses.length > 1 ? "s" : ""} activos`,
            tone: "teal",
          }
        : {
            label: "Pedidos registrados",
            value: String(totalOrders),
            hint: totalOrders > 0 ? lastOrderDate ?? "Actividad reciente" : "Aun sin pedidos",
            tone: "teal",
          },
      {
        label: "Miembro desde",
        value: joinedAt ?? "Sin dato",
        hint: accountState,
        tone: "neutral",
      },
    ];
    return metrics;
  }, [accountState, businessLoading, businesses.length, isOwner, joinedAt, lastOrderDate, totalOrders, verificationCount]);

  const verificationItems = [
    {
      id: "email",
      label: "Correo electronico",
      value: user?.correo_electronico ?? "Sin registrar",
      verified: emailVerified,
      timestamp: verificationTimestamps.email,
      description: emailVerified ? "Correo confirmado" : "Confirma tu correo para recibir notificaciones",
    },
    {
      id: "sms",
      label: "Telefono movil",
      value: user?.numero_telefono ?? "Sin registrar",
      verified: smsVerified,
      timestamp: verificationTimestamps.sms,
      description: smsVerified ? "SMS verificado" : "Registra y confirma tu numero para alertas",
    },
    {
      id: "credential",
      label: "Credencial",
      value: credentialUrl ? "Credencial cargada" : "Sin documento",
      verified: credentialVerified,
      timestamp: verificationTimestamps.credential,
      description: credentialVerified
        ? "Identidad confirmada por FilaCero"
        : "Sube tu credencial oficial para completar el proceso",
    },
  ];

  return (
    <div className="relative min-h-screen bg-[var(--fc-surface-base)] text-[var(--fc-text-primary)] dark:bg-[color:rgba(3,6,16,1)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,var(--fc-brand-100)_0%,transparent_55%)] opacity-60 dark:bg-[radial-gradient(circle_at_top,rgba(78,40,120,0.25)_0%,transparent_60%)]" />
      <NavbarStore />

      <main className="relative z-10 pt-24 pb-20">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 sm:px-6 lg:px-8">
          <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-[var(--fc-brand-600)] via-[var(--fc-brand-500)] to-[var(--fc-teal-500)] text-white shadow-[0_60px_140px_-70px_rgba(15,118,110,0.6)]">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18)_0%,transparent_60%)]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(17,94,89,0.25)_0%,transparent_65%)]"
            />
            <div className="relative flex flex-col gap-10 p-8 sm:p-10 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex flex-1 flex-col gap-8">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.32em]">
                    <Sparkles className="h-3.5 w-3.5" /> Perfil FilaCero
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em]">
                    {roleLabel}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/8 px-3 py-1 text-xs font-medium text-white/80">
                    ID {user.id_usuario}
                  </span>
                </div>

                <div className="flex flex-wrap items-start gap-6">
                  <div className="relative h-20 w-20 overflow-hidden rounded-3xl border border-white/30 bg-white/20 shadow-xl">
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt={user.nombre ?? "Avatar"} fill className="object-cover" sizes="80px" unoptimized />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-2xl font-semibold text-white/90">{initials}</span>
                    )}
                  </div>
                  <div className="space-y-3">
                    <h1 className="text-[2rem] font-semibold leading-tight sm:text-[2.4rem]">
                      {user.nombre ?? "Usuario FilaCero"}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="h-4 w-4" />
                        {user.correo_electronico}
                      </span>
                      {user.numero_telefono && (
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="h-4 w-4" />
                          {user.numero_telefono}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-4 w-4" />
                        {joinedAt ?? "Registro pendiente"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/8 px-3 py-1">
                        Estado: {accountState}
                      </span>
                      {accountNumberValue && (
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/8 px-3 py-1">
                          Cuenta: {maskAccountNumber(accountNumberValue)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {heroMetrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-2xl border border-white/25 bg-white/10 px-5 py-4 text-sm shadow-sm backdrop-blur"
                    >
                      <p className="text-xs uppercase tracking-[0.3em] text-white/70">{metric.label}</p>
                      <p className="mt-2 text-2xl font-semibold">{metric.value}</p>
                      <p className="text-xs text-white/70">{metric.hint}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex w-full max-w-xs flex-col gap-4">
                <button
                  type="button"
                  onClick={() => scrollTo(FORM_SECTION_ID)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[var(--fc-brand-600)] shadow-sm transition hover:bg-white/90"
                >
                  <UserCircle className="h-4 w-4" />
                  Editar perfil
                </button>
                <button
                  type="button"
                  onClick={() => scrollTo(VERIFICATION_SECTION_ID)}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Revisar verificaciones
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white/85 transition hover:bg-white/20"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar sesion
                </button>
                <div className="rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-xs text-white/80">
                  <p className="font-semibold">Estado de seguridad</p>
                  <p className="mt-1 text-white/70">
                    {lastVerificationDate
                      ? `Ultima verificacion registrada el ${lastVerificationDate}`
                      : "Aun hay verificaciones pendientes."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section
            id={FORM_SECTION_ID}
            className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr),minmax(0,0.8fr)]"
          >
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl border border-[var(--fc-border-soft)] bg-white/95 p-6 shadow-sm backdrop-blur-sm dark:border-white/12 dark:bg-[color:rgba(10,14,28,0.92)]"
            >
              <div className="flex items-center gap-3 text-[var(--fc-brand-600)] dark:text-[var(--fc-brand-300)]">
                <Sparkles className="h-5 w-5" />
                <div>
                  <h2 className="text-lg font-semibold text-[var(--fc-text-strong)] dark:text-white">Datos del perfil</h2>
                  <p className="text-sm text-[var(--fc-text-secondary)] dark:text-white/70">
                    Actualiza la informacion que sincronizamos con tus pedidos y tableros.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-[var(--fc-text-tertiary)] dark:text-white/60">
                    Nombre completo
                  </label>
                  <input
                    value={formState.name}
                    onChange={(event) => handleFormChange("name", event.target.value)}
                    className="mt-2 w-full rounded-xl border border-[var(--fc-border-soft)] bg-white px-4 py-2.5 text-sm text-[var(--fc-text-primary)] shadow-sm transition focus:border-[var(--fc-brand-400)] focus:outline-none focus:ring-2 focus:ring-[var(--fc-brand-100)] dark:border-white/12 dark:bg-[color:rgba(12,16,30,0.85)] dark:text-white dark:focus:border-[var(--fc-brand-400)] dark:focus:ring-[var(--fc-brand-400)]"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.3em] text-[var(--fc-text-tertiary)] dark:text-white/60">
                    Telefono
                  </label>
                  <input
                    value={formState.phoneNumber}
                    onChange={(event) => handleFormChange("phoneNumber", event.target.value)}
                    className="mt-2 w-full rounded-xl border border-[var(--fc-border-soft)] bg-white px-4 py-2.5 text-sm text-[var(--fc-text-primary)] shadow-sm transition focus:border-[var(--fc-brand-400)] focus:outline-none focus:ring-2 focus:ring-[var(--fc-brand-100)] dark:border-white/12 dark:bg-[color:rgba(12,16,30,0.85)] dark:text-white dark:focus:border-[var(--fc-brand-400)] dark:focus:ring-[var(--fc-brand-400)]"
                    placeholder="Ej. +52 81 0000 0000"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.3em] text-[var(--fc-text-tertiary)] dark:text-white/60">
                    Numero de cuenta
                  </label>
                  <input
                    value={formState.accountNumber}
                    onChange={(event) => handleFormChange("accountNumber", event.target.value)}
                    className="mt-2 w-full rounded-xl border border-[var(--fc-border-soft)] bg-white px-4 py-2.5 text-sm text-[var(--fc-text-primary)] shadow-sm transition focus:border-[var(--fc-brand-400)] focus:outline-none focus:ring-2 focus:ring-[var(--fc-brand-100)] dark:border-white/12 dark:bg-[color:rgba(12,16,30,0.85)] dark:text-white dark:focus:border-[var(--fc-brand-400)] dark:focus:ring-[var(--fc-brand-400)]"
                    placeholder="CLABE o cuenta institucional"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.3em] text-[var(--fc-text-tertiary)] dark:text-white/60">
                    Edad
                  </label>
                  <input
                    value={formState.age}
                    onChange={(event) => handleFormChange("age", event.target.value)}
                    className="mt-2 w-full rounded-xl border border-[var(--fc-border-soft)] bg-white px-4 py-2.5 text-sm text-[var(--fc-text-primary)] shadow-sm transition focus:border-[var(--fc-brand-400)] focus:outline-none focus:ring-2 focus:ring-[var(--fc-brand-100)] dark:border-white/12 dark:bg-[color:rgba(12,16,30,0.85)] dark:text-white dark:focus:border-[var(--fc-brand-400)] dark:focus:ring-[var(--fc-brand-400)]"
                    placeholder="Ej. 21"
                    inputMode="numeric"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-[var(--fc-text-tertiary)] dark:text-white/60">
                    Avatar (URL)
                  </label>
                  <input
                    value={formState.avatarUrl}
                    onChange={(event) => handleFormChange("avatarUrl", event.target.value)}
                    className="mt-2 w-full rounded-xl border border-[var(--fc-border-soft)] bg-white px-4 py-2.5 text-sm text-[var(--fc-text-primary)] shadow-sm transition focus:border-[var(--fc-brand-400)] focus:outline-none focus:ring-2 focus:ring-[var(--fc-brand-100)] dark:border-white/12 dark:bg-[color:rgba(12,16,30,0.85)] dark:text-white dark:focus:border-[var(--fc-brand-400)] dark:focus:ring-[var(--fc-brand-400)]"
                    placeholder="https://"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs uppercase tracking-[0.3em] text-[var(--fc-text-tertiary)] dark:text-white/60">
                    Credential (URL)
                  </label>
                  <input
                    value={formState.credentialUrl}
                    onChange={(event) => handleFormChange("credentialUrl", event.target.value)}
                    className="mt-2 w-full rounded-xl border border-[var(--fc-border-soft)] bg-white px-4 py-2.5 text-sm text-[var(--fc-text-primary)] shadow-sm transition focus:border-[var(--fc-brand-400)] focus:outline-none focus:ring-2 focus:ring-[var(--fc-brand-100)] dark:border-white/12 dark:bg-[color:rgba(12,16,30,0.85)] dark:text-white dark:focus:border-[var(--fc-brand-400)] dark:focus:ring-[var(--fc-brand-400)]"
                    placeholder="https://"
                  />
                </div>
              </div>

              {formError && (
                <p className="mt-4 text-sm font-medium text-red-600 dark:text-red-400">{formError}</p>
              )}
              {saveFeedback === "success" && !formError && (
                <p className="mt-4 text-sm font-medium text-emerald-600 dark:text-emerald-300">Perfil actualizado correctamente.</p>
              )}
              {saveFeedback === "error" && !formError && (
                <p className="mt-4 text-sm font-medium text-amber-600 dark:text-amber-300">Revisa los datos e intentalo nuevamente.</p>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--fc-brand-600)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--fc-brand-500)] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[var(--fc-brand-500)] dark:hover:bg-[var(--fc-brand-400)]"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  Guardar cambios
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--fc-border-soft)] px-5 py-2.5 text-sm font-semibold text-[var(--fc-brand-600)] transition hover:border-[var(--fc-brand-400)] hover:text-[var(--fc-brand-500)] dark:border-white/12 dark:text-[var(--fc-brand-200)] dark:hover:border-[var(--fc-brand-300)]"
                >
                  Restaurar valores
                </button>
              </div>
            </form>

            <aside className="grid gap-4">
              <div className="rounded-3xl border border-[var(--fc-border-soft)] bg-white/95 p-6 shadow-sm dark:border-white/12 dark:bg-[color:rgba(9,13,25,0.92)]">
                <div className="flex items-center gap-3 text-[var(--fc-brand-600)] dark:text-[var(--fc-brand-300)]">
                  <IdCard className="h-5 w-5" />
                  <div>
                    <h3 className="text-base font-semibold text-[var(--fc-text-strong)] dark:text-white">Datos almacenados</h3>
                    <p className="text-sm text-[var(--fc-text-secondary)] dark:text-white/70">
                      Informacion sincronizada con la base de datos de FilaCero.
                    </p>
                  </div>
                </div>
                <dl className="mt-6 space-y-4 text-sm">
                  <div>
                    <dt className="text-xs uppercase tracking-[0.28em] text-[var(--fc-text-tertiary)] dark:text-white/60">Correo</dt>
                    <dd className="mt-1 font-semibold text-[var(--fc-text-primary)] dark:text-white">{user.correo_electronico}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.28em] text-[var(--fc-text-tertiary)] dark:text-white/60">Fecha de nacimiento</dt>
                    <dd className="mt-1 text-[var(--fc-text-secondary)] dark:text-white/70">{birthDate ?? <span className="italic">Sin registrar</span>}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.28em] text-[var(--fc-text-tertiary)] dark:text-white/60">Edad</dt>
                    <dd className="mt-1 text-[var(--fc-text-secondary)] dark:text-white/70">{ageValue ?? <span className="italic">Sin registrar</span>}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.28em] text-[var(--fc-text-tertiary)] dark:text-white/60">Numero de cuenta</dt>
                    <dd className="mt-1 text-[var(--fc-text-secondary)] dark:text-white/70">
                      {accountNumberValue ? maskAccountNumber(accountNumberValue) : <span className="italic">Sin registrar</span>}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-[0.28em] text-[var(--fc-text-tertiary)] dark:text-white/60">Estado</dt>
                    <dd className="mt-1 text-[var(--fc-text-secondary)] dark:text-white/70">{accountState}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-3xl border border-[var(--fc-border-soft)] bg-white/90 p-6 shadow-sm dark:border-white/12 dark:bg-[color:rgba(9,13,25,0.9)]">
                <div className="flex items-center gap-3 text-[var(--fc-brand-600)] dark:text-[var(--fc-brand-300)]">
                  <Lock className="h-5 w-5" />
                  <div>
                    <h3 className="text-base font-semibold text-[var(--fc-text-strong)] dark:text-white">Credenciales y archivos</h3>
                    <p className="text-sm text-[var(--fc-text-secondary)] dark:text-white/70">
                      Gestiona los recursos que respaldan tu identidad.
                    </p>
                  </div>
                </div>
                <div className="mt-5 space-y-4 text-sm text-[var(--fc-text-secondary)] dark:text-white/70">
                  <div className="flex items-start gap-3">
                    <UserCircle className="mt-1 h-5 w-5 text-[var(--fc-brand-500)] dark:text-[var(--fc-brand-200)]" />
                    <div>
                      <p className="font-semibold text-[var(--fc-text-primary)] dark:text-white">Avatar actual</p>
                      {avatarUrl ? (
                        <div className="mt-2 flex items-center gap-3">
                          <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-[var(--fc-border-soft)] bg-slate-100 dark:border-white/12 dark:bg-white/10">
                            <Image src={avatarUrl} alt="Avatar" fill className="object-cover" sizes="48px" unoptimized />
                          </div>
                          <Link
                            href={avatarUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[var(--fc-brand-600)] hover:text-[var(--fc-brand-500)] dark:text-[var(--fc-brand-200)]"
                          >
                            Ver imagen
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      ) : (
                        <p className="text-xs text-[var(--fc-text-tertiary)] dark:text-white/60">Sin avatar registrado.</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <IdCard className="mt-1 h-5 w-5 text-[var(--fc-brand-500)] dark:text-[var(--fc-brand-200)]" />
                    <div>
                      <p className="font-semibold text-[var(--fc-text-primary)] dark:text-white">Credencial</p>
                      {credentialUrl ? (
                        <Link
                          href={credentialUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex items-center gap-1 text-[var(--fc-brand-600)] hover:text-[var(--fc-brand-500)] dark:text-[var(--fc-brand-200)]"
                        >
                          Abrir documento
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <p className="text-xs text-[var(--fc-text-tertiary)] dark:text-white/60">Aun no cargas tu credencial.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </section>

          <section
            id={VERIFICATION_SECTION_ID}
            className="rounded-3xl border border-[var(--fc-border-soft)] bg-white/95 p-6 shadow-sm dark:border-white/12 dark:bg-[color:rgba(8,13,24,0.94)]"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 text-[var(--fc-brand-600)] dark:text-[var(--fc-brand-300)]">
                <ShieldCheck className="h-5 w-5" />
                <div>
                  <h2 className="text-lg font-semibold text-[var(--fc-text-strong)] dark:text-white">Verificacion de cuenta</h2>
                  <p className="text-sm text-[var(--fc-text-secondary)] dark:text-white/70">
                    Consulta el estatus de tus verificaciones obligatorias.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push("/verification")}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--fc-border-soft)] px-4 py-2 text-sm font-semibold text-[var(--fc-brand-600)] transition hover:border-[var(--fc-brand-400)] hover:text-[var(--fc-brand-500)] dark:border-white/12 dark:text-[var(--fc-brand-200)]"
              >
                Gestionar verificaciones
              </button>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-3">
              {verificationItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-2xl border border-[var(--fc-border-soft)] bg-white/90 p-5 shadow-sm transition hover:border-[var(--fc-brand-200)] dark:border-white/10 dark:bg-[color:rgba(10,14,26,0.88)] dark:hover:border-[color:rgba(56,189,248,0.4)]"
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.verified ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200" : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-100"}`}>
                      {item.verified ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--fc-text-primary)] dark:text-white">{item.label}</p>
                      <p className="text-xs text-[var(--fc-text-secondary)] dark:text-white/70">{item.value}</p>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--fc-text-secondary)] dark:text-white/60">{item.description}</p>
                  <div className="mt-auto flex items-center justify-between text-xs text-[var(--fc-text-tertiary)] dark:text-white/50">
                    <span className={`inline-flex items-center rounded-full px-3 py-1 font-semibold uppercase tracking-[0.3em] ${item.verified ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200" : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-100"}`}>
                      {item.verified ? "Verificado" : "Pendiente"}
                    </span>
                    {item.timestamp && <span>{formatDateTime(item.timestamp)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {isOwner && (
            <section
              id={BUSINESS_SECTION_ID}
              className="rounded-3xl border border-[var(--fc-border-soft)] bg-white/95 p-6 shadow-sm dark:border-white/12 dark:bg-[color:rgba(8,12,22,0.94)]"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 text-[var(--fc-brand-600)] dark:text-[var(--fc-brand-300)]">
                  <Building2 className="h-5 w-5" />
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--fc-text-strong)] dark:text-white">Negocios vinculados</h2>
                    <p className="text-sm text-[var(--fc-text-secondary)] dark:text-white/70">
                      Gestiona los negocios asociados a tu cuenta de propietario.
                    </p>
                  </div>
                </div>
                <Link
                  href="/stores/crear"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--fc-border-soft)] px-4 py-2 text-sm font-semibold text-[var(--fc-brand-600)] transition hover:border-[var(--fc-brand-400)] hover:text-[var(--fc-brand-500)] dark:border-white/12 dark:text-[var(--fc-brand-200)]"
                >
                  Crear nuevo negocio
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {businessLoading &&
                  Array.from({ length: 2 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-32 animate-pulse rounded-2xl border border-[var(--fc-border-soft)] bg-white/80 dark:border-white/10 dark:bg-[color:rgba(12,16,28,0.8)]"
                    />
                  ))}
                {!businessLoading && businessError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-600 dark:border-red-400/40 dark:bg-red-500/10 dark:text-red-200">
                    {businessError}
                  </div>
                )}
                {!businessLoading && !businessError && businesses.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-[var(--fc-border-soft)] bg-white/80 px-5 py-6 text-sm text-[var(--fc-text-secondary)] dark:border-white/10 dark:bg-[color:rgba(10,14,26,0.8)] dark:text-white/70">
                    Aun no tienes negocios asociados. Crea uno nuevo para empezar a vender.
                  </div>
                )}
                {!businessLoading && !businessError &&
                  businesses.map((business) => (
                    <div
                      key={business.id_negocio}
                      className="flex flex-col gap-4 rounded-2xl border border-[var(--fc-border-soft)] bg-white/90 p-5 shadow-sm transition hover:border-[var(--fc-brand-200)] dark:border-white/12 dark:bg-[color:rgba(9,13,25,0.9)] dark:hover:border-[color:rgba(56,189,248,0.4)]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-[var(--fc-border-soft)] bg-[var(--fc-brand-50)] dark:border-white/10 dark:bg-white/10">
                          {business.logo_url ? (
                            <Image
                              src={business.logo_url}
                              alt={business.nombre}
                              fill
                              className="object-cover"
                              sizes="48px"
                              unoptimized
                            />
                          ) : (
                            <Building2 className="absolute inset-0 m-auto h-6 w-6 text-[var(--fc-brand-600)] dark:text-[var(--fc-brand-200)]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-semibold text-[var(--fc-text-primary)] dark:text-white">
                            {business.nombre}
                          </h3>
                          {business.descripcion && (
                            <p className="mt-1 line-clamp-2 text-xs text-[var(--fc-text-secondary)] dark:text-white/70">
                              {business.descripcion}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="grid gap-2 text-sm text-[var(--fc-text-secondary)] dark:text-white/70">
                        {business.telefono && (
                          <span className="inline-flex items-center gap-2">
                            <Phone className="h-4 w-4 text-[var(--fc-brand-500)] dark:text-[var(--fc-brand-200)]" />
                            {business.telefono}
                          </span>
                        )}
                        {business.correo && (
                          <span className="inline-flex items-center gap-2">
                            <Mail className="h-4 w-4 text-[var(--fc-brand-500)] dark:text-[var(--fc-brand-200)]" />
                            {business.correo}
                          </span>
                        )}
                        {business.direccion && <span>{business.direccion}</span>}
                      </div>
                      <div className="flex items-center justify-between text-xs text-[var(--fc-text-tertiary)] dark:text-white/60">
                        <span>
                          Registrado: {formatDate(business.fecha_registro) ?? "Sin fecha"}
                        </span>
                        <Link
                          href={`/stores/${business.id_negocio}`}
                          className="inline-flex items-center gap-1 text-[var(--fc-brand-600)] hover:text-[var(--fc-brand-500)] dark:text-[var(--fc-brand-200)]"
                        >
                          Ver tienda
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
              </div>
            </section>
          )}

          <section
            id={ORDER_SECTION_ID}
            className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr),minmax(0,0.8fr)]"
          >
            <UserOrdersSection orders={userOrders} />
            <div className="rounded-3xl border border-[var(--fc-border-soft)] bg-white/95 p-6 text-sm text-[var(--fc-text-secondary)] shadow-sm dark:border-white/12 dark:bg-[color:rgba(9,13,24,0.9)] dark:text-white/70">
              <div className="flex items-center gap-3 text-[var(--fc-brand-600)] dark:text-[var(--fc-brand-300)]">
                <Sparkles className="h-5 w-5" />
                <h3 className="text-base font-semibold text-[var(--fc-text-primary)] dark:text-white">
                  Consejos para mantener tu perfil al dia
                </h3>
              </div>
              <ul className="mt-4 space-y-3">
                <li className="flex gap-2">
                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-[var(--fc-brand-400)]" />
                  Actualiza tu numero de telefono y verifica el SMS para recibir alertas operativas.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-[var(--fc-teal-400)]" />
                  Carga una credencial vigente para acelerar aprobaciones de negocio.
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-slate-300" />
                  Revisa tus pedidos recientes y confirma su estado desde la tienda o el POS.
                </li>
              </ul>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
