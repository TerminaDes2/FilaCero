# Arquitectura - Diseño del Sistema

Esta carpeta contiene la documentación sobre la arquitectura, diseño y estructura técnica de FilaCero.

## Contenido

### [Arquitectura.md](./Arquitectura.md)
Visión general del sistema:
- Diagrama de componentes
- Decisiones arquitectónicas
- Patrones de diseño
- Flujo de datos
- Integraciones externas

### [Backend.md](./Backend.md)
Arquitectura del backend NestJS:
- Estructura de módulos
- Prisma ORM y base de datos
- Autenticación y autorización (JWT)
- Manejo de errores
- Logging y monitoreo
- Configuración de entorno

### [Frontend.md](./Frontend.md)
Arquitectura del frontend Next.js:
- App Router (Next.js 13)
- Estructura de carpetas
- Estado global (Zustand)
- Componentes y patrones
- Integración con API
- Tailwind CSS y estilos

### [Infraestructura.md](./Infraestructura.md)
Infraestructura y DevOps:
- Docker Compose setup
- Redes y volúmenes
- Variables de entorno
- CI/CD pipelines
- Monitoreo y logs
- Backups y recuperación

### [frontend-api-contract.md](./frontend-api-contract.md)
Contrato de integración Frontend-Backend:
- Tipos TypeScript compartidos
- Estructura de respuestas
- Manejo de errores
- Autenticación en cliente
- Interceptores HTTP
- Estado de carga y errores

## Stack Tecnológico

### Backend
- **Framework**: NestJS 10.4.20
- **ORM**: Prisma 6.18.0
- **Base de datos**: PostgreSQL 15
- **Autenticación**: JWT + Passport
- **Validación**: class-validator + class-transformer
- **Documentación**: Swagger/OpenAPI
- **Testing**: Jest + Supertest

### Frontend
- **Framework**: Next.js 13 (App Router)
- **UI**: Tailwind CSS 3.x
- **Estado**: Zustand
- **HTTP**: Fetch API
- **Validación**: Zod
- **Testing**: Jest + React Testing Library

### Infraestructura
- **Orquestación**: Docker Compose
- **Servidor Web**: Nginx (producción)
- **Base de datos**: PostgreSQL 15
- **Cache**: Redis (futuro)
- **Storage**: Local + S3 (futuro)

## Principios de Diseño

1. **Separación de Responsabilidades**: Backend API REST, Frontend SPA
2. **Domain-Driven Design**: Módulos alineados a dominios de negocio
3. **API First**: Contrato de API antes de implementación
4. **Type Safety**: TypeScript end-to-end
5. **Testing**: Cobertura mínima 70% en lógica crítica
6. **Security**: Auth JWT, validación en cada capa, rate limiting
7. **Observability**: Logs estructurados, métricas, health checks

## Diagramas

### Arquitectura de Alto Nivel
```
┌──────────────┐
│   Browser    │
└──────┬───────┘
       │ HTTPS
       ▼
┌──────────────┐     ┌──────────────┐
│  Next.js     │────▶│   NestJS     │
│  Frontend    │◀────│   Backend    │
└──────────────┘     └──────┬───────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  PostgreSQL  │
                     └──────────────┘
```

### Flujo de Autenticación
```
Client → POST /auth/login → Backend → Valida credenciales
                                    ↓
                            Genera JWT token
                                    ↓
                         ← {accessToken, user} ←
Client → Guarda token en localStorage
       ↓
Requests subsecuentes incluyen: Authorization: Bearer <token>
```

[← Volver al índice principal](../README.md)
