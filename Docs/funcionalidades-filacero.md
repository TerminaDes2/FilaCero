# Funcionalidades Atómicas de FilaCero

Este documento describe todas las funcionalidades principales y atómicas de la plataforma FilaCero, explicando su propósito, funcionamiento y cómo interactúan entre sí en el ecosistema multi-negocio.

---

## 1. Autenticación y Usuarios
### 1.1 Registro de Usuario (`create-user`)
- **Endpoint:** `POST /api/auth/register`
- **Función:** Permite crear una cuenta nueva (dueño, empleado, estudiante).
- **Validaciones:** Email único, password seguro, campos opcionales según tipo de usuario.
- **Interacción:** Tras registro, el usuario recibe un token de verificación por email.

### 1.2 Login (`login`)
- **Endpoint:** `POST /api/auth/login`
- **Función:** Autentica credenciales y retorna JWT con claims de rol y negocio activo.
- **Interacción:** El JWT se usa en todas las llamadas protegidas.

### 1.3 Verificación de Cuenta (`verify-account`)
- **Endpoint:** `POST /api/auth/verify`
- **Función:** Valida el token recibido por email y marca el usuario como verificado.
- **Interacción:** Solo usuarios verificados pueden acceder a onboarding y POS.

### 1.4 Recuperación de Contraseña (`forgot-password`)
- **Endpoint:** `POST /api/auth/forgot`
- **Función:** Envía email con enlace para restablecer contraseña.

### 1.5 Actualización de Perfil (`update-user`)
- **Endpoint:** `PATCH /api/users/:id`
- **Función:** Permite modificar nombre, teléfono, avatar, número de cuenta, edad.
- **Interacción:** Requiere JWT y validación de ownership.

---

## 2. Negocios y Onboarding
### 2.1 Creación de Negocio (`create-business`)
- **Endpoint:** `POST /api/businesses`
- **Función:** Permite al dueño registrar un nuevo negocio con branding, horarios y ubicación.
- **Interacción:** El usuario queda vinculado como propietario en `usuarios_negocio`.

### 2.2 Asignación de Empleados (`assign-employee`)
- **Endpoint:** `POST /api/businesses/:id/assign`
- **Función:** Vincula usuarios existentes como empleados del negocio.
- **Interacción:** Controla acceso a inventario, ventas y categorías.

---

## 3. Catálogo y Categorías
### 3.1 Listar Categorías (`list-categories`)
- **Endpoint:** `GET /api/categories?id_negocio=<id>`
- **Función:** Devuelve categorías globales y del negocio activo.
- **Interacción:** El frontend POS filtra productos por categoría.

### 3.2 Crear Categoría (`create-category`)
- **Endpoint:** `POST /api/categories`
- **Función:** Permite crear una categoría personalizada para el negocio.
- **Restricción:** No se pueden crear categorías globales desde el frontend.

### 3.3 Editar/Eliminar Categoría (`update-category`, `delete-category`)
- **Endpoints:** `PATCH /api/categories/:id`, `DELETE /api/categories/:id`
- **Función:** Solo categorías del negocio pueden editarse/eliminarse. Las globales son de solo lectura.

---

## 4. Productos e Inventario
### 4.1 Listar Productos (`list-products`)
- **Endpoint:** `GET /api/products`
- **Función:** Devuelve productos filtrados por negocio y categoría.
- **Interacción:** El POS muestra solo productos disponibles en el inventario del negocio.

### 4.2 Crear Producto (`create-product`)
- **Endpoint:** `POST /api/products`
- **Función:** Permite registrar un nuevo producto en el catálogo.
- **Interacción:** Se asocia a una categoría y se inicializa inventario.

### 4.3 Actualizar/Eliminar Producto (`update-product`, `delete-product`)
- **Endpoints:** `PATCH /api/products/:id`, `DELETE /api/products/:id`
- **Función:** Modifica datos del producto o lo elimina (borrado lógico si está referenciado).

### 4.4 Inventario (`inventory`)
- **Endpoint:** `GET /api/inventory?negocio=<id>`
- **Función:** Devuelve existencias por producto y negocio.
- **Interacción:** El POS solo permite ventas si hay stock suficiente.

### 4.5 Movimientos de Inventario (`inventory-movement`)
- **Endpoint:** `POST /api/movements`
- **Función:** Registra ajustes, ventas, devoluciones y actualiza stock.

---

## 5. Ventas y POS
### 5.1 Registrar Venta (`create-sale`)
- **Endpoint:** `POST /api/sales`
- **Función:** Crea encabezado de venta, líneas y ajusta inventario.
- **Interacción:** Triggers en la BD aseguran coherencia de stock.

### 5.2 Listar Ventas (`list-sales`)
- **Endpoint:** `GET /api/sales?negocio=<id>`
- **Función:** Devuelve historial de ventas por negocio y usuario.

### 5.3 Corte de Caja (`cashout`)
- **Endpoint:** `POST /api/sales/cashout`
- **Función:** Registra cierre de caja y genera reporte diario.

---

## 6. Reportes y Métricas
### 6.1 Reporte de Ventas (`sales-report`)
- **Endpoint:** `GET /api/sales/report?negocio=<id>&fecha=<YYYY-MM-DD>`
- **Función:** Devuelve totales, productos más vendidos y métricas agregadas.

### 6.2 Métricas de Producto (`product-metrics`)
- **Endpoint:** `GET /api/products/:id/metrics`
- **Función:** Devuelve popularidad semanal y ranking por negocio.

---

## 7. Notificaciones y Feedback
### 7.1 Notificaciones (`notifications`)
- **Endpoint:** `GET /api/notifications?usuario=<id>`
- **Función:** Devuelve mensajes relevantes (ventas, inventario bajo, etc).

### 7.2 Feedback y Comentarios (`feedback`)
- **Endpoint:** `POST /api/feedback`
- **Función:** Permite a usuarios dejar comentarios y calificaciones sobre negocios y productos.

---

## 8. Seguridad y Validaciones
- Todos los endpoints protegidos requieren JWT y validan rol y pertenencia al negocio.
- Los DTOs aplican validaciones estrictas (`class-validator`).
- El backend verifica ownership antes de permitir acciones sensibles (inventario, ventas, categorías).
- Las restricciones únicas y triggers en la BD aseguran integridad de datos.

---

## 9. Interacción entre funcionalidades
- El registro de usuario y negocio habilita el acceso al POS y a la gestión de inventario/categorías.
- Las categorías y productos se filtran siempre por negocio activo, evitando fugas de datos entre negocios.
- Las ventas disparan movimientos de inventario y actualizan métricas en tiempo real.
- Los reportes y notificaciones se personalizan por usuario y negocio, permitiendo seguimiento granular.

---

## 10. Referencias rápidas
- **Frontend:** rutas en `Frontend/app/` y stores en `src/state/`, `src/pos/categoriesStore.ts`.
- **Backend:** módulos en `Backend/src/`, DTOs en `dto/`, migraciones en `prisma/migrations/`.
- **Base de datos:** restricciones y triggers en `Docker/db/db_filacero.sql`, modelo Prisma en `Backend/prisma/schema.prisma`.

---

Este documento debe actualizarse con cada nueva funcionalidad o refactorización relevante para mantener la trazabilidad y coherencia del sistema.