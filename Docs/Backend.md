# Backend

## Resumen
API REST construida con **NestJS 10**, **TypeORM** y **PostgreSQL**. Provee endpoints para la gestión de productos (por ahora) y servirá como base para futuros módulos (ventas, usuarios, inventario avanzado, reportes).

## Stack Principal
- NestJS (@nestjs/common, core, platform-express)
- TypeORM + PostgreSQL
- Configuración con `@nestjs/config`
- Validación: `class-validator` + `class-transformer`
- RXJS (interno Nest)

## Estructura de Carpetas (parcial)
```
Backend/
  src/
    app.module.ts        # Módulo raíz
    app.controller.ts    # Endpoint básico de saludo / health
    products/            # Módulo de productos
      product.controller.ts
      product.service.ts
      product.schema.ts  # Entidad TypeORM
      dto/
        create-product.dto.ts
        update-product.dto.ts
```

## Entidad Product
| Campo      | Tipo    | Notas                |
|------------|---------|----------------------|
| id         | uuid    | Autogenerado         |
| name       | string  | Obligatorio          |
| price      | number  | Obligatorio          |
| stock      | number  | Cantidad en inventario |
| active     | boolean | Por defecto `true`   |
| createdAt  | date    | Automático           |
| updatedAt  | date    | Automático           |

## Endpoints Productos
Base: `/api/products`

| Método | Ruta         | Descripción                 |
|--------|--------------|-----------------------------|
| POST   | /            | Crear producto              |
| GET    | /            | Listar productos            |
| GET    | /:id         | Obtener producto            |
| PATCH  | /:id         | Actualizar producto         |
| DELETE | /:id         | Eliminar (hard delete)      |

### Ejemplos
Crear:
```http
POST /api/products
Content-Type: application/json
{
  "name": "Café Americano",
  "price": 25.5,
  "stock": 120,
  "active": true
}
```
Respuesta 201:
```json
{
  "id": "uuid",
  "name": "Café Americano",
  "price": 25.5,
  "stock": 120,
  "active": true,
  "createdAt": "2025-09-01T00:00:00.000Z",
  "updatedAt": "2025-09-01T00:00:00.000Z"
}
```

Errores comunes:
| Código | Caso                              |
|--------|-----------------------------------|
| 400    | Body inválido / validación        |
| 404    | Producto no encontrado            |
| 500    | Error interno / DB                |

## Variables de Entorno
Ejemplo (`Backend/.env.example`):
```
PORT=3000
DATABASE_URL=postgres://user:password@localhost:5432/filacero
```

En Docker Compose se inyecta `DATABASE_URL` apuntando al servicio `postgres`.

## Scripts NPM
| Script        | Descripción                     |
|---------------|---------------------------------|
| start         | Inicia modo normal              |
| start:dev     | Desarrollo con watch            |
| start:debug   | Watch + inspector               |
| build         | Compila a `dist/`               |
| start:prod    | Ejecuta build                   |

## Configuración TypeORM
Registrada de forma asíncrona en `AppModule` usando `ConfigService` y `DATABASE_URL`. `synchronize: true` está activo (solo desarrollo). En producción cambiar a migraciones.

## Próximos Módulos (propuesto)
- Autenticación / Roles
- Ventas (tickets, totales, métodos de pago)
- Inventario avanzado (movimientos / ajustes)
- Reportes (diario, semanal, ranking productos)