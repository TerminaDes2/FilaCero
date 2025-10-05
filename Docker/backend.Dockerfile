# Backend dev Dockerfile - rápido y para desarrollo
FROM node:20-alpine

WORKDIR /app

# herramientas necesarias para compilación nativa si las necesitas
RUN apk add --no-cache openssl libc6-compat python3 make g++

# copiamos package.json primero para aprovechar cache de docker build
# (el build context es ya ./Backend desde docker-compose, por lo que NO existe subcarpeta Backend aquí)
COPY package*.json ./

# instalamos dependencias (incluye devDependencies para ts-node-dev, chokidar, etc)
RUN npm install

# copiamos el resto (en dev usaremos un bind-mount que reemplace /app en runtime)
COPY . .

EXPOSE 3000 9229

# Ejecuta el script dev que hace "prisma generate" y arranca ts-node-dev (definido en package.json)
CMD ["npm","run","dev"]
