'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MailCheck, RefreshCcw, Sparkles, Timer } from 'lucide-react';
import { createPortal } from 'react-dom';
import { api, type AuthUser } from '../../lib/api';
import { useUserStore } from '../../state/userStore';

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
  const { checkAuth, role } = useUserStore();
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
    const expiresAtDate = new Date(currentExpiresAt);
    const diff = expiresAtDate.getTime() - now;
    if (Number.isNaN(diff) || diff <= 0) {
      return 'Tu código caducó. Puedes solicitar uno nuevo al reenviar.';
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
      setError('El código debe tener 6 dígitos.');
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
      onVerified?.(payload);
    } catch {
      setError('No pudimos verificar el código. Intenta nuevamente.');
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
      const data = await api.preRegisterResendCode({
        session: currentSession,
      });
      setCurrentExpiresAt(data.expiresAt);
      setCurrentSession(data.session);
      setResendCooldown(45);
      setInfo('Nuevo código enviado. Revisa tu bandeja principal y promociones.');
      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('preRegSession', data.session);
          window.localStorage.setItem('preRegExpiresAt', data.expiresAt);
        }
      } catch {
        /* noop */
      }
    } catch {
      setError('No pudimos reenviar el código. Intenta de nuevo en unos segundos.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleClose = () => {
    setCode('');
    setError(null);
    setInfo(null);
    setResendCooldown(0);
    onClose?.();
  };

  if (!open || !isMounted) return null;

  const digitSlots = Array.from({ length: 6 }, (_, index) => code[index] ?? ' ');

  return createPortal(
    <div className="fixed inset-0 z-[999] flex items-center justify-center px-4 py-6" role="dialog" aria-modal="true">
      <div className="absolute inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(233,74,111,0.14),transparent_62%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_82%,rgba(60,178,154,0.14),transparent_65%)]" />
      </div>

      <button
        type="button"
        onClick={handleClose}
        className="absolute inset-0 z-10 h-full w-full cursor-pointer bg-transparent"
        aria-label="Cerrar modal"
      />

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

            {!error && !info && expirationSummary && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-xs font-medium text-slate-600">
                {expirationSummary}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                  <span>Introduce los 6 dígitos</span>
                  <span className="font-semibold text-slate-700">{code.length}/6</span>
                </div>
                <div
                  role="group"
                  aria-label="Código de verificación"
                  className="grid grid-cols-6 gap-2"
                  onClick={() => inputRef.current?.focus()}
                >
                  {digitSlots.map((digit, index) => {
                    const isActive = index === code.length && code.length < 6;
                    const hasValue = digit.trim().length > 0;

                    return (
                      <span
                        key={index}
                        className={`flex h-14 items-center justify-center rounded-2xl border text-lg font-semibold tracking-[0.2em] text-slate-900 shadow-sm transition whitespace-pre
                          ${hasValue ? 'border-brand-400 bg-brand-50/80 text-brand-700' : 'border-slate-200 bg-white/80 text-slate-400'}
                          ${isActive ? 'ring-2 ring-brand-200 ring-offset-2 ring-offset-white' : ''}
                        `}
                      >
                        {digit}
                      </span>
                    );
                  })}
                </div>
                <input
                  ref={inputRef}
                  id="verification-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(event) => handleChange(event.target.value)}
                  className="sr-only"
                  disabled={submitting}
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={submitting || code.length !== 6}
                className={`relative inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r ${palette.button} px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-400`}
              >
                {submitting && (
                  <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                )}
                {submitting ? 'Verificando...' : 'Confirmar código'}
              </button>
            </form>

            <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-xs text-slate-500 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || resendLoading}
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 transition hover:text-brand-500 disabled:text-slate-400"
              >
                <RefreshCcw className="h-4 w-4" />
                {resendLoading ? 'Enviando...' : resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar código'}
              </button>
              <p className="text-[11px] sm:text-xs">
                Este paso protege tus datos y activa tus beneficios personalizados.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
    , document.body
  );
};
