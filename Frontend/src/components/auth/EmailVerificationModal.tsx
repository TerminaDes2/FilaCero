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
  }, [currentExpiresAt, now, t]);

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
      onVerified?.(payload);
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
          window.localStorage.setItem('preRegSession', result.session);
          window.localStorage.setItem('preRegExpiresAt', result.expiresAt);
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

  if (!isMounted) return null;

  return createPortal(
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

        {expirationSummary && (
          <div className="mb-3 rounded-md border border-blue-200 bg-blue-50/80 px-3 py-2 text-xs text-blue-700 flex items-center gap-2">
            <Timer className="h-4 w-4" />
            {expirationSummary}
          </div>
        )}

        {error && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50/80 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}

        {info && (
          <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-700">
            {info}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="verification-code" className="block text-xs font-medium text-gray-700 mb-2">
              {t('auth.register.verification.field.label')}
            </label>
            <input
              ref={inputRef}
              id="verification-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) => handleChange(event.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-center text-lg font-semibold tracking-[0.45em] text-gray-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              placeholder={t('auth.register.verification.field.placeholder')}
              disabled={submitting}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={code.length !== 6 || submitting}
            className="w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? t('auth.register.verification.submit.submitting') : t('auth.register.verification.submit.confirm')}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || resendLoading}
            className="font-medium text-brand-600 hover:text-brand-500 disabled:text-gray-400 transition"
          >
            {resendLoading ? t('auth.register.verification.resend.sending') : resendCooldown > 0 ? `${t('auth.register.verification.resend.waitPrefix')} ${resendCooldown}s` : t('auth.register.verification.resend.action')}
          </button>
          {!onClose && <span className="text-gray-400">{t('auth.register.verification.note')}</span>}
        </div>
      </div>
    </div>,
    document.body
  );
};
