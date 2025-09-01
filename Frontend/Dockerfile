# Dockerfile de desarrollo para Next.js (hot reload)
# Usa este Dockerfile cuando quieras desarrollar montando el código local.
# Para una imagen optimizada de producción sigue usando Docker/frontend.Dockerfile

FROM node:18-alpine AS dev

# Evita instalar dependencias opcionales innecesarias
ENV NODE_ENV=development

WORKDIR /app

# Copiamos únicamente los manifests para aprovechar la cache de dependencias
COPY package*.json ./

# Instalamos dependencias (usa npm; si añades lockfile se aprovechará mejor la cache)
RUN npm install

# Copiamos el resto del código (en docker-compose lo sobreescribirá el volumen, pero
# permite que la imagen funcione también sin volumen)
COPY . .

# Puerto por defecto de Next.js
EXPOSE 3000

# Comando de desarrollo (habilita Fast Refresh)
CMD ["npm","run","dev"]
