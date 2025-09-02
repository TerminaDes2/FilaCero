## Dockerfile unificado frontend (dev y prod) para Next.js
## Uso:
##  Desarrollo (hot reload): docker build -f Docker/frontend.Dockerfile -t terminatordes/filacero-frontend:dev --target dev Frontend
##  Producción optimizada:  docker build -f Docker/frontend.Dockerfile -t terminatordes/filacero-frontend:latest Frontend
##  Multi-arch push: docker buildx build --platform linux/amd64,linux/arm64 -f Docker/frontend.Dockerfile -t terminatordes/filacero-frontend:latest --target runner --push Frontend

############################
# Etapa base de dependencias
############################
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm install

############################
# Etapa de desarrollo (hot reload)
############################
FROM node:20-alpine AS dev
WORKDIR /app
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
# Comando por defecto en entorno dev
CMD ["npm","run","dev"]

############################
# Etapa builder (compila para producción)
############################
FROM node:20-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

############################
# Etapa runner (imagen mínima runtime)
############################
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Sólo copiar lo necesario para runtime
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next-env.d.ts ./next-env.d.ts
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD node -e "require('http').get('http://localhost:3000',r=>{if(r.statusCode!==200)process.exit(1)})" || exit 1
CMD ["npm","start"]
