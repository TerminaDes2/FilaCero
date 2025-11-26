"use client";
import React, { useState } from 'react';
import { api } from '../../../src/lib/api';
import { BrandLogo } from '../../../src/components/BrandLogo';
import { AuthDynamicBackground } from '../../../src/components/auth/AuthDynamicBackground';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? '';
const BASE = API_BASE || '';

export default function RecoverPage() {
  const [step, setStep] = useState<'request' | 'verify' | 'reset' | 'done'>('request');
  const [identifier, setIdentifier] = useState('');
  const [session, setSession] = useState<string | null>(null);
  const [resetSession, setResetSession] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [delivery, setDelivery] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  React.useEffect(() => {
    try {
      console.debug('[recover.page] build-time NEXT_PUBLIC_API_BASE=', process.env.NEXT_PUBLIC_API_BASE, 'computed BASE=', BASE, 'location=', typeof window !== 'undefined' ? window.location.origin : null);
    } catch {}
  }, []);

  function clearMessages() {
    setError(null);
    setSuccess(null);
  }

  async function handleRequest(e: React.FormEvent) {
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
    } catch (err: unknown) {
      const msg = (err as any)?.message || String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
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
    } catch (err: unknown) {
      const msg = (err as any)?.message || String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
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
    } catch (err: unknown) {
      const msg = (err as any)?.message || String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <AuthDynamicBackground />
      <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden px-4 py-6">

        <div className="fixed top-4 left-4 z-50">
          <BrandLogo withWordmark size={40} asLink={true} />
        </div>

        <div className="w-full max-w-sm sm:max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Recuperar contraseña</h1>
              <p className="text-gray-600 text-sm">Solicita un código para recuperar el acceso a tu cuenta</p>
            </div>

            <div className="max-w-md mx-auto mt-0 p-0 bg-transparent rounded shadow-none">

      {error && <div className="mb-4 text-sm text-red-700">{error}</div>}
      {success && <div className="mb-4 text-sm text-green-700">{success}</div>}

      {step === 'request' && (
        <form onSubmit={handleRequest} className="space-y-4">
          <label className="block">
            <span className="text-sm">Correo o teléfono</span>
            <input
              className="mt-1 block w-full border rounded px-3 py-2"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="usuario@dominio.com o +521XXXXXXXXXX"
            />
          </label>

          <button
            className="group relative w-full inline-flex justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white text-sm font-semibold px-4 py-2 shadow-sm hover:shadow-md disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Enviar código'}
          </button>

          <div className="text-sm text-gray-500">
            Si recuerdas tu contraseña puedes iniciar sesión en la página de login.
          </div>
        </form>
      )}

      {step === 'verify' && (
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="text-sm text-gray-700">Se envió un código por <strong>{delivery}</strong>.</div>
          {expiresAt && <div className="text-sm text-gray-500">Expira: {new Date(expiresAt).toLocaleString()}</div>}
          <label className="block">
            <span className="text-sm">Código (6 dígitos)</span>
            <input
              className="mt-1 block w-full border rounded px-3 py-2"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
            />
          </label>

          <div className="flex gap-2">
            <button
              className="flex-1 group relative inline-flex justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white text-sm font-semibold px-4 py-2 shadow-sm hover:shadow-md disabled:opacity-60"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Verificando...' : 'Verificar código'}
            </button>

            <button
              type="button"
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded"
              onClick={() => { setStep('request'); setSession(null); setCode(''); }}
            >
              Volver
            </button>
          </div>
        </form>
      )}

      {step === 'reset' && (
        <form onSubmit={handleReset} className="space-y-4">
          <label className="block">
            <span className="text-sm">Nueva contraseña</span>
            <input
              type="password"
              className="mt-1 block w-full border rounded px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-sm">Confirmar nueva contraseña</span>
            <input
              type="password"
              className="mt-1 block w-full border rounded px-3 py-2"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
            />
          </label>

          <div className="flex gap-2">
            <button
              className="flex-1 group relative inline-flex justify-center items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 text-white text-sm font-semibold px-4 py-2 shadow-sm hover:shadow-md disabled:opacity-60"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>

            <button
              type="button"
              className="flex-1 bg-gray-200 text-gray-800 py-2 rounded"
              onClick={() => { setStep('request'); setResetSession(null); setPassword(''); setPasswordConfirm(''); }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

            {step === 'done' && (
              <div className="space-y-4">
                <div className="text-green-700">{success ?? 'Contraseña actualizada exitosamente.'}</div>
                <a href="/auth/login" className="text-brand-600">Ir a iniciar sesión</a>
              </div>
            )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
