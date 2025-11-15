# Sistema de Pagos - Implementación Técnica Completa

> **Fecha de implementación:** 14-15 de noviembre de 2025  
> **Rama:** `mod/pedido`  
> **Stack:** NestJS + Prisma + Stripe + PostgreSQL

---

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Cambios en Base de Datos](#cambios-en-base-de-datos)
4. [Migraciones Prisma](#migraciones-prisma)
5. [Módulo Backend (PaymentsModule)](#módulo-backend-paymentsmodule)
6. [Endpoints API](#endpoints-api)
7. [Integración con Stripe](#integración-con-stripe)
8. [Configuración y Variables de Entorno](#configuración-y-variables-de-entorno)
9. [Errores Comunes y Soluciones](#errores-comunes-y-soluciones)
10. [Testing y Validación](#testing-y-validación)
11. [Próximos Pasos](#próximos-pasos)

---

## 1. Resumen Ejecutivo

### ¿Qué se implementó?

Sistema completo de procesamiento de pagos digitales para FilaCero que permite:

- **Pagos con tarjeta** mediante Stripe (tokenización PCI-DSS compliant)
- **Transferencias SPEI** (preparado para integración manual/automática)
- **Gestión de métodos de pago guardados** (tarjetas tokenizadas)
- **Historial completo de transacciones** con auditoría y rastreo
- **Webhooks de Stripe** para procesamiento asíncrono de eventos

### Alcance de la implementación

**Fase 2 (Persistencia):** ✅ Completada
- Nuevas tablas en PostgreSQL
- Modelos Prisma actualizados
- Migración aplicada

**Fase 3 (Backend MVP):** ✅ Completada
- Módulo NestJS funcional
- 5 endpoints REST operativos
- Integración Stripe SDK
- Validación y seguridad básica

**Fase 4 (Frontend):** 🔜 Pendiente
- Componentes de checkout
- Integración Stripe Elements
- Flujo de usuario

---

## 2. Arquitectura del Sistema

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  Checkout  │  │ Stripe.js    │  │ Payment Methods  │   │
│  │  Component │  │ (PCI Scope)  │  │ Management       │   │
│  └─────┬──────┘  └──────┬───────┘  └────────┬─────────┘   │
└────────┼─────────────────┼──────────────────┼──────────────┘
         │                 │                  │
         │ HTTPS           │ HTTPS           │ HTTPS
         ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (NestJS)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          PaymentsController (5 endpoints)            │  │
│  └────────────────────┬─────────────────────────────────┘  │
│                       │                                      │
│  ┌────────────────────▼─────────────────────────────────┐  │
│  │             PaymentsService                          │  │
│  │  • createPaymentIntent()                             │  │
│  │  • confirmPayment()                                  │  │
│  │  • handleWebhookEvent()                              │  │
│  │  • getPaymentMethods()                               │  │
│  │  • savePaymentMethod()                               │  │
│  └────────┬────────────────────┬────────────────────────┘  │
│           │                    │                            │
│  ┌────────▼────────┐  ┌────────▼────────────────────────┐  │
│  │  StripeService  │  │      PrismaService             │  │
│  │  (Stripe SDK)   │  │  • transaccion_pago            │  │
│  └────────┬────────┘  │  • metodo_pago_guardado        │  │
│           │           │  • usuarios (stripe_customer_id)│  │
│           │           │  • pedido (transacciones[])     │  │
│           │           └────────┬───────────────────────┘  │
└───────────┼────────────────────┼──────────────────────────┘
            │                    │
            │ API                │ SQL
            ▼                    ▼
   ┌────────────────┐   ┌─────────────────┐
   │  Stripe API    │   │   PostgreSQL    │
   │  (stripe.com)  │   │   (filacero DB) │
   └────────────────┘   └─────────────────┘
```

### Flujo de Datos - Crear Pago

```mermaid
sequenceDiagram
    participant U as Usuario
    participant F as Frontend
    participant B as Backend/PaymentsService
    participant S as StripeService
    participant DB as PostgreSQL
    participant ST as Stripe API

    U->>F: Confirmar pedido
    F->>B: POST /api/payments/create-intent {pedidoId}
    B->>DB: Buscar pedido y usuario
    DB-->>B: {pedido, usuario}
    B->>S: getOrCreateCustomer()
    S->>ST: customers.create() (si no existe)
    ST-->>S: {customerId}
    S-->>B: customerId
    B->>DB: UPDATE usuarios SET stripe_customer_id
    B->>S: createPaymentIntent({amount, customerId})
    S->>ST: paymentIntents.create()
    ST-->>S: {paymentIntent}
    S-->>B: {paymentIntent}
    B->>DB: INSERT transaccion_pago (estado: pending)
    DB-->>B: {transaccion}
    B-->>F: {clientSecret, paymentIntentId}
    F->>U: Mostrar formulario Stripe
    U->>F: Ingresar datos de tarjeta
    F->>ST: confirmCardPayment(clientSecret)
    ST-->>F: {paymentIntent: succeeded}
    ST->>B: Webhook: payment_intent.succeeded
    B->>DB: UPDATE transaccion_pago (estado: succeeded)
    B->>DB: UPDATE pedido (estado: confirmado)
    F->>U: ✅ Pago exitoso
```

---

## 3. Cambios en Base de Datos

### Nuevas Tablas

#### 3.1. `metodo_pago_guardado`

Almacena métodos de pago tokenizados (tarjetas) vinculados a usuarios.

```sql
CREATE TABLE IF NOT EXISTS metodo_pago_guardado (
  id_metodo              BIGSERIAL PRIMARY KEY,
  id_usuario             BIGINT NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
  stripe_payment_method_id VARCHAR(255) UNIQUE NOT NULL,  -- Token Stripe (pm_xxx)
  stripe_customer_id     VARCHAR(255) NOT NULL,            -- Customer Stripe (cus_xxx)
  tipo                   VARCHAR(20) NOT NULL,             -- 'card', 'bank_account', etc.
  marca                  VARCHAR(20),                      -- 'visa', 'mastercard', 'amex'
  ultima_4_digitos       VARCHAR(4) NOT NULL,
  mes_expiracion         INT,
  anio_expiracion        INT,
  nombre_tarjeta         VARCHAR(100),
  is_default             BOOLEAN DEFAULT FALSE,
  activo                 BOOLEAN DEFAULT TRUE,
  creado_en              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_metodo_pago_usuario_activo ON metodo_pago_guardado(id_usuario, activo);
CREATE INDEX idx_metodo_pago_stripe_customer ON metodo_pago_guardado(stripe_customer_id);
```

**Propósito:**
- Permitir checkout rápido (one-click payment)
- Cumplir PCI-DSS (no almacenar datos de tarjeta reales)
- Soportar múltiples tarjetas por usuario

#### 3.2. `transaccion_pago`

Bitácora completa de todas las transacciones de pago procesadas.

```sql
CREATE TABLE IF NOT EXISTS transaccion_pago (
  id_transaccion      BIGSERIAL PRIMARY KEY,
  id_pedido           BIGINT NOT NULL REFERENCES pedido(id_pedido) ON DELETE CASCADE,
  stripe_payment_id   VARCHAR(255) UNIQUE,           -- PaymentIntent ID (pi_xxx)
  stripe_customer_id  VARCHAR(255),                  -- Customer Stripe
  monto               NUMERIC(12,2) NOT NULL,
  moneda              VARCHAR(3) DEFAULT 'mxn',
  estado              VARCHAR(30) DEFAULT 'pending', -- pending, succeeded, failed, canceled, refunded, manual_confirmed
  metodo_pago         VARCHAR(50) NOT NULL,          -- 'tarjeta', 'spei', 'efectivo'
  ultima_4_digitos    VARCHAR(4),
  marca_tarjeta       VARCHAR(20),
  tipo_tarjeta        VARCHAR(20),                   -- 'credit', 'debit'
  error_codigo        VARCHAR(50),                   -- Código de error Stripe
  error_mensaje       TEXT,
  metadata            JSONB,                         -- Datos adicionales flexibles
  stripe_fee          NUMERIC(12,2),                 -- Comisión Stripe
  net_amount          NUMERIC(12,2),                 -- Monto neto recibido
  refund_id           VARCHAR(255),                  -- Refund ID si aplica
  refunded_at         TIMESTAMPTZ,
  creado_en           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transaccion_pago_pedido ON transaccion_pago(id_pedido);
CREATE INDEX idx_transaccion_pago_estado ON transaccion_pago(estado);
CREATE INDEX idx_transaccion_pago_creado ON transaccion_pago(creado_en);
```

**Propósito:**
- Auditoría completa de pagos
- Conciliación financiera
- Soporte para reembolsos
- Rastreo de errores

#### 3.3. Cambios en `usuarios`

```sql
ALTER TABLE usuarios ADD COLUMN stripe_customer_id VARCHAR(255) UNIQUE;
```

**Propósito:**
- Vincular usuario FilaCero con Customer Stripe
- Evitar crear múltiples customers para el mismo usuario
- Facilitar gestión de métodos de pago

#### 3.4. Cambios en `pedido`

```sql
-- Relación agregada en Prisma (no requiere ALTER TABLE explícito)
-- pedido.transacciones → transaccion_pago[]
```

**Propósito:**
- Consultar historial de intentos de pago por pedido
- Soportar múltiples transacciones (ej: primer intento fallido, segundo exitoso)

---

## 4. Migraciones Prisma

### Archivo: `prisma/schema.prisma`

#### Cambios realizados:

```prisma
// 1. Modelo usuarios - Campo Stripe Customer
model usuarios {
  // ... campos existentes
  stripe_customer_id         String?                  @unique @map("stripe_customer_id") @db.VarChar(255)
  
  // Relaciones nuevas
  metodos_pago               metodo_pago_guardado[]
  
  @@map("usuarios")
}

// 2. Modelo pedido - Relación con transacciones
model pedido {
  // ... campos existentes
  transacciones        transaccion_pago[]
  
  @@map("pedido")
}

// 3. Nuevo modelo: metodo_pago_guardado
model metodo_pago_guardado {
  id_metodo              BigInt    @id @default(autoincrement())
  id_usuario             BigInt
  stripe_payment_method  String    @unique @map("stripe_payment_method_id") @db.VarChar(255)
  stripe_customer_id     String    @map("stripe_customer_id") @db.VarChar(255)
  tipo                   String    @db.VarChar(20)
  marca                  String?   @db.VarChar(20)
  ultima_4_digitos       String    @db.VarChar(4)
  mes_expiracion         Int?
  anio_expiracion        Int?
  nombre_tarjeta         String?   @db.VarChar(100)
  is_default             Boolean   @default(false)
  activo                 Boolean   @default(true)
  creado_en              DateTime  @default(now()) @db.Timestamptz(6)
  actualizado_en         DateTime  @updatedAt @db.Timestamptz(6)
  usuario                usuarios  @relation(fields: [id_usuario], references: [id_usuario], onDelete: Cascade)

  @@index([id_usuario, activo])
  @@index([stripe_customer_id])
  @@map("metodo_pago_guardado")
}

// 4. Nuevo modelo: transaccion_pago
model transaccion_pago {
  id_transaccion      BigInt    @id @default(autoincrement())
  id_pedido           BigInt
  stripe_payment_id   String?   @unique @db.VarChar(255)
  stripe_customer_id  String?   @db.VarChar(255)
  monto               Decimal   @db.Decimal(12, 2)
  moneda              String    @default("mxn") @db.VarChar(3)
  estado              String    @default("pending") @db.VarChar(30)
  metodo_pago         String    @db.VarChar(50)
  ultima_4_digitos    String?   @db.VarChar(4)
  marca_tarjeta       String?   @db.VarChar(20)
  tipo_tarjeta        String?   @db.VarChar(20)
  error_codigo        String?   @db.VarChar(50)
  error_mensaje       String?   @db.Text
  metadata            Json?
  stripe_fee          Decimal?  @db.Decimal(12, 2)
  net_amount          Decimal?  @db.Decimal(12, 2)
  refund_id           String?   @db.VarChar(255)
  refunded_at         DateTime? @db.Timestamptz(6)
  creado_en           DateTime  @default(now()) @db.Timestamptz(6)
  actualizado_en      DateTime  @updatedAt @db.Timestamptz(6)
  pedido              pedido    @relation(fields: [id_pedido], references: [id_pedido], onDelete: Cascade)

  @@index([id_pedido])
  @@index([estado])
  @@index([creado_en])
  @@map("transaccion_pago")
}
```

### Migración generada

**Archivo:** `prisma/migrations/20251115033338_add_payment_tables/migration.sql`

```sql
-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN "stripe_customer_id" VARCHAR(255);

-- CreateTable
CREATE TABLE "metodo_pago_guardado" (
    "id_metodo" BIGSERIAL NOT NULL,
    "id_usuario" BIGINT NOT NULL,
    "stripe_payment_method_id" VARCHAR(255) NOT NULL,
    "stripe_customer_id" VARCHAR(255) NOT NULL,
    "tipo" VARCHAR(20) NOT NULL,
    "marca" VARCHAR(20),
    "ultima_4_digitos" VARCHAR(4) NOT NULL,
    "mes_expiracion" INTEGER,
    "anio_expiracion" INTEGER,
    "nombre_tarjeta" VARCHAR(100),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "metodo_pago_guardado_pkey" PRIMARY KEY ("id_metodo")
);

-- CreateTable
CREATE TABLE "transaccion_pago" (
    "id_transaccion" BIGSERIAL NOT NULL,
    "id_pedido" BIGINT NOT NULL,
    "stripe_payment_id" VARCHAR(255),
    "stripe_customer_id" VARCHAR(255),
    "monto" DECIMAL(12,2) NOT NULL,
    "moneda" VARCHAR(3) NOT NULL DEFAULT 'mxn',
    "estado" VARCHAR(30) NOT NULL DEFAULT 'pending',
    "metodo_pago" VARCHAR(50) NOT NULL,
    "ultima_4_digitos" VARCHAR(4),
    "marca_tarjeta" VARCHAR(20),
    "tipo_tarjeta" VARCHAR(20),
    "error_codigo" VARCHAR(50),
    "error_mensaje" TEXT,
    "metadata" JSONB,
    "stripe_fee" DECIMAL(12,2),
    "net_amount" DECIMAL(12,2),
    "refund_id" VARCHAR(255),
    "refunded_at" TIMESTAMPTZ(6),
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "transaccion_pago_pkey" PRIMARY KEY ("id_transaccion")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_stripe_customer_id_key" ON "usuarios"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "metodo_pago_guardado_stripe_payment_method_id_key" ON "metodo_pago_guardado"("stripe_payment_method_id");

-- CreateIndex
CREATE INDEX "metodo_pago_guardado_id_usuario_activo_idx" ON "metodo_pago_guardado"("id_usuario", "activo");

-- CreateIndex
CREATE INDEX "metodo_pago_guardado_stripe_customer_id_idx" ON "metodo_pago_guardado"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "transaccion_pago_stripe_payment_id_key" ON "transaccion_pago"("stripe_payment_id");

-- CreateIndex
CREATE INDEX "transaccion_pago_id_pedido_idx" ON "transaccion_pago"("id_pedido");

-- CreateIndex
CREATE INDEX "transaccion_pago_estado_idx" ON "transaccion_pago"("estado");

-- CreateIndex
CREATE INDEX "transaccion_pago_creado_en_idx" ON "transaccion_pago"("creado_en");

-- AddForeignKey
ALTER TABLE "metodo_pago_guardado" ADD CONSTRAINT "metodo_pago_guardado_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaccion_pago" ADD CONSTRAINT "transaccion_pago_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "pedido"("id_pedido") ON DELETE CASCADE ON UPDATE CASCADE;
```

### Comandos de migración ejecutados

```bash
# 1. Crear migración (genera archivo SQL)
docker exec -it filacero-backend-dev npx prisma migrate dev --create-only --name add_payment_tables

# 2. Aplicar migración a PostgreSQL
docker exec -it filacero-backend-dev npx prisma migrate dev

# 3. Regenerar Prisma Client (actualizar tipos TypeScript)
docker exec -it filacero-backend-dev npx prisma generate

# Para desarrollo local (Windows):
cd Backend
npx prisma generate
```

### Seeds actualizados

**Archivo:** `prisma/seed.ts`

```typescript
// Agregado tipo de pago 'spei'
const tiposPago = [
  { tipo: 'efectivo', descripcion: 'Pago en efectivo' },
  { tipo: 'tarjeta', descripcion: 'Pago con tarjeta de crédito/débito (Stripe)' },
  { tipo: 'spei', descripcion: 'Transferencia SPEI' },
  { tipo: 'transferencia', descripcion: 'Transferencia bancaria' },
];
```

---

## 5. Módulo Backend (PaymentsModule)

### Estructura de archivos

```
Backend/src/payments/
├── payments.module.ts          # Módulo principal
├── payments.controller.ts      # Controlador REST (5 endpoints)
├── payments.service.ts         # Lógica de negocio
├── stripe.service.ts           # Wrapper SDK Stripe
└── dto/
    ├── create-payment-intent.dto.ts
    ├── confirm-payment.dto.ts
    └── save-payment-method.dto.ts
```

### 5.1. `payments.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, StripeService],
  exports: [PaymentsService, StripeService],
})
export class PaymentsModule {}
```

**Dependencias:**
- `PrismaModule`: acceso a base de datos
- `PaymentsService`: lógica de pago
- `StripeService`: integración Stripe SDK

### 5.2. `stripe.service.ts`

Wrapper del SDK oficial de Stripe con métodos clave:

```typescript
@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY no configurada');
    }
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-10-29.clover',
    });
  }

  // Crear o recuperar Stripe Customer
  async getOrCreateCustomer(userId, email, name): Promise<string>

  // Crear PaymentIntent
  async createPaymentIntent(params): Promise<Stripe.PaymentIntent>

  // Confirmar PaymentIntent (server-side)
  async confirmPaymentIntent(paymentIntentId): Promise<Stripe.PaymentIntent>

  // Obtener detalles de PaymentIntent
  async retrievePaymentIntent(paymentIntentId): Promise<Stripe.PaymentIntent>

  // Crear reembolso
  async createRefund(paymentIntentId): Promise<Stripe.Refund>

  // Validar webhook de Stripe
  constructWebhookEvent(payload, signature, secret): Stripe.Event

  // Guardar método de pago (attach)
  async attachPaymentMethod(paymentMethodId, customerId): Promise<Stripe.PaymentMethod>

  // Listar métodos de pago
  async listPaymentMethods(customerId): Promise<Stripe.PaymentMethod[]>

  // Eliminar método de pago (detach)
  async detachPaymentMethod(paymentMethodId): Promise<Stripe.PaymentMethod>
}
```

**Responsabilidades:**
- Abstraer la complejidad del SDK Stripe
- Manejar autenticación con API keys
- Proporcionar métodos type-safe
- Logging de operaciones críticas

### 5.3. `payments.service.ts`

Lógica de negocio principal (320 líneas):

#### Métodos principales:

**`createPaymentIntent(userId, dto)`**
```typescript
/**
 * 1. Valida que el pedido existe y pertenece al usuario
 * 2. Obtiene/crea Stripe Customer
 * 3. Crea PaymentIntent en Stripe
 * 4. Registra transacción en BD con estado 'pending'
 * 5. Retorna clientSecret para frontend
 */
```

**`confirmPayment(dto)`**
```typescript
/**
 * 1. Busca transacción por paymentIntentId
 * 2. Actualiza estado a 'succeeded'
 * 3. Actualiza pedido a 'confirmado'
 * 4. (Futuro) Enviar notificaciones
 */
```

**`handleWebhookEvent(event)`**
```typescript
/**
 * Procesa eventos de Stripe:
 * - payment_intent.succeeded → confirmar pago
 * - payment_intent.payment_failed → marcar como fallido
 * - payment_intent.canceled → marcar como cancelado
 */
```

**`getPaymentMethods(userId)`**
```typescript
/**
 * 1. Busca usuario y su stripe_customer_id
 * 2. Consulta métodos activos en BD
 * 3. Retorna lista formateada
 */
```

**`savePaymentMethod(userId, dto)`**
```typescript
/**
 * 1. Obtiene/crea Stripe Customer
 * 2. Attach payment method a customer en Stripe
 * 3. Guarda tokenizado en BD
 */
```

#### Integraciones:

- **PrismaService:** operaciones CRUD en `transaccion_pago`, `metodo_pago_guardado`, `usuarios`, `pedido`
- **StripeService:** llamadas a API Stripe
- **NotificationsModule:** (futuro) envío de emails/SMS
- **Kitchen Board:** (futuro) eventos real-time

### 5.4. `payments.controller.ts`

Endpoints REST con guards de autenticación:

```typescript
@Controller('api/payments')
export class PaymentsController {
  
  @Post('create-intent')
  @UseGuards(AuthGuard('jwt'))
  async createIntent(@Req() req, @Body() dto) { }

  @Post('confirm')
  @UseGuards(AuthGuard('jwt'))
  async confirmPayment(@Body() dto) { }

  @Post('webhook')  // Sin guard (valida firma Stripe)
  async handleWebhook(@Headers('stripe-signature') sig, @Req() req) { }

  @Get('methods')
  @UseGuards(AuthGuard('jwt'))
  async getPaymentMethods(@Req() req) { }

  @Post('methods')
  @UseGuards(AuthGuard('jwt'))
  async savePaymentMethod(@Req() req, @Body() dto) { }
}
```

### 5.5. DTOs de Validación

**`create-payment-intent.dto.ts`**
```typescript
export class CreatePaymentIntentDto {
  @IsNotEmpty()
  @Type(() => BigInt)
  pedidoId: bigint;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
```

**`confirm-payment.dto.ts`**
```typescript
export class ConfirmPaymentDto {
  @IsNotEmpty()
  @IsString()
  paymentIntentId: string;

  @IsOptional()
  @IsString()
  last4?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  cardType?: string;
}
```

**`save-payment-method.dto.ts`**
```typescript
export class SavePaymentMethodDto {
  @IsNotEmpty()
  @IsString()
  paymentMethodId: string;

  @IsOptional()
  @IsString()
  tipo?: string;

  @IsOptional()
  @IsString()
  marca?: string;

  @IsNotEmpty()
  @IsString()
  last4: string;

  @IsOptional()
  @IsNumber()
  expMonth?: number;

  @IsOptional()
  @IsNumber()
  expYear?: number;

  @IsOptional()
  @IsString()
  cardholderName?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
```

---

## 6. Endpoints API

### 6.1. `POST /api/payments/create-intent`

Crea un PaymentIntent de Stripe para un pedido.

**Autenticación:** JWT requerido

**Request:**
```json
{
  "pedidoId": 123,
  "metadata": {
    "mesa": "5",
    "notas": "Sin cebolla"
  }
}
```

**Response (200):**
```json
{
  "clientSecret": "pi_3xxx_secret_yyy",
  "paymentIntentId": "pi_3xxxxxxxxxxxxx",
  "transaccionId": "456"
}
```

**Errores:**
- `404`: Pedido no encontrado
- `400`: Pedido no pertenece al usuario
- `500`: Error al crear PaymentIntent en Stripe

**Uso frontend:**
```typescript
const { clientSecret } = await fetch('/api/payments/create-intent', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ pedidoId: 123 })
}).then(r => r.json());

// Usar clientSecret con Stripe.js
const { error } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: { card: cardElement }
});
```

---

### 6.2. `POST /api/payments/confirm`

Confirma manualmente un pago (alternativa al webhook para testing).

**Autenticación:** JWT requerido

**Request:**
```json
{
  "paymentIntentId": "pi_3xxxxxxxxxxxxx",
  "last4": "4242",
  "brand": "visa",
  "cardType": "credit"
}
```

**Response (200):**
```json
{
  "success": true,
  "pedidoId": "123"
}
```

**Errores:**
- `404`: Transacción no encontrada

---

### 6.3. `POST /api/payments/webhook`

Endpoint público para recibir eventos de Stripe.

**Autenticación:** Validación de firma Stripe

**Headers requeridos:**
```
stripe-signature: t=1234567890,v1=abc123...
```

**Request (raw body):**
```json
{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_3xxxxxxxxxxxxx",
      "amount": 5000,
      "status": "succeeded"
    }
  }
}
```

**Response (200):**
```json
{
  "received": true
}
```

**Configuración en Stripe Dashboard:**
1. Ir a Developers > Webhooks
2. Agregar endpoint: `https://tu-dominio.com/api/payments/webhook`
3. Seleccionar eventos:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `payment_intent.canceled`
4. Copiar `webhook_secret` a `.env`

