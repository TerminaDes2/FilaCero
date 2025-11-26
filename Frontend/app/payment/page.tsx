"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { api } from "../../src/lib/api";

const stripePromise = loadStripe((process.env.NEXT_PUBLIC_STRIPE_PK || "").replace(/^"|"$/g, ""));

function AddCardForm() {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!stripe || !elements) {
      setError("Stripe no está inicializado todavía.");
      return;
    }
    const card = elements.getElement(CardElement);
    if (!card) {
      setError("Formulario de tarjeta no encontrado.");
      return;
    }

    setLoading(true);
    try {
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card,
        billing_details: {
          name: name || undefined,
        },
      } as any);

      if (pmError) {
        setError(pmError.message || "Error creando método de pago");
        setLoading(false);
        return;
      }

      if (!paymentMethod || !paymentMethod.id) {
        setError("No se obtuvo paymentMethodId de Stripe");
        setLoading(false);
        return;
      }

      // Enviar al backend para guardar
      await api.savePaymentMethod({ paymentMethodId: paymentMethod.id, makeDefault: true });
      setSuccess("Método de pago guardado correctamente.");
      setLoading(false);
      // Volver al checkout o página de account
      setTimeout(() => router.push("/checkout"), 900);
    } catch (err: any) {
      console.error("[payments] save method error", err);
      setError(err?.message ?? "Error guardando el método de pago");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      {error && <div className="rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-3 text-sm text-rose-700">{error}</div>}
      {success && <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      <div>
        <label className="block text-sm font-medium text-slate-700">Nombre en la tarjeta</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          placeholder="Nombre completo"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Datos de la tarjeta</label>
        <div className="mt-2 rounded-md border p-3 bg-white">
          <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          disabled={loading}
          className={`rounded-full px-6 py-2.5 text-sm font-semibold text-white ${loading ? 'bg-slate-300' : 'bg-[var(--fc-brand-600)] hover:bg-[var(--fc-brand-500)]'}`}
        >
          {loading ? 'Guardando…' : 'Agregar tarjeta'}
        </button>
        <a className="text-sm text-slate-500 underline" href="/checkout">Volver al checkout</a>
      </div>
    </form>
  );
}

export default function PaymentPage() {
  // If STRIPE key missing, show instructions
  const pkRaw = (process.env.NEXT_PUBLIC_STRIPE_PK || "").replace(/^"|"$/g, "");
  const hasKey = Boolean(pkRaw && pkRaw !== "");

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-2xl font-bold text-slate-900">Métodos de pago</h1>
        <p className="mt-2 text-sm text-slate-500">Agrega una tarjeta para pagar de forma segura en la tienda.</p>

        <div className="mt-6">
          {!hasKey ? (
            <div className="rounded-2xl border border-yellow-200 bg-yellow-50/80 px-4 py-4 text-sm text-yellow-700">
              No está configurada la clave pública de Stripe en el frontend. Configura `NEXT_PUBLIC_STRIPE_PK` en tu entorno para habilitar la captura de tarjetas.
            </div>
          ) : (
            <Elements stripe={stripePromise}>
              <AddCardForm />
            </Elements>
          )}
        </div>
      </main>
    </div>
  );
}
