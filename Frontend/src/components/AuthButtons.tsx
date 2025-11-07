// components/AuthButtons.tsx
"use client";
import Link from "next/link";

export default function AuthButtons() {
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/login"
        className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-300/70 dark:border-white/15 text-gray-700 dark:text-slate-200 hover:border-brand-500 hover:text-brand-600 dark:hover:border-brand-400 dark:hover:text-brand-300 transition"
      >
        Iniciar sesión
      </Link>
      <Link
        href="/register"
        className="text-sm font-semibold bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-500 transition shadow-glow"
      >
        Crear cuenta
      </Link>
    </div>
  );
}