# Sistema de Pedidos Online - Implementación Fase 1

**Fecha:** 7 de Noviembre, 2025  
**Branch:** `mod/pedido`  
**Estado:** ✅ Completado - Base de Datos y Seeds

---

## 📋 Resumen Ejecutivo

Se implementó la **Fase 1 del Sistema de Pedidos Online** según lo especificado en `PLAN_SISTEMA_PEDIDOS.md`. Esta fase incluye la infraestructura completa de base de datos con triggers automáticos, gestión de inventario, y datos de prueba.

### Objetivos Cumplidos

- ✅ Modelos Prisma para pedidos, detalles, y notificaciones
- ✅ Tablas PostgreSQL con constraints y validaciones
- ✅ Triggers automáticos para inventario y totales
- ✅ Script de seeds con datos demo
- ✅ Testing completo de funcionalidades
- ✅ Documentación técnica

---

## 🗄️ Estructura de Base de Datos

### Tablas Nuevas

#### 1. `pedido`
Almacena los pedidos de la tienda online (separados de ventas POS).

**Campos principales:**
- `id_pedido` (PK, bigserial)
- `id_negocio` (FK → negocio)
- `id_usuario` (FK → usuarios, nullable para pedidos anónimos)
- `id_tipo_pago` (FK → tipo_pago)
- `estado` (varchar) - Estados: `pendiente`, `confirmado`, `en_preparacion`, `listo`, `entregado`, `cancelado`
- `total` (numeric 14,2)
- `nombre_cliente`, `email_cliente`, `telefono_cliente` (para pedidos anónimos)
- Timestamps: `fecha_creacion`, `fecha_confirmacion`, `fecha_preparacion`, `fecha_listo`, `fecha_entrega`

**Constraints:**
- CHECK: `estado` debe ser uno de los 6 valores válidos
- CHECK: Debe tener `id_usuario` O `email_cliente` (al menos uno)

**Índices:**
- `idx_pedido_negocio_estado` (búsquedas Kanban)
- `idx_pedido_usuario`
- `idx_pedido_fecha_creacion` (DESC)
- `idx_pedido_email_cliente` (pedidos anónimos)

#### 2. `detalle_pedido`
Items de cada pedido con cantidades y notas personalizadas.

**Campos:**
- `id_detalle` (PK, bigserial)
- `id_pedido` (FK → pedido, CASCADE)
- `id_producto` (FK → producto)
- `cantidad` (int, CHECK > 0)
- `precio_unitario` (numeric 10,2)
- `notas` (text) - Ej: "sin cebolla", "extra queso"

**Índices:**
- `idx_detalle_pedido_pedido`

#### 3. `notificacion`
Registro de notificaciones multi-canal enviadas.

**Campos:**
- `id_notificacion` (PK, bigserial)
- `id_usuario` (FK → usuarios, nullable)
- `id_negocio` (FK → negocio)
- `id_pedido` (FK → pedido, nullable)
- `tipo` (varchar 30) - Ej: `pedido_nuevo`, `pedido_confirmado`, `pedido_listo`
- `titulo` (varchar 200)
- `mensaje` (text)
- `leida` (boolean, default false)
- `canal` (varchar 20) - `email`, `sms`, `push`, `in_app`
- `enviada_en`, `leida_en` (timestamptz)

**Índices:**
- `idx_notificacion_usuario_leida` (filtrado por leídas)
- `idx_notificacion_negocio_tipo`
- `idx_notificacion_creado` (DESC)

#### 4. `usuarios_negocio`
Relación usuario-negocio con rol (legacy, mantener compatibilidad).

**Campos:**
- `id_asignacion` (PK, bigserial)
- `id_usuario` (FK → usuarios, CASCADE)
- `id_negocio` (FK → negocio, CASCADE)
- `rol` (varchar 30)
- `fecha_asignacion` (timestamptz)

**Constraints:**
- UNIQUE: `(id_usuario, id_negocio)` - Un usuario no puede tener roles duplicados en el mismo negocio

---

## ⚙️ Triggers Automáticos

### 1. `trg_touch_pedido_actualizado`
- **Tipo:** BEFORE UPDATE
- **Función:** `fn_touch_pedido_actualizado()`
- **Propósito:** Actualiza `actualizado_en` a `CURRENT_TIMESTAMP` en cada UPDATE

