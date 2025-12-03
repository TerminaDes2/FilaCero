"use client";
import React, { useEffect, useMemo, useState } from "react";
import { loadStripe, type StripeCardElementOptions } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, Building2, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import NavbarStore from "../../src/components/shop/navbarStore";
import { useCart } from "../../src/components/shop/CartContext";
import { useUserStore } from "../../src/state/userStore";
import { useThemeStore } from "../../src/state/themeStore";
import DeliveryTime from "../../src/components/checkout/deliveryTime";
import { useTranslation } from "../../src/hooks/useTranslation";
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
  const resolvedTheme = useThemeStore((state) => state.resolved);

  const cardElementOptions = useMemo<StripeCardElementOptions>(() => {
    const isDark = resolvedTheme === "dark";
    return {
      hidePostalCode: true,
      iconStyle: "solid",
      style: {
        base: {
          color: isDark ? "#E2E8F0" : "#0F172A",
          fontSize: "15px",
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
          iconColor: isDark ? "#38BDF8" : "#0284C7",
          "::placeholder": {
            color: isDark ? "#64748B" : "#94A3B8",
          },
        },
        empty: {
          color: isDark ? "#CBD5F5" : "#1F2937",
          iconColor: isDark ? "#475569" : "#64748B",
        },
        invalid: {
          color: "#F87171",
          iconColor: "#F87171",
        },
        complete: {
          color: isDark ? "#A5F3FC" : "#0F766E",
          iconColor: isDark ? "#34D399" : "#22C55E",
        },
      },
    };
  }, [resolvedTheme]);

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
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors dark:border-white/12 dark:bg-[color:rgba(10,15,30,0.88)]">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Tarjeta</label>
        <div className="mt-2">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 transition-colors dark:border-white/10 dark:bg-[color:rgba(4,7,16,0.86)]">
            <CardElement options={cardElementOptions} className="[&_.InputElement]:!text-base" />
          </div>
        </div>
      </div>



      {error && <div className="text-sm text-rose-600 dark:text-rose-300">{error}</div>}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handlePay}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--fc-brand-600)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--fc-brand-500)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fc-brand-300)] focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[var(--fc-brand-500)] dark:hover:bg-[var(--fc-brand-400)] dark:focus-visible:ring-offset-[color:rgba(7,11,22,0.94)]"
        >
          {loading ? 'Procesando…' : 'Pagar ahora'}
        </button>
      </div>
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
  { id: 2, title: "Confirmación", caption: "Envía a cocina" },
];

