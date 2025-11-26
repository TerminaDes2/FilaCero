"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, Phone, RefreshCcw, ShieldCheck, Timer, X, Check } from 'lucide-react';
import { api } from '../../lib/api';
import { useUserStore } from '../../state/userStore';
import { useTranslation } from '../../hooks/useTranslation';

interface SmsVerificationModalProps {
  open: boolean;
  defaultPhone?: string | null;
  onClose?: () => void;
  onVerified?: (payload: { phone: string }) => void;
}

export const SmsVerificationModal: React.FC<SmsVerificationModalProps> = ({
  open,
  defaultPhone,
  onClose,
  onVerified,
}) => {
  const { checkAuth } = useUserStore();
  const { t } = useTranslation();

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    setPhone(defaultPhone ?? '');
    setCode('');
    setError(null);
    setInfo(null);
    setCodeSent(false);
    setExpiresAt(null);
    setResendCooldown(0);
  }, [open, defaultPhone]);

  useEffect(() => {
    if (!open) return;
    if (!expiresAt) return;

    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [open, expiresAt]);

  useEffect(() => {
    if (!open) return;
    if (!resendCooldown) return;

    const interval = window.setInterval(() => {
      setResendCooldown((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [open, resendCooldown]);

  const expirationSummary = useMemo(() => {
    if (!expiresAt) return null;
    try {
      const expiresDate = new Date(expiresAt);
      if (Number.isNaN(expiresDate.getTime())) return null;
      const remainingMs = expiresDate.getTime() - now;
      if (remainingMs <= 0) return t('auth.register.smsVerification.expires');
      const totalMinutes = Math.floor(remainingMs / 60000);
      const totalSeconds = Math.floor((remainingMs % 60000) / 1000);
      return `${t('auth.register.smsVerification.expiresIn')} ${totalMinutes}m ${totalSeconds.toString().padStart(2, '0')}s`;
    } catch {
      return null;
    }
  }, [expiresAt, now, t]);

  const handleSendCode = async () => {
    setError(null);
    setInfo(null);

    const normalizedPhone = phone.trim();
    if (!normalizedPhone || normalizedPhone.length < 6) {
      setError(t('auth.register.smsVerification.errors.phoneRequired'));
      return;
    }

    setIsSending(true);
    try {
      const response = await api.startSmsVerification(normalizedPhone, 'sms');
      setCodeSent(true);
      setExpiresAt(response?.expiresAt ?? null);
      setInfo(t('auth.register.smsVerification.sent'));
      setResendCooldown(45);
    } catch (err: any) {
      setError(err?.message || t('auth.register.smsVerification.errors.sendGeneric'));
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyCode = async () => {
    setError(null);

    const normalizedCode = code.trim();
    if (!normalizedCode || normalizedCode.length < 4) {
      setError(t('auth.register.smsVerification.errors.codeRequired'));
      return;
    }

    const normalizedPhone = phone.trim();
    setIsVerifying(true);

    try {
      const result = await api.checkSmsVerification(normalizedPhone, normalizedCode);
      if (result?.verified) {
        setInfo(t('auth.register.smsVerification.success'));
        await checkAuth();
        onVerified?.({ phone: normalizedPhone });
        setCode('');
      } else {
        setError(t('auth.register.smsVerification.errors.invalidCode'));
      }
    } catch (err: any) {
      setError(err?.message || t('auth.register.smsVerification.errors.verifyGeneric'));
    } finally {
      setIsVerifying(false);
    }
  };

  if (!open || !isMounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-950/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200/60 bg-brand-50/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-brand-600 dark:border-brand-400/40 dark:bg-brand-500/20 dark:text-brand-200">
              <MessageCircle className="h-4 w-4" strokeWidth={2.4} />
              {t('auth.register.smsVerification.badge')}
            </div>
            <h2 className="mt-3 text-xl font-semibold text-slate-900 dark:text-slate-100">
              {t('auth.register.smsVerification.title')}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {t('auth.register.smsVerification.description')}
            </p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              aria-label={t('auth.register.smsVerification.closeAria')}
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="mt-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400" htmlFor="sms-phone-input">
              {t('auth.register.smsVerification.phone.label')}
            </label>
            <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white/80 p-3 shadow-sm transition focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-200 dark:border-slate-700 dark:bg-slate-800/80 dark:focus-within:border-brand-300/70 dark:focus-within:ring-brand-300/30">
              <Phone className="h-5 w-5 text-brand-500 dark:text-brand-300" />
              <input
                id="sms-phone-input"
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder={t('auth.register.smsVerification.phone.placeholder')}
                className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                disabled={isSending || isVerifying}
              />
            </div>
          </div>

          <div className="space-y-3">
            {!codeSent ? (
              <button
                type="button"
                onClick={handleSendCode}
                disabled={isSending || !phone.trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-slate-900"
              >
                {isSending ? (
                  <>
                    <RefreshCcw className="h-4 w-4 animate-spin" />
                    {t('auth.register.smsVerification.send.sending')}
                  </>
                ) : (
                  <>
                    <SendIcon />
                    {t('auth.register.smsVerification.send.action')}
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400" htmlFor="sms-code-input">
                    {t('auth.register.smsVerification.code.label')}
                  </label>
                  <div className="mt-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-white/80 p-3 shadow-sm transition focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-200 dark:border-slate-700 dark:bg-slate-800/80 dark:focus-within:border-brand-300/70 dark:focus-within:ring-brand-300/30">
                    <ShieldCheck className="h-5 w-5 text-emerald-500 dark:text-emerald-300" />
                    <input
                      id="sms-code-input"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={code}
                      onChange={(event) => setCode(event.target.value.replace(/[^0-9]/g, ''))}
                      placeholder={t('auth.register.smsVerification.code.placeholder')}
                      className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-500"
                      disabled={isVerifying}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleVerifyCode}
                    disabled={isVerifying || code.trim().length < 4}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-slate-900"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCcw className="h-4 w-4 animate-spin" />
                        {t('auth.register.smsVerification.verify.verifying')}
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        {t('auth.register.smsVerification.verify.action')}
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (resendCooldown > 0) return;
                      void handleSendCode();
                    }}
                    disabled={isSending || resendCooldown > 0}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-brand-400 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:border-brand-300 dark:hover:text-brand-200 dark:focus:ring-brand-300/30"
                  >
                    <RefreshCcw className={`h-4 w-4 ${isSending ? 'animate-spin' : ''}`} />
                    {resendCooldown > 0
                      ? `${t('auth.register.smsVerification.send.resendIn')} ${resendCooldown}s`
                      : t('auth.register.smsVerification.send.resend')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {expirationSummary && (
            <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50/80 px-3 py-2 text-xs text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-200">
              <Timer className="h-4 w-4" />
              {expirationSummary}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-rose-300 bg-rose-50/80 px-3 py-2 text-sm text-rose-700 dark:border-rose-400/60 dark:bg-rose-500/15 dark:text-rose-200">
              {error}
            </div>
          )}

          {info && !error && (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-500/50 dark:bg-emerald-500/15 dark:text-emerald-200">
              {info}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

const SendIcon: React.FC = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z" />
    <path d="M22 2 11 13" />
  </svg>
);
