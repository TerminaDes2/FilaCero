FROM node:20-alpine AS base
WORKDIR /app

# Copiar definiciones y manifest (incluye package-lock si existe)
COPY Backend/package*.json ./
COPY Backend/tsconfig.json ./
COPY Backend/tsconfig.build.json ./
COPY Backend/nest-cli.json ./

# Instalar dependencias
RUN npm install --production=false && npm cache clean --force

# Copiar el código fuente
COPY Backend/src ./src
## (Opcional) carpeta public eliminada porque no existe actualmente

# Compilar a dist
RUN npx nest build

EXPOSE 3000

# Ejecutar versión compilada (estable)
CMD ["node", "dist/main.js"]

