'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MailCheck, RefreshCcw, Sparkles, Timer } from 'lucide-react';
import { createPortal } from 'react-dom';
import { api, type AuthUser } from '../../lib/api';
import { useUserStore } from '../../state/userStore';
import { useTranslation } from '../../hooks/useTranslation';

interface EmailVerificationModalProps {
  open: boolean;
  email: string;
  expiresAt?: string | null;
  session: string;
  onClose?: () => void;
  onVerified?: (payload: { token: string; user: AuthUser }) => void;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  open,
  email,
  expiresAt,
  session,
  onClose,
  onVerified,
}) => {
  const { checkAuth } = useUserStore();
  const { t } = useTranslation();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [currentExpiresAt, setCurrentExpiresAt] = useState<string | null>(expiresAt ?? null);
  const [currentSession, setCurrentSession] = useState<string>(session);
  const [now, setNow] = useState(() => Date.now());
  const [isMounted, setIsMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const palette = useMemo(
    () =>
      role === 'OWNER'
        ? {
            gradient: 'from-[#3CB29A] via-[#32A892] to-[#1E8E7C]',
            chip: 'bg-white/20 text-white/95',
            button: 'from-[#32A892] to-[#1E8E7C]',
            glow: 'bg-[#3CB29A]',
          }
        : {
            gradient: 'from-[#F58AAB] via-[#E94A6F] to-[#D13E66]',
            chip: 'bg-white/20 text-white/95',
            button: 'from-[#E94A6F] to-[#D13E66]',
            glow: 'bg-[#E94A6F]',
          },
    [role]
  );

  useEffect(() => {
    if (!open) return;

    setCurrentExpiresAt(expiresAt ?? null);
    setCode('');
    setError(null);
    setInfo(null);
    setResendCooldown(0);

    try {
      if (typeof window !== 'undefined') {
        const stored = window.localStorage.getItem('preRegSession');
        const nextSession = session || stored || '';
        setCurrentSession(nextSession);
        if (session) window.localStorage.setItem('preRegSession', session);
        if (expiresAt) window.localStorage.setItem('preRegExpiresAt', expiresAt);
        if (email) window.localStorage.setItem('preRegEmail', email);
      }
    } catch {
      /* noop */
    }
  }, [open, expiresAt, session, email]);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    setCurrentSession(session);
    try {
      if (typeof window !== 'undefined' && session) {
        window.localStorage.setItem('preRegSession', session);
      }
    } catch {
      /* noop */
    }
  }, [session]);

  useEffect(() => {
    if (!open) return;
    if (!currentExpiresAt) return;

    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [open, currentExpiresAt]);

  useEffect(() => {
    if (!open) return;
    if (!resendCooldown) return;

    const interval = window.setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [open, resendCooldown]);

  const expirationSummary = useMemo(() => {
    if (!currentExpiresAt) return null;
    try {
      const expiresDate = new Date(currentExpiresAt);
      if (Number.isNaN(expiresDate.getTime())) return null;
      const remainingMs = expiresDate.getTime() - now;
      if (remainingMs <= 0) return 'El código actual ha expirado.';
      const totalMinutes = Math.floor(remainingMs / 60000);
      const totalSeconds = Math.floor((remainingMs % 60000) / 1000);
      return `${t('auth.register.verification.expiresPrefix')} ${totalMinutes}m ${totalSeconds.toString().padStart(2, '0')}s`;
    } catch {
      return null;
    }

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000)
      .toString()
      .padStart(2, '0');

    return `Expira en ${minutes}:${seconds}.`;
  }, [currentExpiresAt, now]);

  const handleChange = (value: string) => {
    const sanitized = value.replace(/[^0-9]/g, '').slice(0, 6);
    setCode(sanitized);
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (code.length !== 6) {
      setError(t('auth.register.verification.errors.invalidLength'));
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = await api.preRegisterVerifyEmail({
        code,
        session: currentSession,
      });
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('auth_token', payload.token);
          window.localStorage.setItem('auth_user', JSON.stringify(payload.user));
          window.localStorage.removeItem('preRegSession');
          window.localStorage.removeItem('preRegExpiresAt');
          window.localStorage.removeItem('preRegEmail');
        }
      } catch {
        /* noop */
      }
      setInfo('Correo verificado correctamente. Redirigiendo...');
      await checkAuth();
      setCode('');
      onVerified?.({ verifiedAt: new Date().toISOString(), user: response.user });
    } catch (err: any) {
      setError(err?.message || t('auth.register.verification.errors.verifyGeneric'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;

    setResendLoading(true);
    setError(null);
    setInfo(null);

    try {
      const result = await api.resendRegister(currentSession);
      setInfo(t('auth.register.verification.info.resent'));
      setCurrentExpiresAt(result.expiresAt);
      setCurrentSession(result.session);
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('preRegSession', data.session);
          window.localStorage.setItem('preRegExpiresAt', data.expiresAt);
        }
      } catch {}
      setResendCooldown(45);
    } catch (err: any) {
      setError(err?.message || t('auth.register.verification.errors.resendGeneric'));
    } finally {
      setResendLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{t('auth.register.verification.title')}</h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
              aria-label={t('auth.register.verification.closeAria')}
            >
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>

        <p className="text-sm text-gray-600 mb-4">
          {t('auth.register.verification.sentPrefix')} <span className="font-medium text-gray-900">{email}</span>. {t('auth.register.verification.sentSuffix')}
        </p>

  const digitSlots = Array.from({ length: 6 }, (_, index) => code[index] ?? ' ');

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center px-4 py-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(233,74,111,0.14),transparent_62%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_82%,rgba(60,178,154,0.14),transparent_65%)]" />
      </div>

        {info && (
          <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-700">
            {info}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="verification-code" className="block text-xs font-medium text-gray-700">
              {t('auth.register.verification.field.label')}
            </label>
            <input
              id="verification-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) => handleChange(event.target.value)}
              className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-lg font-semibold tracking-[0.45em] text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              placeholder={t('auth.register.verification.field.placeholder')}
              disabled={submitting}
              autoFocus
            />
          </div>

      <section
        className="relative z-20 w-full max-w-4xl overflow-hidden rounded-[32px] border border-white/40 bg-white/90 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.26)] backdrop-blur-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
          <aside className={`relative hidden min-h-full flex-col justify-between border-r border-white/40 bg-gradient-to-br ${palette.gradient} px-8 py-9 text-white lg:flex`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_65%)]" aria-hidden />
            <div className={`absolute -left-16 top-10 h-36 w-36 rounded-full ${palette.glow} opacity-30 blur-3xl`} aria-hidden />
            <div className={`absolute -right-10 bottom-6 h-44 w-44 rounded-full ${palette.glow} opacity-25 blur-[90px]`} aria-hidden />

            <div className="relative flex flex-col gap-6">
              <span className={`inline-flex items-center gap-2 self-start rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] ${palette.chip}`}>
                <Sparkles className="h-4 w-4" strokeWidth={2.5} />
                Paso 2 de 2
              </span>
              <div className="flex items-start gap-4">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 shadow-lg">
                  <MailCheck className="h-6 w-6" strokeWidth={2.3} />
                </span>
                <div className="space-y-3">
                  <h1 className="text-2xl font-semibold leading-snug text-white/95">
                    Verifica tu correo para activar la experiencia completa
                  </h1>
                  <p className="text-sm text-white/75">
                    Enviamos un código dinámico a <span className="font-semibold text-white">{email}</span>. Es nuestro filtro de seguridad para protegerte y personalizar el acceso a tu panel.
                  </p>
                </div>
              </div>
            </div>

            <ul className="relative mt-10 space-y-4 text-sm text-white/80">
              <li className="flex items-center gap-3">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/50 bg-white/15 text-xs font-semibold text-white">01</span>
                Revisa bandeja principal y promociones. El código expira rápido.
              </li>
              <li className="flex items-center gap-3">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/50 bg-white/15 text-xs font-semibold text-white">02</span>
                Ingresa los 6 dígitos aquí y activaremos tu cuenta al instante.
              </li>
              <li className="flex items-center gap-3">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/50 bg-white/15 text-xs font-semibold text-white">03</span>
                ¿No llegó? Puedes reenviarlo cada 45 segundos desde esta pantalla.
              </li>
            </ul>

            <div className="relative isolate mt-12 flex items-center gap-3 rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-xs text-white/80 backdrop-blur">
              <Timer className="h-5 w-5" strokeWidth={2.5} />
              <p className="font-medium">
                {expirationSummary ?? 'Ingresa el código antes de que expire para evitar repetir el proceso.'}
              </p>
            </div>
          </aside>

          <div className="relative flex flex-col gap-6 px-6 py-7 sm:px-9">
            <div className="flex flex-col gap-3">
              <span className="inline-flex w-max items-center gap-2 rounded-full border border-brand-100 bg-brand-50/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-brand-600">
                Validación requerida
              </span>
              <h2 className="text-xl font-semibold text-slate-900 sm:text-2xl">
                Ingresa tu código de verificación
              </h2>
              <p className="text-sm text-slate-600">
                Es válido por tiempo limitado. Si no lo ves en tu bandeja principal, revisa spam o promociones.
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50/70 px-4 py-3 text-xs font-medium text-rose-700">
                {error}
              </div>
            )}

            {info && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-xs font-medium text-emerald-700">
                {info}
              </div>
            )}
            {submitting ? t('auth.register.verification.submit.submitting') : t('auth.register.verification.submit.confirm')}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || resendLoading}
            className="font-medium text-brand-600 hover:text-brand-500 disabled:text-gray-400"
          >
            {resendLoading ? t('auth.register.verification.resend.sending') : resendCooldown > 0 ? `${t('auth.register.verification.resend.waitPrefix')} ${resendCooldown}s` : t('auth.register.verification.resend.action')}
          </button>
          {!onClose && <span className="text-gray-400">{t('auth.register.verification.note')}</span>}
        </div>
      </section>
    </div>
    , document.body
  );
};
