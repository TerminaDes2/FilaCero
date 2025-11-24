"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, Send, ShieldCheck } from "lucide-react";
import NavbarStore from "../../../src/components/shop/navbarStore";
import { api } from "../../../src/lib/api";
import { useUserStore } from "../../../src/state/userStore";

export default function PhoneVerificationPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading, checkAuth } = useUserStore();

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [verified, setVerified] = useState<boolean>(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/auth/login");
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (user?.numero_telefono) setPhone(user.numero_telefono);
    if (user?.sms_verificado) setVerified(Boolean(user.sms_verificado));
  }, [user]);

  const sendSms = async () => {
    setError(null);
    setInfo(null);
    const normalized = phone.trim();
    if (!normalized || normalized.length < 6) {
      setError("Ingresa un número válido (mínimo 6 caracteres)");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.startSmsVerification(normalized, "sms");
      setIsCodeSent(true);
      setInfo(
        res.expiresAt
          ? `Código enviado. Expira en ${new Date(res.expiresAt).toLocaleTimeString()}`
          : "Código enviado. Revisa tu teléfono."
      );
    } catch (e: any) {
      setError(e?.message || "Error enviando SMS");
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyCode = async () => {
    setError(null);
    const normalized = code.trim();
    if (!normalized || normalized.length < 4) {
      setError("Ingresa el código recibido (mínimo 4 dígitos)");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.checkSmsVerification(phone.trim(), normalized);
      if (res.verified) {
        setVerified(true);
        setInfo("Número verificado correctamente.");
        await checkAuth();
        // Redirigir automáticamente al perfil de usuario
        router.replace("/user");
      } else {
        setError("Código incorrecto. Intenta nuevamente.");
      }
    } catch (e: any) {
      setError(e?.message || "Error verificando código");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900">
      <NavbarStore />
      <main className="flex-1 pt-24 pb-16 px-6 md:px-10 lg:px-16 max-w-xl mx-auto space-y-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Verificar teléfono</h1>

        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Número de teléfono</h2>
          </div>

          <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">Tu número</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={verified || isSubmitting}
            placeholder="Ej. +34 600 000 000"
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white mb-2"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Usa un número válido para recibir el código por SMS.</p>

          {!verified && (
            <div className="space-y-3">
              {!isCodeSent ? (
                <button
                  onClick={sendSms}
                  disabled={isSubmitting || !phone}
                  className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" /> {isSubmitting ? "Enviando..." : "Enviar SMS"}
                </button>
              ) : (
                <div className="space-y-2">
                  <label className="block text-sm text-gray-600 dark:text-gray-400">Código recibido</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Ej. 1234"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={verifyCode}
                      disabled={isSubmitting || !code}
                      className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg disabled:opacity-50"
                    >
                      {isSubmitting ? "Verificando..." : "Verificar"}
                    </button>
                    <button
                      onClick={sendSms}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-200 rounded-lg"
                    >
                      Reenviar
                    </button>
                  </div>
                </div>
              )}
              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
              {info && !error && <p className="text-sm text-green-600 dark:text-green-400">{info}</p>}
            </div>
          )}

          {verified && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mt-2">
              <ShieldCheck className="w-5 h-5" />
              <span>Teléfono verificado</span>
            </div>
          )}
        </section>

        <div className="flex justify-end">
          <button
            onClick={() => router.push("/verification")}
            className="px-4 py-2 text-brand-600 hover:text-brand-700 underline"
          >
            Volver a verificación
          </button>
        </div>
      </main>
    </div>
  );
}