### 2. `trg_pedido_timestamps_estado`
- **Tipo:** BEFORE UPDATE
- **Función:** `fn_pedido_timestamps_estado()`
- **Propósito:** Registra automáticamente timestamps cuando cambia el estado
  - `confirmado` → `fecha_confirmacion`
  - `en_preparacion` → `fecha_preparacion`
  - `listo` → `fecha_listo`
  - `entregado` → `fecha_entrega`

### 3. `trg_pedido_after_confirm`
- **Tipo:** AFTER UPDATE
- **Función:** `fn_pedido_confirmar_inventario()`
- **Propósito:** Descuenta inventario cuando el estado pasa a `en_preparacion`
- **Lógica:**
  1. Valida stock disponible para cada item
  2. Descuenta `inventario.cantidad_actual`
  3. Registra movimiento en `movimientos_inventario` (motivo: `pedido_online_confirm`)
  4. Si falta stock → EXCEPTION con mensaje detallado

### 4. `trg_pedido_after_cancel`
- **Tipo:** AFTER UPDATE
- **Función:** `fn_pedido_cancelar_restaurar_inventario()`
- **Propósito:** Restaura inventario cuando se cancela un pedido en `en_preparacion`
- **Lógica:**
  1. Solo actúa si `OLD.estado = 'en_preparacion'` y `NEW.estado = 'cancelado'`
  2. Suma de vuelta las cantidades a `inventario.cantidad_actual`
  3. Registra movimiento en `movimientos_inventario` (motivo: `pedido_cancel_restore`)

### 5. `trg_detalle_pedido_total`
- **Tipo:** AFTER INSERT/UPDATE
- **Función:** `fn_recalcular_total_pedido()`
- **Propósito:** Recalcula `pedido.total` automáticamente al modificar items
- **Fórmula:** `SUM(cantidad * precio_unitario)`

### 6. `trg_detalle_pedido_total_del`
- **Tipo:** AFTER DELETE
- **Función:** `fn_recalcular_total_pedido()`
- **Propósito:** Recalcula total al eliminar items

---

## 🔧 Cambios en Prisma Schema

### Modelos Agregados

```prisma
model pedido {
  id_pedido          BigInt    @id @default(autoincrement())
  id_negocio         BigInt
  id_usuario         BigInt?
  id_tipo_pago       BigInt?
  estado             String    @default("pendiente") @db.VarChar(30)
  total              Decimal   @db.Decimal(14, 2)
  nombre_cliente     String?   @db.VarChar(100)
  email_cliente      String?   @db.VarChar(100)
  telefono_cliente   String?   @db.VarChar(20)
  notas_cliente      String?
  tiempo_entrega     String?   @db.VarChar(50)
  // + timestamps
  
  negocio           negocio          @relation(...)
  usuarios          usuarios?        @relation(...)
  tipo_pago         tipo_pago?       @relation(...)
  detalle_pedido    detalle_pedido[]
  notificacion      notificacion[]
}

model detalle_pedido {
  id_detalle       BigInt  @id @default(autoincrement())
  id_pedido        BigInt
  id_producto      BigInt
  cantidad         Int
  precio_unitario  Decimal @db.Decimal(10, 2)
  notas            String?
  
  pedido    pedido   @relation(...)
  producto  producto @relation(...)
}

model notificacion {
  id_notificacion  BigInt    @id @default(autoincrement())
  id_usuario       BigInt?
  id_negocio       BigInt?
  id_pedido        BigInt?
  tipo             String    @db.VarChar(30)
  titulo           String    @db.VarChar(200)
  mensaje          String
  leida            Boolean   @default(false)
  canal            String?   @db.VarChar(20)
  enviada_en       DateTime? @db.Timestamptz(6)
  leida_en         DateTime? @db.Timestamptz(6)
  creado_en        DateTime  @default(now()) @db.Timestamptz(6)
  
  usuarios  usuarios? @relation(...)
  negocio   negocio?  @relation(...)
  pedido    pedido?   @relation(...)
}

model usuarios_negocio {
  id_asignacion     BigInt   @id @default(autoincrement())
  id_usuario        BigInt
  id_negocio        BigInt
  rol               String   @db.VarChar(30)
  fecha_asignacion  DateTime @default(now()) @db.Timestamptz(6)
  
  usuarios  usuarios @relation(...)
  negocio   negocio  @relation(...)
  
  @@unique([id_usuario, id_negocio])
}
```

