"use client";

import { useState } from "react";
import { BadgeCheck, Calendar, CreditCard, IdCard, Save, User } from "lucide-react";
import { UserInfo } from "../../lib/api";

interface UserMetricsProps {
  user: UserInfo;
}

export default function UserMetrics({ user }: UserMetricsProps) {
  const [personalInfoOpen, setPersonalInfoOpen] = useState(true);
  const [accountInfoOpen, setAccountInfoOpen] = useState(false);

  const [formValues, setFormValues] = useState({
    nombre: user.nombre ?? "",
    correo_electronico: user.correo_electronico ?? "",
    numero_telefono: user.numero_telefono ?? "",
    fecha_nacimiento: user.fecha_nacimiento ?? "",
    edad: user.edad ?? "",
  });

  const handleInputChange = (field: keyof typeof formValues, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveChanges = () => {
    // TODO: Implement save functionality with API call
    console.log("Saving changes:", formValues);
  };

  const formatDate = (value: string | Date | null | undefined) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Personal Information Section */}
      <section className="rounded-3xl border border-white/70 bg-white p-6 shadow-lg transition-all hover:shadow-xl">
        <button
          onClick={() => setPersonalInfoOpen((prev) => !prev)}
          className="flex w-full items-center justify-between gap-2 text-left"
          type="button"
        >
          <div className="flex items-center gap-3 text-[var(--fc-brand-700)]">
            <div className="rounded-xl bg-[var(--fc-brand-100)] p-2">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Información Personal</h3>
              <p className="text-sm text-slate-500">Datos básicos de tu cuenta</p>
            </div>
          </div>
          <svg
            className={`h-5 w-5 text-slate-400 transition-transform ${personalInfoOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {personalInfoOpen && (
          <div className="mt-6 grid gap-5 text-sm text-slate-600">
            <div className="grid gap-2">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--fc-brand-600)]">
                <BadgeCheck className="h-3.5 w-3.5" />
                Nombre Completo
              </label>
              <input
                type="text"
                value={formValues.nombre}
                onChange={(event) => handleInputChange("nombre", event.target.value)}
                className="rounded-xl border-2 border-[var(--fc-brand-100)] bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-[var(--fc-brand-400)] focus:ring-4 focus:ring-[var(--fc-brand-100)]"
                placeholder="Tu nombre"
              />
            </div>

            <div className="grid gap-2">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--fc-brand-600)]">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Correo Electrónico
              </label>
              <input
                type="email"
                value={formValues.correo_electronico}
                onChange={(event) => handleInputChange("correo_electronico", event.target.value)}
                className="rounded-xl border-2 border-[var(--fc-brand-100)] bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-[var(--fc-brand-400)] focus:ring-4 focus:ring-[var(--fc-brand-100)]"
                placeholder="tu@email.com"
              />
            </div>

            <div className="grid gap-2">
              <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--fc-brand-600)]">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Teléfono
              </label>
              <input
                type="tel"
                value={formValues.numero_telefono}
                onChange={(event) => handleInputChange("numero_telefono", event.target.value)}
                className="rounded-xl border-2 border-[var(--fc-brand-100)] bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-[var(--fc-brand-400)] focus:ring-4 focus:ring-[var(--fc-brand-100)]"
                placeholder="+52 123 456 7890"
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--fc-brand-600)]">
                  <Calendar className="h-3.5 w-3.5" />
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  value={formValues.fecha_nacimiento}
                  onChange={(event) => handleInputChange("fecha_nacimiento", event.target.value)}
                  className="rounded-xl border-2 border-[var(--fc-brand-100)] bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-[var(--fc-brand-400)] focus:ring-4 focus:ring-[var(--fc-brand-100)]"
                />
              </div>

              <div className="grid gap-2">
                <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--fc-brand-600)]">
                  <User className="h-3.5 w-3.5" />
                  Edad
                </label>
                <input
                  type="number"
                  value={formValues.edad}
                  onChange={(event) => handleInputChange("edad", event.target.value)}
                  className="rounded-xl border-2 border-[var(--fc-brand-100)] bg-white px-4 py-3 text-sm text-slate-700 outline-none transition-all focus:border-[var(--fc-brand-400)] focus:ring-4 focus:ring-[var(--fc-brand-100)]"
                  placeholder="18"
                  min="1"
                  max="120"
                />
              </div>
            </div>

            <button 
              onClick={handleSaveChanges}
              className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[var(--fc-brand-600)] to-[var(--fc-brand-500)] px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105"
            >
              <Save className="h-4 w-4" />
              Guardar Cambios
            </button>
          </div>
        )}
      </section>

      {/* Account Information Section */}
      <section className="rounded-3xl border border-white/70 bg-white p-6 shadow-lg transition-all hover:shadow-xl">
        <button
          onClick={() => setAccountInfoOpen((prev) => !prev)}
          className="flex w-full items-center justify-between gap-2 text-left"
          type="button"
        >
          <div className="flex items-center gap-3 text-[var(--fc-teal-700)]">
            <div className="rounded-xl bg-[var(--fc-teal-100)] p-2">
              <IdCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Información de Cuenta</h3>
              <p className="text-sm text-slate-500">Detalles adicionales y credenciales</p>
            </div>
          </div>
          <svg
            className={`h-5 w-5 text-slate-400 transition-transform ${accountInfoOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {accountInfoOpen && (
          <div className="mt-6 grid gap-5 text-sm">
            {/* Registration Date */}
            {user.fecha_registro && (
              <div className="rounded-2xl border-2 border-slate-100 bg-gradient-to-br from-slate-50 to-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Miembro desde</p>
                    <p className="mt-1 text-lg font-bold text-slate-900">{formatDate(user.fecha_registro)}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-slate-300" />
                </div>
              </div>
            )}

            {/* Account Number */}
            {user.numero_cuenta && (
              <div className="rounded-2xl border-2 border-[var(--fc-teal-100)] bg-gradient-to-br from-[var(--fc-teal-50)] to-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--fc-teal-600)]">Número de Cuenta</p>
                    <p className="mt-1 font-mono text-lg font-bold text-slate-900">{user.numero_cuenta}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-[var(--fc-teal-300)]" />
                </div>
              </div>
            )}

            {/* Credential URL */}
            {user.credential_url && (
              <div className="rounded-2xl border-2 border-[var(--fc-brand-100)] bg-gradient-to-br from-[var(--fc-brand-50)] to-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--fc-brand-600)]">Credencial</p>
                    <a 
                      href={user.credential_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-[var(--fc-brand-600)] hover:text-[var(--fc-brand-700)] hover:underline"
                    >
                      Ver credencial
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                  <IdCard className="h-8 w-8 text-[var(--fc-brand-300)]" />
                </div>
              </div>
            )}

            {/* Account Status */}
            {user.estado && (
              <div className="rounded-2xl border-2 border-slate-100 bg-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Estado de Cuenta</p>
                    <p className="mt-1 inline-flex items-center gap-2 text-lg font-bold capitalize text-slate-900">
                      {user.estado}
                      <span className={`h-3 w-3 rounded-full ${
                        user.estado === 'activo' ? 'bg-emerald-400' : 'bg-slate-300'
                      }`} />
                    </p>
                  </div>
                  <BadgeCheck className="h-8 w-8 text-slate-300" />
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
