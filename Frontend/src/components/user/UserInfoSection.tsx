"use client";
import React, { useState } from "react";
import { UserInfo } from "../../lib/api";

export default function UserInfoSection({ user }: { user: UserInfo }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.nombre);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Información de la Cuenta
      </h3>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
            Nombre
          </label>
          {editing ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setEditing(false)}
              className="w-full mt-1 px-2 py-1 rounded border border-gray-300 dark:bg-slate-700 dark:text-white"
              autoFocus
            />
          ) : (
            <p
              className="text-gray-900 dark:text-white font-medium cursor-pointer"
              onClick={() => setEditing(true)}
            >
              {name}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
            ID de Usuario
          </label>
          <p className="text-gray-900 dark:text-white font-mono text-sm">
            {user.id_usuario}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
            Fecha de Registro
          </label>
          <p className="text-gray-900 dark:text-white text-sm">
            {user.fecha_registro
              ? new Date(user.fecha_registro).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              : "No disponible"}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
            Estado
          </label>
          <span
            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
              user.estado === "activo"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
            }`}
          >
            {user.estado || "Activo"}
          </span>
        </div>
      </div>
    </div>
  );
}
