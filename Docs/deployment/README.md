# Deployment - Despliegue e Infraestructura

Esta carpeta contiene guías y documentación para el despliegue y operación de FilaCero.

## Contenido

### [Contenedores.md](./Contenedores.md)
Configuración de Docker y Docker Compose:
- Setup de servicios (backend, frontend, postgres)
- Redes y volúmenes
- Variables de entorno
- Health checks
- Troubleshooting común

### [tutorial_desplegar_contenedores.txt](./tutorial_desplegar_contenedores.txt)
Tutorial paso a paso para desplegar con Docker:
- Instalación de Docker Desktop
- Comandos básicos
- Levantar el stack completo
- Verificación de servicios
- Logs y debugging

### [Desarrollo.md](./Desarrollo.md)
Ambiente de desarrollo local:
- Setup sin Docker (desarrollo nativo)
- Configuración de IDEs
- Hot reload y debugging
- Base de datos local
- Testing en desarrollo

## Quick Start

### Desarrollo Local con Docker

```bash
# 1. Clonar repositorio
git clone https://github.com/TerminaDes2/FilaCero.git
cd FilaCero

# 2. Copiar variables de entorno
cp Backend/.env.example Backend/.env
cp Frontend/.env.example Frontend/.env

# 3. Levantar stack completo
docker compose up -d

# 4. Verificar servicios
docker compose ps

# 5. Ver logs
docker compose logs -f backend
```

Servicios disponibles:
- Backend: http://localhost:3000
- Frontend: http://localhost:8080
- PostgreSQL: localhost:5432
- Swagger: http://localhost:3000/api/docs

### Comandos Útiles

```bash
# Reconstruir servicios
docker compose up -d --build

# Detener servicios
docker compose down

# Detener y eliminar volúmenes (destructivo)
docker compose down -v

# Ver logs de un servicio específico
docker compose logs -f backend

# Ejecutar comando en contenedor
docker exec -it filacero-backend sh

# Prisma: generar cliente
docker exec -it filacero-backend npx prisma generate

# Prisma: crear migración
docker exec -it filacero-backend npx prisma migrate dev --name nombre_migracion

# Prisma: aplicar migraciones
docker exec -it filacero-backend npx prisma migrate deploy
```

## Ambientes

### 1. Desarrollo (Local)
- Docker Compose
- Hot reload habilitado
- Logs verbose
- Postgres local con datos de prueba
- Stripe en modo test

### 2. Staging (Pre-producción)
- Docker en servidor VPS/Cloud
- Configuración similar a producción
- Base de datos separada
- Stripe en modo test
- CI/CD automatizado

### 3. Producción
- Docker o Kubernetes
- Variables de entorno productivas
- Stripe en modo live
- Backups automatizados
- Monitoring y alertas
- SSL/TLS obligatorio

## Variables de Entorno

### Backend (.env)
```bash
# Base de datos
DATABASE_URL="postgresql://user:password@postgres:5432/filacero"

# JWT
JWT_SECRET="tu-secret-muy-seguro-aqui"
JWT_EXPIRES_IN="7d"

# Stripe
STRIPE_SECRET_KEY="sk_test_XXXXXXXX"  # test en dev, live en prod
STRIPE_WEBHOOK_SECRET="whsec_XXXXXXXX"

# Features
ENABLE_PAYMENTS=true
ENABLE_SPEI=false
ENABLE_SAVED_CARDS=true

# Email (opcional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="noreply@filacero.com"
SMTP_PASS="app-password"
```

### Frontend (.env)
```bash
# API Backend
NEXT_PUBLIC_API_BASE="http://localhost:3000"

# Negocio ID
NEXT_PUBLIC_NEGOCIO_ID="1"

# Stripe (clave pública)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_XXXXXXXX"
```

## Docker Compose

### Estructura
```yaml
services:
  backend:
    build: ./Backend
    ports: ["3000:3000", "9229:9229"]
    environment:
      DATABASE_URL: postgresql://...
    depends_on: [postgres]
    
  frontend:
    build: ./Frontend
    ports: ["8080:3000"]
    environment:
      NEXT_PUBLIC_API_BASE: http://backend:3000
    depends_on: [backend]
    
  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./Docker/db/db_filacero.sql:/docker-entrypoint-initdb.d/init.sql
```

## CI/CD

### GitHub Actions (Ejemplo)
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker images
        run: docker compose build
      
      - name: Run tests
        run: |
          docker compose up -d postgres
          docker compose run backend npm test
      
      - name: Deploy to server
        run: |
          ssh user@server 'cd /app && git pull && docker compose up -d --build'
```

## Monitoreo

### Health Checks
- Backend: `GET /health` (200 OK)
- Database: `SELECT 1` query
- Frontend: Status page

### Logs
- Backend: JSON estructurado a stdout
- Nginx: Access y error logs
- PostgreSQL: Query logs (solo errores en prod)

### Métricas
- Endpoint: `GET /metrics`
- Prometheus compatible
- Métricas: pagos, ventas, requests, errores

## Troubleshooting

### Puerto ya en uso
```bash
# Ver qué proceso usa el puerto 3000
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # Linux/Mac

# Cambiar puerto en docker-compose.yml
ports: ["3001:3000"]
```

### Error de conexión a base de datos
```bash
# Verificar que postgres esté corriendo
docker compose ps postgres

# Ver logs de postgres
docker compose logs postgres

# Recrear volumen (DESTRUCTIVO)
docker compose down -v
docker compose up -d
```

### Frontend no se conecta al backend
```bash
# Verificar variable NEXT_PUBLIC_API_BASE
docker compose exec frontend env | grep API_BASE

# Verificar que backend esté accesible desde frontend
docker compose exec frontend curl http://backend:3000/health
```

[← Volver al índice principal](../README.md)
