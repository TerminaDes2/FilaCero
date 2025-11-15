# Guía de Despliegue: Sistema de Historial de Precios

## 📋 Información del Commit/PR

### Título del Commit
```
feat(products): Implementar sistema de historial de precios con auditoría completa
```

### Descripción del Pull Request

```markdown
## 🎯 Objetivo
Implementar un sistema completo de auditoría y seguimiento de cambios de precios para productos, permitiendo rastrear históricamente las modificaciones de precio con motivos y usuarios responsables.

## ✨ Cambios Realizados

### Base de Datos
- ✅ Nueva tabla `producto_historial_precio` con 9 campos
- ✅ Índices compuestos para optimización de consultas: `(id_producto, vigente)` y `(id_producto, fecha_inicio)`
- ✅ Claves foráneas con políticas CASCADE y SET NULL
- ✅ Migración Prisma: `20251111165945_add_product_price_history`

### Backend (NestJS)
- ✅ Nuevo servicio `ProductPriceHistoryService` con 5 métodos:
  - `actualizarPrecio()`: Actualización transaccional de precio
  - `obtenerHistorial()`: Consulta de historial completo con joins
  - `obtenerPrecioActual()`: Obtención de precio vigente
  - `obtenerPrecioEnFecha()`: Consulta temporal de precio en fecha específica
  - `obtenerEstadisticas()`: Cálculo de métricas (min/max/avg/total)
- ✅ DTO de validación `UpdateProductPriceDto` con `class-validator`
- ✅ 4 nuevos endpoints REST en `ProductsController`:
  - `GET /api/products/:id/price-history` (público con paginación)
  - `GET /api/products/:id/price/current` (público)
  - `GET /api/products/:id/price/stats` (público)
  - `PUT /api/products/:id/price` (protegido: admin/superadmin)

### Prisma Schema
- ✅ Modelo `producto_historial_precio` con relaciones bidireccionales
- ✅ Relación inversa en modelo `producto` (historial_precios)
- ✅ Relación inversa en modelo `usuarios` (cambios_precio_producto)

### Documentación
- ✅ `Docs/PRODUCTO_HISTORIAL_PRECIO.md` (documentación técnica completa)
- ✅ `Docs/DEPLOY_PRODUCTO_HISTORIAL_PRECIO.md` (esta guía de despliegue)
- ✅ Ejemplos de uso con curl y TypeScript
- ✅ Diagramas de modelo de datos

## 🔒 Seguridad
- Endpoint de actualización de precio requiere JWT válido
- Solo roles `admin` y `superadmin` pueden modificar precios
- Auditoría automática de usuario responsable del cambio

## 🧪 Testing
- ✅ Endpoints GET probados exitosamente
- ✅ Endpoint PUT protegido correctamente (401 sin autenticación)
- ✅ Compilación backend sin errores
- ✅ 6 registros de prueba insertados en BD

## 📊 Impacto
- **Base de Datos**: +1 tabla, +2 índices, +2 claves foráneas
- **Backend**: +1 servicio, +1 DTO, +4 endpoints, +232 líneas
- **Breaking Changes**: Ninguno (retrocompatible)
- **Migración**: Requiere aplicar migración Prisma

## 🔗 Referencias
- Documentación técnica: `Docs/PRODUCTO_HISTORIAL_PRECIO.md`
- Guía de despliegue: `Docs/DEPLOY_PRODUCTO_HISTORIAL_PRECIO.md`
- Schema Prisma: `Backend/prisma/schema.prisma`
- Migración: `Backend/prisma/migrations/20251111165945_add_product_price_history/`

## ✅ Checklist
- [x] Migración de base de datos creada
- [x] Schema Prisma actualizado
- [x] Servicio implementado con lógica transaccional
- [x] DTOs con validación
- [x] Endpoints REST creados
- [x] Guards de autenticación aplicados
- [x] Documentación técnica completa
- [x] Tests funcionales ejecutados
- [x] Compilación sin errores
- [x] Sin conflictos de merge
```

---

## 🚀 Pasos para Aplicar los Cambios

### 1. Clonar/Actualizar la Rama

```bash
# Cambiar a la rama
git checkout mod/pedido

# Actualizar desde remoto
git pull origin mod/pedido
```

