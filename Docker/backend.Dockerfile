###############################
# Dockerfile Backend (NestJS)
# build: docker build -f Docker/backend.Dockerfile -t terminatordes/filacero-backend:latest .
# multi-arch (ejemplo): docker buildx build --platform linux/amd64,linux/arm64 -f Docker/backend.Dockerfile -t terminatordes/filacero-backend:latest --push .
###############################

# 1. Etapa deps (instala TODAS las dependencias para compilar)
FROM node:20-alpine AS deps
WORKDIR /app
COPY Backend/package*.json ./
RUN npm install --no-audit --no-fund

# 2. Etapa build (compila TypeScript a dist)
FROM node:20-alpine AS build
WORKDIR /app
ENV NODE_ENV=development
COPY Backend/package*.json ./
COPY Backend/tsconfig.json ./
COPY Backend/tsconfig.build.json ./
COPY Backend/nest-cli.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY Backend/prisma ./prisma
RUN npx prisma generate --schema=/app/prisma/schema.prisma
COPY Backend/src ./src
RUN npm run build

# 3. Etapa prod-deps (solo dependencias de producción)
FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY Backend/package*.json ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

# 4. Runner final
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
		PORT=3000
COPY --from=prod-deps /app/node_modules ./node_modules
COPY Backend/package*.json ./
# (Opcional) si hubiera archivos públicos/estáticos descomentar:
# COPY Backend/public ./public
COPY --from=build /app/dist ./dist
COPY Backend/prisma ./prisma  

# Genera Prisma Client en la imagen final
RUN npx prisma generate --schema=/app/prisma/schema.prisma

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD node -e "require('http').get({host:'localhost',port:3000,path:'/'},r=>{if(r.statusCode!==200)process.exit(1)}).on('error',()=>process.exit(1))" || exit 1
CMD ["node", "dist/main.js"]