**Errores:**
- `400`: Firma inválida o webhook secret incorrecto
- `400`: Missing raw body

---

### 6.4. `GET /api/payments/methods`

Lista métodos de pago guardados del usuario.

**Autenticación:** JWT requerido

**Response (200):**
```json
[
  {
    "id": "123",
    "tipo": "card",
    "marca": "visa",
    "last4": "4242",
    "expMonth": 12,
    "expYear": 2025,
    "isDefault": true
  },
  {
    "id": "124",
    "tipo": "card",
    "marca": "mastercard",
    "last4": "5555",
    "expMonth": 8,
    "expYear": 2026,
    "isDefault": false
  }
]
```

**Errores:**
- `401`: No autenticado

---

### 6.5. `POST /api/payments/methods`

Guarda un nuevo método de pago tokenizado.

**Autenticación:** JWT requerido

**Request:**
```json
{
  "paymentMethodId": "pm_1xxx",
  "tipo": "card",
  "marca": "visa",
  "last4": "4242",
  "expMonth": 12,
  "expYear": 2025,
  "cardholderName": "Juan Pérez",
  "isDefault": true
}
```

**Response (201):**
```json
{
  "id": "125",
  "tipo": "card",
  "marca": "visa",
  "last4": "4242"
}
```

**Errores:**
- `404`: Usuario no encontrado
- `400`: Error al attach payment method en Stripe

