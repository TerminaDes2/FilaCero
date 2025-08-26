FROM node:20-alpine AS base
WORKDIR /app
COPY Frontend/package.json ./
RUN npm install --production=false
COPY Frontend/ ./
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
