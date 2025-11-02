# Panorama de la Base de Datos FilaCero (Oct 2025)

Este documento resume el estado actual del esquema PostgreSQL que respalda a FilaCero, las principales entidades de negocio y las reglas de integridad que deben considerarse al planificar nuevas funcionalidades o correcciones.

## 1. Fuentes de la Verdad
- **Prisma (`Backend/prisma/schema.prisma`)**: define el modelo ORM utilizado por NestJS. Las migraciones se generan a partir de este esquema.
- **SQL inicial (`Docker/db/db_filacero.sql`)**: se ejecuta cuando el contenedor `postgres` inicializa un volumen vacío. Incluye creación de tablas base, restricciones adicionales, funciones PL/pgSQL y datos semilla.
- **Migraciones Prisma**: aplican cambios incrementales (por ejemplo `20251018120000_add_user_account_fields`). En entornos que ya tienen datos, se debe ejecutar la migración en lugar del SQL inicial.

## 2. Entidades Principales
### 2.1 Control de Acceso
- `roles`: catálogo de roles (`superadmin`, `admin`, `empleado`, `usuario`).
- `usuarios`:
  - Clave primaria `id_usuario` (bigint autoincremental).
  - Campos de perfil: `nombre`, `correo_electronico` (único), `numero_telefono`, `avatar_url`, `credential_url`.
  - **Nuevos campos**: `numero_cuenta` (único, pensado para estudiantes) y `edad` (smallint).
  - Ciclo de verificación: `verificado`, `fecha_verificacion`, `verification_token`, `verification_token_expires`.
  - Relación opcional con `roles` mediante `id_rol`.

### 2.2 Negocios y Asignaciones
- `negocio`: datos de la cafetería (branding con `logo_url`, `hero_image_url`).
- `empleados`: relación muchos-a-muchos entre usuarios y negocio con estado (`activo`/`inactivo`).
- `usuarios_negocio`: asignaciones con rol específico por negocio (empleados vs propietarios). También se usa para autorizar acceso a inventario, categorías y ventas.
- `negocio_rating`: puntuaciones de usuarios sobre negocios (una por usuario y negocio).

### 2.3 Catálogo y Stock
- `categoria`: catálogo jerárquico. Las categorías globales poseen `negocio_id = NULL`; las personalizadas vinculan `negocio_id` y el esquema aplica `@@unique([negocio_id, nombre])` para evitar duplicados por negocio.
- `producto`:
  - Información general: `nombre`, `descripcion`, `descripcion_larga`, `codigo_barras` (único), `precio`, `estado` (`activo`/`inactivo`).
  - Relación opcional con `categoria` y varias tablas derivadas.
- `producto_media`: galería de recursos multimedia (URL hasta 2048 caracteres, indicador `principal`).
- `producto_metricas_semanales`: cache semanal de popularidad por negocio.
- `inventario`: cantidades por producto y negocio, con restricciones para evitar duplicados (`UNIQUE(id_negocio, id_producto)`) y cantidades negativas.
- `movimientos_inventario`: auditoría de cambios de inventario (ventas, ajustes, devoluciones).

### 2.4 Ventas
- `venta`: encabezado de venta con referencias a negocio, usuario y tipo de pago (`tipo_pago`).
- `detalle_venta`: líneas de venta conectadas a `producto`.
- `reporte_ventas`: reportes agregados por fecha y negocio.
- `corte_caja`: cierres de caja por usuario y negocio.

### 2.5 Interacción del Usuario
- `comentario` y `feedback`: comentarios y calificaciones de usuarios.

## 3. Reglas de Integridad y Lógica en la BD
- **Restricciones únicas**:
  - `usuarios.correo_electronico` y `usuarios.numero_cuenta`.
  - `producto.codigo_barras`.
  - `inventario(id_negocio, id_producto)`.
  - `empleados(negocio_id, usuario_id)`.
  - `negocio_rating(id_negocio, id_usuario)`.
  - `categoria(negocio_id, nombre)` para asegurar unicidad por negocio sin bloquear categorías globales.
- **Checks**:
  - `producto.estado` y `venta.estado` limitan valores permitidos.
  - `inventario` impone cantidades no negativas.
- **Funciones/Triggers**:
  - `fn_touch_inventario_fecha`: auto-actualiza `inventario.fecha_actualizacion`.
  - `fn_inventario_aplicar_delta` / `fn_trg_detalle_venta_inventario`: mantienen coherencia entre detalle de venta, inventario y movimientos.
  - `fn_recalcular_total_venta` / `fn_trg_detalle_venta_total`: recalculan el total de la venta después de cambios en el detalle.
  - Las verificaciones de que una categoría pertenece al negocio se realizan en la capa de servicio (`CategoriesService`) antes de insertar o actualizar productos.
