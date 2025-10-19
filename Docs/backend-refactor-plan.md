# Backend Refactor Plan — Verification, Media & Metrics

## 1. Alcance y Supuestos
- **Foco exclusivo en backend**: Prisma + NestJS. Frontend consumirá los nuevos endpoints en una fase posterior.
- **Prisma como fuente de verdad**: todas las modificaciones al esquema se realizarán en `Backend/prisma/schema.prisma` mediante migraciones (`npx prisma migrate dev`).
- **Compatibilidad**: mantener datos existentes; cualquier conversión o valor por defecto debe considerarse en scripts de backfill.
- **Servicios TypeORM**: plan para migrarlos gradualmente a Prisma (prioridad: `products`). No se realizarán cambios TypeORM en esta etapa salvo que sean imprescindibles.

## 2. Cambios de Esquema Propuestos
### 2.1 Usuarios (`usuarios`)
Campos nuevos:
- `verificado Boolean @default(false)`
- `fecha_verificacion DateTime?`
- `verification_token String? @unique`
- `verification_token_expires DateTime?`
- `credential_url String?` (ruta a documento escaneado)
- `avatar_url String?` (imagen de perfil)

### 2.2 Negocios (`negocio`)
- `logo_url String?` (renombrar `logo`)
- `hero_image_url String?`

Nueva tabla `negocio_rating`:
```
model negocio_rating {
  id_rating     BigInt   @id @default(autoincrement())
  id_negocio    BigInt
  id_usuario    BigInt
  estrellas     Int      @db.SmallInt
  comentario    String?
  creado_en     DateTime @default(now())

  negocio negocio @relation(fields: [id_negocio], references: [id_negocio])
  usuario usuarios @relation(fields: [id_usuario], references: [id_usuario])

  @@unique([id_negocio, id_usuario])
}
```

### 2.3 Productos (`producto`)
- `imagen_url String?` (renombrar `imagen`)
- `descripcion_larga String?`

Tabla opcional `producto_media` (para múltiples imágenes):
```
model producto_media {
  id_media   BigInt   @id @default(autoincrement())
  id_producto BigInt
  url        String
  principal  Boolean  @default(false)
  tipo       String   @db.VarChar(20) // ej. "foto", "miniatura"
  creado_en  DateTime @default(now())

  producto producto @relation(fields: [id_producto], references: [id_producto])
}
```

### 2.4 Métricas
Tabla cache opcional `producto_metricas_semanales`:
```
model producto_metricas_semanales {
  id_metricas BigInt  @id @default(autoincrement())
  id_producto BigInt
  anio        Int
  semana      Int
  cantidad    Int
  calculado_en DateTime @default(now())

  producto producto @relation(fields: [id_producto], references: [id_producto])

  @@unique([id_producto, anio, semana])
}
```

## 3. Flujo de Migraciones
1. **Actualizar `schema.prisma`** con campos/tablas.
2. Ejecutar `npx prisma format`.
3. Generar migración: `npx prisma migrate dev --name add_verification_media_metrics`.
4. `npx prisma generate`.
5. Preparar script de backfill:
   - Rellenar `verificado=false`, `avatar_url=null`, etc.
   - Migrar datos de columnas renombradas (`logo` → `logo_url`, `imagen` → `imagen_url`).
6. Actualizar seeds (si se usan) y `Docker/db/db_filacero.sql` para reflejar estructura (solo como referencia).
7. Ejecutar batería de tests backend (`npm run test` en `Backend`).

## 4. Cambios en Servicios NestJS
### 4.1 Módulo Auth / Users
- Extender DTOs (`CreateUserDto`, `UpdateUserDto`) con campos de verificación e imágenes. ✅ (`UpdateUserDto` y selects actualizados).
- Crear servicio de verificación:
  - ✅ `verifyEmail(token)` → expone `POST /auth/verify`, marca `verificado`, registra `fecha_verificacion` y regenera JWT.
  - ⏳ `requestVerification(email)` → pendiente de servicio de mailing.
  - ⏳ Endpoint protegido para subir `credential_url` (almacenar en S3/local y guardar URL).
- Añadir guard que restrinja ciertas operaciones a usuarios verificados. ⏳ (diseñar guardia custom una vez definido alcance).

