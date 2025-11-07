"use client";
import React, { useState } from "react";
import Image from "next/image";
import NavbarStore from "../../src/components/shop/navbarStore";
import { useCart } from "../../src/components/shop/CartContext";
import { useRouter } from "next/navigation";
import { api } from "../../src/lib/api";
import Step1DeliveryTime from "../../src/components/checkout/deliveryTime";
import Step2PaymentMethod from "../../src/components/checkout/paymentMethod";

export default function CheckoutPage() {
  const { items, total, clearCart, updateQty, removeFromCart } = useCart();
  const router = useRouter();

  const [deliveryTime, setDeliveryTime] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "tarjeta" | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canConfirm = deliveryTime && paymentMethod;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setIsSubmitting(true);
    try {
      const saleData = {
        id_negocio: localStorage.getItem("active_business_id") || "1",
        id_tipo_pago: paymentMethod === "efectivo" ? "1" : "2",
        items: items.map((it) => ({
          id_producto: String(it.id),
          cantidad: it.cantidad,
          precio_unitario: it.precio,
        })),
      };
      await api.createSale(saleData);
      clearCart();
      router.push("/shop");
    } catch (err) {
      console.error("Error al confirmar:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <NavbarStore />

      <div className="flex flex-1 pt-16">
        {/* --- Columna izquierda --- */}
        <div className="flex-1 max-w-3xl mx-auto p-6 md:p-10 space-y-8">
          <h1 className="text-2xl font-bold text-gray-800">Confirmar pedido</h1>

          {/* Paso 1 */}
          <Step1DeliveryTime
            deliveryTime={deliveryTime}
            setDeliveryTime={setDeliveryTime}
          />

          {/* Paso 2 */}
          <Step2PaymentMethod
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
          />

          {/* Botón confirmar */}
          <div className="pt-4">
            <button
              onClick={handleConfirm}
              disabled={!canConfirm || isSubmitting}
              className={`w-full py-3 rounded-xl font-semibold text-white transition ${
                canConfirm
                  ? "bg-brand-500 hover:bg-brand-600 shadow-glow"
                  : "bg-gray-300 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? "Procesando..." : "Confirmar pedido"}
            </button>
          </div>
        </div>

        {/* --- Columna derecha (resumen carrito) --- */}
        <aside className="hidden lg:block w-[400px] border-l bg-white px-6 py-8 sticky top-0 h-screen overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Tu carrito</h2>

          {items.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay productos en tu carrito.</p>
          ) : (
            <>
              <ul className="space-y-4 mb-6">
                {items.map((it) => (
                  <li key={it.id} className="flex items-center gap-4">
                    <div className="relative h-16 w-16 overflow-hidden rounded-md bg-gray-100">
                      {it.imagen ? (
                        <Image
                          src={it.imagen}
                          alt={it.nombre}
                          fill
                          className="object-cover"
                          sizes="64px"
                          unoptimized
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                          Img
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{it.nombre}</div>
                      <div className="text-sm text-gray-500">
                        ${(it.precio * it.cantidad).toFixed(2)}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          className="px-2 border rounded hover:bg-gray-100"
                          onClick={() => updateQty(it.id, it.cantidad - 1)}
                        >
                          -
                        </button>
                        <span className="text-sm">{it.cantidad}</span>
                        <button
                          className="px-2 border rounded hover:bg-gray-100"
                          onClick={() => updateQty(it.id, it.cantidad + 1)}
                        >
                          +
                        </button>
                        <button
                          className="text-xs text-red-600 ml-2"
                          onClick={() => removeFromCart(it.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between text-gray-700 font-medium border-t pt-4">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
