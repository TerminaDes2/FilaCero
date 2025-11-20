# Plan Definitivo del Sistema de Pagos FilaCero

> Última actualización: 14 de noviembre de 2025  
> Responsable: Equipo Backend / Plataforma FilaCero  
> Alcance: POS físico + Tienda en línea (cafetería universitaria)

---

## 1. Objetivo

Implementar un sistema de pagos seguro y escalable que permita a estudiantes y profesores pagar pedidos en línea con tarjeta (Stripe) o transferencia SPEI, manteniendo la opción de pago en efectivo al recoger. El sistema debe integrarse con el POS existente, el módulo de pedidos y la infraestructura de verificación de cuentas.

---

## 2. Principios Clave

1. **Seguridad primero**: PCI-DSS mediante tokenización de Stripe; nunca almacenamos tarjetas en BD.  
2. **Usuarios verificados**: solo cuentas con correo + teléfono + credencial validados pueden pagar.  
3. **Dual payment flow**: permitir "pago ahora" (tarjeta/SPEI) o "pago al recoger" (efectivo), con trazabilidad completa.  
4. **Experiencia fluida**: checkout express con tarjetas guardadas opcionales.  
5. **Observabilidad**: registrar cada transacción y correlacionarla con pedidos, ventas y Kitchen Board.  

---

## 3. Resumen por Fases

| Fase | Nombre | Resultado Clave | Estimación |
|------|--------|-----------------|------------|
| 1 | Fundamentos | Cuenta Stripe test, dependencias, variables de entorno, documentación de tokens | 1 día |
| 2 | Persistencia | Nuevas tablas Prisma (`transaccion_pago`, `metodo_pago_guardado`, campos en `usuarios`/`pedido`) + seeds `tipo_pago` | 0.5 día |
| 3 | Backend MVP | `PaymentsModule` (Stripe intents, webhook, guardas), endpoints REST, integración con pedidos/notificaciones | 3 días |
| 4 | Frontend Checkout | Integración Stripe Elements, selector SPEI/efectivo, tarjetas guardadas, flujo de confirmación | 2 días |
| 5 | SPEI Fast-Track | Generación de referencia, dashboard de conciliación manual, webhook futuro | 1.5 días |
| 6 | QA + Observabilidad | Tests E2E, sandbox pagos, alertas, dashboards, runbooks | 1 día |
| 7 | Go-Live | Claves productivas, hardening, feature flags, monitoreo | 0.5 día |

Total estimado: **~9 días hábiles** (prioridad Fases 1-4 para MVP beta).

---

## 4. Detalle de Fases

