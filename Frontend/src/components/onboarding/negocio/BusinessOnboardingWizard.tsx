'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { CheckCircle2, ChevronLeft, ChevronRight, Store, MapPin, Cog, ClipboardList } from 'lucide-react'
import { useUserStore } from '../../../state/userStore'
import { useBusinessStore } from '../../../state/businessStore'
import { LoginCard } from '../../auth/LoginCard'
import { api, activeBusiness } from '../../../lib/api'
import { useTranslation } from '../../../hooks/useTranslation'

type FormState = {
  nombre: string;
  direccion: string;
  telefono: string;
  correo: string;
  logoUrl: string;
  heroImageUrl: string;
};

type TouchedState = Record<keyof FormState, boolean>;

const STORAGE_KEY = 'business-onboarding-form';
const EMAIL_REGEX = /[^\s@]+@[^\s@]+\.[^\s@]+/;

const INITIAL_FORM: FormState = {
  nombre: '',
  direccion: '',
  telefono: '',
  correo: '',
  logoUrl: '',
  heroImageUrl: '',
};

function isValidUrl(candidate: string): boolean {
  if (!candidate.trim()) return true;
  try {
    const url = new URL(candidate.trim());
    return Boolean(url.protocol && url.host);
  } catch {}
  return false;
}

type Step = 'identidad' | 'ubicacion' | 'configuracion' | 'exito';

