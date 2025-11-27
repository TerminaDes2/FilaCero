"use client";
import React, { useEffect, useMemo, useState } from "react";
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, Building2, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import NavbarStore from "../../src/components/shop/navbarStore";
import { useCart } from "../../src/components/shop/CartContext";
import { useUserStore } from "../../src/state/userStore";
import DeliveryTime from "../../src/components/checkout/deliveryTime";
import PaymentMethod from "../../src/components/checkout/paymentMethod";
import { api, activeBusiness } from "../../src/lib/api";

// Stripe init
// Evitar acceso directo a `process` en el cliente: usar comprobaciones seguras y fallback a __NEXT_DATA__ si existe.
const stripePk =
  (typeof process !== 'undefined' && (process.env as any)?.NEXT_PUBLIC_STRIPE_PK) ||
  (typeof window !== 'undefined' && (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_STRIPE_PK) ||
  '';
const stripePromise = stripePk ? loadStripe(stripePk) : null;

function CardPaymentForm({ pedidoId, onSuccess, onError, user, clearCartAndRedirect, onReady }: any) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    if (!stripe || !elements) {
      setError('Stripe aún no está listo. Intenta de nuevo en unos segundos.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const resp = await api.createPaymentIntent({ pedidoId: String(pedidoId) });
      const clientSecret = resp?.clientSecret;
      if (!clientSecret) throw new Error('No se recibió clientSecret');
      const card = elements.getElement(CardElement);
      if (!card) throw new Error('Elemento de tarjeta no disponible');

      const result: any = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: {
            name: user?.nombre || (user as any)?.name || undefined,
            email: user?.correo_electronico || (user as any)?.email || undefined,
          },
        },
      });

      if (result.error) {
        throw result.error;
      }

      const pi = result.paymentIntent;
      if (pi && pi.status === 'succeeded') {
        onSuccess?.();
        // Limpiar carrito y redirigir
        clearCartAndRedirect?.();
      } else {
        throw new Error('Pago no completado. Revisa los datos e intenta de nuevo.');
      }
    } catch (err: any) {
      setError(err?.message ?? String(err));
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  // Exponer handlePay al componente padre
  useEffect(() => {
    if (onReady) {
      onReady({ handlePay });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onReady]);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <label className="block text-sm font-medium text-slate-700">Tarjeta</label>
        <div className="mt-2">
          <div className="rounded-md border px-3 py-2">
            <CardElement options={{ hidePostalCode: true }} />
          </div>
        </div>
      </div>

      {error && <div className="text-sm text-rose-600">{error}</div>}
    </div>
  );
}

type BusinessSummary = {
  id_negocio?: string;
  nombre?: string;
  direccion?: string | null;
  telefono?: string | null;
  hero_image_url?: string | null;
  logo?: string | null;
  horario?: string | null;
};

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
});

function formatCurrency(amount: number) {
  return currencyFormatter.format(amount);
}

