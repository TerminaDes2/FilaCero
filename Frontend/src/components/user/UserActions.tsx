"use client";
import React from "react";

export default function UserActions() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Acciones Rápidas
      </h3>
      <div className="space-y-3">
        {[
          { text: "Cambiar Contraseña", color: "text-blue-600" },
          { text: "Configurar Notificaciones", color: "text-green-600" },
          { text: "Descargar Datos", color: "text-purple-600" },
        ].map((btn, i) => (
          <button
            key={i}
            className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <div className={`${btn.color} font-medium text-sm`}>{btn.text}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
