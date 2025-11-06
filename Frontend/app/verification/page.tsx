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

export default function VerificationPage() {
  const { user, isAuthenticated, loading } = useUserStore();
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [credentialFile, setCredentialFile] = useState<File | null>(null);
  const [emailCode, setEmailCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

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

      <main className="flex-1 pt-24 pb-16 px-6 md:px-10 lg:px-16 max-w-3xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Verificación de cuenta
        </h1>

        {/* ✉️ VERIFICAR EMAIL */}
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Verificación de correo electrónico
            </h2>
          </div>

          <p className="text-gray-700 dark:text-gray-300 mb-3">
            {user.correo_electronico}
          </p>

          {!isEmailVerified ? (
            <>
              {!isCodeSent ? (
                <button
                  onClick={handleSendCode}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg transition"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? "Enviando..." : "Enviar código de verificación"}
                </button>
              ) : (
                <div className="mt-3">
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Ingresa el código recibido:
                  </label>
                  <input
                    type="text"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value)}
                    placeholder="Ej. 123456"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white mb-3"
                  />
                  <button
                    onClick={handleVerifyCode}
                    disabled={isSubmitting || !emailCode}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition"
                  >
                    {isSubmitting ? "Verificando..." : "Verificar código"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mt-3">
              <ShieldCheck className="w-5 h-5" />
              <span>Correo verificado correctamente</span>
            </div>
          )}
        </section>

        {/* 📞 TELÉFONO */}
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Número de teléfono
            </h2>
          </div>

          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Ingresa tu número de teléfono"
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white mb-3"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Usa un número válido para recibir notificaciones y confirmar tu
            identidad.
          </p>
        </section>

        {/* 🪪 CREDENCIAL */}
        <section className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <IdCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Credencial estudiantil
            </h2>
          </div>

          <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-brand-500 transition">
            {credentialFile ? (
              <div className="text-sm text-gray-700 dark:text-gray-300">
                📎 {credentialFile.name}
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-gray-600 dark:text-gray-300">
                  Sube una imagen de tu credencial
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Formatos permitidos: JPG, PNG, PDF
                </p>
              </>
            )}

            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              className="mt-4 text-sm text-gray-700 dark:text-gray-300"
              onChange={handleFileChange}
            />
          </div>

          {/* ✅ Términos y condiciones */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Al subir tu credencial, aceptas nuestros{" "}
            <Link
              href="/terms"
              className="text-brand-600 hover:text-brand-500 underline font-medium"
            >
              Términos y Condiciones
            </Link>{" "}
            y la Política de Privacidad.
          </p>
        </section>

        {/* BOTÓN FINAL */}
        <div className="flex justify-end pt-4">
          <button
            disabled={
              isSubmitting || !phone || !credentialFile || !isEmailVerified
            }
            onClick={handleSubmit}
            className={`px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
              phone && credentialFile && isEmailVerified
                ? "bg-brand-500 hover:bg-brand-600 text-white shadow-glow"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                Procesando...
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                ¡Verificado!
              </>
            ) : (
              "Guardar y verificar"
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