export default function CheckoutPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { items, total, updateQty, removeFromCart, clearCart } = useCart();
  const { isAuthenticated, user, loading: userLoading } = useUserStore();

  const [activeStep, setActiveStep] = useState(1);
  const [deliveryTime, setDeliveryTime] = useState<string>("asap");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [verificationsOk, setVerificationsOk] = useState(false);
  const [business, setBusiness] = useState<BusinessSummary | null>(null);
  const [bizLoading, setBizLoading] = useState(true);
  const [pendingPedidoId, setPendingPedidoId] = useState<string | null>(null);
  const [cardFormRef, setCardFormRef] = useState<{ handlePay: () => Promise<void> } | null>(null);

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
  const paymentSummary = "Tarjeta / QR";

  const canAdvanceFromStep = (stepId: number) => {
    if (stepId === 1) return Boolean(deliveryTime);
    return true;
  };

  // Cambiar el label del botón si hay un pedido pendiente con tarjeta
  const confirmDisabled =
    !items.length || !deliveryTime || isSubmitting || !verificationsOk;
  const primaryDisabled =
    activeStep === steps.length ? confirmDisabled : isSubmitting || !canAdvanceFromStep(activeStep);
  const primaryLabel =
    activeStep === steps.length
      ? isSubmitting
        ? "Procesando…"
        : pendingPedidoId
          ? "Pagar ahora"
          : "Enviar a cocina"
      : "Ir a confirmación";

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

    // Si ya existe un pedido pendiente, ejecutar el pago con tarjeta
    if (pendingPedidoId && cardFormRef) {
      await cardFormRef.handlePay();
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      // Agrupar items por negocio
      const itemsByBusiness = new Map<string, typeof items>();
      
      for (const item of items) {
        const bizId = item.id_negocio ? String(item.id_negocio) : (activeBusiness.get() ?? business?.id_negocio ?? "1");
        const existing = itemsByBusiness.get(bizId) || [];
        itemsByBusiness.set(bizId, [...existing, item]);
      }

      // Crear una venta por cada negocio
      const allPedidos: any[] = [];
      
      for (const [negocioId, bizItems] of itemsByBusiness.entries()) {
        const payload = {
          id_negocio: String(negocioId),
          id_tipo_pago: "2", // Siempre tarjeta
          items: bizItems.map((item) => ({
            id_producto: String(item.id),
            cantidad: item.cantidad,
            precio_unitario: item.precio,
          })),
          cerrar: true,
        };

        const sale = await api.createSale(payload);
        const pedido = sale?.pedido;
        
        if (!pedido || !pedido.id_pedido) {
          throw new Error(`No se pudo crear el pedido para el negocio ${negocioId}`);
        }
        
        allPedidos.push(pedido);
      }

      // Usar el primer pedido como referencia para el pago (o crear lógica de pago múltiple)
      if (allPedidos.length > 0) {
        setPendingPedidoId(String(allPedidos[0].id_pedido));
      } else {
        throw new Error('No se pudo obtener ningún pedido para procesar el pago');
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
          <div className="rounded-2xl border border-dashed border-[var(--fc-brand-200)] bg-[var(--fc-brand-50)]/50 px-4 py-4 text-xs text-[var(--fc-brand-700)] transition-colors dark:border-[color:rgba(56,189,248,0.4)] dark:bg-[color:rgba(8,36,63,0.45)] dark:text-[color:rgba(190,227,248,0.95)]">
            <Sparkles className="mr-2 inline h-4 w-4" />
            La hora que elijas alimenta el tablero de cocina y ajusta los tiempos de producción.
          </div>
        </div>
      );
    }



    return (
      <div className="space-y-5">
        {!verificationsOk && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-700 transition-colors dark:border-amber-500/50 dark:bg-[color:rgba(120,53,15,0.28)] dark:text-amber-200">
            Necesitas verificar tu <strong>correo</strong> y tu <strong>credencial</strong> para completar pagos digitales. Por favor completa las verificaciones en tu perfil.
          </div>
        )}
        {submitError && (
          <div className="rounded-2xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm text-red-700 transition-colors dark:border-red-500/60 dark:bg-[color:rgba(127,29,29,0.3)] dark:text-red-200">{submitError}</div>
        )}
        {successMessage && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-700 transition-colors dark:border-emerald-500/55 dark:bg-[color:rgba(6,78,59,0.28)] dark:text-emerald-200">
            <BadgeCheck className="h-5 w-5" />
            {successMessage}
          </div>
        )}
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 transition-colors dark:border-white/12 dark:bg-[color:rgba(6,10,22,0.92)]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Ticket digital</h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">{items.length} productos</span>
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(total)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-dashed border-slate-200 pt-2 text-sm font-semibold text-slate-900 dark:border-white/10 dark:text-white">
              <span>Total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-5 text-sm text-slate-600 transition-colors dark:border-white/12 dark:bg-[color:rgba(6,10,22,0.92)] dark:text-slate-300">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Detalles operativos</h3>
          <dl className="mt-3 space-y-2">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-xs uppercase tracking-[0.32em] text-slate-400 dark:text-slate-500">Ventana</dt>
              <dd className="font-medium text-slate-900 dark:text-white">{deliverySummary}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-xs uppercase tracking-[0.32em] text-slate-400 dark:text-slate-500">Pago</dt>
              <dd className="font-medium text-slate-900 dark:text-white">{paymentSummary}</dd>
            </div>
          </dl>
        </div>
        <div className="mt-4 space-y-3">
          {!pendingPedidoId ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600 transition-colors dark:border-white/12 dark:bg-[color:rgba(9,14,28,0.75)] dark:text-slate-300">
              Al confirmar el pedido se solicitará el pago con tarjeta en esta pantalla.
            </div>
          ) : (
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
                      setSuccessMessage(t('checkout.payment.success'));
                      setTimeout(() => router.push('/shop?order=confirmed'), 900);
                    }}
                    onReady={(ref: any) => setCardFormRef(ref)}
                  />
                </Elements>
              ) : (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/70 px-4 py-3 text-sm text-rose-700 transition-colors dark:border-rose-500/60 dark:bg-[color:rgba(136,19,55,0.28)] dark:text-rose-200">
                  {t('checkout.payment.stripeNotConfigured')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 transition-colors dark:bg-[color:rgba(2,6,23,0.96)]">
      <NavbarStore />

      <main className="relative flex min-h-[calc(100vh-5rem)] flex-col overflow-hidden pt-24 pb-12 text-slate-900 transition-colors dark:text-slate-100">
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 pb-6">
            <Link href="/shop" className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
              <ChevronLeft className="h-4 w-4" />
              {t('checkout.header.backToShop')}
            </Link>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">{t('checkout.header.title')}</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('checkout.header.subtitle')}</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[var(--fc-brand-50)] px-4 py-2 text-xs font-semibold text-[var(--fc-brand-600)] dark:bg-[color:rgba(30,64,175,0.25)] dark:text-[color:rgba(195,243,255,0.92)]">
                <Sparkles className="h-4 w-4" />
                {t('checkout.header.badge')}
              </span>
            </div>
          </div>

          {emptyState ? (
            <div className="flex flex-1 items-center justify-center rounded-3xl border border-white/70 bg-white/90 px-6 py-10 text-center shadow-sm transition-colors dark:border-white/12 dark:bg-[color:rgba(5,8,18,0.92)] dark:shadow-[0_48px_120px_-80px_rgba(2,6,23,0.9)]">
              <div className="max-w-sm space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--fc-brand-50)] text-[var(--fc-brand-600)] dark:bg-[color:rgba(30,64,175,0.25)] dark:text-[color:rgba(190,227,248,0.92)]">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t('checkout.empty.title')}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('checkout.empty.subtitle')}</p>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--fc-brand-600)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--fc-brand-500)] dark:bg-[var(--fc-brand-500)] dark:hover:bg-[var(--fc-brand-400)]"
                >
                  {t('checkout.header.backToShop')}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid flex-1 gap-6 overflow-hidden lg:grid-cols-[minmax(0,1fr),340px]">
              <section className="flex h-full flex-col overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-sm backdrop-blur transition-colors dark:border-white/12 dark:bg-[color:rgba(5,8,18,0.9)] dark:shadow-[0_48px_120px_-70px_rgba(2,6,23,0.92)]">
                <header className="border-b border-white/70 px-6 py-5 dark:border-white/10">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-400 dark:text-slate-500">{t('checkout.flow.badge')}</p>
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t('checkout.flow.title', { current: activeStep, total: steps.length })}</h2>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{paymentSummary}</span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {steps.map((step) => {
                      const status = step.id < activeStep ? "done" : step.id === activeStep ? "active" : "upcoming";
                      const baseClasses =
                        "group flex min-w-[200px] flex-1 items-center gap-3 rounded-2xl border px-4 py-3 text-left transition";
                      const stateClasses =
                        status === "active"
                          ? "border-slate-900 bg-slate-900 text-white shadow-sm dark:border-white/20 dark:bg-[color:rgba(15,23,42,0.75)]"
                          : status === "done"
                            ? "border-[var(--fc-brand-500)] bg-[var(--fc-brand-50)] text-[var(--fc-brand-700)] dark:border-[color:rgba(56,189,248,0.35)] dark:bg-[color:rgba(8,47,73,0.45)] dark:text-[color:rgba(186,230,253,0.95)]"
                            : "border-slate-200/80 bg-white text-slate-500 dark:border-white/10 dark:bg-[color:rgba(9,14,28,0.86)] dark:text-slate-400";
                      const pillClasses =
                        status === "active"
                          ? "bg-white text-slate-900 dark:bg-white/80 dark:text-slate-900"
                          : status === "done"
                            ? "bg-[var(--fc-brand-600)] text-white dark:bg-[var(--fc-brand-500)]"
                            : "bg-slate-200 text-slate-600 dark:bg-white/10 dark:text-slate-400";
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

                <footer className="flex items-center justify-between gap-4 border-t border-white/70 px-6 py-5 dark:border-white/10">
                  {activeStep === 1 ? (
                    <Link
                      href="/shop"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-700 dark:border-white/12 dark:text-slate-300 dark:hover:border-white/20 dark:hover:text-white"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t('checkout.header.backToShop')}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-700 dark:border-white/12 dark:text-slate-300 dark:hover:border-white/20 dark:hover:text-white"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t('checkout.flow.prev')}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={activeStep === steps.length ? handleConfirm : handleNext}
                    disabled={primaryDisabled}
                    className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fc-brand-300)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[color:rgba(8,12,24,0.96)] ${primaryDisabled
                        ? "cursor-not-allowed border border-slate-200 bg-slate-200 text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500"
                        : activeStep === steps.length
                          ? "bg-[var(--fc-brand-600)] text-white shadow-lg shadow-[rgba(222,53,95,0.25)] hover:bg-[var(--fc-brand-500)] dark:bg-[var(--fc-brand-500)] dark:hover:bg-[var(--fc-brand-400)]"
                          : "border border-[var(--fc-brand-500)] bg-[var(--fc-brand-500)]/10 text-[var(--fc-brand-600)] hover:bg-[var(--fc-brand-500)]/20 dark:border-[var(--fc-brand-400)] dark:bg-[color:rgba(9,14,28,0.6)] dark:text-[color:rgba(186,230,253,0.95)] dark:hover:bg-[color:rgba(12,19,38,0.9)]"
                      }`}
                  >
                    {primaryLabel}
                    {!primaryDisabled && activeStep !== steps.length && <ChevronRight className="h-4 w-4" />}
                  </button>
                </footer>
              </section>

              <aside className="hidden h-full flex-col overflow-hidden rounded-3xl border border-white/70 bg-white/90 shadow-sm transition-colors lg:flex dark:border-white/12 dark:bg-[color:rgba(5,8,18,0.9)] dark:shadow-[0_48px_120px_-70px_rgba(2,6,23,0.92)]">
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
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--fc-brand-600)] text-white shadow-sm dark:bg-[var(--fc-brand-500)]">
                      <Building2 className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{business?.nombre || "Negocio activo"}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {bizLoading ? "Cargando datos…" : business?.direccion || "Dirección no disponible"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-500 transition-colors dark:border-white/12 dark:bg-[color:rgba(8,13,24,0.85)] dark:text-slate-300">
                    Tu pedido se sincroniza con el tablero de cocina y el POS registra la venta automáticamente.
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-100/80 dark:divide-white/5">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 px-5 py-4">
                      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-white/10">
                        {item.imagen ? (
                          <Image src={item.imagen} alt={item.nombre} fill className="object-cover" sizes="70px" unoptimized />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-[10px] text-slate-400 dark:text-slate-500">Sin imagen</div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold text-slate-900 line-clamp-2 dark:text-white" title={item.nombre}>
                            {item.nombre}
                          </h4>
                          <span className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(item.precio * item.cantidad)}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <div className="inline-flex items-center rounded-full border border-slate-200 dark:border-white/10 dark:bg-[color:rgba(9,14,28,0.7)]">
                            <button
                              type="button"
                              onClick={() => updateQty(item.id, item.cantidad - 1)}
                              className="h-7 w-7 rounded-l-full text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
                              aria-label="Restar"
                            >
                              –
                            </button>
                            <span className="w-8 text-center text-sm font-medium text-slate-700 dark:text-white">{item.cantidad}</span>
                            <button
                              type="button"
                              onClick={() => updateQty(item.id, item.cantidad + 1)}
                              className="h-7 w-7 rounded-r-full bg-[var(--fc-brand-600)] text-white transition hover:bg-[var(--fc-brand-500)] dark:bg-[var(--fc-brand-500)] dark:hover:bg-[var(--fc-brand-400)]"
                              aria-label="Sumar"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            className="text-[11px] text-red-500 transition hover:text-red-600 dark:text-red-300 dark:hover:text-red-200"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-white/70 px-5 py-5 dark:border-white/10">
                  <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                    <span>Subtotal</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm font-semibold text-slate-900 dark:text-white">
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
