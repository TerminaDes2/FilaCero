# Guía de Validación Manual - Sistema de Pagos

Esta guía describe cómo validar manualmente el sistema de pagos usando Thunder Client/Postman y Stripe CLI.

## Prerrequisitos

1. **Backend corriendo**: `docker-compose up -d` o `npm run start:dev`
2. **Base de datos inicializada**: Con usuarios y negocios de prueba
3. **Thunder Client** instalado en VS Code (o Postman)
4. **Stripe CLI** instalado: https://stripe.com/docs/stripe-cli
5. **Variables de entorno** configuradas en `.env`:
   - `STRIPE_SECRET_KEY=sk_test_...`
   - `STRIPE_WEBHOOK_SECRET=whsec_...`

## Paso 1: Importar Colección

1. Abrir Thunder Client en VS Code (ícono de rayo en sidebar)
2. Ir a "Collections" → "Import"
3. Seleccionar archivo: `Backend/test/FilaCero-Payments.thunder-collection.json`
4. La colección "FilaCero - Sistema de Pagos" aparecerá con 7 carpetas

## Paso 2: Configurar Stripe CLI para Webhooks

Ejecutar en terminal separada:

```bash
stripe listen --forward-to localhost:3000/api/payments/webhook
```

Esto mostrará el **webhook secret** (whsec_...). Copiar y agregarlo al `.env`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

Reiniciar el backend para cargar el nuevo webhook secret.

## Paso 3: Flujo Completo de Validación

### 3.1. Autenticación

1. Ejecutar **"Login Usuario"** (carpeta 1. Autenticación)
2. Verificar que retorna `access_token`
3. El token se guarda automáticamente en variable `{{jwt_token}}`

**Validación en BD:**
```sql
SELECT * FROM usuarios WHERE correo_electronico = 'test@example.com';
```

### 3.2. Crear Pedido

1. Ejecutar **"Crear Pedido"** (carpeta 2. Pedidos)
2. Verificar response con `id_pedido`, `estado: "pendiente"`, `total`
3. El `id_pedido` se guarda en variable `{{pedido_id}}`

**Validación en BD:**
```sql
SELECT * FROM pedido WHERE id_pedido = <PEDIDO_ID>;
-- Debe tener estado = 'pendiente'
```

### 3.3. Crear PaymentIntent

1. Ejecutar **"Crear PaymentIntent"** (carpeta 3)
2. Verificar response con `clientSecret` y `paymentIntentId`
3. Ambos valores se guardan automáticamente

**Validación en BD:**
```sql
SELECT * FROM transaccion_pago WHERE id_pedido = <PEDIDO_ID>;
-- Debe existir registro con estado = 'pending'

SELECT * FROM usuarios WHERE id_usuario = <USER_ID>;
-- Debe tener stripe_customer_id poblado
```

**Métricas:**
```bash
curl http://localhost:3000/api/payments/metrics
# Verificar que total_payments_created incrementó en 1
```

### 3.4. Simular Pago con Stripe CLI

En la terminal donde corre `stripe listen`, ejecutar:

```bash
stripe trigger payment_intent.succeeded
```

O usar tarjeta de prueba en frontend con `clientSecret`:
- **Éxito**: 4242 4242 4242 4242
- **Fallo**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155

**Validación en BD:**
```sql
SELECT p.id_pedido, p.estado, t.estado AS estado_transaccion
FROM pedido p
JOIN transaccion_pago t ON p.id_pedido = t.id_pedido
WHERE p.id_pedido = <PEDIDO_ID>;
-- Después de webhook succeeded:
-- p.estado = 'confirmado'
-- t.estado = 'succeeded'
```

**Logs del Backend:**
Buscar en logs:
```
webhook_payment_succeeded
total_payments_succeeded: 1
total_amount_processed: <MONTO>
```

### 3.5. Validar Casos de Error

#### 3.5.1. Pedido Inexistente (404)
1. Ejecutar **"Crear PaymentIntent - Pedido Inexistente (404)"**
2. Debe retornar: `404 Not Found - "Pedido no encontrado"`

#### 3.5.2. Pedido de Otro Usuario (403)
1. Ejecutar **"Crear PaymentIntent - Pedido de Otro Usuario (403)"**
2. Debe retornar: `403 Forbidden - "Pedido no pertenece al usuario"`

#### 3.5.3. Monto Inválido
Editar el pedido en BD para tener `total = 0.25` (menor a 0.50):
```sql
UPDATE pedido SET total = 0.25 WHERE id_pedido = <PEDIDO_ID>;
```
Ejecutar "Crear PaymentIntent" → Debe retornar 400 Bad Request.

#### 3.5.4. Pedido Cancelado
```sql
UPDATE pedido SET estado = 'cancelado' WHERE id_pedido = <PEDIDO_ID>;
```
Ejecutar "Crear PaymentIntent" → Debe retornar 400 Bad Request.