---

## 7. Integración con Stripe

### 7.1. Configuración de cuenta

1. **Crear cuenta:** https://dashboard.stripe.com/register
2. **Activar modo test:** Dashboard > Developers > API keys
3. **Obtener claves:**
   - `Publishable key`: empieza con `pk_test_`
   - `Secret key`: empieza con `sk_test_`

### 7.2. SDK Stripe (Backend)

**Instalación:**
```bash
npm install stripe
```

**Inicialización:**
```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
});
```

### 7.3. Stripe.js (Frontend)

**Instalación:**
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

**Uso básico:**
```typescript
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 1. Crear PaymentIntent en backend
    const { clientSecret } = await fetch('/api/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({ pedidoId: 123 })
    }).then(r => r.json());

    // 2. Confirmar pago con Stripe.js
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
        billing_details: { name: 'Usuario' }
      }
    });

    if (error) {
      console.error(error.message);
    } else if (paymentIntent.status === 'succeeded') {
      console.log('¡Pago exitoso!');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe}>Pagar</button>
    </form>
  );
}

// Envolver con Elements provider
<Elements stripe={stripePromise}>
  <CheckoutForm />
</Elements>
```

### 7.4. Flujo de pagos Stripe

```
┌─────────────────────────────────────────────────────────┐
│  1. FRONTEND: Usuario ingresa datos de tarjeta          │
│     (Stripe.js los tokeniza, NUNCA llegan al servidor)  │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  2. BACKEND: Crear PaymentIntent                         │
│     POST /api/payments/create-intent                     │
│     → Stripe API: paymentIntents.create()                │
│     → Retorna clientSecret                               │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  3. FRONTEND: Confirmar pago con Stripe.js               │
│     stripe.confirmCardPayment(clientSecret, {...})       │
│     → Stripe procesa pago                                │
│     → Retorna resultado (succeeded/failed)               │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  4. STRIPE: Envía webhook al backend                     │
│     POST /api/payments/webhook                           │
│     event: "payment_intent.succeeded"                    │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│  5. BACKEND: Actualiza transacción y pedido              │
│     UPDATE transaccion_pago SET estado='succeeded'       │
│     UPDATE pedido SET estado='confirmado'                │
│     → Enviar notificaciones (email/SMS)                  │
└─────────────────────────────────────────────────────────┘
```

