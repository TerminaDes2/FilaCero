# Testeo: Business Ratings (inserciones)

Este documento describe cómo ejecutar el test de inserciones para el módulo `business-ratings`.

Resumen
- Tipo: test de integración usando Jest + Prisma
- Archivo de test: `Backend/src/business-ratings/__tests__/business-ratings.service.spec.ts`
- Qué hace: crea un usuario y un negocio, inserta una valoración usando `BusinessRatingsService.upsertRating`, verifica la respuesta y limpia los datos creados.

Requisitos previos
- Tener `DATABASE_URL` apuntando a una base de datos de pruebas o de desarrollo (Postgres). El test conecta usando la configuración de Prisma.
- Instalar dependencias en la carpeta `Backend/`:

PowerShell (en la raíz del repo):

```powershell
cd .\Backend;
npm install
```

Ejecución de tests

Desde `Backend/` ejecutar:

```powershell
# En PowerShell
cd .\Backend;
npm test --silent
```

Notas y consideraciones
- El test crea registros reales en la base de datos configurada por `DATABASE_URL`. Se encarga de limpiar los registros creados (rating, usuario y negocio). Aun así, preferible usar una base de datos dedicada para pruebas.
- Si quieres aislar más los tests, puedes preparar una base de datos temporal (p. ej. contenedor Postgres) y apuntar `DATABASE_URL` a ella antes de ejecutar los tests.
- Tiempo de timeout: el test tiene timeout extendido (20s) para cubrir tiempos de conexión y operaciones en DB.

Posibles mejoras
- Usar un esquema de pruebas con transacciones y rollback o usar `prisma migrate dev --name test` y una DB efímera.
- Añadir tests para rutas HTTP usando `Supertest` y el `INestApplication` de Nest.

Resultados esperados
- `PASS` para el test de inserción si la base de datos está accesible y las migraciones están aplicadas.

Contacto
- Si hay fallos, comparte el output del test y el valor de `DATABASE_URL` (sin credenciales privadas) o describe el entorno para poder reproducir.

## Remediación aplicada durante la verificación

Durante la ejecución de los tests se identificaron y resolvieron dos problemas principales:

- Errores de TypeScript en el archivo de pruebas (no se reconocían `describe`, `it`, `expect`, etc.). Solución: añadir `"jest"` al array `compilerOptions.types` en `Backend/tsconfig.json`. Esto permite que el compilador TypeScript cargue las definiciones de Jest (`@types/jest`) ya presentes en `devDependencies`.
- Error de ejecución: Prisma no alcanza el servidor de base de datos (`Can't reach database server at 'postgres:5432'`). Esto ocurre porque los tests de integración intentan usar la base de datos configurada por `DATABASE_URL` (por defecto apuntando al servicio `postgres` en Docker). Debes tener la base de datos en ejecución y las migraciones aplicadas antes de ejecutar los tests.

## Pasos recomendados para ejecutar los tests de integración (Windows PowerShell)

1) Instalar dependencias (si no está hecho):

```powershell
cd .\Backend
npm install
```

2) Levantar los servicios de Docker (incluye Postgres). Desde la raíz del repo:

```powershell
docker compose up -d postgres
```

3) Aplicar migraciones Prisma en el contenedor backend (o localmente si prefieres):

```powershell
# Ejecutar dentro del contenedor backend (recomendado si trabajas con la configuración dockerizada)
docker exec -it filacero-backend npx prisma migrate deploy

# Alternativa: desde la carpeta Backend localmente
cd .\Backend
npx prisma migrate deploy
```

4) Ejecutar tests (PowerShell a veces bloquea npm scripts por la política de ejecución; usar cmd.exe para evitarlo):

```powershell
# Ejecutar el comando de tests a través de cmd para evitar el bloqueo de scripts en PowerShell
cmd /c "cd /d C:\AppServ\www\FilaCero\FilaCero\Backend && npm test"
```

5) Resultado esperado: los tests de integración deben pasar si la DB es accesible y las tablas/migraciones están aplicadas.

## Alternativa: tests aislados (sin DB real)

Si no quieres depender de Docker/Postgres para ejecutar los tests, tienes dos opciones:

- Mockear `PrismaService` en los tests para no realizar operaciones reales en la DB (útil para pruebas unitarias). Reemplaza el provider `PrismaService` en el `Test.createTestingModule` por un mock con los métodos necesarios (`usuarios.create`, `negocio.create`, `negocio_rating.deleteMany`, etc.).
- Preparar una base de datos SQLite local y regenerar Prisma Client con un `schema.prisma` que use `provider = "sqlite"`. Esto requiere generar un cliente Prisma específico para sqlite y puede ser más trabajo.

Si quieres, puedo:

- Añadir un ejemplo de mock para `PrismaService` y convertir el test en unitario (rápido).
- Añadir scripts helper en `Backend/package.json` para arrancar migraciones y ejecutar tests en Windows.

Indica tu preferencia y lo implemento.