export default function BusinessOnboardingWizard({ embed = false }: { embed?: boolean }) {
  const router = useRouter()
  const { role, checkAuth } = useUserStore()
  const { setActiveBusiness } = useBusinessStore()
  const { t } = useTranslation()
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [touched, setTouched] = useState<TouchedState>({
    nombre: false,
    direccion: false,
    telefono: false,
    correo: false,
    logoUrl: false,
    heroImageUrl: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<{ message?: string } | null>(null);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<FormState>;
      setForm((prev) => ({ ...prev, ...parsed }));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    } catch {}
  }, [form]);

  const nameValid = form.nombre.trim().length >= 2;
  const emailValid = !form.correo.trim() || EMAIL_REGEX.test(form.correo.trim());
  const phoneValid = !form.telefono.trim() || form.telefono.trim().length >= 6;
  const logoValid = isValidUrl(form.logoUrl);
  const heroValid = isValidUrl(form.heroImageUrl);

  const validationMessages = useMemo(
    () => ({
      nombre: !nameValid ? 'Ingresa un nombre con al menos 2 caracteres.' : undefined,
      correo: !emailValid ? 'Correo inválido.' : undefined,
      telefono: !phoneValid ? 'Teléfono demasiado corto.' : undefined,
      logoUrl: !logoValid ? 'Proporciona una URL válida.' : undefined,
      heroImageUrl: !heroValid ? 'Proporciona una URL válida.' : undefined,
    }),
    [nameValid, emailValid, phoneValid, logoValid, heroValid]
  );

  const formValid = nameValid && emailValid && phoneValid && logoValid && heroValid;

  const markAllTouched = () => {
    setTouched({
      nombre: true,
      direccion: true,
      telefono: true,
      correo: true,
      logoUrl: true,
      heroImageUrl: true,
    });
  };

  const handleChange = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleBlur = (field: keyof FormState) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const resetDraft = () => {
    setForm(INITIAL_FORM);
    setTouched({
      nombre: false,
      direccion: false,
      telefono: false,
      correo: false,
      logoUrl: false,
      heroImageUrl: false,
    });
    try {
      if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    markAllTouched();
    if (!formValid) {
      setError('Revisa los campos resaltados antes de continuar.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const token =
      typeof window !== 'undefined' ? window.localStorage.getItem('auth_token') : null;
    if (!token) {
      await checkAuth();
      const refreshedToken =
        typeof window !== 'undefined' ? window.localStorage.getItem('auth_token') : null;
      if (!refreshedToken) {
        setSubmitting(false);
        setError('Tu sesión expiró. Inicia sesión nuevamente para crear un negocio.');
        router.push('/login?redirect=/onboarding/negocio');
        return;
      }
    }

    const payload: Parameters<typeof api.createBusiness>[0] = {
      nombre: form.nombre.trim(),
    };
    const direccion = form.direccion.trim();
    const telefono = form.telefono.trim();
    const correo = form.correo.trim();
    const logo = form.logoUrl.trim();
    const hero = form.heroImageUrl.trim();

    if (direccion) payload.direccion = direccion;
    if (telefono) payload.telefono = telefono;
    if (correo) payload.correo = correo.toLowerCase();
    if (logo) payload.logo = logo;
    if (hero) payload.hero_image_url = hero;

    try {
      const created = await api.createBusiness(payload);
      const id = String(created?.id_negocio ?? created?.id ?? created?.idNegocio ?? '');
      if (id) {
        activeBusiness.set(id);
        setActiveBusiness({
          id_negocio: id,
          nombre: created?.nombre ?? payload.nombre,
          direccion: created?.direccion ?? payload.direccion ?? null,
          telefono: created?.telefono ?? payload.telefono ?? null,
          correo: created?.correo ?? payload.correo ?? null,
          logo_url: created?.logo_url ?? created?.logo ?? payload.logo ?? null,
          hero_image_url: created?.hero_image_url ?? payload.hero_image_url ?? null,
        });
      }
      // limpiar storage y redirigir al POS
      try { localStorage.removeItem(STORAGE_KEY) } catch {}
      router.push('/pos')
    } catch (e: any) {
      if (e?.status === 413) {
        setError(t('onboarding.business.errors.logoTooBig'))
      } else {
        setError(e?.message || t('onboarding.business.errors.createFailed'))
      }
    } finally {
      setSubmitting(false);
    }
  };

  const SuccessView = (
    <div className="space-y-5 text-center">
      <div className="flex items-center justify-center">
        <CheckCircle2 className="h-12 w-12 text-brand-600" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-gray-900">¡Tu negocio está listo!</h2>
        <p className="mt-1 text-sm text-gray-600">Ya puedes crear productos y comenzar a cobrar.</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-gray-300 hover:text-gray-900"
        >
          Volver al inicio
        </button>
        <button
          type="button"
          onClick={() => router.push('/pos')}
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
        >
          Ir al POS
        </button>
      </div>
      <p className="text-xs text-gray-500">Podrás editar los datos del negocio en cualquier momento.</p>
    </div>
  );

  const FormView = (
    <form onSubmit={handleSubmit} className="space-y-4 lg:space-y-6" noValidate>
      <div className="grid gap-0 lg:grid-cols-[1.9fr_1.9fr]">
        <div className="flex flex-col rounded-2xl border border-white/60 bg-white/92 p-5 shadow-sm backdrop-blur">
          <div className="mb-4 text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-brand-600">
              Perfil del negocio
            </span>
            <h2 className="mt-3 text-lg font-semibold text-gray-900">Datos básicos</h2>
            <p className="mt-1 text-xs text-gray-500">Esta información se mostrará en tu catálogo y tickets.</p>
          </div>
          <div className="flex flex-col gap-3 lg:gap-4">
            <FancyInput
              label="Nombre comercial"
              value={form.nombre}
              onChange={handleChange('nombre')}
              onBlur={handleBlur('nombre')}
              error={touched.nombre ? validationMessages.nombre : undefined}
              leftIcon={<Store className="h-4 w-4" />}
              placeholder="Ej. Café Aurora"
              required
            />
            <FancyInput
              label="Correo de contacto"
              type="email"
              value={form.correo}
              onChange={handleChange('correo')}
              onBlur={handleBlur('correo')}
              error={touched.correo ? validationMessages.correo : undefined}
              placeholder="contacto@tu-negocio.com"
              hint="Usaremos este correo para comunicaciones administrativas."
            />
            <div className="grid gap-3 xl:grid-cols-2">
              <FancyInput
                label="Teléfono"
                value={form.telefono}
                onChange={handleChange('telefono')}
                onBlur={handleBlur('telefono')}
                error={touched.telefono ? validationMessages.telefono : undefined}
                placeholder="Ej. +52 55 1234 5678"
              />
              <FancyInput
                label="Dirección"
                value={form.direccion}
                onChange={handleChange('direccion')}
                onBlur={handleBlur('direccion')}
                placeholder="Calle, número y ciudad"
                hint="Opcional"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col rounded-2xl border border-white/60 bg-white/92 p-5 shadow-sm backdrop-blur">
          <div className="mb-4 text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">
              Imagen de marca
            </span>
            <h2 className="mt-3 text-lg font-semibold text-gray-900">Personaliza tu presencia</h2>
            <p className="mt-1 text-xs text-gray-500">Usa URLs públicas (Cloudinary, Drive con acceso público, etc.).</p>
          </div>
          <h1 className="text-xl font-bold mb-1">{t('onboarding.business.success.title')}</h1>
          <p className="text-sm text-gray-600 mb-4">{t('onboarding.business.success.subtitle')}</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => router.push('/')} className="fc-btn-secondary">{t('onboarding.business.success.goHome')}</button>
            <button onClick={() => router.push('/pos')} className={`fc-btn-primary bg-brand-600 hover:bg-brand-700`}>{t('onboarding.business.success.goPOS')}</button>
          </div>
          <div className="mt-3 text-xs text-gray-500">{t('onboarding.business.success.note')}</div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      <div className="flex justify-center">
        <button
          type="submit"
          disabled={submitting}
          className="relative inline-flex w-full sm:w-auto sm:min-w-[17rem] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 via-brand-500 to-brand-600 bg-[length:200%_auto] bg-[position:0_0] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[position:100%_0] hover:shadow-md disabled:cursor-not-allowed disabled:from-gray-400 disabled:via-gray-400 disabled:to-gray-400"
        >
          {submitting && (
            <span className="absolute left-5 inline-flex">
              <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </span>
          )}
          {submitting ? 'Creando negocio…' : 'Crear mi negocio'}
        </button>
      </div>
      <p className="text-center text-[11px] text-gray-500">Podrás editar cualquiera de estos datos desde Configuración.</p>
    </form>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-6">
      <LoginCard
        brandMark={<Store className="h-6 w-6" />}
        brandFull
        title="Completa tu negocio"
        subtitle="Añade los datos básicos para comenzar"
        size="wide"
        compact
      >
        {FormView}
      </LoginCard>
    </div>
  );
}

function FancyInput({
  label,
  value,
  onChange,
  onBlur,
  type = 'text',
  placeholder,
  error,
  hint,
  leftIcon,
  required,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  type?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </label>
      <div className="relative">
        {leftIcon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`block w-full rounded-xl border ${
            error ? 'border-rose-300' : 'border-gray-200'
          } bg-white/80 ${
            leftIcon ? 'pl-11' : 'pl-4'
          } pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm backdrop-blur transition focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20`}
        />
      </div>
      {error ? (
        <p className="text-xs text-rose-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-gray-400">{hint}</p>
      ) : null}
    </div>
  );
}