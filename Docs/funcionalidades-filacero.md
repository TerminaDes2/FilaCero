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

### 2.2 Listado público de negocios (`list-public-businesses`)
- **Endpoint:** `GET /api/businesses` (público, sin autenticación)
- **Query params:** `search` (filtro por nombre), `limit` (máx 50, default 20)
- **Función:** Devuelve negocios disponibles para la tienda online con:
  - Información básica: nombre, dirección, teléfono, correo
  - Branding: `logo`, `hero_image_url`
  - Rating promedio calculado desde `negocio_rating`
  - Lista de categorías destacadas con inventario disponible
- **Interacción:** 
  - Consumido por `app/api/stores` (proxy Next.js) para la sección "Tiendas cerca de ti"
  - Frontend renderiza cards con logo, rating, categorías y botón "Visitar tienda"
  - Usa consulta SQL optimizada con agregaciones para performance

### 2.3 Mis negocios (`my-businesses`)
- **Endpoint:** `GET /api/businesses/my` (requiere JWT)
- **Función:** Lista negocios donde el usuario está registrado en `usuarios_negocio`
- **Interacción:** POS y onboarding usan esto para seleccionar negocio activo

### 2.4 Obtener negocio por ID (`get-business`)
- **Endpoint:** `GET /api/businesses/:id` (requiere JWT)
- **Función:** Retorna detalles completos de un negocio específico
- **Interacción:** Usado en vistas de configuración y edición de negocio

### 2.5 Asignación de Empleados (`assign-employee`)
- **Endpoint:** `POST /api/businesses/:id/assign` (requiere JWT y ownership)
- **Función:** Vincula usuarios existentes como empleados del negocio
- **Interacción:** Controla acceso a inventario, ventas y categorías

---

## 3. Catálogo y Categorías
### 3.1 Listar Categorías (`list-categories`)
- **Endpoint:** `GET /api/categories?id_negocio=<id>` (requiere JWT)
- **Función:** Devuelve categorías globales (`negocio_id=null`) y del negocio especificado
- **Interacción:** 
  - El POS filtra productos por categoría seleccionada
  - Store Zustand (`useCategoriesStore`) persiste categorías con `scope: 'global' | 'business'`
  - Frontend deshabilita edición/borrado de categorías globales

### 3.2 Obtener Categoría (`get-category`)
- **Endpoint:** `GET /api/categories/:id` (requiere JWT)
- **Función:** Retorna una categoría específica validando ownership si es del negocio
- **Interacción:** Usado en formularios de edición

### 3.3 Crear Categoría (`create-category`)
- **Endpoint:** `POST /api/categories` (requiere JWT)
- **Body:** `{ "nombre": "string", "negocioId": "string" }`
- **Función:** Crea categoría personalizada vinculada al negocio
- **Restricción:** 
  - No se pueden crear categorías globales desde API
  - Validación de unicidad por `[negocio_id, nombre]`
  - Requiere pertenencia del usuario al negocio (`usuarios_negocio`)

### 3.4 Actualizar Categoría (`update-category`)
- **Endpoint:** `PATCH /api/categories/:id` (requiere JWT)
- **Body:** `{ "nombre": "string" }` (parcial)
- **Función:** Renombra categorías del negocio
- **Restricción:** Categorías globales son de solo lectura (error 403)

### 3.5 Eliminar Categoría (`delete-category`)
- **Endpoint:** `DELETE /api/categories/:id` (requiere JWT)
- **Función:** Borra categoría del negocio
- **Restricción:** 
  - No se pueden eliminar categorías globales
  - Validación de ownership antes de borrado

---

## 4. Productos e Inventario
### 4.1 Listar Productos (`list-products`)
- **Endpoint:** `GET /api/products` (requiere JWT)
- **Query params:** filtros por negocio, categoría, búsqueda
- **Función:** Devuelve productos con datos completos:
  - Información básica y precios
  - Media asociada (`producto_media`)
  - Métricas semanales de popularidad
  - Estado de inventario por negocio
