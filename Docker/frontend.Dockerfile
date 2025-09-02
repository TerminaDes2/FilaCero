## Etapa deps: instala dependencias (aprovecha cache)
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm install

## Etapa builder: compila Next.js (TS soportado automáticamente)
FROM node:18-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

## Etapa runner: imagen mínima de ejecución
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Sólo copiar lo necesario para runtime
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next-env.d.ts ./next-env.d.ts

EXPOSE 3000
CMD ["npm", "start"]
