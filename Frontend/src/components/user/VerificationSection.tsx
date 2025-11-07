"use client";
import Link from "next/link";
import { UserInfo } from "../../lib/api";
import {
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  IdCard,
} from "lucide-react";

interface VerificationSectionProps {
  user: UserInfo;
}

interface VerificationItem {
  id: string;
  label: string;
  status: "verified" | "pending" | "unverified" | "missing";
  description: string;
  icon: any;
  action?: string; // Ruta hacia la página de verificación
}

export default function VerificationSection({ user }: VerificationSectionProps) {
  const verificationItems: VerificationItem[] = [
    {
      id: "email",
      label: "Correo electrónico",
      status: user.correo_electronico ? "verified" : "missing",
      description: user.correo_electronico
        ? "Tu correo electrónico está verificado"
        : "Debes registrar un correo para verificarlo",
      icon: Mail,
      action: user.correo_electronico ? undefined : "/verification/page",
    },
    {
      id: "phone",
      label: "Número de teléfono",
      status: user.numero_telefono
        ? "pending"
        : "missing",
      description: user.numero_telefono
        ? "Verifica tu número de teléfono"
        : "Registra tu número antes de verificarlo",
      icon: Phone,
      action: "/verification",
    },
    {
      id: "credential",
      label: "Credencial estudiantil",
      status: user.credential_url
        ? "pending"
        : "missing",
      description: user.credential_url
        ? "Verifica tu credencial para validar tu identidad"
        : "Sube tu credencial antes de verificarla",
      icon: IdCard,
      action: "/verification",
    },
  ];

  const getStatusIcon = (status: VerificationItem["status"]) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "missing":
        return <XCircle className="w-5 h-5 text-gray-400" />;
      case "unverified":
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: VerificationItem["status"]) => {
    switch (status) {
      case "verified":
        return "text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400";
      case "pending":
        return "text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 dark:text-yellow-400";
      case "missing":
        return "text-gray-600 bg-gray-100 dark:bg-slate-800 dark:text-gray-300";
      case "unverified":
        return "text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400";
    }
  };

  const getStatusText = (status: VerificationItem["status"]) => {
    switch (status) {
      case "verified":
        return "Verificado";
      case "pending":
        return "Pendiente";
      case "missing":
        return "No registrado";
      case "unverified":
        return "Sin verificar";
    }
  };

  const verifiedCount = verificationItems.filter(
    (item) => item.status === "verified"
  ).length;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Verificación de Cuenta
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Verifica tus datos para asegurar tu identidad
        </p>
      </div>

      {/* Items */}
      <div className="p-6 space-y-4">
        {verificationItems.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-slate-600"
            >
              <div className="p-2 bg-gray-100 dark:bg-slate-700 rounded-lg">
                <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.label}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {item.description}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                    item.status
                  )}`}
                >
                  {getStatusText(item.status)}
                </span>
                {getStatusIcon(item.status)}
              </div>

              {/* Botón de acción */}
              {item.action && (
                <Link
                  href={item.action}
                  className="ml-3 text-xs font-medium text-brand-600 hover:underline"
                >
                  Ir a verificar →
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* Progreso */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Progreso de verificación
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {verifiedCount}/{verificationItems.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
          <div
            className="bg-brand-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${(verifiedCount / verificationItems.length) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