- **Interacción:** 
  - POS muestra solo productos con inventario > 0
  - Admin productos usa vista completa para gestión

### 4.2 Obtener Producto (`get-product`)
- **Endpoint:** `GET /api/products/:id` (requiere JWT)
- **Función:** Retorna producto individual con media, categoría y métricas
- **Interacción:** Vista de detalle y formularios de edición

### 4.3 Crear Producto (`create-product`)
- **Endpoint:** `POST /api/products` (requiere JWT)
- **Body:** datos del producto + opcionalmente `categoria_id`, `media[]`
- **Función:** Registra producto en catálogo y puede inicializar inventario
- **Interacción:** 
  - Valida categoría si se proporciona
  - Asigna primera imagen como principal si no se especifica

### 4.4 Actualizar Producto (`update-product`)
- **Endpoint:** `PATCH /api/products/:id` (requiere JWT)
- **Función:** Modifica datos del producto (nombre, precio, descripción, media)
- **Restricción:** No permite cambiar categoría si tiene inventario activo

### 4.5 Eliminar Producto (`delete-product`)
- **Endpoint:** `DELETE /api/products/:id` (requiere JWT)
- **Función:** Borrado físico o lógico según referencias
- **Interacción:** Si tiene ventas registradas, cambia estado a 'inactivo'

### 4.6 Listar Inventario (`list-inventory`)
- **Endpoint:** `GET /api/inventory?negocio=<id>` (requiere JWT)
- **Función:** Devuelve existencias por producto y negocio con:
  - Cantidad actual y stock mínimo
  - Fecha última actualización
  - Detalles del producto asociado
- **Interacción:** 
  - POS valida stock antes de permitir ventas
  - Panel inventario muestra alertas de stock bajo

### 4.7 Crear/Actualizar Inventario (`manage-inventory`)
- **Endpoint:** `POST /api/inventory`, `PATCH /api/inventory/:id` (requiere JWT)
- **Función:** Inicializa o ajusta existencias por negocio/producto
- **Restricción:** Unique constraint `[negocio_id, producto_id]`

### 4.8 Movimientos de Inventario (`inventory-movements`)
- **Endpoint:** `GET /api/movements?negocio=<id>` (requiere JWT)
- **Función:** Auditoría de cambios de stock con:
  - Delta aplicado (positivo=entrada, negativo=salida)
  - Motivo (venta, ajuste, devolución)
  - Referencias a venta/detalle/usuario
- **Interacción:** Triggers automáticos registran movimientos en ventas

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

## 8. Tienda Online (Shop)
### 8.1 Vista Pública de Negocios (`public-stores`)
- **Frontend:** `/shop` (página pública)
- **API:** `GET /api/stores` (proxy Next.js → `GET /api/businesses`)
- **Función:** Muestra grid de negocios disponibles con:
  - Logo y hero image
  - Rating promedio con estrella
  - Categorías destacadas
  - Botón "Visitar tienda"
- **Interacción:** 
  - No requiere autenticación
  - Soporta búsqueda por nombre
  - Links a vista individual de negocio

### 8.2 Catálogo Público por Negocio (`store-catalog`)
- **Frontend:** `/shop/:negocioId` (en desarrollo)
- **Función:** Muestra productos disponibles de un negocio específico
- **Interacción:** Consume productos filtrados por negocio con inventario > 0

### 8.3 Carrito de Compras (`shopping-cart`)
- **Frontend:** `CartContext` + `CartSlide`
- **Función:** Gestión de carrito temporal en sesión
- **Interacción:** Permite agregar productos, ajustar cantidades, checkout

---

## 9. Seguridad y Validaciones
- **JWT obligatorio:** Todos los endpoints mutables y de gestión requieren JWT válido
- **Validación de ownership:** Backend verifica pertenencia en `usuarios_negocio` antes de permitir acciones sobre inventario, ventas, categorías
- **DTOs estrictos:** `class-validator` aplica reglas en todos los payloads (longitud, formato, tipos)
- **Restricciones DB:** 
  - Unicidad: email, codigo_barras, [negocio_id+producto_id], [negocio_id+nombre_categoria]
  - Checks: estados permitidos, cantidades no negativas
  - Triggers: auto-actualización de timestamps, coherencia inventario/ventas
