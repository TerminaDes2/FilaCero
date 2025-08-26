FROM node:20-alpine AS base
WORKDIR /app

# Copiar definiciones y manifest (incluye package-lock si existe)
COPY Backend/package*.json ./
COPY Backend/tsconfig.json ./
COPY Backend/tsconfig.build.json ./
COPY Backend/nest-cli.json ./

# Instalar dependencias (todas, incluidas dev para modo watch)
RUN npm install

# Copiar el código fuente
COPY Backend/src ./src
COPY Backend/public ./public

EXPOSE 3000 9229

# Comando por defecto: desarrollo con watch
CMD ["npm", "run", "start:dev"]