### Relaciones Actualizadas

**`usuarios`:**
```prisma
pedidos            pedido[]
notificaciones     notificacion[]
usuarios_negocio   usuarios_negocio[]
```

**`negocio`:**
```prisma
pedidos            pedido[]
notificaciones     notificacion[]
usuarios_negocio   usuarios_negocio[]
```

**`producto`:**
```prisma
detalle_pedido     detalle_pedido[]
```

**`tipo_pago`:**
```prisma
pedidos            pedido[]
```

---

## 📦 Script de Seeds

**Archivo:** `Backend/prisma/seed.ts`

### Datos Creados

1. **Roles:**
   - `admin`
   - `owner`
   - `employee`

2. **Usuario Demo:**
   - Email: `demo@filacero.com`
   - Password: `demo123` (hash: `$2b$10$rM9ZwJ1Q2XYZ9kFQ9ZwJ1u`)
   - Rol: `owner`

3. **Negocio:**
   - Nombre: "Cafetería FilaCero"
   - Dirección: "Av. Principal 123, Centro"
   - Teléfono: "555-0200"
   - Owner: Usuario demo

4. **Categorías:**
   - Bebidas
   - Alimentos
   - Postres
   - Snacks

5. **Productos:**
   | Nombre | Precio | Categoría | Stock Inicial |
   |--------|--------|-----------|---------------|
   | Café Americano | $35.00 | Bebidas | 50 |
   | Café Latte | $45.00 | Bebidas | 50 |
   | Sandwich Club | $85.00 | Alimentos | 50 |
   | Ensalada Caesar | $75.00 | Alimentos | 50 |

6. **Tipos de Pago:**
   - efectivo
   - tarjeta
   - transferencia

7. **Pedido de Ejemplo:**
   - Cliente: Juan Pérez (juan@example.com)
   - Estado: pendiente
   - Items:
     - 2x Café Americano ($35.00) - "Extra caliente"
     - 1x Sandwich Club ($85.00) - "Sin cebolla"
   - Total: $155.00

8. **Notificación:**
   - Tipo: `pedido_nuevo`
   - Título: "Nuevo pedido recibido"
   - Mensaje: "Pedido #4 de Juan Pérez"
   - Canal: `in_app`

---

## 🧪 Testing Realizado

### Prueba 1: Crear Pedido Anónimo
```sql
INSERT INTO pedido (id_negocio, email_cliente, nombre_cliente, total) 
VALUES (1, 'cliente@example.com', 'Juan Pérez', 100.50);
```
**Resultado:** ✅ Pedido creado con estado `pendiente`

### Prueba 2: Agregar Items y Recalcular Total
```sql
INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario, notas) 
VALUES (3, 1, 5, 50.00, 'Sin cebolla');
```
**Resultado:** ✅ Total recalculado automáticamente: $250.00 (5 × $50)

### Prueba 3: Confirmar Pedido (Descuento de Inventario)
```sql
UPDATE pedido SET estado = 'en_preparacion' WHERE id_pedido = 3;
```
**Antes:** `inventario.cantidad_actual = 100`  
**Después:** `inventario.cantidad_actual = 95`  
**Movimiento registrado:** `delta = -5, motivo = 'pedido_online_confirm'`  
**Resultado:** ✅ Inventario descontado correctamente

### Prueba 4: Cancelar Pedido (Restaurar Inventario)
```sql
UPDATE pedido SET estado = 'cancelado' WHERE id_pedido = 3;
```
**Antes:** `inventario.cantidad_actual = 95`  
**Después:** `inventario.cantidad_actual = 100`  
**Movimiento registrado:** `delta = +5, motivo = 'pedido_cancel_restore'`  
**Resultado:** ✅ Inventario restaurado correctamente

### Prueba 5: Ejecutar Seeds
```bash
docker exec filacero-backend npx prisma db seed
```
**Resultado:** ✅ Todos los datos demo creados exitosamente

---

## 📝 Archivos Modificados

### Nuevos Archivos
- ✅ `Backend/prisma/seed.ts` - Script de seeds
- ✅ `Docs/SISTEMA_PEDIDOS_IMPLEMENTACION.md` - Esta documentación