### Fase 1 · Fundamentos
- Crear cuenta Stripe (modo test) y registrar región MX.  
- Instalar dependencias: `stripe`, `@stripe/stripe-js`, tipados.  
- Variables `.env` backend/frontend (`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, etc.).  
- Documentar flujo de tokens y responsabilidades (backend vs frontend).  
- Crear llaves y restringir permisos desde Dashboard Stripe.

### Fase 2 · Persistencia y Seeds
- Prisma:  
  - `usuarios`: campo `stripe_customer_id`.  
  - `metodo_pago_guardado` (tokens Stripe).  
  - `transaccion_pago` (bitácora completa).  
  - `pedido`: relación con transacciones.  
- Seeds: asegurar `tipo_pago` incluye `efectivo`, `tarjeta`, `spei`.  
- Script SQL en `Docker/db/db_filacero.sql` para consistencia fuera de Prisma.  
- Ejecutar `npx prisma migrate dev --name add_payment_tables` y `prisma generate`.

#### Estado al 14 de noviembre de 2025
- ✅ Prisma `schema.prisma` actualizado con:
  - `usuarios.stripe_customer_id` (`@unique` + `@db.VarChar(255)`) y relación `metodos_pago` para tarjetas tokenizadas.  
  - `pedido` enlazado a `transaccion_pago[]` para consultar el historial de cobros por pedido.  
  - `metodo_pago_guardado` con llaves (`id_metodo` bigint, `id_usuario`, `stripe_payment_method_id`, `stripe_customer_id`) y metadatos de tarjeta (`marca`, `ultima_4_digitos`, expiración, flags `is_default`/`activo`).  
  - `transaccion_pago` con trazabilidad completa (`stripe_payment_id`, montos `monto/stripe_fee/net_amount`, estado, metadata JSON, refund tracking, índices por pedido/estado/fecha).  
- 🔜 Generar migración `add_payment_tables`, aplicar en Postgres y correr `prisma generate`.
- 🔜 Actualizar seed `tipo_pago` y `Docker/db/db_filacero.sql` para los nuevos campos/tablas.

### Fase 3 · Backend MVP
- Crear módulo `payments/` con:
  - `PaymentsModule`, `PaymentsController`, `PaymentsService`, `StripeService`.  
  - DTOs: `create-payment-intent`, `confirm-payment`, `webhook-event`, `save-payment-method`.  
- Endpoints clave:
  - `POST /api/payments/create-intent` → genera PaymentIntent y transacción `pending`.  
  - `POST /api/payments/webhook` → valida firma, procesa `payment_intent.succeeded/failed`.  
  - `GET /api/payments/methods` → tarjetas guardadas del usuario.  
  - `POST /api/payments/methods` → guardar/actualizar método.  
- Integraciones:
  - Pedidos: actualizar estado `pagado` al confirmar transacción.  
  - Notificaciones: enviar email/SMS al completar pago.  
  - Kitchen Board: emitir evento real-time al confirmar pago.  
- Seguridad: guardas `AuthGuard('jwt')` + `VerifiedGuard`, validación de montos, rate limiting básico.

### Fase 4 · Frontend Checkout
- Crear componentes en `Frontend/src/components/checkout/`:
  - `StripeCheckoutForm` (Elements + CardElement).  
  - `PaymentMethodSelector` (tarjeta / SPEI / efectivo).  
  - `SpeiInstructions` (CLABE + referencia).  
  - Integrar con `CartPanel` y tienda `checkout/`.  
- Flujos: 
  - Tarjeta: confirmación inmediata + modal de éxito.  
  - SPEI: mostrar referencia y botón "Ya transferí" → queda `pendiente_spei`.  
  - Efectivo: `pendiente_pago` sin transacción digital.  
- Opcional: almacenamiento de tarjetas (Stripe payment methods) desde UI.

### Fase 5 · SPEI Fast-Track (MVP Manual)
- Generar referencia única por pedido (UUID corto).  
- Mostrar CLABE (banco cafetería) + referencia.  
- Dashboard para cajero: marcar pagos SPEI como confirmados tras verificar estado bancario.  
- Registrar confirmación en `transaccion_pago` con `estado='manual_confirmed'`.  
- Plan para webhook futuro (BBVA API Market o Stripe Treasury).

### Fase 6 · QA + Observabilidad
- Casos de prueba:
  - Tarjeta éxito, declinada, cancelada.  
  - SPEI pendiente, confirmado, expirado.  
  - Efectivo/terminal sin pago digital.  
  - Usuario no verificado intentando pagar → `403`.  
- Instrumentación:
  - Logs estructurados para transacciones.  
  - Métricas (ventas por método).  
  - Alertas (webhook fallido, conciliación pendiente).  
- Simulación con tarjetas de prueba Stripe (`4242...`).

### Fase 7 · Go-Live
- Cambiar a claves productivas Stripe.  
- Configurar webhook público (ngrok → dominio definitivo).  
- Revisar checklist PCI (no logging de PAN, HTTPS obligatorio).  
- Feature flag "online-payments" para rollout gradual.  
- Capacitación al personal sobre conciliación SPEI y fallback manual.

---

## 5. Matriz de Riesgos

| Riesgo | Impacto | Mitigación |
|--------|----------|------------|
| Webhook caído | Pagos confirmados sin reflejarse | Retries automáticos, alertas, endpoint manual de reconciliación |
| Estudiante no recoge pedido "pago al recoger" | Inventario ocioso | Sistema de penalizaciones + registro de no-shows |
| SPEI tarda >30 min | Retrasos en cocina | Timeout configurable + botón "marcar como pagado" para administradores |
| Error en Stripe | Pedidos detenidos | Fallback: permitir efectivo/terminal; monitoreo en tiempo real |
| Duplicidad de pedidos | Cobros múltiples | Idempotencia en PaymentIntent (metadata con `pedido_id`) |

---

## 6. Dependencias Técnicas

- Stripe Dashboard (API keys, webhooks, logs).  
- Twilio Verify (ya utilizado, asegura 2FA).  
- Prisma ORM (migraciones nuevas).  
- Docker Stack (actualizar `db_filacero.sql`).  
- EmailModule + SmsModule para notificaciones de pago.  
- Kitchen Board (para reflejar pedidos pagados automáticamente).

---

## 7. Checklist Pre-Release

1. ✅ Migraciones Prisma aplicadas (`npx prisma migrate dev`).  
2. ✅ Backend compila (`npm run build`).  
3. ✅ Webhook probado con `stripe listen`.  
4. ✅ Frontend muestra métodos de pago correctos.  
5. ✅ Documentación entregada (`Docs/SISTEMA-PAGOS.md`).  
6. ✅ Equipo de cafetería capacitado en SPEI manual.  

---

## 8. Próximos Pasos

1. Ejecutar Fase 1 y 2 de inmediato para habilitar el resto del desarrollo.  
2. En paralelo, diseñar UI final del checkout con el equipo de frontend.  
3. Preparar ambiente de QA con cuentas verificados de prueba.  
4. Definir cutover a producción (fecha tentativa + ventana de mantenimiento).  

> **Nota:** Toda la información sensible (API keys, referencias bancarias) debe gestionarse mediante el vault corporativo. No se deben exponer en repositorio ni en documentación pública.