const steps = [
  { id: 1, title: "Ventana de retiro", caption: "Coordina tu horario" },
  { id: 2, title: "Método de pago", caption: "Define cómo cobramos" },
  { id: 3, title: "Confirmación", caption: "Envía a cocina" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, updateQty, removeFromCart, clearCart } = useCart();
  const { isAuthenticated, user, loading: userLoading } = useUserStore();

  const [activeStep, setActiveStep] = useState(1);
  const [deliveryTime, setDeliveryTime] = useState<string>("asap");
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "tarjeta" | "">("tarjeta");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [verificationsOk, setVerificationsOk] = useState(false);
  const [business, setBusiness] = useState<BusinessSummary | null>(null);
  const [bizLoading, setBizLoading] = useState(true);
  const [pendingPedidoId, setPendingPedidoId] = useState<string | null>(null);
  const [cardFormRef, setCardFormRef] = useState<{ handlePay: () => Promise<void> } | null>(null);
  const cardOnlyMethods = useMemo(() => ["tarjeta"] as Array<"efectivo" | "tarjeta">, []);

  useEffect(() => {
    // Redirect to login if not authenticated (and not still loading auth)
    if (!userLoading && !isAuthenticated) {
      router.push('/auth/login?redirect=/checkout');
    }

    let active = true;
    const fetchBusiness = async () => {
      try {
        let negocioId = activeBusiness.get() ?? undefined;
        if (!negocioId) {
          const envBiz = (globalThis as any).process?.env?.NEXT_PUBLIC_NEGOCIO_ID as string | undefined;
          if (envBiz && envBiz.trim()) {
            negocioId = envBiz.trim();
          }
        }
        if (!negocioId) {
          setBusiness(null);
          return;
        }
        const data = await api.getBusinessById(negocioId);
        if (!active) return;
        setBusiness(data as BusinessSummary);
      } catch (error) {
        console.error("[checkout] No se pudo cargar el negocio activo", error);
      } finally {
        if (active) setBizLoading(false);
      }
    };

    fetchBusiness();
    return () => {
      active = false;
    };
  }, [userLoading, isAuthenticated, router]);

  // Recompute verifications when user or auth state changes
  useEffect(() => {
    if (!isAuthenticated) {
      setVerificationsOk(false);
      return;
    }

    if (user) {
      const emailVerified = user.verifications?.email ?? Boolean((user as any).correo_verificado);
      const credentialVerified = user.verifications?.credential ?? Boolean((user as any).credencial_verificada);
      setVerificationsOk(Boolean(emailVerified && credentialVerified));
    }
  }, [isAuthenticated, user]);

  const grandTotal = useMemo(() => {
    return Number(total.toFixed(2));
  }, [total]);

  const deliverySummary = deliveryTime === "asap" ? "Lo antes posible" : `Retiro ${deliveryTime} h`;
  const paymentSummary =
    paymentMethod === "efectivo"
      ? "Efectivo en barra"
      : paymentMethod === "tarjeta"
      ? "Tarjeta / QR"
      : "Selecciona un método";

  const canAdvanceFromStep = (stepId: number) => {
    if (stepId === 1) return Boolean(deliveryTime);
    if (stepId === 2) return Boolean(paymentMethod);
    return true;
  };

  // Cambiar el label del botón si hay un pedido pendiente con tarjeta
  const confirmDisabled =
    !items.length || !paymentMethod || !deliveryTime || isSubmitting || !verificationsOk;
  const primaryDisabled =
    activeStep === steps.length ? confirmDisabled : isSubmitting || !canAdvanceFromStep(activeStep);
  const primaryLabel =
    activeStep === steps.length
      ? isSubmitting
        ? "Procesando…"
        : pendingPedidoId && paymentMethod === "tarjeta"
        ? "Pagar ahora"
        : "Enviar a cocina"
      : activeStep === steps.length - 1
      ? "Ir a confirmación"
      : "Continuar";

  const handleNext = () => {
    setActiveStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handlePrev = () => {
    setActiveStep((prev) => Math.max(prev - 1, 1));
  };

  const handleConfirm = async () => {
    if (confirmDisabled) return;
    if (!isAuthenticated) {
      setSubmitError("Inicia sesión para confirmar tu pedido.");
      router.push("/auth/login?redirect=/checkout");
      return;
    }

    // Si ya existe un pedido pendiente con tarjeta, ejecutar el pago
    if (pendingPedidoId && paymentMethod === 'tarjeta' && cardFormRef) {
      await cardFormRef.handlePay();
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      let negocioId = activeBusiness.get() ?? business?.id_negocio ?? "1";
      if (!negocioId || String(negocioId).trim() === "") {
        negocioId = "1";
      }

      const payload = {
        id_negocio: String(negocioId),
        id_tipo_pago: paymentMethod === "efectivo" ? "1" : "2",
        items: items.map((item) => ({
          id_producto: String(item.id),
          cantidad: item.cantidad,
          precio_unitario: item.precio,
        })),
        cerrar: true,
      };

      // 1) Crear la venta/pedido
      const sale = await api.createSale(payload);

      // Si el pago es con tarjeta, creamos un PaymentIntent y dejamos que el cliente lo confirme
      if (paymentMethod === 'tarjeta') {
        const pedido = sale?.pedido;
        if (!pedido || !pedido.id_pedido) {
          throw new Error('No se pudo obtener el pedido para procesar el pago');
        }
        // Guardamos el pedido pendiente para que el formulario de tarjeta cree el PaymentIntent
        setPendingPedidoId(String(pedido.id_pedido));
      } else {
        // Efectivo: confirmamos y finalizamos
        window.dispatchEvent(
          new CustomEvent("shop:order-confirmed", {
            detail: {
              negocioId: String(negocioId),
              total: grandTotal,
              paymentMethod,
              deliveryTime,
            },
          }),
        );

        clearCart();
        setSuccessMessage("Pedido enviado a cocina. Estamos preparando tu orden.");
        setTimeout(() => {
          router.push("/shop?order=confirmed");
        }, 900);
      }
    } catch (error: any) {
      console.error("[checkout] Error al confirmar pedido", error);
      setSubmitError(error?.message ?? "No pudimos confirmar tu pedido. Inténtalo nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const emptyState = !items.length;

  const renderStepContent = () => {
    if (activeStep === 1) {
      return (
        <div className="space-y-6">
          <DeliveryTime deliveryTime={deliveryTime} setDeliveryTime={setDeliveryTime} displayMode="embedded" />
          <div className="rounded-2xl border border-dashed border-[var(--fc-brand-200)] bg-[var(--fc-brand-50)]/50 px-4 py-4 text-xs text-[var(--fc-brand-700)]">
            <Sparkles className="mr-2 inline h-4 w-4" />
            La hora que elijas alimenta el tablero de cocina y ajusta los tiempos de producción.
          </div>
        </div>
      );
    }

    if (activeStep === 2) {
      return (
        <div className="space-y-6">
          <PaymentMethod
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            displayMode="embedded"
            allowedMethods={cardOnlyMethods}
          />
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-xs text-slate-500">
            Este checkout admite únicamente cobros con tarjeta o QR para garantizar la confirmación inmediata del pedido.
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        {!verificationsOk && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-700">
            Necesitas verificar tu <strong>correo</strong> y tu <strong>credencial</strong> para completar pagos digitales. Por favor completa las verificaciones en tu perfil.
          </div>
        )}
        {submitError && (
          <div className="rounded-2xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm text-red-700">{submitError}</div>
        )}
        {successMessage && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-700">
            <BadgeCheck className="h-5 w-5" />
            {successMessage}
          </div>
        )}
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Ticket digital</h3>
            <span className="text-xs text-slate-500">{items.length} productos</span>
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-2 text-sm font-semibold text-slate-900">
              <span>Total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 text-sm text-slate-600">
          <h3 className="text-sm font-semibold text-slate-900">Detalles operativos</h3>
          <dl className="mt-3 space-y-2">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-xs uppercase tracking-[0.32em] text-slate-400">Ventana</dt>
              <dd className="font-medium text-slate-900">{deliverySummary}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-xs uppercase tracking-[0.32em] text-slate-400">Pago</dt>
              <dd className="font-medium text-slate-900">{paymentSummary}</dd>
            </div>
          </dl>
        </div>
        {paymentMethod === 'tarjeta' && !pendingPedidoId && (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Al confirmar el pedido se solicitará el pago con tarjeta en esta pantalla.
          </div>
        )}
        {paymentMethod === 'tarjeta' && pendingPedidoId && (
          <div>
            {stripePromise ? (
              <Elements stripe={stripePromise as any}>
                <CardPaymentForm
                  pedidoId={pendingPedidoId}
                  user={user}
                  onSuccess={() => setPendingPedidoId(null)}
                  onError={(err: any) => setSubmitError(err?.message ?? String(err))}
                  clearCartAndRedirect={() => {
                    clearCart();
                    setSuccessMessage('Pago procesado. Pedido enviado a cocina.');
                    setTimeout(() => router.push('/shop?order=confirmed'), 900);
                  }}
                  onReady={(ref: any) => setCardFormRef(ref)}
                />
              </Elements>
            ) : (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-3 text-sm text-rose-700">
                Stripe no está configurado en el frontend (falta NEXT_PUBLIC_STRIPE_PK).
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <NavbarStore />

      <main className="relative flex min-h-[calc(100vh-5rem)] flex-col overflow-hidden pt-24 pb-12">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 pb-6">
            <Link href="/shop" className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 hover:text-slate-600">
              <ChevronLeft className="h-4 w-4" />
              Volver a la tienda
            </Link>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-black text-slate-900">Checkout guiado</h1>
                <p className="text-sm text-slate-500">Resuelve en tres pasos y envía la venta directo al POS.</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--fc-brand-50)] px-4 py-2 text-xs font-semibold text-[var(--fc-brand-600)]">
                <Sparkles className="h-4 w-4" />
                Sin filas, sin terminal compartida
              </span>
            </div>
          </div>

          {emptyState ? (
            <div className="flex flex-1 items-center justify-center rounded-3xl border border-white/70 bg-white/90 px-6 py-10 text-center shadow-sm">
              <div className="max-w-sm space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--fc-brand-50)] text-[var(--fc-brand-600)]">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Tu carrito está vacío</h2>
                <p className="text-sm text-slate-500">Explora la tienda para elegir productos antes de confirmar el pedido.</p>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--fc-brand-600)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--fc-brand-500)]"
                >
                  Volver a la tienda
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid flex-1 gap-6 overflow-hidden lg:grid-cols-[minmax(0,1fr),340px]">
              <section className="flex h-full flex-col overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-sm backdrop-blur">
                <header className="border-b border-white/70 px-6 py-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400">Flujo</p>
                      <h2 className="text-xl font-semibold text-slate-900">Paso {activeStep} de {steps.length}</h2>
                    </div>
                    <span className="text-xs text-slate-500">{paymentSummary}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {steps.map((step) => {
                      const status = step.id < activeStep ? "done" : step.id === activeStep ? "active" : "upcoming";
                      const baseClasses =
                        "group flex min-w-[200px] flex-1 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition";
                      const stateClasses =
                        status === "active"
                          ? "border-slate-900 bg-slate-900 text-white shadow-sm"
                          : status === "done"
                          ? "border-[var(--fc-brand-500)] bg-[var(--fc-brand-50)] text-[var(--fc-brand-700)]"
                          : "border-slate-200/80 bg-white text-slate-500";
                      const pillClasses =
                        status === "active"
                          ? "bg-white text-slate-900"
                          : status === "done"
                          ? "bg-[var(--fc-brand-600)] text-white"
                          : "bg-slate-200 text-slate-600";
                      return (
                        <button
                          key={step.id}
                          type="button"
                          onClick={() => {
                            if (step.id <= activeStep) {
                              setActiveStep(step.id);
                            }
                          }}
                          disabled={status === "upcoming"}
                          className={`${baseClasses} ${stateClasses}`}
                        >
                          <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${pillClasses}`}>
                            {step.id}
                          </span>
                          <div>
                            <div className="text-sm font-semibold">{step.title}</div>
                            <p className="text-[11px] opacity-80">{step.caption}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </header>

                <div className="flex-1 overflow-y-auto px-6 py-6">{renderStepContent()}</div>

                <footer className="flex items-center justify-between gap-4 border-t border-white/70 px-6 py-5">
                  {activeStep === 1 ? (
                    <Link
                      href="/shop"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Volver a la tienda
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Paso anterior
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={activeStep === steps.length ? handleConfirm : handleNext}
                    disabled={primaryDisabled}
                    className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                      primaryDisabled
                        ? "cursor-not-allowed border border-slate-200 bg-slate-200 text-slate-400"
                        : activeStep === steps.length
                        ? "bg-[var(--fc-brand-600)] text-white shadow-lg shadow-[rgba(222,53,95,0.25)] hover:bg-[var(--fc-brand-500)]"
                        : "border border-[var(--fc-brand-500)] bg-[var(--fc-brand-500)]/10 text-[var(--fc-brand-600)] hover:bg-[var(--fc-brand-500)]/20"
                    }`}
                  >
                    {primaryLabel}
                    {!primaryDisabled && activeStep !== steps.length && <ChevronRight className="h-4 w-4" />}
                  </button>
                </footer>
              </section>

              <aside className="hidden h-full flex-col overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-sm lg:flex">
                <div className="relative h-32 w-full overflow-hidden rounded-t-3xl">
                  {business?.hero_image_url ? (
                    <Image
                      src={business.hero_image_url}
                      alt={business?.nombre || "Negocio"}
                      width={900}
                      height={320}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-[var(--fc-brand-100)] to-[var(--fc-teal-100)]" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent" />
                </div>

                <div className="px-5 py-5">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--fc-brand-600)] text-white shadow-sm">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{business?.nombre || "Negocio activo"}</h3>
                      <p className="text-xs text-slate-500">
                        {bizLoading ? "Cargando datos…" : business?.direccion || "Dirección no disponible"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                    Tu pedido se sincroniza con el tablero de cocina y el POS registra la venta automáticamente.
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100/80">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 px-5 py-4">
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                        {item.imagen ? (
                          <Image src={item.imagen} alt={item.nombre} fill className="object-cover" sizes="70px" unoptimized />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-[10px] text-slate-400">Sin imagen</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold text-slate-900 line-clamp-2" title={item.nombre}>
                            {item.nombre}
                          </h4>
                          <span className="text-sm font-semibold text-slate-900">{formatCurrency(item.precio * item.cantidad)}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                          <div className="inline-flex items-center rounded-full border border-slate-200">
                            <button
                              type="button"
                              onClick={() => updateQty(item.id, item.cantidad - 1)}
                              className="h-7 w-7 rounded-l-full text-slate-700 hover:bg-slate-100"
                              aria-label="Restar"
                            >
                              –
                            </button>
                            <span className="w-8 text-center text-sm font-medium text-slate-700">{item.cantidad}</span>
                            <button
                              type="button"
                              onClick={() => updateQty(item.id, item.cantidad + 1)}
                              className="h-7 w-7 rounded-r-full bg-[var(--fc-brand-600)] text-white hover:bg-[var(--fc-brand-500)]"
                              aria-label="Sumar"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="text-[11px] text-red-500 hover:text-red-600"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/70 px-5 py-5">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm font-semibold text-slate-900">
                    <span>Total</span>
                    <span>{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
