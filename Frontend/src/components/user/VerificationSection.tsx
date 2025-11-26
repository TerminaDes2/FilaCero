"use client";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  IdCard,
  Mail,
  Phone,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { UserInfo } from "../../lib/api";

interface VerificationSectionProps {
  user: UserInfo;
}

type VerificationStatus = "verified" | "pending" | "missing";

interface VerificationItem {
  id: string;
  label: string;
  status: VerificationStatus;
  description: string;
  icon: LucideIcon;
  timestamp?: string | null;
}

const STATUS_CONFIG = {
  verified: {
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    container: "border-emerald-200 bg-emerald-50",
    icon: <CheckCircle2 className="h-4 w-4" />,
    iconColor: "text-emerald-600",
    text: "Verificado",
  },
  pending: {
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    container: "border-amber-200 bg-amber-50",
    icon: <Clock className="h-4 w-4" />,
    iconColor: "text-amber-600",
    text: "Pendiente",
  },
  missing: {
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    container: "border-slate-200 bg-slate-50",
    icon: <ShieldAlert className="h-4 w-4" />,
    iconColor: "text-slate-600",
    text: "Sin registrar",
  },
} as const;

export default function VerificationSection({ user }: VerificationSectionProps) {
  const emailVerified = user.verifications?.email ?? (user as any).correo_verificado ?? false;
  const smsVerified = user.verifications?.sms ?? (user as any).sms_verificado ?? false;
  const credentialVerified = user.verifications?.credential ?? (user as any).credencial_verificada ?? false;
  const timestamps = user.verificationTimestamps ?? {
    email: (user as any).correo_verificado_en ?? null,
    sms: (user as any).sms_verificado_en ?? null,
    credential: (user as any).credencial_verificada_en ?? null,
  };

  const formatTimestamp = (value: string | Date | null | undefined) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const verificationItems: VerificationItem[] = [
    {
      id: "email",
      label: "Correo Electrónico",
      status: emailVerified ? "verified" : user.correo_electronico ? "pending" : "missing",
      description: emailVerified
        ? "Tu correo está verificado y activo"
        : user.correo_electronico
          ? "Verifica tu correo para activar todas las funciones"
          : "Agrega un correo para continuar",
      icon: Mail,
      timestamp: formatTimestamp(timestamps.email),
    },
    {
      id: "phone",
      label: "Número de Teléfono",
      status: smsVerified ? "verified" : user.numero_telefono ? "pending" : "missing",
      description: smsVerified
        ? "Tu número de teléfono está verificado"
        : user.numero_telefono
          ? "Verifica tu número para recibir notificaciones"
          : "Registra tu número para recibir alertas",
      icon: Phone,
      timestamp: formatTimestamp(timestamps.sms),
    },
    {
      id: "credential",
      label: "Credencial Estudiantil",
      status: credentialVerified ? "verified" : user.credential_url ? "pending" : "missing",
      description: credentialVerified
        ? "Tu identidad ha sido validada"
        : user.credential_url
          ? "Estamos revisando tu credencial"
          : "Sube tu credencial para validar tu identidad",
      icon: IdCard,
      timestamp: formatTimestamp(timestamps.credential),
    },
  ];

  const verifiedCount = verificationItems.filter((item) => item.status === "verified").length;
  const completion = Math.round((verifiedCount / verificationItems.length) * 100);

  return (
    <section
      id="verifications"
      className="relative overflow-hidden rounded-3xl border border-white/80 bg-white p-6 shadow-lg transition-all hover:shadow-xl lg:p-8"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(222,53,95,0.08)_0%,transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(38,198,183,0.08)_0%,transparent_60%)]" />
      
      <div className="relative space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-[var(--fc-teal-100)] p-2">
              <Sparkles className="h-5 w-5 text-[var(--fc-teal-600)]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Estado de Verificación</h2>
              <p className="text-sm text-slate-500">
                Completa todos los pasos para desbloquear todas las funciones
              </p>
            </div>
          </div>
        </header>

        {/* Progress Bar */}
        <div className="rounded-2xl border-2 border-slate-200 bg-gradient-to-r from-slate-50 to-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-900">Progreso General</span>
                <span className="font-bold text-[var(--fc-brand-600)]">{verifiedCount}/{verificationItems.length}</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--fc-brand-500)] to-[var(--fc-teal-500)] transition-all duration-500"
                  style={{ width: `${completion}%` }}
                />
              </div>
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[var(--fc-brand-100)] to-[var(--fc-teal-100)] text-2xl font-black text-[var(--fc-brand-700)]">
              {completion}%
            </div>
          </div>
        </div>

        {/* Verification Items */}
        <div className="space-y-4">
          {verificationItems.map((item) => {
            const Icon = item.icon;
            const config = STATUS_CONFIG[item.status];

            return (
              <div
                key={item.id}
                className={`group relative overflow-hidden rounded-2xl border-2 p-4 transition-all hover:shadow-lg ${config.container}`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`rounded-xl bg-white p-3 shadow-sm ${config.iconColor}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">{item.label}</h3>
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${config.badge}`}>
                          {config.icon}
                          {config.text}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{item.description}</p>
                      {item.timestamp && (
                        <p className="text-xs font-medium text-emerald-600">
                          ✓ Verificado el {item.timestamp}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  {item.status === "missing" && (item.id === "phone" || item.id === "credential") && (
                    <Link
                      href={item.id === "phone" ? "/verification/phone" : "/verification/credencial"}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[var(--fc-brand-600)] px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[var(--fc-brand-700)] hover:shadow-lg hover:scale-105"
                    >
                      {item.id === "phone" ? "Registrar número" : "Subir credencial"}
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Message */}
        {verifiedCount < verificationItems.length && (
          <div className="rounded-2xl border-2 border-[var(--fc-brand-200)] bg-gradient-to-br from-[var(--fc-brand-50)] to-white p-4">
            <p className="text-sm font-medium text-slate-700">
              <span className="font-bold text-[var(--fc-brand-600)]">¡Casi listo!</span> Completa las {verificationItems.length - verifiedCount} verificaciones restantes para aprovechar al máximo tu cuenta.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
