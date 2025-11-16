# Backend dev Dockerfile - rápido y para desarrollo
FROM node:20-bullseye

WORKDIR /app

# herramientas necesarias para compilación nativa si las necesitas
RUN apt-get update \
		&& apt-get install -y --no-install-recommends \
			python3 make g++ openssl \
		&& rm -rf /var/lib/apt/lists/*

# copiamos package.json primero para aprovechar cache de docker build
# (el build context es ya ./Backend desde docker-compose, por lo que NO existe subcarpeta Backend aquí)
COPY package*.json ./

# instalamos dependencias (incluye devDependencies para ts-node-dev, chokidar, etc)
RUN npm install

# copiamos el resto (en dev usaremos un bind-mount que reemplace /app en runtime)
COPY . .

EXPOSE 3000 9229

# Ejecuta el script de desarrollo de Nest con watch (más estable en contenedores).
# Evita usar `ts-node-dev` dentro de Docker para prevenir errores EPIPE y reinicios
# por problemas con los pipes de proceso cuando el contenedor usa volúmenes montados.
CMD ["npm","run","dev","start:dev"]
