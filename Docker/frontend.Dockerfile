# Dockerfile - Frontend (solo desarrollo)
# Contexto esperado: ./Frontend

FROM node:20-alpine AS dev
WORKDIR /app

ENV NODE_ENV=development

# Copiar dependencias y instalarlas
COPY package.json package-lock.json* ./
RUN npm install --silent --no-audit --no-fund

# Copiar el resto del proyecto
COPY . .

EXPOSE 3000

# Hot-reload con Next.js
CMD ["npm", "run", "dev"]
