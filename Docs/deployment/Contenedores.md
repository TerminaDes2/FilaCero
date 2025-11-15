Pasos típicos para “destruir” (bajar y limpiar) y volver a levantar en modo dev:

1. Apagar y eliminar (con volúmenes)
docker compose down -v
-v borra volúmenes (incluye la BD). Si no quieres perder datos, omite -v.

2. (Opcional) Limpiar caché de imágenes sólo de este proyecto
docker image prune -f

3. Levantar en modo dev
Revisa si tienes un archivo docker-compose.dev.yml.

Si existe:
docker compose -f docker-compose.dev.yml up -d --build

Si sólo usas docker-compose.yml y ya define comandos “dev” (nodemon / next dev):
docker compose up -d --build

4. Ver logs en vivo
docker compose logs -f backend
docker compose logs -f frontend

5. Regenerar Prisma (si cambiaste schema)
docker exec -it filacero-backend npx prisma generate

6. Primera migración (si aún no existe)
docker exec -it filacero-backend npx prisma migrate dev --name init

7. Reconstruir solo un servicio (si cambias Dockerfile)
docker compose build backend
docker compose up -d backend

8. Forzar reconstrucción sin usar caché
docker compose build --no-cache
docker compose up -d

9. Ver estado rápido
docker compose ps

10. Entrar al contenedor
docker exec -it filacero-backend sh

11. Si quieres mantener datos de Postgres pero refrescar código:
docker compose down (sin -v)
docker compose up -d --build