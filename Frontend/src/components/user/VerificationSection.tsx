"use client";
import type { ReactNode, ElementType } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  IdCard,
  Mail,
  Phone,
  ShieldAlert,
} from "lucide-react";
import { UserInfo } from "../../lib/api";

interface VerificationSectionProps {
  user: UserInfo;
}

type VerificationStatus = "verified" | "pending" | "missing" | "unverified";

interface VerificationItem {
  id: string;
  label: string;
  status: VerificationStatus;
  description: string;
  icon: ElementType;
  action?: string;
}

interface StatusStyle {
  badge: string;
  accent: string;
  icon: ReactNode;
  helper: string;
  container: string;
  helperColor: string;
}

const STATUS_STYLES: Record<VerificationStatus, StatusStyle> = {
  verified: {
    badge: "bg-[var(--fc-teal-100)] text-[var(--fc-teal-700)]",
    accent: "from-[var(--fc-teal-200)]/30",
    icon: <CheckCircle2 className="h-4 w-4 text-[var(--fc-teal-500)]" />,
    helper: "Ya está sincronizado con los tableros",
    container: "border-[var(--fc-teal-300)] bg-[var(--fc-teal-50)] text-[var(--fc-teal-700)]",
    helperColor: "text-[var(--fc-teal-500)]",
  },
  pending: {
    badge: "bg-[var(--fc-brand-100)] text-[var(--fc-brand-600)]",
    accent: "from-[var(--fc-brand-200)]/30",
    icon: <Clock3 className="h-4 w-4 text-[var(--fc-brand-500)]" />,
    helper: "Revisa este dato para activarlo",
    container: "border-[var(--fc-brand-200)] bg-[var(--fc-brand-50)] text-[var(--fc-brand-700)]",
    helperColor: "text-[var(--fc-brand-500)]",
  },
  missing: {
    badge: "bg-slate-200 text-slate-600",
    accent: "from-slate-200/30",
    icon: <ShieldAlert className="h-4 w-4 text-slate-500" />,
    helper: "Completa la información para continuar",
    container: "border-slate-200 bg-slate-50 text-slate-600",
    helperColor: "text-slate-400",
  },
  unverified: {
    badge: "bg-rose-100 text-rose-600",
    accent: "from-rose-200/30",
    icon: <ShieldAlert className="h-4 w-4 text-rose-500" />,
    helper: "Necesitamos comprobar estos datos",
    container: "border-rose-200 bg-rose-50 text-rose-600",
    helperColor: "text-rose-400",
  },
};

const STATUS_TEXT: Record<VerificationStatus, string> = {
  verified: "Verificado",
  pending: "Pendiente",
  missing: "No registrado",
  unverified: "Sin verificar",
};

export default function VerificationSection({ user }: VerificationSectionProps) {
  const phoneStatus: VerificationStatus = user.sms_verificado
    ? "verified"
    : user.numero_telefono
    ? "pending"
    : "missing";

  const credentialStatus: VerificationStatus = user.credencial_verificada
    ? "verified"
    : user.credential_url
    ? "pending"
    : "missing";

  const verificationItems: VerificationItem[] = [
    {
      id: "email",
      label: "Correo electrónico",
      status: user.correo_electronico ? "verified" : "missing",
      description: user.correo_electronico
        ? "Tu correo respalda tus accesos y el historial de pedidos."
        : "Agrega un correo institucional para validar tu cuenta.",
      icon: Mail,
      action: user.correo_electronico ? undefined : "/verification/email",
    },
    {
      id: "phone",
      label: "Número de teléfono",
      status: phoneStatus,
      description: user.numero_telefono
        ? user.sms_verificado
          ? `Número verificado: ${user.numero_telefono}`
          : `Número registrado: ${user.numero_telefono}. Falta verificar con código SMS.`
        : "Registra un número para recibir recordatorios y alertas.",
      icon: Phone,
      action: user.sms_verificado ? undefined : "/verification/phone",
    },
    {
      id: "credential",
      label: "Credencial estudiantil",
      status: credentialStatus,
      description: user.credencial_verificada
        ? "Tu credencial estudiantil ha sido verificada correctamente."
        : user.credential_url
        ? "Subimos tu credencial, falta una breve validación."
        : "Carga tu credencial para activar beneficios académicos.",
      icon: IdCard,
      action: user.credencial_verificada ? undefined : "/verification/credencial",
    },
  ];

  const verifiedCount = verificationItems.filter((item) => item.status === "verified").length;
  const completion = Math.round((verifiedCount / verificationItems.length) * 100);

  return (
    <section
      id="verifications"
      className="relative overflow-hidden rounded-3xl border border-white/80 bg-white/95 p-6 text-sm text-slate-600 shadow-[0_40px_120px_-90px_rgba(15,23,42,0.25)] xl:p-8"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(222,53,95,0.12)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(38,198,183,0.12)_0%,transparent_60%)]" />
      <div className="relative space-y-6">
        <header className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--fc-brand-500)]">Verificaciones activas</p>
          <h2 className="text-xl font-semibold text-slate-900">Configura la identidad que la cocina confía</h2>
          <p className="text-sm text-slate-500">
            Todos los datos verificados viajan directo al POS y a la cocina para respaldar cada pedido en segundos.
          </p>
        </header>

        <div className="space-y-4">
          {verificationItems.map((item) => {
            const Icon = item.icon;
            const status = STATUS_STYLES[item.status];

            return (
              <div
                key={item.id}
                className={`relative overflow-hidden rounded-2xl border px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-[0_20px_60px_-45px_rgba(15,23,42,0.35)] ${status.container}`}
              >
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${status.accent} via-transparent to-transparent opacity-70`} />
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3 text-sm">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-[var(--fc-brand-600)] shadow-sm">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">{item.label}</h3>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${status.badge}`}>
                          {status.icon}
                          {STATUS_TEXT[item.status]}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{item.description}</p>
                      <p className={`text-[11px] ${status.helperColor}`}>{status.helper}</p>
                    </div>
                  </div>

                  {item.action && (
                    <Link
                      href={item.action}
                      className="inline-flex items-center gap-2 self-start rounded-full border border-[var(--fc-brand-200)] px-4 py-2 text-xs font-semibold text-[var(--fc-brand-600)] transition hover:border-[var(--fc-brand-300)]"
                    >
                      Completar ahora
                      <span aria-hidden>→</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <footer className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">Progreso total de validación</p>
            <p>Necesitas completar los 3 pasos para desbloquear ventas sin fricción.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative grid h-14 w-14 place-items-center rounded-full bg-[var(--fc-brand-100)] text-sm font-semibold text-[var(--fc-brand-600)]">
              {completion}%
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 36 36" aria-hidden>
                <path
                  className="text-[var(--fc-brand-200)]"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  strokeLinecap="round"
                  d="M18 2a16 16 0 1 1 0 32 16 16 0 0 1 0-32z"
                />
                <path
                  className="text-[var(--fc-brand-600)]"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="100"
                  strokeDashoffset={`${100 - completion}`}
                  d="M18 2a16 16 0 1 1 0 32 16 16 0 0 1 0-32z"
                />
              </svg>
            </div>
            <span className="text-xs text-slate-500">{verifiedCount}/{verificationItems.length} completados</span>
          </div>
        </footer>
      </div>
    </section>
  );
}