### 7.5. Tarjetas de prueba

| Número | Marca | Comportamiento |
|--------|-------|----------------|
| 4242 4242 4242 4242 | Visa | Pago exitoso |
| 4000 0025 0000 3155 | Visa | Requiere autenticación 3D Secure |
| 4000 0000 0000 9995 | Visa | Declinada (insufficient_funds) |
| 5555 5555 5555 4444 | Mastercard | Pago exitoso |
| 3782 822463 10005 | American Express | Pago exitoso |

**CVC:** Cualquier 3 dígitos (ej: 123)  
**Fecha:** Cualquier fecha futura (ej: 12/25)

---

## 8. Configuración y Variables de Entorno

### Archivo: `Backend/.env`

```dotenv
# Base de datos
PORT=3000
DATABASE_URL="postgresql://user:password@postgres:5432/filacero?schema=public"
SHADOW_DATABASE_URL="postgresql://user:password@postgres:5432/filacero_shadow"

# JWT
JWT_SECRET="Y2VxvQ1O9a0H3PQpY5FmKjNc4pGpEX1sBqkhZHVzuzQ="
JWT_EXPIRES_IN="3600s"

# Stripe (REEMPLAZAR con claves reales de Dashboard)
STRIPE_SECRET_KEY="sk_test_51JXExample_REPLACE_WITH_YOUR_KEY"
STRIPE_PUBLISHABLE_KEY="pk_test_51JXExample_REPLACE_WITH_YOUR_KEY"
STRIPE_WEBHOOK_SECRET="whsec_Example_REPLACE_WITH_YOUR_WEBHOOK_SECRET"

# Twilio (requerido para SMS)
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your_auth_token_here"
TWILIO_VERIFY_SERVICE_SID="VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### Archivo: `Frontend/.env.local`

```dotenv
NEXT_PUBLIC_API_BASE=http://localhost:3000/api
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51JXExample_REPLACE
```

### Obtener claves de Stripe

1. Ir a: https://dashboard.stripe.com/test/apikeys
2. Copiar `Publishable key` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Copiar `Secret key` → `STRIPE_SECRET_KEY`
4. Para webhook secret:
   - Ir a: https://dashboard.stripe.com/test/webhooks
   - Click "Add endpoint"
   - URL: `https://tu-dominio.com/api/payments/webhook`
   - Seleccionar eventos
   - Copiar `Signing secret` → `STRIPE_WEBHOOK_SECRET`

