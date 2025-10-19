/*
  Warnings:

  - You are about to drop the column `logo` on the `negocio` table. All the data in the column will be lost.
  - You are about to drop the column `imagen` on the `producto` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[verification_token]` on the table `usuarios` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."negocio" DROP COLUMN "logo",
ADD COLUMN     "hero_image_url" TEXT,
ADD COLUMN     "logo_url" TEXT;

-- AlterTable
ALTER TABLE "public"."producto" DROP COLUMN "imagen",
ADD COLUMN     "descripcion_larga" TEXT,
ADD COLUMN     "imagen_url" TEXT;

-- AlterTable
ALTER TABLE "public"."usuarios" ADD COLUMN     "avatar_url" VARCHAR(512),
ADD COLUMN     "credential_url" VARCHAR(512),
ADD COLUMN     "fecha_verificacion" TIMESTAMP(3),
ADD COLUMN     "verificado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verification_token" VARCHAR(128),
ADD COLUMN     "verification_token_expires" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "public"."negocio_rating" (
    "id_rating" BIGSERIAL NOT NULL,
    "id_negocio" BIGINT NOT NULL,
    "id_usuario" BIGINT NOT NULL,
    "estrellas" SMALLINT NOT NULL,
    "comentario" TEXT,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "negocio_rating_pkey" PRIMARY KEY ("id_rating")
);

-- CreateTable
CREATE TABLE "public"."producto_media" (
    "id_media" BIGSERIAL NOT NULL,
    "id_producto" BIGINT NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "tipo" VARCHAR(30),
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "producto_media_pkey" PRIMARY KEY ("id_media")
);

-- CreateTable
CREATE TABLE "public"."producto_metricas_semanales" (
    "id_metricas" BIGSERIAL NOT NULL,
    "id_producto" BIGINT NOT NULL,
    "id_negocio" BIGINT,
    "anio" INTEGER NOT NULL,
    "semana" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "calculado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "producto_metricas_semanales_pkey" PRIMARY KEY ("id_metricas")
);

-- CreateIndex
CREATE UNIQUE INDEX "negocio_rating_id_negocio_id_usuario_key" ON "public"."negocio_rating"("id_negocio", "id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "producto_metricas_semanales_id_producto_id_negocio_anio_sem_key" ON "public"."producto_metricas_semanales"("id_producto", "id_negocio", "anio", "semana");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_verification_token_key" ON "public"."usuarios"("verification_token");

-- AddForeignKey
ALTER TABLE "public"."negocio_rating" ADD CONSTRAINT "negocio_rating_id_negocio_fkey" FOREIGN KEY ("id_negocio") REFERENCES "public"."negocio"("id_negocio") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."negocio_rating" ADD CONSTRAINT "negocio_rating_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."producto_media" ADD CONSTRAINT "producto_media_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "public"."producto"("id_producto") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."producto_metricas_semanales" ADD CONSTRAINT "producto_metricas_semanales_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "public"."producto"("id_producto") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."producto_metricas_semanales" ADD CONSTRAINT "producto_metricas_semanales_id_negocio_fkey" FOREIGN KEY ("id_negocio") REFERENCES "public"."negocio"("id_negocio") ON DELETE CASCADE ON UPDATE NO ACTION;
