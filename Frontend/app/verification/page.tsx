"use client";
import { useUserStore } from "../../src/state/userStore";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Mail,
  Phone,
  IdCard,
  Upload,
  CheckCircle2,
  Send,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import NavbarStore from "../../src/components/shop/navbarStore";
import { api } from "../../src/lib/api";

export default function VerificationPage() {
  const { user, isAuthenticated, loading, checkAuth: userStoreCheckAuth } = useUserStore();
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [credentialFile, setCredentialFile] = useState<File | null>(null);
  const [emailCode, setEmailCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [phoneCode, setPhoneCode] = useState("");
  const [isPhoneCodeSent, setIsPhoneCodeSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState<boolean>(Boolean(user?.sms_verificado));
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneInfo, setPhoneInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/auth/login");
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (user?.numero_telefono) setPhone(user.numero_telefono);
  }, [user]);

  if (loading || !user)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );

 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setCredentialFile(file);
  };

  const handleSendCode = async () => {
    setIsSubmitting(true);
    try {
      // Simula envío del código de verificación al correo
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsCodeSent(true);
    } catch (error) {
      console.error("Error enviando código:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async () => {
    setIsSubmitting(true);
    try {
      // Simula verificación del código
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (emailCode === "123456") {
        setIsEmailVerified(true);
      } else {
        alert("Código incorrecto. Intenta nuevamente.");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Enviar código SMS real ---
  const handleSendSms = async () => {
    setPhoneError(null);
    setPhoneInfo(null);
    if (!phone || phone.trim().length < 6) {
      setPhoneError("Ingresa un número válido (mínimo 6 caracteres)");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.startSmsVerification(phone.trim(), "sms");
      setIsPhoneCodeSent(true);
      setPhoneInfo(
        res.expiresAt
          ? `Código enviado. Expira en ${new Date(res.expiresAt).toLocaleTimeString()}`
          : "Código enviado. Revisa tu teléfono."
      );
    } catch (err: any) {
      setPhoneError(err?.message || "Error enviando SMS");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Verificar código SMS ---
  const handleVerifySms = async () => {
    setPhoneError(null);
    if (!phoneCode || phoneCode.trim().length < 4) {
      setPhoneError("Ingresa el código recibido (mínimo 4 dígitos)");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.checkSmsVerification(phone.trim(), phoneCode.trim());
      if (res.verified) {
        setIsPhoneVerified(true);
        setPhoneInfo("Número verificado correctamente.");
        // Refrescar datos del usuario
        await userStoreCheckAuth();
      } else {
        setPhoneError("Código incorrecto. Intenta nuevamente.");
      }
    } catch (err: any) {
      setPhoneError(err?.message || "Error verificando código");
    } finally {
      setIsSubmitting(false);
    }
  };

  // (Ya obtenido de useUserStore en el destructuring inicial)

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setSuccess(true);
      setTimeout(() => router.push("/user"), 2000);
    } catch (err) {
      console.error("Error al enviar verificación:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900">
      <NavbarStore />

      <main className="flex-1 pt-24 pb-20 px-6 md:px-10 lg:px-16 max-w-3xl mx-auto space-y-10">
        <header className="text-center space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-brand-600">
            Verifica tu identidad
          </p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Configuración de seguridad
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            Completa los pasos para proteger tu cuenta y acceder a los beneficios estudiantiles.
          </p>
        </header>

        {/* ---------------------- EMAIL ---------------------- */}
        <section className={`
          relative overflow-hidden rounded-3xl border p-6 transition shadow-sm
          ${isEmailVerified
            ? "border-teal-300 bg-teal-50 text-teal-700"
            : "border-slate-200 bg-white dark:bg-slate-800 text-slate-700"}
        `}>
          <div className="absolute inset-0 bg-gradient-to-br from-brand-200/30 via-transparent to-transparent pointer-events-none" />
          
          <div className="relative flex items-start gap-4">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/70 shadow text-brand-600">
              <Mail className="h-5 w-5" />
            </span>

            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-slate-900 dark:text-white">Correo electrónico</h2>
                <span className={`
                  inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold
                  ${isEmailVerified
                    ? "bg-teal-100 text-teal-600"
                    : "bg-rose-100 text-rose-600"}
                `}>
                  {isEmailVerified ? <CheckCircle2 className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                  {isEmailVerified ? "Verificado" : "Sin verificar"}
                </span>
              </div>

              <p className="text-sm">{user.correo_electronico}</p>

              {!isEmailVerified && (
                <>
                  {!isCodeSent ? (
                    <button
                      onClick={handleSendCode}
                      className="mt-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      Enviar código
                    </button>
                  ) : (
                    <div className="space-y-2 mt-3">
                      <input
                        type="text"
                        value={emailCode}
                        onChange={(e) => setEmailCode(e.target.value)}
                        placeholder="Ingresa el código"
                        className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-slate-700"
                      />
                      <button
                        onClick={handleVerifyCode}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg"
                      >
                        Verificar
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* ---------------------- PHONE ---------------------- */}
        <section className={`
          relative overflow-hidden rounded-3xl border p-6 transition shadow-sm
          ${isPhoneVerified
            ? "border-teal-300 bg-teal-50 text-teal-700"
            : "border-slate-200 bg-white dark:bg-slate-800 text-slate-700"}
        `}>
          <div className="absolute inset-0 bg-gradient-to-br from-green-200/30 via-transparent to-transparent pointer-events-none" />
          
          <div className="relative flex items-start gap-4">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/70 shadow text-green-600">
              <Phone className="h-5 w-5" />
            </span>

            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-slate-900 dark:text-white">Número de teléfono</h2>
                <span className={`
                  inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold
                  ${isPhoneVerified
                    ? "bg-teal-100 text-teal-600"
                    : "bg-rose-100 text-rose-600"}
                `}>
                  {isPhoneVerified ? <CheckCircle2 className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                  {isPhoneVerified ? "Verificado" : "Sin verificar"}
                </span>
              </div>

              <input
                type="tel"
                value={phone}
                disabled={isPhoneVerified}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700"
              />

              {!isPhoneVerified && (
                <>
                  {!isPhoneCodeSent ? (
                    <button
                      onClick={handleSendSms}
                      className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg"
                    >
                      Enviar SMS
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <input
                        value={phoneCode}
                        onChange={(e) => setPhoneCode(e.target.value)}
                        placeholder="Código SMS"
                        className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleVerifySms}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg"
                        >
                          Verificar
                        </button>
                        <button
                          onClick={handleSendSms}
                          className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-300 rounded-lg"
                        >
                          Reenviar
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {phoneError && <p className="text-sm text-red-600">{phoneError}</p>}
              {phoneInfo && <p className="text-sm text-green-600">{phoneInfo}</p>}
            </div>
          </div>
        </section>

        {/* ---------------------- CREDENTIAL ---------------------- */}
        <section className={`
          relative overflow-hidden rounded-3xl border p-6 transition shadow-sm
          ${credentialFile
            ? "border-brand-300 bg-brand-50"
            : "border-slate-200 bg-white dark:bg-slate-800"}
        `}>
          <div className="absolute inset-0 bg-gradient-to-br from-purple-200/30 via-transparent to-transparent pointer-events-none" />

          <div className="relative flex items-start gap-4">
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/70 shadow text-purple-600">
              <IdCard className="h-5 w-5" />
            </span>

            <div className="flex-1 space-y-3">
              <h2 className="font-semibold text-slate-900 dark:text-white">Credencial estudiantil</h2>

              <div className="border-2 mt-3 border-dashed rounded-xl p-5 flex flex-col items-center text-center hover:border-brand-500 transition">
                {credentialFile ? (
                  <p className="text-sm">{credentialFile.name}</p>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400" />
                    <p className="text-gray-500 mt-2">Sube tu credencial</p>
                    <p className="text-xs text-gray-400">JPG, PNG o PDF</p>
                  </>
                )}

                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  className="mt-3"
                  onChange={(e) => setCredentialFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ----------- SUBMIT ----------- */}
        <div className="flex justify-between items-center">

          {/* Botón de regresar */}
          <Link
            href="/user"
            className="
              px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition
              bg-brand-400 text-white hover:bg-brand-600
            ">
            Regresar
          </Link>

          {/* Botón Guardar (sin verificación) */}
          <button
            onClick={handleSubmit}
            className="
              px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition
              bg-brand-500 text-white hover:bg-brand-600
            "
          >
            {success ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                ¡Guardado!
              </>
            ) : (
              "Guardar"
            )}
          </button>

        </div>

      </main>
    </div>
  );
}
