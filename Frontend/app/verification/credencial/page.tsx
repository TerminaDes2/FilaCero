"use client";

import { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "../../../src/components/BrandLogo";

export default function VerificacionCredencial() {
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<'error' | 'success' | ''>('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setImage(file);
      try {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } catch (e) {
        setPreviewUrl(null);
      }
    }
  };

  const handleSubmit = async () => {
    if (!image) {
      setMessageType('error');
      setMessage("Por favor, selecciona una imagen.");
      return;
    }

    setUploading(true);
    setMessage("");
    setMessageType('');

    try {
      // Subir imagen a Cloudinary usando variables de entorno públicas
      const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (!CLOUD_NAME || !UPLOAD_PRESET) {
        throw new Error(
          "Configuración faltante: define NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME y NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET en .env.local"
        );
      }

      const formData = new FormData();
      formData.append("file", image);
      formData.append("upload_preset", UPLOAD_PRESET);

      const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
      const cloudinaryResponse = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!cloudinaryResponse.ok) {
        const txt = await cloudinaryResponse.text();
        throw new Error(`Falló la subida a Cloudinary (${cloudinaryResponse.status}): ${txt}`);
      }

      const cloudinaryData = await cloudinaryResponse.json();

      if (!cloudinaryData.secure_url) {
        throw new Error("Cloudinary no devolvió `secure_url`. Revisa el upload_preset y permisos.");
      }

      // Preparar endpoint del backend (respeta variable de entorno para dev vs Docker)
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';
      let resolvedApiBase = API_BASE.replace(/\/$/, '');
      if (typeof window !== 'undefined' && API_BASE) {
        try {
          const parsed = new URL(API_BASE);
          if (parsed.hostname === 'backend' || parsed.hostname === 'filacero-backend') {
            parsed.hostname = window.location.hostname;
            resolvedApiBase = parsed.toString().replace(/\/$/, '');
          }
        } catch (e) {
          // Si no es una URL válida, mantén el valor tal cual
        }
      }

      const endpoint = resolvedApiBase ? `${resolvedApiBase}/verificacion_credencial` : '/api/verificacion_credencial';

      // Recuperar token almacenado
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('auth_token') : null;
      if (!token) {
        throw new Error('No autenticado. Por favor inicia sesión antes de verificar tu credencial.');
      }

      // Enviar URL al backend incluyendo Authorization
      const backendResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ imageUrl: cloudinaryData.secure_url }),
      });

      const backendData = await backendResponse.json();

      if (backendResponse.ok) {
        // Verificar si el backend devolvió un resultado exitoso (ok: true en details)
        // o si el mensaje indica que fue exitosa
        const isVerified = backendData.message?.includes('completada') || 
                          backendData.message?.includes('exitosa');
        
        if (isVerified) {
          setMessageType('success');
          setMessage('¡Verificación exitosa! Tu credencial ha sido verificada correctamente.');
        } else {
          // La respuesta fue 200 pero la verificación falló (OCR no validó)
          setMessageType('error');
          setMessage(backendData.message || 'Favor intente nuevamente con una credencial válida.');
        }
      } else if (backendResponse.status === 401) {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('auth_token');
          window.localStorage.removeItem('auth_user');
        }
        throw new Error('No autorizado. Tu sesión puede haber expirado. Por favor inicia sesión de nuevo.');
      } else {
        throw new Error(backendData.error || 'Error en la verificación.');
      }
    } catch (error: any) {
      setMessageType('error');
      setMessage(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-gradient relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-brand-200/30 rounded-full blur-3xl animate-blob-lazy" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#4cc1ad]/20 rounded-full blur-3xl animate-blob-lazy [animation-delay:2s]" />

      {/* Header con logo */}
      <div className="fixed top-4 left-4 z-50">
        <BrandLogo withWordmark size={40} asLink={true} />
      </div>

      {/* Contenedor principal */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-3xl">
          {/* Card principal */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-glow border border-white/40 p-6 sm:p-8 lg:p-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Verificación de Credencial
              </h1>
              <p className="text-gray-600 max-w-md mx-auto">
                Sube una foto clara de tu credencial para verificar tu identidad y acceder a todas las funcionalidades.
              </p>
            </div>

            {/* Contenido principal */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Columna izquierda: Upload */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="file-upload" className="block text-sm font-semibold text-gray-700 mb-3">
                    Seleccionar imagen
                  </label>
                  
                  {/* Custom file input button */}
                  <label 
                    htmlFor="file-upload" 
                    className="flex items-center justify-center w-full px-6 py-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-brand-400 hover:bg-brand-50/50 transition-all cursor-pointer group"
                  >
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400 group-hover:text-brand-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-600 group-hover:text-brand-600 transition-colors">
                        <span className="font-semibold">Haz clic para subir</span> o arrastra aquí
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        JPG, PNG hasta 5MB
                      </p>
                    </div>
                  </label>
                  
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {/* Info adicional */}
                <div className="bg-gradient-to-br from-[#4cc1ad]/10 to-brand-50 rounded-xl p-4 border border-[#4cc1ad]/20">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-[#4cc1ad] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm text-gray-700">
                      <p className="font-semibold mb-1">Consejos para una mejor verificación:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs text-gray-600">
                        <li>Asegúrate de que la foto sea clara y legible</li>
                        <li>Evita reflejos o sombras sobre la credencial</li>
                        <li>Captura toda la credencial en la imagen</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna derecha: Preview */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Previsualización
                </label>
                <div className="relative aspect-[3/2] bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 overflow-hidden flex items-center justify-center">
                  {previewUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={previewUrl} 
                        alt="Previsualización de credencial" 
                        className="w-full h-full object-contain p-4"
                      />
                      {/* Overlay con info del archivo */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                        <div className="text-white text-xs space-y-0.5">
                          <p className="font-semibold truncate">{image?.name}</p>
                          <p className="text-white/80">{image && (image.size / 1024).toFixed(0)} KB</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-gray-400 p-4">
                      <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm font-medium">Tu imagen aparecerá aquí</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Mensajes de estado */}
            {message && (
              <div className={`mb-6 p-4 rounded-xl border-l-4 ${
                messageType === 'success' 
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800' 
                  : 'bg-red-50 border-red-500 text-red-800'
              }`}>
                <div className="flex items-start gap-3">
                  {messageType === 'success' ? (
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  <p className="text-sm font-medium">{message}</p>
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <Link 
                href="/"
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver al inicio
              </Link>

              <button
                onClick={handleSubmit}
                disabled={uploading || !image}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-brand-500 to-brand-600 rounded-xl shadow-lg hover:shadow-xl hover:from-brand-600 hover:to-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Verificando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Subir y Verificar
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Footer info */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              ¿Tienes problemas? {' '}
              <Link href="/soporte" className="text-brand-600 hover:text-brand-700 font-semibold">
                Contacta con soporte
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}