### 2. Verificar Archivos Nuevos/Modificados

```bash
# Ver cambios en Prisma schema
git diff main Backend/prisma/schema.prisma

# Ver nueva migración
ls Backend/prisma/migrations/20251111165945_add_product_price_history/

# Archivos nuevos esperados:
# - Backend/src/products/product-price-history.service.ts
# - Backend/src/products/dto/update-product-price.dto.ts
# - Docs/PRODUCTO_HISTORIAL_PRECIO.md
# - Docs/DEPLOY_PRODUCTO_HISTORIAL_PRECIO.md
```

### 3. Aplicar Migración de Base de Datos

#### Opción A: Con Docker (Recomendado)

```powershell
# Detener contenedores actuales
docker compose down

# Levantar contenedores (esto aplicará migraciones automáticamente si está configurado)
docker compose up -d

# Aplicar migración manualmente dentro del contenedor
docker exec -it filacero-backend npx prisma migrate deploy

# Verificar estado de migraciones
docker exec -it filacero-backend npx prisma migrate status
```

#### Opción B: Sin Docker (Desarrollo Local)

```bash
cd Backend

# Instalar dependencias (si es necesario)
npm install

# Aplicar migración
npx prisma migrate deploy

# Verificar estado
npx prisma migrate status
```

### 4. Regenerar Cliente Prisma

```powershell
# Dentro del contenedor Docker
docker exec -it filacero-backend npx prisma generate

# Si trabajas localmente
cd Backend
npx prisma generate
```

### 5. Reiniciar Backend

```powershell
# Con Docker
docker restart filacero-backend

# Verificar logs
docker logs -f filacero-backend

# Buscar mensaje: "Listening on http://localhost:3000"
```

### 6. Verificar Aplicación de Cambios

```powershell
# Verificar tabla creada
docker exec -it filacero-postgres psql -U user -d filacero -c "\d producto_historial_precio"

# Verificar índices
docker exec -it filacero-postgres psql -U user -d filacero -c "\d+ producto_historial_precio"

# Probar endpoint (sin autenticación)
Invoke-RestMethod -Uri http://localhost:3000/api/products/1/price-history | ConvertTo-Json -Depth 5

# Probar estadísticas
Invoke-RestMethod -Uri http://localhost:3000/api/products/1/price/stats | ConvertTo-Json
```

### 7. (Opcional) Insertar Datos de Prueba

```powershell
# Ejecutar seed si existe
docker exec -it filacero-backend npx prisma db seed

# O insertar manualmente registros de prueba
docker exec -it filacero-postgres psql -U user -d filacero -c "
INSERT INTO producto_historial_precio 
  (id_producto, precio, motivo, id_usuario, vigente) 
VALUES 
  (1, 35.00, 'Precio inicial', 1, false),
  (1, 32.50, 'Descuento promocional', 1, false),
  (1, 37.00, 'Ajuste por inflación', 2, true);
"
```

---

## ⚠️ Errores Típicos y Soluciones

### Error 1: "Migration already applied"

**Síntoma:**
```
Error: Migration `20251111165945_add_product_price_history` has already been applied.
```

**Causa:** La migración ya fue ejecutada previamente.

**Solución:**
```powershell
# Verificar estado de migraciones
docker exec -it filacero-backend npx prisma migrate status

# Si aparece como aplicada, no hacer nada
# Si necesitas revertir (¡CUIDADO EN PRODUCCIÓN!):
docker exec -it filacero-backend npx prisma migrate resolve --rolled-back 20251111165945_add_product_price_history
```

---

### Error 2: "Property 'producto_historial_precio' does not exist on type 'PrismaClient'"

**Síntoma:**
```typescript
error TS2339: Property 'producto_historial_precio' does not exist on type 'PrismaClient'
```

**Causa:** Cliente Prisma no regenerado después de cambios en schema.

**Solución:**
```powershell
# En contenedor Docker
docker exec -it filacero-backend npx prisma generate

# Copiar cliente generado a workspace local (para TypeScript IDE)
docker cp filacero-backend:/app/node_modules/.prisma C:\AppServ\www\FilaCero\FilaCero\Backend\node_modules\.prisma
docker cp filacero-backend:/app/node_modules/@prisma/client C:\AppServ\www\FilaCero\FilaCero\Backend\node_modules\@prisma\client

# Reiniciar TypeScript server en VS Code
# Ctrl+Shift+P -> "TypeScript: Restart TS Server"
```

