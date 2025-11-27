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
  ArrowRight,
  Loader2,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import NavbarStore from "../../src/components/shop/navbarStore";
import { api } from "../../src/lib/api";
import { VerificationCard } from "../../src/components/verification/VerificationCard";
import { BrandLogo } from "../../src/components/BrandLogo";

export default function VerificationPage() {
  const { user, isAuthenticated, loading, checkAuth: userStoreCheckAuth } = useUserStore();
  const router = useRouter();

  // Form States
  const [phone, setPhone] = useState("");
  const [credentialFile, setCredentialFile] = useState<File | null>(null);
  const [emailCode, setEmailCode] = useState("");

  // UI States
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // SMS States
  const [phoneCode, setPhoneCode] = useState("");
  const [isPhoneCodeSent, setIsPhoneCodeSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState<boolean>(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneInfo, setPhoneInfo] = useState<string | null>(null);

  // Credential States
  const [credentialError, setCredentialError] = useState<string | null>(null);
  const [credentialSuccess, setCredentialSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push("/auth/login");
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (user) {
      if (user.numero_telefono) setPhone(user.numero_telefono);
      setIsPhoneVerified(Boolean(user.sms_verificado));
      // Assuming email is verified if we are here, or we could check a field
      // For this demo, let's assume if they have an account, email is verified or needs verification
      // If there's a field user.email_verified, use it. Otherwise default to false or true based on logic.
      // Let's assume false for demo purposes unless we have a field.
      // setIsEmailVerified(Boolean(user.email_verified)); 
    }
  }, [user]);

  if (loading || !user)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCredentialFile(file);
      setCredentialError(null);
    }
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

  const handleCredentialUpload = async () => {
    if (!credentialFile) return;
    setIsSubmitting(true);
    setCredentialError(null);

    try {
      const res = await api.verifyCredentialUpload(credentialFile);
      const isVerified = res.message?.includes('completada') || res.message?.includes('exitosa');
      if (isVerified) {
        setCredentialSuccess("Credencial verificada exitosamente.");
        await userStoreCheckAuth();
      } else {
        setCredentialError(res?.message || "No se pudo verificar la credencial");
      }
    } catch (err: any) {
      setCredentialError(err?.message || "Error al subir la credencial");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate progress
  const steps = [
    { id: 'email', verified: isEmailVerified },
    { id: 'phone', verified: isPhoneVerified },
    { id: 'id', verified: !!credentialSuccess } // Simplified for demo
  ];
  const completedSteps = steps.filter(s => s.verified).length;
  const progress = (completedSteps / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <NavbarStore />

      <main className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mx-auto max-w-4xl text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
            Centro de Verificación
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-slate-400">
            Completa estos pasos para verificar tu identidad y desbloquear todas las funciones de FilaCero.
          </p>

          {/* Progress Bar */}
          <div className="mt-8 max-w-md mx-auto">
            <div className="flex justify-between text-sm font-medium text-gray-600 dark:text-slate-400 mb-2">
              <span>Tu progreso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-1000 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-3xl space-y-6">

          {/* 1. Email Verification */}
          <VerificationCard
            title="Correo Electrónico"
            description="Verifica tu dirección de correo para recibir notificaciones importantes y recuperar tu cuenta."
            icon={Mail}
            isVerified={isEmailVerified}
            isActive={!isEmailVerified}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800">
                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                  @
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.correo_electronico}
                </span>
              </div>

              {!isCodeSent ? (
                <button
                  onClick={handleSendCode}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Enviar código
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value)}
                    placeholder="Código de 6 dígitos"
                    className="flex-1 rounded-xl border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                  <button
                    onClick={handleVerifyCode}
                    disabled={isSubmitting || !emailCode}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50 transition-all"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar"}
                  </button>
                </div>
              )}
            </div>
          </VerificationCard>

          {/* 2. Phone Verification */}
          <VerificationCard
            title="Número de Teléfono"
            description="Vincula tu número para mayor seguridad y recuperación rápida de cuenta vía SMS."
            icon={Phone}
            isVerified={isPhoneVerified}
            isActive={isEmailVerified && !isPhoneVerified}
          >
            <div className="space-y-4">
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isPhoneVerified || isSubmitting}
                  placeholder="+52 123 456 7890"
                  className="w-full rounded-xl border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-brand-500 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:opacity-60"
                />
              </div>

              {phoneError && (
                <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  {phoneError}
                </div>
              )}

              {phoneInfo && !phoneError && (
                <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  {phoneInfo}
                </div>
              )}

              {!isPhoneCodeSent ? (
                <button
                  onClick={handleSendSms}
                  disabled={isSubmitting || !phone}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Enviar SMS
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value)}
                    placeholder="Código SMS"
                    className="flex-1 rounded-xl border-gray-200 bg-gray-50 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                  <button
                    onClick={handleVerifySms}
                    disabled={isSubmitting || !phoneCode}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50 transition-all"
                  >
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar"}
                  </button>
                  <button
                    onClick={handleSendSms}
                    disabled={isSubmitting}
                    className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                  >
                    Reenviar
                  </button>
                </div>
              )}
            </div>
          </VerificationCard>

          {/* 3. ID Verification */}
          <VerificationCard
            title="Credencial Estudiantil"
            description="Sube una foto clara de tu credencial vigente para validar tu estatus de estudiante."
            icon={IdCard}
            isVerified={!!credentialSuccess}
            isActive={isPhoneVerified && !credentialSuccess}
          >
            <div className="space-y-4">
              <div className="rounded-xl border-2 border-dashed border-gray-200 p-6 transition-colors hover:border-brand-300 hover:bg-brand-50/30 dark:border-slate-700 dark:hover:border-brand-700 dark:hover:bg-brand-900/10">
                <label className="flex flex-col items-center justify-center cursor-pointer">
                  {credentialFile ? (
                    <div className="text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                        <CheckCircle2 className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {credentialFile.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(credentialFile.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Haz clic para subir o arrastra tu imagen
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        JPG, PNG o PDF (Máx 5MB)
                      </p>
                    </div>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {credentialError && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  {credentialError}
                </div>
              )}

              {credentialSuccess && (
                <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
                  {credentialSuccess}
                </div>
              )}

              <button
                onClick={handleCredentialUpload}
                disabled={isSubmitting || !credentialFile || !!credentialSuccess}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Subir y Verificar"
                )}
              </button>
            </div>
          </VerificationCard>

        </div>
      </main>
    </div>
  );
}