- **Roles y permisos:**
  - Categorías globales: solo lectura para todos
  - Negocios: solo owners y empleados asignados
  - Ventas/inventario: validación de negocio activo
- **Endpoints públicos:** 
  - `GET /api/businesses` (listado tiendas)
  - `GET /api/health` (ping)
  - Resto requiere autenticación

---

## 10. Interacción entre funcionalidades
### Flujo de registro a operación
1. Usuario se registra (`POST /api/auth/register`) y verifica email (`POST /api/auth/verify`)
2. Completa onboarding de negocio (`POST /api/businesses`) quedando como owner
3. Configura categorías personalizadas (`POST /api/categories`)
4. Crea productos y asocia inventario (`POST /api/products`, `POST /api/inventory`)
5. Accede al POS seleccionando negocio activo, carga categorías/productos
6. Registra ventas que disparan automáticamente movimientos de inventario

### Flujo tienda pública
1. Usuario anónimo visita `/shop`
2. Frontend llama `GET /api/stores` (proxy a `GET /api/businesses`)
3. Backend agrega ratings y categorías disponibles
4. Usuario navega a `/shop/:negocioId` para ver catálogo
5. Añade productos al carrito y procede a checkout (futuro)

### Separación por negocio
- Todas las operaciones CRUD validan `negocio_id` activo
- Inventario, categorías y ventas filtran por negocio
- Reportes y métricas se agregan por negocio
- POS muestra solo datos del negocio seleccionado

### Auditoría y trazabilidad
- Movimientos de inventario registran usuario, fecha y motivo
- Ventas mantienen referencia a usuario y negocio
- Timestamps automáticos en todas las tablas principales

---

## 11. Referencias rápidas
### Documentación por módulo
- **Arquitectura:** `Docs/Arquitectura.md` - visión general, diagrama, decisiones clave
- **Backend:** `Docs/Backend.md` - módulos, endpoints, variables de entorno, scripts
- **Frontend:** `Docs/Frontend.md` - rutas, componentes, stores, formularios
- **Base de datos:** `Docs/backend-db-overview.md` - esquema, restricciones, triggers, migraciones
- **APIs específicas:**
  - `Docs/API_Businesses.md` - negocios públicos y CRUD
  - `Docs/API_Categorias.md` - categorías globales y por negocio
  - `Docs/API_Productos.md` - catálogo y media
  - `Docs/API_Usuarios.md` - perfil y autenticación
  - `Docs/API_Ventas.md` - ventas, tickets, reportes

### Rutas clave
- **Backend:** módulos en `Backend/src/`, DTOs en `dto/`, migraciones en `prisma/migrations/`
- **Frontend:** rutas en `Frontend/app/`, stores en `src/state/` y `src/pos/`, componentes en `src/components/`
- **Docker:** `docker-compose.yml` (producción), `docker-compose.dev.yml` (desarrollo)
- **Prisma:** modelo en `Backend/prisma/schema.prisma`, cliente generado en `Backend/generated/prisma/`

### Comandos útiles
```bash
# Backend
docker exec -it filacero-backend npx prisma migrate dev
docker exec -it filacero-backend npx prisma generate
docker exec -it filacero-backend npm run lint

# Frontend
docker exec -it filacero-frontend npm run build
docker exec -it filacero-frontend npm run lint

# Docker
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml build
docker compose logs -f backend
```

### Próximas funcionalidades planificadas
- Checkout completo en tienda pública
- Notificaciones en tiempo real (WebSockets)
- Dashboard analítico con gráficas
- Gestión avanzada de empleados y permisos
- API de pagos integrada
- Sistema de cupones y descuentos

---

Este documento debe actualizarse con cada nueva funcionalidad o refactorización relevante para mantener la trazabilidad y coherencia del sistema.