---

### Error 3: "Table 'producto_historial_precio' doesn't exist"

**Síntoma:**
```
error: relation "producto_historial_precio" does not exist
```

**Causa:** Migración no aplicada en la base de datos.

**Solución:**
```powershell
# Verificar migraciones pendientes
docker exec -it filacero-backend npx prisma migrate status

# Aplicar migraciones pendientes
docker exec -it filacero-backend npx prisma migrate deploy

# Si persiste, verificar conexión a BD correcta
docker exec -it filacero-backend printenv DATABASE_URL
```

---

### Error 4: "Cannot find module './product-price-history.service'"

**Síntoma:**
```
Error: Cannot find module './product-price-history.service'
```

**Causa:** Archivos no copiados correctamente desde Git.

**Solución:**
```bash
# Verificar que el archivo existe
ls Backend/src/products/product-price-history.service.ts

# Si no existe, descargar rama nuevamente
git fetch origin mod/pedido
git checkout mod/pedido
git reset --hard origin/mod/pedido

# Reconstruir contenedor Docker
docker compose down
docker compose up -d --build
```

---

### Error 5: "Migration file is corrupt or manually modified"

**Síntoma:**
```
Error: Migration file 20251111165945_add_product_price_history/migration.sql has been modified
```

**Causa:** El archivo de migración fue editado manualmente después de ser generado.

**Solución (Desarrollo):**
```powershell
# Opción A: Resetear migración (DESTRUCTIVO - solo en desarrollo)
docker exec -it filacero-backend npx prisma migrate reset

# Opción B: Resolver manualmente
docker exec -it filacero-backend npx prisma migrate resolve --applied 20251111165945_add_product_price_history

# Opción C: Recrear desde cero (último recurso)
# 1. Eliminar carpeta de migración
# 2. Eliminar registro de _prisma_migrations
# 3. Regenerar migración con: npx prisma migrate dev --name add_product_price_history
```

**Solución (Producción):**
```powershell
# NO usar migrate reset en producción
# Crear migración de corrección si es necesario
npx prisma migrate dev --name fix_product_price_history
```

---

### Error 6: "Unauthorized (401)" al llamar PUT /api/products/:id/price

**Síntoma:**
```json
{"message":"Unauthorized","statusCode":401}
```

**Causa:** Falta token JWT en la petición.

**Solución:**
```powershell
# 1. Obtener token JWT haciendo login
$loginBody = @{
  correo = "admin@filacero.com"
  password = "admin123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri http://localhost:3000/api/auth/login -Method POST -Body $loginBody -ContentType 'application/json'
$token = $loginResponse.access_token

# 2. Usar token en petición PUT
$priceBody = @{
  precio = 45.00
  motivo = "Actualización de precio"
} | ConvertTo-Json

$headers = @{
  'Authorization' = "Bearer $token"
  'Content-Type' = 'application/json'
}

Invoke-RestMethod -Uri http://localhost:3000/api/products/1/price -Method PUT -Body $priceBody -Headers $headers
```

---

### Error 7: "Forbidden (403)" - Usuario sin permisos

**Síntoma:**
```json
{"message":"Forbidden resource","statusCode":403}
```

**Causa:** Usuario autenticado no tiene rol `admin` o `superadmin`.

**Solución:**
```powershell
# Verificar rol del usuario
docker exec -it filacero-postgres psql -U user -d filacero -c "
SELECT u.correo, r.nombre_rol 
FROM usuarios u 
JOIN roles r ON u.id_rol = r.id_rol 
WHERE u.correo = 'tu_usuario@example.com';
"

# Actualizar rol si es necesario (solo en desarrollo)
docker exec -it filacero-postgres psql -U user -d filacero -c "
UPDATE usuarios 
SET id_rol = (SELECT id_rol FROM roles WHERE nombre_rol = 'admin') 
WHERE correo = 'tu_usuario@example.com';
"

# Volver a hacer login para obtener nuevo token
```

---

### Error 8: "Cannot read properties of undefined (reading 'id_usuario')"

**Síntoma:**
```
TypeError: Cannot read properties of undefined (reading 'id_usuario')
```

