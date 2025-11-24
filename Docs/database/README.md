# Database - Documentación de Base de Datos

Esta carpeta contiene documentación sobre el esquema de base de datos, migraciones, queries y procedimientos almacenados.

## Contenido

### [backend-db-overview.md](./backend-db-overview.md)
Visión general del esquema de base de datos:
- Diagrama ER completo
- Tablas principales y relaciones
- Índices y constraints
- Triggers y funciones
- Políticas de datos (retención, archivado)

### [verificacion-usuarios.md](./verificacion-usuarios.md)
Scripts de validación de datos de usuarios:
- Queries de verificación
- Detección de inconsistencias
- Scripts de corrección
- Procedimientos de mantenimiento

## Esquema Principal (Prisma)

El esquema está definido en `Backend/prisma/schema.prisma`:

### Tablas Core
- **usuarios**: Usuarios del sistema con autenticación
- **roles**: Roles y permisos (Admin, Cajero, etc.)
- **negocios**: Múltiples negocios en la plataforma

### Catálogo
- **categorias**: Categorías de productos
- **productos**: Catálogo de productos
- **producto_historial_precio**: Tracking de cambios de precio
- **inventario**: Stock por negocio

### Transacciones
- **pedidos**: Órdenes de compra
- **pedido_items**: Líneas de pedido
- **transacciones_pago**: Pagos procesados
- **metodos_pago_guardados**: Tarjetas guardadas

### Operaciones
- **ventas**: Registro de ventas
- **venta_items**: Líneas de venta
- **empleados**: Personal del negocio

### Calificaciones
- **business_ratings**: Calificaciones de negocios

## Migraciones

Las migraciones Prisma se encuentran en `Backend/prisma/migrations/`:

```bash
# Crear nueva migración
npx prisma migrate dev --name descripcion_cambio

# Aplicar migraciones en producción
npx prisma migrate deploy

# Ver estado de migraciones
npx prisma migrate status
```

## Tipos de Datos Importantes

### BigInt
Usado para IDs autoincrementales:
```prisma
id BigInt @id @default(autoincrement())
```
En TypeScript se mapea a `number` (hasta 53 bits seguros).

### Decimal
Para montos monetarios:
```prisma
monto Decimal @db.Decimal(10, 2)
```
Precisión: 10 dígitos totales, 2 decimales.

### UUID
Para referencias externas (Stripe, etc.):
```prisma
id String @id @default(uuid())
```

## Índices

Índices críticos para performance:
```sql
CREATE INDEX idx_productos_negocio ON productos(negocio_id);
CREATE INDEX idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX idx_pedidos_negocio_estado ON pedidos(negocio_id, estado);
CREATE INDEX idx_transacciones_pedido ON transacciones_pago(pedido_id);
```

## Triggers

### actualizar_inventario_despues_venta
Decrementa stock automáticamente al registrar venta:
```sql
CREATE TRIGGER actualizar_inventario_despues_venta
AFTER INSERT ON venta_items
FOR EACH ROW EXECUTE FUNCTION decrementar_stock();
```

### validar_stock_antes_pedido
Valida disponibilidad antes de crear pedido:
```sql
CREATE TRIGGER validar_stock_antes_pedido
BEFORE INSERT ON pedido_items
FOR EACH ROW EXECUTE FUNCTION validar_disponibilidad();
```

## Scripts de Mantenimiento

### Limpieza de Datos Antiguos
```sql
-- Archivar pedidos cancelados >6 meses
UPDATE pedidos 
SET archivado = true 
WHERE estado = 'cancelado' 
  AND created_at < NOW() - INTERVAL '6 months';
```

### Recálculo de Inventario
```sql
-- Recalcular inventario desde ventas
UPDATE inventario i
SET cantidad_actual = (
  SELECT i.cantidad_inicial - COALESCE(SUM(vi.cantidad), 0)
  FROM venta_items vi
  JOIN ventas v ON vi.venta_id = v.id
  WHERE vi.producto_id = i.producto_id
    AND v.negocio_id = i.negocio_id
);
```

## Backups

### Backup Manual
```bash
# Exportar base completa
docker exec filacero-postgres pg_dump -U user filacero > backup.sql

# Restaurar
docker exec -i filacero-postgres psql -U user filacero < backup.sql
```

### Backup Automatizado
Configurado en cron (producción):
```bash
0 2 * * * /scripts/backup-db.sh  # Diario a las 2am
```

## Queries Útiles

### Ver tamaño de tablas
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Ver índices no utilizados
```sql
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexname NOT LIKE '%_pkey';
```

[← Volver al índice principal](../README.md)
