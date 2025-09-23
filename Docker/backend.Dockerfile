# Dockerfile - Backend (solo desarrollo)
# Contexto esperado: ./Backend

FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=development

# Copiar dependencias y instalarlas directo
COPY package*.json ./
RUN npm install --silent --no-audit --no-fund

# Copiar el resto del proyecto
COPY . .

# Exponer API y puerto debug si lo usas
EXPOSE 3000 9229

# Para desarrollo en caliente (nest start --watch, nodemon, etc.)
CMD ["npm", "run", "start:dev"]
