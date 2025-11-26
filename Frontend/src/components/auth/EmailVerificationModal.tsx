'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { api, type AuthUser } from '../../lib/api';
import { useUserStore } from '../../state/userStore';
import { useTranslation } from '../../hooks/useTranslation';

interface EmailVerificationModalProps {
  open: boolean;
  email: string;
  expiresAt?: string | null;
  session: string;
  onClose?: () => void;
  onVerified?: (payload: { verifiedAt: string; user: AuthUser }) => void;
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

  useEffect(() => {
    if (open) {
      setCurrentExpiresAt(expiresAt ?? null);
      setCode('');
      setError(null);
      setInfo(null);
      setResendCooldown(0);
      try {
        if (typeof window !== 'undefined') {
          // prioridad: prop session; fallback: storage
          const stored = window.localStorage.getItem('preRegSession');
          const sess = session || stored || '';
          setCurrentSession(sess);
          if (session) window.localStorage.setItem('preRegSession', session);
          if (expiresAt) window.localStorage.setItem('preRegExpiresAt', expiresAt);
          if (email) window.localStorage.setItem('preRegEmail', email);
        }
      } catch {}
    }
  }, [open, expiresAt, session, email]);

  useEffect(() => {
    setCurrentSession(session);
    try {
      if (typeof window !== 'undefined' && session) {
        window.localStorage.setItem('preRegSession', session);
      }
    } catch {}
  }, [session]);

  useEffect(() => {
    if (!open) return;
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((prev) => Math.max(prev - 1, 0)), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown, open]);

  useEffect(() => {
    if (!open || !currentExpiresAt) return;
    setNow(Date.now());
    const tick = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(tick);
  }, [open, currentExpiresAt]);

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
  }, [currentExpiresAt, now]);

  const handleChange = (value: string) => {
    const sanitized = value.replace(/\D/g, '').slice(0, 6);
    setCode(sanitized);
    if (error) setError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (code.length !== 6) {
      setError(t('auth.register.verification.errors.invalidLength'));
      return;
    }
    setSubmitting(true);
    setError(null);
    setInfo(null);
    try {
      const response = await api.verifyRegister(currentSession, code);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('auth_user', JSON.stringify(response.user));
        window.localStorage.setItem('auth_token', response.token);
        window.localStorage.removeItem('preRegSession');
        window.localStorage.removeItem('preRegExpiresAt');
        window.localStorage.removeItem('preRegEmail');
      }
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
    if (resendCooldown > 0) return;
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
          if (result.expiresAt) window.localStorage.setItem('preRegExpiresAt', result.expiresAt);
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

        {expirationSummary && (
          <div className="mb-3 rounded-md bg-brand-50/80 px-3 py-2 text-xs text-brand-700">
            {expirationSummary}
          </div>
        )}

        {error && (
          <div className="mb-3 rounded-md border border-rose-200 bg-rose-50/80 px-3 py-2 text-xs text-rose-700">
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

          <button
            type="submit"
            disabled={submitting || code.length !== 6}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {submitting && (
              <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
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
      </div>
    </div>
  );
};
