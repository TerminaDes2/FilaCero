# Dockerfile - Backend (solo desarrollo)
# Contexto esperado: ./Backend

FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=development
<<<<<<< HEAD
COPY Backend/package*.json ./
COPY Backend/tsconfig.json ./
COPY Backend/tsconfig.build.json ./
COPY Backend/nest-cli.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY Backend/prisma ./prisma
RUN npx prisma generate --schema=/app/prisma/schema.prisma
COPY Backend/src ./src
RUN npm run build
=======
>>>>>>> 34df74acec310b91977b9bae525d2f69bf650fe0

# Copiar dependencias y instalarlas directo
COPY package*.json ./
RUN npm install --silent --no-audit --no-fund

<<<<<<< HEAD
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
=======
# Copiar el resto del proyecto
COPY . .
>>>>>>> 34df74acec310b91977b9bae525d2f69bf650fe0

# Exponer API y puerto debug si lo usas
EXPOSE 3000 9229

# Para desarrollo en caliente (nest start --watch, nodemon, etc.)
CMD ["npm", "run", "start:dev"]
