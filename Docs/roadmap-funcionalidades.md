# Roadmap de Funcionalidades FilaCero

Este documento define las próximas funcionalidades a implementar, priorizadas por impacto y dependencias técnicas.

---

## Fase 1: Completar Tienda Online (MVP)

### 1.1 Catálogo Público por Negocio
- **Ruta:** `/shop/:negocioId`
- **Backend:** `GET /api/businesses/:id/products` (público o con validación ligera)
- **Función:** Mostrar productos disponibles del negocio con imágenes, precio, descripción y stock disponible
- **Componentes:** 
  - Vista grid/list de productos
  - Filtros por categoría
  - Búsqueda por nombre
  - Detalles de producto en modal o página dedicada

### 1.2 Checkout y Carrito Persistente
- **Backend:** 
  - `POST /api/orders` (crear orden desde tienda pública)
  - `GET /api/orders/:id` (consultar estado)
- **Función:** 
  - Persistir carrito en localStorage o sesión autenticada
  - Formulario de datos de entrega
  - Selección de método de pago
  - Confirmación de orden
- **Validaciones:** 
  - Stock suficiente al momento de checkout
  - Precios actualizados
  - Datos de contacto obligatorios

### 1.3 Seguimiento de Órdenes
- **Backend:** `GET /api/orders?usuario=<id>` o `GET /api/orders?email=<email>`
- **Función:** 
  - Panel de órdenes del usuario (historial)
  - Estados: pendiente, confirmada, en preparación, lista, entregada, cancelada
  - Notificación por email de cambios de estado
- **Interacción:** Negocios actualizan estado desde panel POS o admin

---

## Fase 2: Pagos y Transacciones

### 2.1 Integración de Pasarela de Pagos
- **Proveedores sugeridos:** Stripe, MercadoPago, Conekta
- **Backend:** 
  - `POST /api/payments/intent` (crear intención de pago)
  - `POST /api/payments/webhook` (confirmar pago)
- **Función:** 
  - Soporte para tarjeta, transferencia, OXXO (México)
  - Validación de pago antes de confirmar orden
  - Registro de transacción en tabla `pagos`
- **Seguridad:** 
  - Tokens efímeros para datos sensibles
  - Webhooks firmados
  - Logs de auditoría

### 2.2 Sistema de Reembolsos
- **Backend:** `POST /api/payments/:id/refund`
- **Función:** 
  - Devolución total o parcial
  - Ajuste automático de inventario si aplica
  - Registro en movimientos de inventario

---

## Fase 3: Notificaciones y Comunicación

### 3.1 Notificaciones en Tiempo Real
- **Tecnología:** WebSockets (Socket.io) o Server-Sent Events
- **Backend:** 
  - Canal por usuario autenticado
  - Eventos: nueva orden, cambio de estado, stock bajo, venta completada
- **Frontend:** 
  - Badge de notificaciones en navbar
  - Panel de notificaciones con historial
  - Sonido/vibración en eventos críticos

### 3.2 Sistema de Mensajería Negocio-Cliente
- **Backend:** 
  - `POST /api/messages` (enviar mensaje)
  - `GET /api/messages?order=<id>` (conversación por orden)
- **Función:** 
  - Chat contextual por orden
  - Negocio puede contactar al cliente para aclaraciones
  - Cliente puede solicitar cambios o cancelaciones

### 3.3 Notificaciones por Email/SMS
- **Backend:** integración con SendGrid, Twilio, etc.
- **Función:** 
  - Confirmación de orden
  - Cambio de estado
  - Recordatorios de recogida
  - Promociones (con opt-in del usuario)

---

## Fase 4: Gestión Avanzada de Negocios

### 4.1 Panel de Analítica y Reportes
- **Backend:** 
  - `GET /api/reports/sales?negocio=<id>&periodo=<semanal|mensual>`
  - `GET /api/reports/products-ranking?negocio=<id>`
- **Frontend:** 
  - Dashboard con gráficas (Chart.js o Recharts)
  - KPIs: ventas totales, ticket promedio, productos top, horarios pico
  - Exportación a CSV/PDF

### 4.2 Gestión de Empleados y Permisos
- **Backend:** 
  - `POST /api/businesses/:id/employees` (invitar empleado)
  - `PATCH /api/businesses/:id/employees/:userId` (actualizar permisos)
- **Función:** 
  - Roles granulares: cajero, admin inventario, gerente
  - Permisos por módulo (ventas, productos, reportes)
  - Historial de acciones por empleado

### 4.3 Horarios y Disponibilidad
- **Backend:** 
  - `POST /api/businesses/:id/schedule` (configurar horarios)
  - `GET /api/businesses/:id/availability` (consultar si está abierto)
- **Función:** 
  - Horarios por día de la semana
  - Días festivos y cierres temporales
  - Mostrar estado "Abierto/Cerrado" en tienda pública
  - Bloquear órdenes fuera de horario

### 4.4 Gestión de Mesas y Turnos (para cafeterías)
- **Backend:** 
  - `POST /api/businesses/:id/tables` (crear mesa)
  - `POST /api/orders/:id/assign-table` (asignar orden a mesa)