---

## 9. Errores Comunes y Soluciones

### 9.1. Error: "STRIPE_SECRET_KEY no configurada"

**Síntoma:**
```
[Nest] ERROR [ExceptionHandler] STRIPE_SECRET_KEY no configurada en variables de entorno
```

**Causa:** Falta variable de entorno en `Backend/.env`

**Solución:**
```bash
# Agregar a Backend/.env
STRIPE_SECRET_KEY="sk_test_..."

# Reiniciar backend
docker restart filacero-backend-dev
```

---

### 9.2. Error: "Cannot find module './dto/create-payment-intent.dto'"

**Síntoma:**
```
Cannot find module './dto/create-payment-intent.dto' or its corresponding type declarations
```

**Causa:** Archivos DTO no están en el contenedor Docker (problema de volúmenes)

**Solución:**
```bash
# Reiniciar stack completo para remontar volúmenes
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up -d

# Verificar archivos en contenedor
docker exec filacero-backend-dev ls -la /app/src/payments/dto/
```

---

### 9.3. Error: "Property 'transaccion_pago' does not exist on type 'PrismaService'"

**Síntoma:**
```typescript
Property 'transaccion_pago' does not exist on type 'PrismaService'
```

**Causa:** Prisma Client no regenerado después de cambios en schema