### 4.2 Módulo Businesses
- Actualizar DTOs a `logo_url`, `hero_image_url`. ✅
- Ajustar servicio para persistir URLs y mantener transacción de asignación de propietario. ✅
- Implementar ratings de negocios (`POST /api/businesses/:id/ratings`, agregados). ⏳

### 4.3 Módulo Products
- Ajustar DTOs con `descripcion_larga`, `imagen_url` y colección `media`. ✅
- Servicio Prisma reescrito para incluir galería (`producto_media`) y métricas semanales; respuestas normalizan BigInt/Decimal y exponen `popularity`. ✅
- Endpoint `POST /api/products/:id/media` para subir imágenes adicionales. ⏳ (se evaluará tras definir almacenamiento).

### 4.4 Reportes / Métricas
- Nuevo servicio `ReportsService` con métodos:
  ```ts
  getPopularProducts(range: 'week' | 'month')
  refreshWeeklyMetrics()
  ```
- `getPopularProducts('week')` consulta `detalle_venta` + `venta` filtrando por semana actual. Si existe `producto_metricas_semanales`, usa caché. ⏳

### 4.5 Docs y Validaciones
- Actualizar `Docs/Backend.md` con nuevos endpoints y campos. 🔄 (secciones Auth/Products actualizadas, pendiente ratings/métricas).
- Añadir validaciones `class-validator` y reglas Prisma (índices únicos, longitud URLs, etc.). 🔄 (URLs y medios cubiertos; revisar métricas/ratings al implementarlos).
## 5. Documentación para Frontend
Crear/actualizar `Docs/frontend-api-contract.md` con:
- Nuevos campos en recursos (`usuario.verificado`, `usuario.avatar_url`, `producto.descripcion_larga`, etc.).
- Endpoints:
  - `POST /auth/verify` (body: `{ token }`). ✅
  - `POST /auth/request-verification` (body: `{ email }`). ⏳
  - `POST /api/users/:id/credential` (multipart-form-data: `credential_file`). ⏳
  - `GET /api/businesses/:id/ratings` (response: `{ promedio, total, estrellas: {1..5} }`).
  - `POST /api/businesses/:id/ratings` (body: `{ estrellas, comentario? }`).
  - `GET /api/reports/popular-products?range=week` (response: array con `{ productoId, nombre, cantidad, imagen_url }`).
  - `POST /api/products/:id/media` (multipart, retorna URLs almacenadas).
- Reglas de negocio (solo usuarios verificados pueden subir credencial, ratings limitados a uno por usuario y negocio, etc.).

## 6. Roadmap de Entregables
1. **Semana 1**: editar `schema.prisma`, migración, backfill, tests base.
2. **Semana 2**: implementar verificación de usuarios (token + endpoints), documentación y pruebas.
3. **Semana 3**: ratings de negocios (backend) y endpoints de métricas.
4. **Semana 4**: endpoints de media (productos/usuarios/negocios) y galería opcional; refinar documentación frontend.
5. **Semana 5** (opcional): migrar módulos TypeORM restantes a Prisma, QA completo.

## 7. Checklist Técnico
- [ ] `schema.prisma` actualizado y migración generada.
- [ ] Servicios/DTOs ajustados (auth, users, products, businesses, reports).
- [ ] Envío de correos configurado (`EMAIL_PROVIDER_API_KEY`, template).
- [ ] Gestión de almacenamiento definida (`FILE_STORAGE_BUCKET` o similar).
- [ ] Tests unitarios/e2e cubriendo verificación, ratings, métricas.
- [ ] Documentación en `Docs/Backend.md` y `Docs/frontend-api-contract.md` actualizada.
- [ ] Scripts de backfill probados en staging con backup previo.

---
**Notas**
- Mantener IDs BigInt en respuestas (el interceptor `BigIntInterceptor` ya los transforma a string). Verificar que nuevos endpoints usen el interceptor.
- Al renombrar columnas (`logo` → `logo_url`, `imagen` → `imagen_url`), Prisma generará columnas nuevas; necesitarás SQL manual en la migración para copiar valores existentes.
- Coordinar con DevOps para almacenar credenciales e imágenes (S3, Cloudinary, etc.).
