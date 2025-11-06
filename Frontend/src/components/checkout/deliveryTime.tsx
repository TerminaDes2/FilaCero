"use client";
import React from "react";

interface Props {
  deliveryTime: string;
  setDeliveryTime: (value: string) => void;
}

export default function deliveryTime({ deliveryTime, setDeliveryTime }: Props) {
  return (
    <section className="bg-white p-6 rounded-2xl shadow-sm border">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        Paso 1: Configurar hora de envío
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Selecciona la hora en que deseas recibir tu pedido.
      </p>

      <input
        type="time"
        value={deliveryTime}
        onChange={(e) => setDeliveryTime(e.target.value)}
        className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-brand-400 focus:border-brand-400"
      />
    </section>
  );
}
