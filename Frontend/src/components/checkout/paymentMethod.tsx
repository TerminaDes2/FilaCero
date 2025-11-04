"use client";
import React from "react";

interface Props {
  paymentMethod: "efectivo" | "tarjeta" | "";
  setPaymentMethod: (value: "efectivo" | "tarjeta" | "") => void;
}

export default function paymentMethod({ paymentMethod, setPaymentMethod }: Props) {
  return (
    <section className="bg-white p-6 rounded-2xl shadow-sm border">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Paso 2: Método de pago
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Elige cómo deseas realizar el pago.
      </p>

      <div className="flex flex-col md:flex-row gap-4">
        <button
          onClick={() => setPaymentMethod("efectivo")}
          className={`flex-1 py-3 rounded-lg border transition font-medium ${
            paymentMethod === "efectivo"
              ? "border-brand-500 bg-brand-50 text-brand-700"
              : "border-gray-300 hover:border-brand-300"
          }`}
        >
          💵 Efectivo
        </button>

        <button
          onClick={() => setPaymentMethod("tarjeta")}
          className={`flex-1 py-3 rounded-lg border transition font-medium ${
            paymentMethod === "tarjeta"
              ? "border-brand-500 bg-brand-50 text-brand-700"
              : "border-gray-300 hover:border-brand-300"
          }`}
        >
          💳 Tarjeta de crédito
        </button>
      </div>
    </section>
  );
}
