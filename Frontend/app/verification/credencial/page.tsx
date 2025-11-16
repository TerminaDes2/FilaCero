"use client";

import { useState } from "react";

export default function VerificacionCredencial() {
  const [image, setImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setImage(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!image) {
      setMessage("Por favor, selecciona una imagen.");
      return;
    }

    setUploading(true);
    setMessage("");

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
      // Si `NEXT_PUBLIC_API_BASE` apunta a `http://backend:3000` (valido dentro de Docker),
      // y la app se está ejecutando en el navegador del host, reemplazamos el hostname
      // por `window.location.hostname` (habitualmente `localhost`) para evitar ERR_NAME_NOT_RESOLVED.
      const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';
      let resolvedApiBase = API_BASE.replace(/\/$/, '');
      if (typeof window !== 'undefined' && API_BASE) {
        try {
          const parsed = new URL(API_BASE);
          // Reemplazar host 'backend' (o cualquier host no resolvible desde el navegador dentro de Docker)
          if (parsed.hostname === 'backend' || parsed.hostname === 'filacero-backend') {
            parsed.hostname = window.location.hostname;
            resolvedApiBase = parsed.toString().replace(/\/$/, '');
          }
        } catch (e) {
          // Si no es una URL válida, mantén el valor tal cual (podría ser relativo)
        }
      }

      const endpoint = resolvedApiBase ? `${resolvedApiBase}/verificacion_credencial` : '/api/verificacion_credencial';

      // Recuperar token almacenado (userStore guarda en localStorage con la llave 'auth_token')
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
        setMessage('Verificación exitosa: ' + backendData.message);
      } else if (backendResponse.status === 401) {
        // Si el backend devuelve 401, limpiar sesión local y pedir re-login
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('auth_token');
          window.localStorage.removeItem('auth_user');
        }
        throw new Error('No autorizado. Tu sesión puede haber expirado. Por favor inicia sesión de nuevo.');
      } else {
        throw new Error(backendData.error || 'Error en la verificación.');
      }
    } catch (error: any) {
      setMessage(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Verificación de Credencial</h1>
      <label htmlFor="file-upload" className="block mb-2">
        Sube tu imagen:
      </label>
      <input
        id="file-upload"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="mb-4"
      />
      <button
        onClick={handleSubmit}
        disabled={uploading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {uploading ? "Subiendo..." : "Subir y Verificar"}
      </button>
      {message && <p className="mt-4 text-red-500">{message}</p>}
    </div>
  );
}