**Solución:**
```bash
# En contenedor
docker exec filacero-backend-dev npx prisma generate

# Localmente (para VS Code TypeScript)
cd Backend
npx prisma generate

# Reiniciar TypeScript Server en VS Code
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

---

### 9.4. Error: "prisma: not found" (loop infinito)

**Síntoma:**
```
sh: 1: prisma: not found
sh: 1: prisma: not found
(se repite indefinidamente)
```

**Causa:** `node_modules` no instalados en contenedor

**Solución:**
```bash
# Reconstruir imagen Docker
docker compose -f docker-compose.dev.yml build backend

# Levantar servicios
docker compose -f docker-compose.dev.yml up -d
```

---

### 9.5. Error: Webhook firma inválida

**Síntoma:**
```
Webhook error: No signatures found matching the expected signature for payload
```

**Causa:** `STRIPE_WEBHOOK_SECRET` incorrecto o body no es raw

**Solución:**
```typescript
// En main.ts, configurar raw body para webhook
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Verificar webhook secret en .env
STRIPE_WEBHOOK_SECRET="whsec_..." // debe empezar con whsec_
```

---

### 9.6. Error: Migration failed

**Síntoma:**
```
The migration `20251111165945_add_product_price_history` failed.
```

**Causa:** Migración anterior quedó en estado inconsistente

**Solución:**
```bash
# Marcar como rolled back
docker exec filacero-backend-dev npx prisma migrate resolve --rolled-back "20251111165945_add_product_price_history"

# Aplicar nuevas migraciones
docker exec filacero-backend-dev npx prisma migrate dev
```

---

### 9.7. Error: VS Code no reconoce tipos Prisma

**Síntoma:** Errores de TypeScript en VS Code pero backend compila correctamente

**Causa:** TypeScript Server usa caché desactualizado

**Solución:**
```bash
# 1. Regenerar client localmente
cd Backend
npx prisma generate

# 2. Recargar ventana VS Code
Ctrl+Shift+P → "Developer: Reload Window"

# O reiniciar TS Server
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

---

## 10. Testing y Validación

### 10.1. Verificar backend corriendo

```bash
docker ps --filter "name=filacero"
```

Debe mostrar `filacero-backend-dev` con status `Up`

### 10.2. Verificar logs del backend

```bash
docker logs --tail 100 filacero-backend-dev | grep -i payment
```

Debe mostrar:
```
[RoutesResolver] PaymentsController {/api/payments}: +0ms
[RouterExplorer] Mapped {/api/payments/create-intent, POST} route +0ms
[RouterExplorer] Mapped {/api/payments/confirm, POST} route +0ms
[RouterExplorer] Mapped {/api/payments/webhook, POST} route +1ms
[RouterExplorer] Mapped {/api/payments/methods, GET} route +0ms
[RouterExplorer] Mapped {/api/payments/methods, POST} route +0ms
```

### 10.3. Test manual con cURL

#### Crear PaymentIntent:

```bash
curl -X POST http://localhost:3000/api/payments/create-intent \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pedidoId": 1}'
```

Respuesta esperada:
```json
{
  "clientSecret": "pi_3xxx_secret_yyy",
  "paymentIntentId": "pi_3xxxxxxxxxxxxx",
  "transaccionId": "1"
}
```

#### Listar métodos de pago:

```bash
curl -X GET http://localhost:3000/api/payments/methods \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 10.4. Verificar tablas en PostgreSQL

```bash
docker exec -it filacero-postgres-dev psql -U filacero_user -d filacero

-- Verificar columna stripe_customer_id
\d usuarios

-- Verificar tabla transaccion_pago
\d transaccion_pago

-- Verificar tabla metodo_pago_guardado
\d metodo_pago_guardado

-- Ver datos
SELECT * FROM transaccion_pago LIMIT 5;
```

### 10.5. Test con Stripe CLI

```bash
# Instalar Stripe CLI
# Windows: scoop install stripe
# Mac: brew install stripe/stripe-cli/stripe
# Linux: https://stripe.com/docs/stripe-cli

# Login
stripe login

# Escuchar webhooks localmente
stripe listen --forward-to localhost:3000/api/payments/webhook

# Simular evento
stripe trigger payment_intent.succeeded
```

---

## 11. Próximos Pasos

### Fase 4: Frontend Checkout (Pendiente)

#### Componentes a crear:

1. **`CheckoutPage.tsx`**
   - Resumen del pedido
   - Selector de método de pago
   - Formulario Stripe Elements

2. **`StripeCheckoutForm.tsx`**
   - Integración con `@stripe/react-stripe-js`
   - Manejo de errores de pago
   - Loading states

3. **`PaymentMethodSelector.tsx`**
   - Radio buttons: Tarjeta / SPEI / Efectivo
   - Preview de tarjetas guardadas

4. **`SavedPaymentMethods.tsx`**
   - Lista de tarjetas tokenizadas
   - Botón "Eliminar método"
   - Toggle "Tarjeta predeterminada"

5. **`SpeiInstructions.tsx`**
   - CLABE bancaria
   - Referencia de pago
   - Botón "Ya transferí"

#### Rutas sugeridas:

```
Frontend/app/checkout/
├── page.tsx                    # Página principal de checkout
├── success/page.tsx            # Confirmación de pago exitoso
└── canceled/page.tsx           # Usuario canceló el pago