- **Semillas**:
  - Roles básicos y tipos de pago se insertan idempotentemente.
  - Categorías iniciales (`Bebidas`, `Alimentos`, etc.) se insertan como globales (`negocio_id = NULL`).

## 4. Flujo de Datos Clave
1. **Registro y verificación**
   - Los DTO (`RegisterDto`, `VerifyEmailDto`) validan entrada.
   - `AuthService.register` crea el usuario, asigna `numero_cuenta`/`edad` si se proporcionan y genera token de verificación.
   - `AuthService.verifyAccount` marca `verificado=true` y limpia tokens.
   - El JWT entregado incluye `verified`, URLs de medios, `numero_cuenta` y `edad` para hidratar el frontend.

2. **Gestión de perfil**
   - `UsersController` exige JWT.
   - `UsersService.findOne` devuelve metadatos serializados (IDs como string, fechas en ISO, nuevos campos).
   - `UsersService.update` permite modificar nombre, teléfono, URLs, contraseña, `numero_cuenta` y `edad` (validaciones en DTO).

3. **Catálogo y media**
   - `ProductsService` utiliza Prisma para resolver categoría, gestionar media y mapear métricas.
   - Sanitiza colección `media`: asegura un recurso principal.

4. **Ventas e inventario**
   - Triggers de `detalle_venta` disminuyen inventario y registran movimientos.
   - Eliminaciones de productos respetan las restricciones FK; se aplica borrado lógico a través de estado si el producto está referenciado.

## 5. Estado de las Migraciones
- Migraciones existentes en `Backend/prisma/migrations/` deben ejecutarse con `npx prisma migrate dev` (en contenedor o local con la misma DB).
- Cambios recientes (`numero_cuenta`, `edad`) requieren aplicar la migración `add_user_account_fields` para mantener el esquema sincronizado.
- El SQL inicial debe mantenerse alineado para instalaciones en limpio; cualquier cambio en Prisma debe reflejarse también en `db_filacero.sql`.

## 6. Consideraciones para Próximas Refactorizaciones
- **Sincronización Prisma ↔ SQL**: cuando se añadan nuevas columnas o tablas, actualizar ambos orígenes y generar migraciones.
- **Estrategia de verificación**: considerar guardas (`VerifiedUserGuard`) para restringir operaciones sensibles a cuentas verificadas.
- **Uso de `numero_cuenta`**: planificar endpoints que aprovechen la nueva clave alternativa (ej. búsqueda por cuenta, importación masiva de estudiantes).
- **Datos legacy**: si existen usuarios previos sin `numero_cuenta`/`edad`, definir scripts de backfill o permitir valores nulos.
- **Pruebas automatizadas**: ampliar suites e2e para cubrir registro con `numero_cuenta`, actualización y flujos de inventario.

## 7. Modelos Adicionales

### 7.1 Business Ratings
**Tabla:** `negocio_rating`  
**Descripción:** Valoraciones 1-5 estrellas sobre negocios con comentarios opcionales.

**Campos:**
- `id_rating`: PK autoincremental
- `id_negocio`: FK a negocio (cascade delete)
- `id_usuario`: FK a usuario (cascade delete)
- `estrellas`: SmallInt (1-5)
- `comentario`: Text opcional
- `creado_en`: Timestamp con zona horaria

**Restricciones:**
- `UNIQUE(id_negocio, id_usuario)`: un usuario solo puede tener una valoración por negocio (permite upsert)
- Check constraint en estrellas (1-5) aplicado en capa aplicación

**Uso en código:**
- `BusinessRatingsService.upsertRating`: crea o actualiza valoración existente
- `BusinessRatingsService.getSummary`: agrega promedio y distribución usando Prisma `aggregate` + `groupBy`
- Validación de cuenta verificada en controller para prevenir spam

### 7.2 Comentarios y Feedback
**Tablas:** `comentario`, `feedback`

**Comentario:**
- Permite a usuarios dejar opiniones textuales sobre negocios
- Estados: `visible`, `oculto`, `reportado`
- Trigger `fn_touch_comentario_actualizado` actualiza timestamp al recibir feedback

**Feedback:**
- Reacciones sobre comentarios (likes, calificaciones)
- Restricción única: `(id_comentario, id_usuario, tipo)` previene duplicados por tipo de reacción
- Cascade delete cuando se elimina comentario o usuario

**Pendiente:**
- Implementar `FeedbackService` y endpoints REST
- Validar estados de comentarios en capa aplicación
- Frontend para visualizar/moderar comentarios

---
Este panorama debe revisarse en cada refactorización significativa para evitar divergencia entre el modelo Prisma, las migraciones y el SQL inicial distribuidos con Docker.

## Referencias
- **Análisis exhaustivo:** `backend-comprehensive-analysis.md`
- **Verificación:** `verificacion-usuarios.md`
- **Ratings:** `implementaciones-negocio-rating.md`
