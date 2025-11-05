"use client";
import { Clock, PackageCheck, ShoppingBag } from "lucide-react";

interface UserOrdersSectionProps {
  orders?: Array<{
    id: number;
    fecha: string;
    total: number;
    estado: string;
  }>;
}

export default function UserOrdersSection({ orders = [] }: UserOrdersSectionProps) {
  const mostRecent = orders[0];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        <ShoppingBag className="w-5 h-5 text-brand-600" /> Historial de pedidos
      </h2>

      {orders.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No tienes pedidos registrados aún.
        </p>
      ) : (
        <>
          {/* Pedido más reciente */}
          <div className="mb-6 p-4 bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-brand-700 dark:text-brand-300">
                  Pedido más reciente
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {new Date(mostRecent.fecha).toLocaleDateString("es-ES")}
                </p>
              </div>
              <span
                className={`px-3 py-1 text-xs font-medium rounded-full ${
                  mostRecent.estado === "completado"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                }`}
              >
                {mostRecent.estado}
              </span>
            </div>
            <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
              Total: ${mostRecent.total.toFixed(2)}
            </p>
          </div>

          {/* Lista de otros pedidos */}
          <ul className="divide-y divide-gray-200 dark:divide-slate-700">
            {orders.slice(1).map((order) => (
              <li key={order.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <PackageCheck className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    #{order.id} — {new Date(order.fecha).toLocaleDateString("es-ES")}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {order.estado}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