Frontend/src/components/checkout/
├── CheckoutForm.tsx
├── StripeCheckoutForm.tsx
├── PaymentMethodSelector.tsx
├── SavedPaymentMethods.tsx
└── SpeiInstructions.tsx

Frontend/src/hooks/
└── usePayments.ts             # Hook personalizado para pagos
```

#### Estado global (Zustand):

```typescript
// src/state/paymentStore.ts
interface PaymentState {
  currentPaymentIntent: string | null;
  selectedMethod: 'card' | 'spei' | 'efectivo';
  savedCards: PaymentMethod[];
  setPaymentIntent: (intentId: string) => void;
  setSelectedMethod: (method: string) => void;
  fetchSavedCards: () => Promise<void>;
}
```

### Fase 5: SPEI (Manual/Automático)

- Integración con banco (API BBVA, Banorte, etc.)
- Dashboard de conciliación para cajeros
- Webhooks de confirmación bancaria

### Fase 6: Notificaciones

- Email post-pago (confirmación, recibo)
- SMS con enlace de seguimiento
- Push notifications en PWA

### Fase 7: Observabilidad

- Dashboard de métricas (Grafana)
- Alertas de pagos fallidos (PagerDuty)
- Logs centralizados (ELK Stack)

### Fase 8: Producción

#### 8.1. Obtener Claves Productivas de Stripe

1. **Acceder a Stripe Dashboard:**
   - Ir a https://dashboard.stripe.com
   - Cambiar modo de "Test" a "Live" (toggle en esquina superior izquierda)

2. **Obtener Secret Key:**
   - Menú: Developers → API keys
   - Copiar "Secret key" (comienza con `sk_live_...`)
   - ⚠️ **NUNCA** commitear esta clave a Git

3. **Obtener Publishable Key:**
   - En la misma página, copiar "Publishable key" (`pk_live_...`)
   - Esta clave SÍ puede ir en frontend (es pública)

4. **Configurar Webhook Productivo:**
   - Menú: Developers → Webhooks
   - Clic en "Add endpoint"
   - URL: `https://tudominio.com/api/payments/webhook`
   - Eventos a escuchar:
     * `payment_intent.succeeded`
     * `payment_intent.payment_failed`
     * `payment_intent.canceled`
     * `charge.refunded`
   - Clic en "Add endpoint"
   - Copiar "Signing secret" (`whsec_...`)

#### 8.2. Configurar Variables de Entorno Productivas

**Backend (.env en servidor de producción):**

```env
# ⚠️ NO COMMITEAR ESTE ARCHIVO
# Usar variables de entorno del servidor (Railway, Vercel, AWS, etc.)

# Stripe Production Keys
STRIPE_SECRET_KEY=sk_live_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_PUBLISHABLE_KEY=pk_live_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Feature Flags (habilitar gradualmente)
ENABLE_PAYMENTS=true
ENABLE_SPEI=false            # Habilitar cuando SPEI esté listo
ENABLE_SAVED_CARDS=true
ENABLE_REFUNDS=false         # Habilitar cuando proceso de reembolsos esté definido

# Database Production
DATABASE_URL=postgresql://user:password@prod-db.internal:5432/filacero_prod

# Node Environment
NODE_ENV=production
```

**Frontend (.env.production):**

```env
# Estas variables SÍ se pueden commitear (son públicas)
NEXT_PUBLIC_API_BASE=https://api.tudominio.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### 8.3. Checklist de Seguridad Pre-Producción

- [ ] **Claves productivas configuradas** en variables de entorno del servidor
- [ ] **Webhook productivo** registrado en Stripe Dashboard
- [ ] **Firma de webhook validada** en endpoint `/api/payments/webhook`
- [ ] **Rate limiting activado** (100 req/15min payments, 50 req/15min webhook)
- [ ] **Feature flags** configurados (PAYMENTS_ENABLED=true en producción)
- [ ] **HTTPS habilitado** en dominio (obligatorio para Stripe)
- [ ] **Certificado SSL válido** (Let's Encrypt o similar)
- [ ] **Logs de producción** configurados (JSON estructurado)
- [ ] **Métricas monitoreadas** (endpoint `/api/payments/metrics`)
- [ ] **Tests E2E pasando** en ambiente staging
- [ ] **Backup de base de datos** configurado
- [ ] **Plan de rollback** documentado

#### 8.4. Proceso de Deployment a Producción

##### Opción A: Railway / Render

```bash
# 1. Push código a rama main
git checkout main
git merge mod/pedido
git push origin main

# 2. Railway/Render detecta push y hace deploy automático

# 3. Configurar variables de entorno en dashboard:
# Railway: Settings → Environment → Add variables
# Render: Environment → Add Environment Variable

# 4. Verificar deployment:
curl https://api.tudominio.com/api/payments/metrics
```

##### Opción B: Docker + VPS

```bash
# 1. Build imagen de producción
docker build -f Docker/backend.Dockerfile -t filacero-backend:prod .

# 2. Push a registry
docker tag filacero-backend:prod registry.tudominio.com/filacero-backend:prod
docker push registry.tudominio.com/filacero-backend:prod

# 3. En servidor de producción:
docker pull registry.tudominio.com/filacero-backend:prod
docker run -d \
  -p 3000:3000 \
  -e STRIPE_SECRET_KEY=sk_live_xxx \
  -e STRIPE_WEBHOOK_SECRET=whsec_xxx \
  -e DATABASE_URL=postgresql://... \
  -e NODE_ENV=production \
  --name filacero-backend \
  registry.tudominio.com/filacero-backend:prod

# 4. Verificar logs
docker logs -f filacero-backend
```

#### 8.5. Validación Post-Deployment

```bash
# 1. Health check
curl https://api.tudominio.com/health