**Causa:** El objeto `req.user` no está siendo inyectado por el guard JWT.

**Solución:**
```typescript
// Verificar que AuthGuard('jwt') esté antes de RolesGuard
@Put(':id/price')
@UseGuards(AuthGuard('jwt'), RolesGuard) // ✅ Orden correcto
@Roles('admin', 'superadmin')
async updatePrice(...)

// Verificar estrategia JWT en auth/jwt.strategy.ts
// Debe retornar objeto con id_usuario:
validate(payload: any) {
  return { 
    id_usuario: payload.sub, 
    correo: payload.correo,
    rol: payload.rol 
  };
}
```

---

### Error 9: "Docker compose up fails" - Puerto 3000 ocupado

**Síntoma:**
```
Error: bind: address already in use
```

**Causa:** Puerto 3000 ya está en uso por otro proceso.

**Solución:**
```powershell
# Opción A: Encontrar y matar proceso
netstat -ano | findstr :3000
taskkill /PID <PID_DEL_PROCESO> /F

# Opción B: Cambiar puerto en docker-compose.yml
# Editar: "3001:3000" en lugar de "3000:3000"

# Opción C: Detener contenedor antiguo
docker ps -a | findstr filacero-backend
docker rm -f <CONTAINER_ID>
```

---

### Error 10: "Prisma Client version mismatch"

**Síntoma:**
```
Error: Prisma Client version mismatch
Expected: 6.16.2
Actual: 6.15.0
```

**Causa:** Versión del cliente Prisma no coincide con CLI.

**Solución:**
```powershell
# Eliminar node_modules y reinstalar
docker exec -it filacero-backend rm -rf node_modules
docker exec -it filacero-backend npm install

# Regenerar cliente
docker exec -it filacero-backend npx prisma generate

# Reiniciar contenedor
docker restart filacero-backend
```

---

## 🔍 Verificación Post-Despliegue

### Checklist de Verificación

```powershell
# ✅ 1. Verificar migración aplicada
docker exec -it filacero-backend npx prisma migrate status
# Esperado: "Database schema is up to date!"

# ✅ 2. Verificar tabla creada
docker exec -it filacero-postgres psql -U user -d filacero -c "\dt producto_historial_precio"
# Esperado: Tabla listada

# ✅ 3. Verificar índices
docker exec -it filacero-postgres psql -U user -d filacero -c "\di" | Select-String "producto_historial"
# Esperado: 2 índices (producto_historial_precio_id_producto_vigente_idx, ...)

# ✅ 4. Probar endpoint GET historial
$response = Invoke-RestMethod -Uri http://localhost:3000/api/products/1/price-history
$response.Count -gt 0
# Esperado: True (si hay datos)

# ✅ 5. Probar endpoint GET stats
$stats = Invoke-RestMethod -Uri http://localhost:3000/api/products/1/price/stats
$stats.total
# Esperado: Número > 0 (si hay datos)

# ✅ 6. Verificar backend sin errores
docker logs filacero-backend --tail 20
# Esperado: Sin mensajes de error

# ✅ 7. Verificar compilación TypeScript
docker exec -it filacero-backend npm run build
# Esperado: Sin errores de compilación
```

---

## 📚 Recursos Adicionales

- **Documentación Técnica Completa**: `Docs/PRODUCTO_HISTORIAL_PRECIO.md`
- **API Reference**: Ver sección "Endpoints REST" en documentación técnica
- **Schema Prisma**: `Backend/prisma/schema.prisma` (líneas modelo producto_historial_precio)
- **Ejemplos de Uso**: Ver sección "Ejemplos de Uso" en documentación técnica

---

## 🆘 Soporte

Si encuentras un error no documentado aquí:

1. Verificar logs del backend: `docker logs -f filacero-backend`
2. Verificar logs de PostgreSQL: `docker logs -f filacero-postgres`
3. Revisar estado de migraciones: `npx prisma migrate status`
4. Consultar documentación técnica completa
5. Verificar que todos los archivos fueron descargados correctamente desde Git

---

**Fecha de Creación**: 12 de Noviembre, 2025  
**Versión del Sistema**: FilaCero v0.3.0  
**Autor**: Sistema de Historial de Precios - Módulo Products
