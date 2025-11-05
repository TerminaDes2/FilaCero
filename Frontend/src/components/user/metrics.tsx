"use client";
import { UserInfo } from "../../lib/api";
import { User, Mail, Phone, IdCard, Edit3, Package } from "lucide-react";
import { useState } from "react";

interface UserMetricsProps {
  user: UserInfo;
}

export default function UserMetrics({ user }: UserMetricsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);

  const handleSave = () => {
    console.log("Guardando cambios:", editedUser);
    setIsEditing(false);
    // api.updateUser(editedUser) ...
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Información Personal
        </h2>
        <button
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          className="flex items-center space-x-2 px-3 py-1 text-sm bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          <span>{isEditing ? "Guardar" : "Editar"}</span>
        </button>
      </div>

      {/* Contenido en dos columnas */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Columna izquierda */}
        <div className="space-y-6">
          {/* Nombre */}
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-brand-100 dark:bg-brand-900 rounded-lg">
              <User className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre completo
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedUser.nombre}
                  onChange={(e) =>
                    setEditedUser({ ...editedUser, nombre: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              ) : (
                <p className="text-gray-900 dark:text-white">
                  {user.nombre || "No especificado"}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Correo electrónico
              </label>
              <p className="text-gray-900 dark:text-white">
                {user.correo_electronico}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Verificado ✓
              </p>
            </div>
          </div>

          {/* Teléfono */}
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Teléfono
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editedUser.numero_telefono || ""}
                  onChange={(e) =>
                    setEditedUser({
                      ...editedUser,
                      numero_telefono: e.target.value,
                    })
                  }
                  placeholder="Ingresa tu número de teléfono"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              ) : (
                <p className="text-gray-900 dark:text-white">
                  {user.numero_telefono || "No especificado"}
                </p>
              )}
            </div>
          </div>

          {/* Credencial */}
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <IdCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Credencial Estudiantil
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedUser.credential_url || ""}
                  onChange={(e) =>
                    setEditedUser({
                      ...editedUser,
                      credential_url: e.target.value,
                    })
                  }
                  placeholder="Ingresa tu ID de credencial"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              ) : (
                <p className="text-gray-900 dark:text-white">
                  {user.credential_url || "No registrada"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Columna derecha: Resumen de pedidos */}
        <div className="space-y-6">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Package className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Número de pedidos realizados
              </label>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                10
                {/* {user.totalPedidos ?? 0} */}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Tus compras totales registradas
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