### Archivos Modificados
- ✅ `Backend/prisma/schema.prisma` - 4 modelos nuevos + relaciones
- ✅ `Docker/db/db_filacero.sql` - Tablas, triggers, funciones, índices
- ✅ `Backend/package.json` - Configuración `prisma.seed`
- ✅ `Docs/PLAN_SISTEMA_PEDIDOS.md` - Sección de implementación DB

---

## 🚀 Pasos para Aplicar en Otros Entornos

### Para Desarrolladores (Pull de `mod/pedido`)

#### 1. Actualizar Repositorio
```bash
git checkout mod/pedido
git pull origin mod/pedido
```

#### 2. Reconstruir Contenedor Backend
```bash
cd FilaCero
docker compose build backend
docker compose up -d backend
```

#### 3. Generar Cliente Prisma
```bash
docker exec filacero-backend npx prisma generate
```

#### 4. Aplicar Cambios a la Base de Datos

**Opción A: Usando Prisma DB Push (Desarrollo)**
```bash
docker exec filacero-backend npx prisma db push --accept-data-loss
```

**Opción B: Reset Completo con Seeds**
```bash
# ⚠️ ESTO BORRARÁ TODOS LOS DATOS
docker exec filacero-backend npx prisma migrate reset --force
```

#### 5. Ejecutar Seeds (Datos Demo)
```bash
docker exec filacero-backend npx prisma db seed
```

#### 6. Verificar Instalación
```sql
# Conectarse a PostgreSQL
docker exec -it filacero-postgres psql -U user -d filacero

# Verificar tablas
\dt pedido*

# Verificar triggers
\d+ pedido

# Verificar datos
SELECT COUNT(*) FROM pedido;
SELECT COUNT(*) FROM detalle_pedido;
SELECT COUNT(*) FROM notificacion;
```

### Para Producción (Cuando se haga Merge)

#### 1. Crear Migración Formal
```bash
# En desarrollo, generar migración
docker exec filacero-backend npx prisma migrate dev --name add_sistema_pedidos_v1

# Esto creará: Backend/prisma/migrations/YYYYMMDDHHMMSS_add_sistema_pedidos_v1/
```

#### 2. Aplicar en Producción
```bash
# En servidor de producción
docker exec filacero-backend npx prisma migrate deploy
```

#### 3. NO ejecutar seeds en producción
Los seeds son solo para desarrollo.

---

## 🔍 Verificación Post-Instalación

### Checklist de Validación

- [ ] Tabla `pedido` existe y tiene 18 columnas
- [ ] Tabla `detalle_pedido` existe y tiene 6 columnas
- [ ] Tabla `notificacion` existe y tiene 13 columnas
- [ ] Tabla `usuarios_negocio` existe y tiene 5 columnas
- [ ] Trigger `trg_pedido_after_confirm` existe
- [ ] Trigger `trg_pedido_after_cancel` existe
- [ ] Trigger `trg_detalle_pedido_total` existe
- [ ] Función `fn_pedido_confirmar_inventario` existe
- [ ] Función `fn_pedido_cancelar_restaurar_inventario` existe
- [ ] Función `fn_recalcular_total_pedido` existe
- [ ] Seeds ejecutados: 4 productos, 1 pedido, 1 notificación
- [ ] Cliente Prisma generado sin errores

### Comando de Verificación Rápida
```bash
docker exec filacero-postgres psql -U user -d filacero -c "
  SELECT 
    'pedido' as tabla, COUNT(*) as registros FROM pedido
  UNION ALL
  SELECT 'detalle_pedido', COUNT(*) FROM detalle_pedido
  UNION ALL
  SELECT 'notificacion', COUNT(*) FROM notificacion
  UNION ALL
  SELECT 'usuarios_negocio', COUNT(*) FROM usuarios_negocio;
"
```

**Resultado esperado (con seeds):**
```
     tabla      | registros 
----------------+-----------
 pedido         |         1
 detalle_pedido |         2
 notificacion   |         1
 usuarios_negocio |        0
```

---

## ⚠️ Consideraciones Importantes

### 1. Sincronización Prisma
- El cliente Prisma se genera automáticamente en el contenedor después de `docker compose build`
- Si trabajas localmente (fuera de Docker), ejecuta: `npx prisma generate` después de cada cambio en `schema.prisma`

