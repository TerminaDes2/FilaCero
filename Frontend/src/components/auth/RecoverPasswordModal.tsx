'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../lib/api';
import { useTranslation } from '../../hooks/useTranslation';
import { FancyInput } from './FancyInput';
import { BrandLogo } from '../BrandLogo';
import { X, ArrowLeft, CheckCircle2, Mail, Lock, KeyRound, Send } from 'lucide-react';

interface RecoverPasswordModalProps {
    open: boolean;
    onClose: () => void;
    initialEmail?: string;
}

type Step = 'request' | 'verify' | 'reset' | 'done';

export const RecoverPasswordModal: React.FC<RecoverPasswordModalProps> = ({
    open,
    onClose,
    initialEmail = '',
}) => {
    const { t } = useTranslation();
    const [step, setStep] = useState<Step>('request');
    const [identifier, setIdentifier] = useState(initialEmail);
    const [session, setSession] = useState<string | null>(null);
    const [resetSession, setResetSession] = useState<string | null>(null);
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [delivery, setDelivery] = useState<string | null>(null);
    const [expiresAt, setExpiresAt] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    // Reset state when opening
    useEffect(() => {
        if (open) {
            setStep('request');
            setIdentifier(initialEmail);
            setSession(null);
            setResetSession(null);
            setCode('');
            setPassword('');
            setPasswordConfirm('');
            setError(null);
            setSuccess(null);
        }
    }, [open, initialEmail]);

    useEffect(() => {
        setIsMounted(true);
        return () => setIsMounted(false);
    }, []);

    const clearMessages = () => {
        setError(null);
        setSuccess(null);
    };

    const handleRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        clearMessages();
        if (!identifier.trim()) return setError('Ingresa correo o número de teléfono.');

        setLoading(true);
        try {
            const json = await api.requestPasswordRecover(identifier.trim());
            setSession(json.session || null);
            setDelivery(json.delivery || null);
            setExpiresAt(json.expiresAt || null);
            setStep('verify');
            setSuccess('Código enviado. Revisa tu correo o SMS.');
        } catch (err: any) {
            setError(err?.message || String(err));
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        clearMessages();
        if (!session) return setError('Sesión inválida. Vuelve a solicitar el código.');
        if (!code.trim()) return setError('Ingresa el código recibido.');

        setLoading(true);
        try {
            const json = await api.verifyPasswordRecover(session, code.trim());
            setResetSession(json.resetSession || null);
            setStep('reset');
            setSuccess('Código verificado. Ingresa tu nueva contraseña.');
        } catch (err: any) {
            setError(err?.message || String(err));
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        clearMessages();
        if (!resetSession) return setError('Sesión inválida. Vuelve a verificar el código.');
        if (!password || !passwordConfirm) return setError('Ingresa y confirma la contraseña.');
        if (password !== passwordConfirm) return setError('Las contraseñas no coinciden.');
        if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');

        setLoading(true);
        try {
            const json = await api.resetPasswordRecover(resetSession, password, passwordConfirm);
            setStep('done');
            setSuccess(json.message || 'Contraseña actualizada correctamente.');
        } catch (err: any) {
            setError(err?.message || String(err));
        } finally {
            setLoading(false);
        }
    };

    if (!isMounted || !open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div className="relative w-full max-w-md transform overflow-hidden rounded-3xl bg-white p-8 shadow-2xl transition-all dark:bg-slate-950 dark:border dark:border-slate-800">

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-900/20">
                        {step === 'done' ? (
                            <CheckCircle2 className="h-8 w-8 text-brand-600 dark:text-brand-400" />
                        ) : (
                            <KeyRound className="h-8 w-8 text-brand-600 dark:text-brand-400" />
                        )}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {step === 'request' && 'Recuperar contraseña'}
                        {step === 'verify' && 'Verificar código'}
                        {step === 'reset' && 'Nueva contraseña'}
                        {step === 'done' && '¡Listo!'}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                        {step === 'request' && 'Ingresa tu correo o teléfono para buscar tu cuenta.'}
                        {step === 'verify' && `Ingresa el código enviado a ${delivery || 'tu contacto'}.`}
                        {step === 'reset' && 'Crea una contraseña segura para tu cuenta.'}
                        {step === 'done' && 'Tu contraseña ha sido actualizada exitosamente.'}
                    </p>
                </div>

                {/* Messages */}
                {error && (
                    <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900/30">
                        {error}
                    </div>
                )}
                {success && step !== 'done' && (
                    <div className="mb-6 rounded-xl bg-green-50 p-4 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400 border border-green-100 dark:border-green-900/30">
                        {success}
                    </div>
                )}

                {/* Forms */}
                <div className="relative">
                    {step === 'request' && (
                        <form onSubmit={handleRequest} className="space-y-6">
                            <FancyInput
                                label="Correo o teléfono"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="usuario@ejemplo.com"
                                leftIcon={<Mail className="h-5 w-5" />}
                            />

                            <button
                                type="submit"
                                disabled={loading || !identifier.trim()}
                                className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition-all hover:shadow-brand-500/40 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                            >
                                {loading ? (
                                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                ) : (
                                    <>
                                        Enviar código <Send className="h-4 w-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    {step === 'verify' && (
                        <form onSubmit={handleVerify} className="space-y-6">
                            <div className="flex justify-center">
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={code}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                        setCode(val);
                                    }}
                                    className="w-full text-center text-3xl font-bold tracking-[0.5em] text-gray-900 dark:text-white bg-transparent border-b-2 border-gray-200 dark:border-slate-700 focus:border-brand-500 focus:outline-none py-2 transition-colors placeholder-gray-200 dark:placeholder-slate-800"
                                    placeholder="000000"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setStep('request')}
                                    className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Atrás
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || code.length < 6}
                                    className="flex-[2] group relative flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition-all hover:shadow-brand-500/40 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                                >
                                    {loading ? (
                                        <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    ) : (
                                        'Verificar'
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 'reset' && (
                        <form onSubmit={handleReset} className="space-y-6">
                            <FancyInput
                                label="Nueva contraseña"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                leftIcon={<Lock className="h-5 w-5" />}
                                isPassword
                                onTogglePassword={() => setShowPassword(!showPassword)}
                            />
                            <FancyInput
                                label="Confirmar contraseña"
                                type={showPasswordConfirm ? 'text' : 'password'}
                                value={passwordConfirm}
                                onChange={(e) => setPasswordConfirm(e.target.value)}
                                leftIcon={<Lock className="h-5 w-5" />}
                                isPassword
                                onTogglePassword={() => setShowPasswordConfirm(!showPasswordConfirm)}
                            />

                            <button
                                type="submit"
                                disabled={loading || !password || !passwordConfirm}
                                className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition-all hover:shadow-brand-500/40 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                            >
                                {loading ? (
                                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                ) : (
                                    'Actualizar contraseña'
                                )}
                            </button>
                        </form>
                    )}

                    {step === 'done' && (
                        <div className="space-y-6">
                            <div className="rounded-2xl bg-green-50 p-6 text-center dark:bg-green-900/10">
                                <p className="text-green-800 dark:text-green-200 font-medium">
                                    ¡Todo listo! Ya puedes iniciar sesión con tu nueva contraseña.
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-full rounded-xl bg-gray-900 px-4 py-3.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-gray-800 hover:shadow-xl active:scale-[0.98] dark:bg-white dark:text-slate-900 dark:hover:bg-gray-100"
                            >
                                Ir a iniciar sesión
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {step === 'request' && (
                    <div className="mt-8 text-center">
                        <button
                            onClick={onClose}
                            className="text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-slate-500 dark:hover:text-slate-300 transition-colors"
                        >
                            Volver al inicio de sesión
                        </button>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};