# 2. Verificar Swagger UI
open https://api.tudominio.com/api/docs

# 3. Test de pago real con tarjeta de producción
# (usar tarjeta real con monto pequeño, ej: $1.00 MXN)

# 4. Verificar webhook recibido
# Stripe Dashboard → Developers → Webhooks → Ver eventos

# 5. Métricas funcionando
curl https://api.tudominio.com/api/payments/metrics
```

#### 8.6. Rollout Gradual con Feature Flags

Para activar pagos progresivamente:

```bash
# Día 1: Solo admins y beta testers
ENABLE_PAYMENTS=true
# Agregar lógica en guard para verificar rol de usuario

# Día 2-3: 10% de usuarios aleatorios
# Modificar FeatureFlagGuard con random:
# if (Math.random() > 0.1) throw ServiceUnavailableException()

# Día 4-7: 50% de usuarios
# Cambiar threshold a 0.5

# Día 8+: 100% de usuarios
ENABLE_PAYMENTS=true
# Sin lógica adicional
```

#### 8.7. ⚠️ IMPORTANTE: Seguridad de Claves

**NUNCA hacer:**
- ❌ Commitear `.env` con claves reales a Git
- ❌ Compartir `sk_live_` en Slack, Discord, email
- ❌ Hardcodear claves en código fuente
- ❌ Usar claves de producción en ambiente local

**SIEMPRE hacer:**
- ✅ Usar variables de entorno del servidor
- ✅ Rotar claves si fueron expuestas (Stripe Dashboard → API keys → Roll key)
- ✅ Configurar alertas de actividad inusual en Stripe
- ✅ Revisar logs de acceso a claves (Stripe Dashboard → Logs)
- ✅ Usar `.env.example` para documentar variables requeridas

#### 8.8. Monitoreo Post-Producción

Configurar alertas para:
- **Pagos fallidos > 10% en 1 hora** → Investigar
- **Webhook con status 500** → Revisar logs backend
- **Rate limit alcanzado** → Aumentar límite o detectar ataque
- **Feature flag deshabilitado** → Notificar equipo

**Herramientas sugeridas:**
- Grafana + Prometheus (métricas)
- Sentry (errores)
- LogDNA / Papertrail (logs)
- Stripe Dashboard (transacciones)

---

### Fase 9: Optimizaciones Post-Lanzamiento

- Caché de métodos de pago guardados
- Retry automático de webhooks fallidos
- Dashboard de analytics para negocios
- Reportes fiscales automáticos

---

## Apéndices

### A. Checklist de Implementación

**Backend (Fase 2-3):**
- [x] Diseño de tablas SQL
- [x] Migración Prisma generada
- [x] Migración aplicada a PostgreSQL
- [x] Prisma Client regenerado
- [x] Seeds actualizados con tipo_pago 'spei'
- [x] Docker SQL script sincronizado
- [x] Módulo PaymentsModule creado
- [x] StripeService implementado
- [x] PaymentsService implementado
- [x] PaymentsController con 5 endpoints
- [x] DTOs de validación
- [x] Guards de autenticación aplicados
- [x] Variables de entorno configuradas
- [x] Backend compilando sin errores
- [x] Backend corriendo en Docker dev
- [x] Endpoints registrados correctamente

**Hardening de Producción (Noviembre 2025):**
- [x] Tests E2E (payments.e2e-spec.ts)
- [x] Tests unitarios PaymentsService
- [ ] Tests unitarios StripeService (opcional)
- [x] Validaciones de seguridad (monto, usuario, estado, duplicados)
- [x] Logging estructurado JSON
- [x] Rate limiting (100/50 req/15min)
- [x] Manejo robusto de webhooks (charge.refunded, try-catch)
- [x] Documentación Swagger/OpenAPI
- [x] Feature flags (PAYMENTS_ENABLED, SAVED_CARDS_ENABLED, etc.)
- [x] Métricas y observabilidad (contadores, endpoint /metrics)
- [x] Colección Thunder Client para validación manual
- [x] Queries SQL de validación
- [x] Guía de testing manual completa
- [x] Documentación de producción (esta sección)

**Frontend (Fase 4 - Pendiente):**
- [ ] Componente CheckoutForm
- [ ] Integración Stripe Elements
- [ ] Manejo de saved cards
- [ ] UI de SPEI instructions
- [ ] Hooks usePayments
- [ ] Estado global paymentStore

**Infraestructura Producción:**
- [ ] Claves Stripe productivas configuradas
- [ ] Webhook productivo registrado
- [ ] HTTPS habilitado en dominio
- [ ] Monitoreo y alertas configurados
- [ ] Backup automático de BD
- [ ] Plan de rollback documentado

### B. Referencias

- **Stripe Docs:** https://stripe.com/docs/api
- **Stripe Testing:** https://stripe.com/docs/testing
- **Prisma Docs:** https://www.prisma.io/docs
- **NestJS Docs:** https://docs.nestjs.com
- **PCI-DSS Compliance:** https://stripe.com/docs/security/guide

### C. Glosario

| Término | Definición |
|---------|------------|
| **PaymentIntent** | Objeto de Stripe que representa la intención de cobrar al cliente |
| **PaymentMethod** | Token que representa un método de pago guardado (tarjeta, etc.) |
| **Customer** | Entidad Stripe que agrupa métodos de pago de un usuario |
| **Webhook** | Callback HTTP que Stripe envía para notificar eventos |
| **clientSecret** | Token temporal para confirmar pago desde frontend |
| **Idempotencia** | Propiedad que permite ejecutar operación múltiples veces con mismo resultado |
| **3D Secure** | Protocolo de autenticación adicional para tarjetas |
| **SPEI** | Sistema de Pagos Electrónicos Interbancarios (México) |

### D. Contactos y Soporte

- **Stripe Support:** https://support.stripe.com
- **Equipo Backend:** [agregar emails]
- **Documentación interna:** `Docs/SISTEMA-PAGOS.md` (plan estratégico)

---

**Última actualización:** 15 de noviembre de 2025  
**Versión del documento:** 1.0  
**Estado:** ✅ Fases 2-3 completadas, Fase 4 en planificación