### 2. Migraciones vs DB Push
- **DB Push:** Para desarrollo rápido, sobrescribe el schema directamente
- **Migrate Dev:** Para desarrollo formal, crea archivos de migración versionados
- **Migrate Deploy:** Para producción, aplica migraciones existentes sin interacción

### 3. Triggers de Inventario
- Los triggers solo actúan en cambios de estado específicos
- `en_preparacion` → Descuenta inventario
- `cancelado` (desde `en_preparacion`) → Restaura inventario
- Si se cancela desde `pendiente`, no afecta inventario (nunca se descontó)

### 4. Pedidos Anónimos
- Los pedidos pueden tener `id_usuario = NULL` si el cliente no está registrado
- En ese caso, `email_cliente` es OBLIGATORIO (constraint `ck_pedido_contacto`)
- Para notificaciones por email, usar `pedido.email_cliente` en lugar de `usuarios.correo_electronico`

### 5. Compatibilidad con Ventas POS
- La tabla `pedido` es independiente de `venta`
- Los pedidos online NO se duplican en la tabla `venta`
- Ambos sistemas comparten `inventario` y `movimientos_inventario`

---

## 🐛 Troubleshooting

### Error: "Property 'pedido' does not exist on type 'PrismaClient'"
**Causa:** El cliente Prisma no se regeneró después de agregar los modelos.

**Solución:**
```bash
# En contenedor
docker exec filacero-backend npx prisma generate

# Copiar tipos al workspace local (opcional)
docker cp filacero-backend:/app/node_modules/.prisma c:\AppServ\www\FilaCero\FilaCero\Backend\node_modules\
docker cp filacero-backend:/app/node_modules/@prisma/client c:\AppServ\www\FilaCero\FilaCero\Backend\node_modules\@prisma\

# Recargar VS Code
Ctrl+Shift+P → "Developer: Reload Window"
```

### Error: "Table 'pedido' already exists"
**Causa:** Intentando ejecutar `db_filacero.sql` cuando las tablas ya existen.

**Solución:**
```sql
-- Eliminar tablas manualmente
DROP TABLE IF EXISTS notificacion CASCADE;
DROP TABLE IF EXISTS detalle_pedido CASCADE;
DROP TABLE IF EXISTS pedido CASCADE;
DROP TABLE IF EXISTS usuarios_negocio CASCADE;

-- O hacer reset completo
docker exec filacero-backend npx prisma migrate reset --force
```

### Error: "Stock insuficiente para producto X"
**Causa:** El trigger `fn_pedido_confirmar_inventario` valida stock antes de descontar.

**Solución:**
```sql
-- Aumentar inventario
UPDATE inventario 
SET cantidad_actual = 100 
WHERE id_negocio = 1 AND id_producto = X;
```

### Seed falla con "Unknown argument 'descripcion'"
**Causa:** El modelo en `schema.prisma` no tiene ese campo.

**Solución:** Ya corregido en `seed.ts`. Si persiste, verificar que el seed en el contenedor esté actualizado:
```bash
docker compose build backend
docker compose up -d backend
docker exec filacero-backend npx prisma db seed
```

---

## 📚 Referencias

- **Plan General:** `Docs/PLAN_SISTEMA_PEDIDOS.md`
- **Schema Prisma:** `Backend/prisma/schema.prisma`
- **SQL Inicial:** `Docker/db/db_filacero.sql`
- **Seeds:** `Backend/prisma/seed.ts`
- **Copilot Instructions:** `.github/copilot-instructions.md`

---

## 👥 Equipo de Desarrollo

- **Implementación:** GitHub Copilot + Usuario
- **Testing:** Completado el 7 de Noviembre, 2025
- **Revisión:** Pendiente (Pull Request)

---

## ✅ Estado del Proyecto

| Fase | Estado | Fecha Completado |
|------|--------|------------------|
| **Fase 1: Base de Datos** | ✅ Completada | 2025-11-07 |
| Fase 2: Backend API | ⏳ Pendiente | - |
| Fase 3: Frontend Shop | ⏳ Pendiente | - |
| Fase 4: Notificaciones | ⏳ Pendiente | - |
| Fase 5: Kanban POS | ⏳ Pendiente | - |

---

**Última actualización:** 7 de Noviembre, 2025  
**Versión:** 1.0.0