### 3.6. Métodos de Pago Guardados

#### 3.6.1. Listar Métodos
1. Ejecutar **"Listar Métodos de Pago"** (carpeta 6)
2. Debe retornar array (vacío si usuario nuevo)

#### 3.6.2. Guardar Método
1. Generar `paymentMethodId` real con Stripe Elements (frontend) o usar token de prueba:
   ```bash
   stripe tokens create --card-number=4242424242424242 --card-exp-month=12 --card-exp-year=2025
   ```
2. Ejecutar **"Guardar Método de Pago"**
3. Verificar que retorna el método guardado

**Validación en BD:**
```sql
SELECT * FROM metodo_pago_guardado WHERE id_usuario = <USER_ID>;
-- Debe tener registro con is_default = true, activo = true
```

### 3.7. Métricas Finales

Ejecutar **"Obtener Métricas de Pagos"** (carpeta 7):

```json
{
  "total_payments_created": 1,
  "total_payments_succeeded": 1,
  "total_payments_failed": 0,
  "total_payments_canceled": 0,
  "total_payments_refunded": 0,
  "total_amount_processed": 300.00,
  "timestamp": "2025-11-15T16:30:00.000Z"
}
```

## Paso 4: Validación Avanzada

### 4.1. Rate Limiting

Ejecutar **"Crear PaymentIntent"** 101 veces en menos de 15 minutos:
- Primeras 100 peticiones: `201 Created`
- Petición 101: `429 Too Many Requests`

### 4.2. Feature Flags

Configurar en `.env`:
```env
ENABLE_PAYMENTS=false
```

Reiniciar backend y ejecutar "Crear PaymentIntent":
- Debe retornar: `503 Service Unavailable - "Funcionalidad PAYMENTS_ENABLED temporalmente deshabilitada"`

### 4.3. Idempotencia

Ejecutar "Crear PaymentIntent" **2 veces con el mismo pedido**:
- Primera ejecución: Crea PaymentIntent
- Segunda ejecución: Debe retornar error 400 (ya existe transacción)

**Validación en BD:**
```sql
SELECT COUNT(*) FROM transaccion_pago WHERE id_pedido = <PEDIDO_ID>;
-- Debe retornar 1 (no se crean duplicados)
```

### 4.4. Reembolsos

Simular reembolso con Stripe CLI:
```bash
stripe refunds create --charge=ch_xxxxxxxxxxxxx
```

**Validación en BD:**
```sql
SELECT * FROM transaccion_pago WHERE estado = 'refunded';
SELECT * FROM pedido WHERE id_pedido = <PEDIDO_ID>;
-- Pedido debe cambiar a estado = 'cancelado'
```

**Métricas:**
```bash
curl http://localhost:3000/api/payments/metrics
# total_payments_refunded debe incrementar
```

## Paso 5: Queries SQL de Verificación

Ejecutar queries del archivo `payment-validation-queries.sql`:

1. **Query #10**: Verificar integridad pedidos/transacciones
2. **Query #11**: Buscar duplicados de PaymentIntent (debe retornar 0 filas)
3. **Query #9**: Estadísticas generales

## Checklist Final

- [ ] Login exitoso y JWT token guardado
- [ ] Pedido creado con estado "pendiente"
- [ ] PaymentIntent creado y transacción registrada
- [ ] Webhook succeeded actualiza pedido a "confirmado"
- [ ] Métricas incrementan correctamente
- [ ] Errores 404/403/400 funcionan según casos
- [ ] Rate limiting bloquea después de 100 requests
- [ ] Feature flags deshabilitan endpoints (503)
- [ ] Idempotencia previene pagos duplicados
- [ ] Métodos de pago se guardan correctamente
- [ ] Reembolsos actualizan estado a "refunded" y "cancelado"
- [ ] Logs JSON estructurados en terminal backend
- [ ] Documentación Swagger accesible en `/api/docs`

## Troubleshooting

### Error: "STRIPE_WEBHOOK_SECRET no configurado"
- Verificar que `.env` tiene `STRIPE_WEBHOOK_SECRET`
- Reiniciar backend después de cambiar `.env`

### Error: "Invalid signature" en webhook
- El webhook secret debe obtenerse de `stripe listen`
- No usar el webhook secret del dashboard (diferente para CLI)

### Error: 401 Unauthorized
- Token JWT expirado, ejecutar "Login Usuario" nuevamente

### Error: "Pedido no encontrado"
- Verificar que `{{pedido_id}}` tiene valor en variables de Thunder Client
- Crear nuevo pedido si fue eliminado de BD

## Documentación Adicional

- **Swagger UI**: http://localhost:3000/api/docs
- **Stripe Dashboard**: https://dashboard.stripe.com/test/payments
- **Stripe CLI Docs**: https://stripe.com/docs/stripe-cli
- **Thunder Client Docs**: https://www.thunderclient.com/
