FROM node:20-alpine AS base
WORKDIR /app
COPY Backend/package.json ./
RUN npm install --production=false
COPY Backend/src ./src
EXPOSE 3000 9229
CMD ["npm", "run", "dev"]
