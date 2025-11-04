"use client";
import React from "react";
import { UserInfo } from "../../lib/api";
import Link from "next/link";

export default function VerificationSection({ user }: { user: UserInfo }) {
  const verifications = [
    { type: "Email", value: user.correo_electronico, icon: "📧" },
    { type: "Teléfono", value: user.numero_telefono || "No verificado", icon: "📱" },
    { type: "Credencial Estudiantil", value: user.credential_url || "No registrada", icon: "🎓" },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Verificación de Cuenta
      </h3>
      <div className="space-y-4">
        {verifications.map((v, idx) => (
          <div key={idx} className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {v.icon} {v.type}
              </div>
              <div className="text-gray-900 dark:text-white text-sm font-medium">
                {v.value}
              </div>
            </div>
            <Link
              href="/verification"
              className="text-brand-600 hover:text-brand-700 text-sm font-semibold"
            >
              Verificar
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