- **Función:** 
  - Vista de mesas ocupadas/disponibles
  - Turnos de espera con notificación
  - Integración con POS para órdenes presenciales

---

## Fase 5: Promociones y Fidelización

### 5.1 Sistema de Cupones y Descuentos
- **Backend:** 
  - `POST /api/coupons` (crear cupón)
  - `POST /api/orders/apply-coupon` (validar y aplicar)
- **Función:** 
  - Tipos: porcentaje, monto fijo, envío gratis, 2x1
  - Restricciones: productos, categorías, monto mínimo, usos máximos
  - Vigencia temporal

### 5.2 Programa de Puntos y Recompensas
- **Backend:** 
  - Tabla `puntos_usuario` (acumulado por compra)
  - `POST /api/rewards/redeem` (canjear puntos)
- **Función:** 
  - Acumulación: 1 punto por cada $10
  - Recompensas: descuentos, productos gratis, beneficios exclusivos
  - Niveles de membresía (bronce, plata, oro)

### 5.3 Reseñas y Calificaciones de Productos
- **Backend:** 
  - `POST /api/products/:id/reviews` (crear reseña)
  - `GET /api/products/:id/reviews` (listar reseñas)
- **Función:** 
  - Calificación 1-5 estrellas
  - Comentario opcional
  - Verificación de compra previa
  - Moderación de contenido

---

## Fase 6: Experiencia de Usuario Avanzada

### 6.1 Búsqueda Inteligente
- **Backend:** integración con Elasticsearch o Algolia
- **Función:** 
  - Búsqueda por texto completo (nombre, descripción, tags)
  - Autocompletado
  - Sugerencias por similitud
  - Filtros combinados (precio, categoría, rating, disponibilidad)

### 6.2 Recomendaciones Personalizadas
- **Backend:** algoritmo basado en historial de compras y popularidad
- **Función:** 
  - "También te puede gustar"
  - "Compradores también vieron"
  - Productos complementarios (café + pan)

### 6.3 Modo Oscuro y Accesibilidad
- **Frontend:** 
  - Toggle de tema claro/oscuro persistente
  - Soporte de lectores de pantalla
  - Navegación por teclado completa
  - Contraste AAA

### 6.4 Aplicación Móvil (PWA o nativa)
- **Frontend:** 
  - PWA con Service Workers para offline
  - Instalación en home screen
  - Notificaciones push
  - Geolocalización para negocios cercanos

---

## Fase 7: Escalabilidad y Operaciones

### 7.1 Multi-idioma (i18n)
- **Backend:** soporte de `Accept-Language`
- **Frontend:** react-i18next o similar
- **Función:** español, inglés (inicialmente)

### 7.2 Multi-moneda
- **Backend:** 
  - Tabla `monedas` (MXN, USD, etc.)
  - API de tipos de cambio
- **Función:** 
  - Selección de moneda en tienda
  - Conversión automática de precios

### 7.3 Sistema de Afiliados
- **Backend:** 
  - `POST /api/affiliates/register` (registro de afiliado)
  - Tracking de conversiones por código de referido
- **Función:** 
  - Comisión por venta referida
  - Panel de afiliado con estadísticas

### 7.4 Integración con Delivery Partners
- **Backend:** integración con Uber Eats, Rappi, DiDi Food APIs
- **Función:** 
  - Sincronización de menú
  - Recepción de órdenes externas
  - Actualización de estado

---

## Fase 8: Administración y Compliance

### 8.1 Facturación Electrónica (México)
- **Backend:** integración con PAC (Facturama, FacturAPI)
- **Función:** 
  - Generación de CFDI 4.0
  - Descarga de XML y PDF
  - Registro de RFC del cliente

### 8.2 Auditoría y Logs
- **Backend:** 
  - Tabla `auditoria` (usuario, acción, timestamp, IP)
  - Logs estructurados (Winston/Pino)
- **Función:** 
  - Rastreo de cambios críticos (precios, inventario, usuarios)
  - Exportación de logs para compliance

### 8.3 Backup Automatizado
- **Infraestructura:** 
  - Snapshots diarios de base de datos
  - Backup de media en S3/Cloudinary
  - Plan de recuperación ante desastres

---

## Priorización Sugerida

### Corto plazo (1-2 meses)
1. Catálogo público por negocio
2. Checkout y carrito persistente
3. Notificaciones básicas por email
4. Panel de analítica simple

### Mediano plazo (3-6 meses)
5. Integración de pagos
6. Sistema de cupones
7. Gestión de empleados y permisos
8. Notificaciones en tiempo real

### Largo plazo (6-12 meses)
9. Programa de fidelización
10. Búsqueda inteligente
11. PWA móvil
12. Multi-idioma y multi-moneda

---

## Criterios de Aceptación General

Cada funcionalidad debe cumplir:
- **Documentación:** API documentada en `Docs/API_*.md`
- **Validaciones:** DTOs con `class-validator`
- **Seguridad:** autenticación/autorización apropiada
- **Tests:** cobertura mínima 70% en lógica crítica
- **UX:** diseño coherente con Tailwind, accesible
- **Performance:** tiempo de respuesta < 500ms (p95)

---

Este roadmap debe revisarse trimestralmente y ajustarse según feedback de usuarios y métricas de negocio.
