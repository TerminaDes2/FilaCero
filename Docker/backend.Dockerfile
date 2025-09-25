###############################
# Dockerfile Backend (NestJS)
# Multi-stage build con Prisma Client y build TypeScript
###############################

# 1. Etapa deps (instala TODAS las dependencias)
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat python3 make g++
COPY package*.json ./
RUN npm install --no-audit --no-fund

# 2. Etapa build (compila TypeScript)
FROM node:20-alpine AS build
WORKDIR /app
ENV NODE_ENV=development
COPY package*.json ./
COPY tsconfig.json ./
COPY tsconfig.build.json ./
COPY nest-cli.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma
RUN npx prisma generate --schema=/app/prisma/schema.prisma
COPY src ./src
RUN npm run build

# 3. Etapa prod-deps (solo dependencias prod)
FROM node:20-alpine AS prod-deps
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund && npm cache clean --force

# 4. Runner final
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000
COPY --from=prod-deps /app/node_modules ./node_modules
COPY package*.json ./
# (Opcional) si hubiera archivos públicos/estáticos descomentar:
# COPY public ./public
COPY --from=build /app/dist ./dist
# Copiamos la carpeta prisma desde la etapa build (ya verificada) para evitar fallo de contexto
COPY --from=build /app/prisma ./prisma  

# Genera Prisma Client en la imagen final
RUN npx prisma generate --schema=/app/prisma/schema.prisma

EXPOSE 3000 9229
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s CMD node -e "require('http').get({host:'localhost',port:3000,path:'/'},r=>{if(r.statusCode!==200)process.exit(1)}).on('error',()=>process.exit(1))" || exit 1
CMD ["node", "dist/main.js"]
