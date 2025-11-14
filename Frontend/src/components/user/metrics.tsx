"use client";

import { useState } from "react";
import { BadgeCheck, Bell, ChevronDown, Compass, Milestone, Save, Sparkles } from "lucide-react";
import { UserInfo } from "../../lib/api";

interface UserMetricsProps {
  user: UserInfo;
}

const notificationOptions = [
  {
    id: "email",
    label: "Alertas por correo",
    description: "Confirma ventas, recolecciones y recordatorios por email.",
  },
  {
    id: "push",
    label: "Notificaciones push",
    description: "Recibe avisos inmediatos en el POS y la app móvil.",
  },
  {
    id: "digest",
    label: "Resumen semanal",
    description: "Un reporte compacto cada lunes con tus métricas clave.",
  },
];

const trustHighlights = [
  {
    title: "Certificación de higiene alimentaria",
    detail: "Expira: 12 de febrero 2026 • Responsable: Operaciones",
    accent: "brand",
  },
  {
    title: "Capacitación POS inteligente",
    detail: "Completado 100% • Última actualización: hace 4 semanas",
    accent: "teal",
  },
  {
    title: "Validación de identidad",
    detail: "Verificada con credencial UDEM • Vencimiento: 2027",
    accent: "neutral",
  },
];

export default function UserMetrics({ user }: UserMetricsProps) {
  const [personalInfoOpen, setPersonalInfoOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [trustPanelOpen, setTrustPanelOpen] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(true);
  const [notifyDigest, setNotifyDigest] = useState(false);

  const [formValues, setFormValues] = useState({
    nombre: user.nombre ?? "",
    correo_electronico: user.correo_electronico ?? "",
    numero_telefono: user.numero_telefono ?? "",
  });

  const handleInputChange = (field: keyof typeof formValues, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="grid gap-6">
      <section className="rounded-3xl border border-white/70 bg-white p-6 shadow-[0_30px_120px_-80px_rgba(222,53,95,0.35)]">
        <button
          onClick={() => setPersonalInfoOpen((prev) => !prev)}
          className="flex w-full items-center justify-between gap-2 text-left"
          type="button"
        >
          <div className="flex items-center gap-3 text-[var(--fc-brand-700)]">
            <BadgeCheck className="h-5 w-5" />
            <div>
              <h3 className="text-base font-semibold">Información personal</h3>
              <p className="text-sm text-slate-500">Sincronizamos con tus pedidos y POS en tiempo real</p>
            </div>
          </div>
          <ChevronDown className={`h-5 w-5 text-slate-400 transition ${personalInfoOpen ? "rotate-180" : ""}`} />
        </button>

        {personalInfoOpen && (
          <div className="mt-6 grid gap-4 text-sm text-slate-600">
            <div className="grid gap-1">
              <label className="text-xs uppercase tracking-[0.28em] text-[var(--fc-brand-500)]">Nombre completo</label>
              <input
                value={formValues.nombre}
                onChange={(event) => handleInputChange("nombre", event.target.value)}
                className="rounded-xl border border-[var(--fc-brand-100)] bg-white px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-[var(--fc-brand-400)] focus:ring-2 focus:ring-[var(--fc-brand-100)]"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-xs uppercase tracking-[0.28em] text-[var(--fc-brand-500)]">Correo electrónico</label>
              <input
                value={formValues.correo_electronico}
                onChange={(event) => handleInputChange("correo_electronico", event.target.value)}
                className="rounded-xl border border-[var(--fc-brand-100)] bg-white px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-[var(--fc-brand-400)] focus:ring-2 focus:ring-[var(--fc-brand-100)]"
              />
            </div>
            <div className="grid gap-1">
              <label className="text-xs uppercase tracking-[0.28em] text-[var(--fc-brand-500)]">Teléfono</label>
              <input
                value={formValues.numero_telefono}
                onChange={(event) => handleInputChange("numero_telefono", event.target.value)}
                className="rounded-xl border border-[var(--fc-brand-100)] bg-white px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-[var(--fc-brand-400)] focus:ring-2 focus:ring-[var(--fc-brand-100)]"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <button className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--fc-brand-600)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--fc-brand-500)]">
                <Save className="h-4 w-4" /> Guardar cambios
              </button>
              <button className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--fc-brand-200)] px-4 py-2 text-sm font-semibold text-[var(--fc-brand-600)] transition hover:border-[var(--fc-brand-300)]">
                <Sparkles className="h-4 w-4" /> Exportar reporte perfil
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white/70 bg-white p-6 shadow-[0_30px_120px_-80px_rgba(38,198,183,0.3)]">
        <button
          onClick={() => setNotificationsOpen((prev) => !prev)}
          className="flex w-full items-center justify-between gap-2 text-left"
          type="button"
        >
          <div className="flex items-center gap-3 text-[var(--fc-teal-700)]">
            <Bell className="h-5 w-5" />
            <div>
              <h3 className="text-base font-semibold">Alertas y notificaciones</h3>
              <p className="text-sm text-slate-500">Preferencias para tus recordatorios omnicanal</p>
            </div>
          </div>
          <ChevronDown className={`h-5 w-5 text-slate-400 transition ${notificationsOpen ? "rotate-180" : ""}`} />
        </button>

        {notificationsOpen && (
          <div className="mt-6 grid gap-4 text-sm text-slate-600">
            {notificationOptions.map((option) => {
              const toggles = {
                email: [notifyEmail, setNotifyEmail],
                push: [notifyPush, setNotifyPush],
                digest: [notifyDigest, setNotifyDigest],
              } as const;
              const [active, setActive] = toggles[option.id as keyof typeof toggles];

              return (
                <div
                  key={option.id}
                  className="flex items-center justify-between rounded-2xl border border-[var(--fc-teal-100)] bg-[var(--fc-teal-50)] px-4 py-3"
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-[var(--fc-teal-700)]">{option.label}</span>
                    <span className="text-xs text-[var(--fc-teal-500)]">{option.description}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActive((prev) => !prev)}
                    className={`relative h-6 w-12 rounded-full transition ${active ? "bg-[var(--fc-teal-400)]" : "bg-white"}`}
                    aria-pressed={active}
                  >
                    <span
                      className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow transition ${
                        active ? "left-7" : "left-1"
                      }`}
                    />
                    <span className="sr-only">Cambiar {option.id}</span>
                  </button>
                </div>
              );
            })}
            <button className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--fc-teal-200)] px-4 py-2 text-sm font-semibold text-[var(--fc-teal-700)] transition hover:border-[var(--fc-teal-300)]">
              <Sparkles className="h-4 w-4" /> Programar recordatorio semanal
            </button>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-white/70 bg-white p-6 shadow-[0_30px_120px_-90px_rgba(15,23,42,0.2)]">
        <button
          onClick={() => setTrustPanelOpen((prev) => !prev)}
          className="flex w-full items-center justify-between gap-2 text-left"
          type="button"
        >
          <div className="flex items-center gap-3 text-[var(--fc-brand-700)]">
            <Milestone className="h-5 w-5" />
            <div>
              <h3 className="text-base font-semibold">Confianza y credenciales</h3>
              <p className="text-sm text-slate-500">Potencia tu reputación con el resto del equipo</p>
            </div>
          </div>
          <ChevronDown className={`h-5 w-5 text-slate-400 transition ${trustPanelOpen ? "rotate-180" : ""}`} />
        </button>

        {trustPanelOpen && (
          <div className="mt-6 grid gap-4 text-sm text-slate-600">
            <div className="grid gap-1">
              <span className="text-xs uppercase tracking-[0.28em] text-[var(--fc-brand-500)]">Puntuación de confianza</span>
              <div className="flex items-center gap-3">
                <div className="font-mono text-3xl font-semibold text-slate-900">92</div>
                <div className="text-xs text-slate-500">
                  Basado en puntualidad de pedidos, feedback del equipo y registros de capacitación.
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              {trustHighlights.map((highlight) => {
                const palette = {
                  brand: "border-[var(--fc-brand-100)] bg-[var(--fc-brand-50)] text-[var(--fc-brand-700)]",
                  teal: "border-[var(--fc-teal-100)] bg-[var(--fc-teal-50)] text-[var(--fc-teal-700)]",
                  neutral: "border-slate-200 bg-slate-50 text-slate-700",
                } as const;

                return (
                  <div
                    key={highlight.title}
                    className={`rounded-2xl border px-4 py-3 ${palette[highlight.accent as keyof typeof palette]}`}
                  >
                    <p className="text-sm font-semibold">{highlight.title}</p>
                    <p className="text-xs opacity-80">{highlight.detail}</p>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--fc-brand-600)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--fc-brand-500)]">
                <Sparkles className="h-4 w-4" /> Agendar evaluación de confianza
              </button>
              <button className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--fc-brand-200)] px-4 py-2 text-sm font-semibold text-[var(--fc-brand-600)] transition hover:border-[var(--fc-brand-300)]">
                <Compass className="h-4 w-4" /> Explorar casos de éxito
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
