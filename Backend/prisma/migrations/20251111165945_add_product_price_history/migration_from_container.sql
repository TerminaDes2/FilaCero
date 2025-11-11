/*
  Warnings:

  - A unique constraint covering the columns `[id_comentario,id_usuario,tipo]` on the table `feedback` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id_negocio,id_producto]` on the table `inventario` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `id_negocio` to the `comentario` table without a default value. This is not possible if the table is not empty.
  - Made the column `id_usuario` on table `comentario` required. This step will fail if there are existing NULL values in that column.
  - Made the column `comentario` on table `comentario` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fecha` on table `comentario` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_usuario` on table `feedback` required. This step will fail if there are existing NULL values in that column.
  - Made the column `id_comentario` on table `feedback` required. This step will fail if there are existing NULL values in that column.
  - Made the column `fecha` on table `feedback` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "public"."comentario" DROP CONSTRAINT "comentario_id_usuario_fkey";

-- DropForeignKey
ALTER TABLE "public"."feedback" DROP CONSTRAINT "feedback_id_comentario_fkey";

-- DropForeignKey
ALTER TABLE "public"."feedback" DROP CONSTRAINT "feedback_id_usuario_fkey";

-- DropForeignKey
ALTER TABLE "public"."movimientos_inventario" DROP CONSTRAINT "movimientos_inventario_id_detalle_fkey";

-- DropForeignKey
ALTER TABLE "public"."movimientos_inventario" DROP CONSTRAINT "movimientos_inventario_id_negocio_fkey";

-- DropForeignKey
ALTER TABLE "public"."movimientos_inventario" DROP CONSTRAINT "movimientos_inventario_id_producto_fkey";

-- DropForeignKey
ALTER TABLE "public"."movimientos_inventario" DROP CONSTRAINT "movimientos_inventario_id_usuario_fkey";

-- DropForeignKey
ALTER TABLE "public"."movimientos_inventario" DROP CONSTRAINT "movimientos_inventario_id_venta_fkey";

-- DropForeignKey
ALTER TABLE "public"."usuarios_negocio" DROP CONSTRAINT "usuarios_negocio_id_negocio_fkey";

-- DropForeignKey
ALTER TABLE "public"."usuarios_negocio" DROP CONSTRAINT "usuarios_negocio_id_usuario_fkey";

-- AlterTable
ALTER TABLE "public"."comentario" ADD COLUMN     "actualizado_en" TIMESTAMPTZ(6),
ADD COLUMN     "estado" VARCHAR(20) NOT NULL DEFAULT 'visible',
ADD COLUMN     "id_negocio" BIGINT NOT NULL,
ADD COLUMN     "titulo" VARCHAR(150),
ALTER COLUMN "id_usuario" SET NOT NULL,
ALTER COLUMN "comentario" SET NOT NULL,
ALTER COLUMN "fecha" SET NOT NULL,
ALTER COLUMN "fecha" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."feedback" ADD COLUMN     "mensaje" TEXT,
ADD COLUMN     "tipo" VARCHAR(20) NOT NULL DEFAULT 'like',
ALTER COLUMN "id_usuario" SET NOT NULL,
ALTER COLUMN "id_comentario" SET NOT NULL,
ALTER COLUMN "fecha" SET NOT NULL,
ALTER COLUMN "fecha" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."inventario" ALTER COLUMN "stock_minimo" SET DEFAULT 0,
ALTER COLUMN "cantidad_actual" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."negocio" ADD COLUMN     "owner_id" BIGINT,
ALTER COLUMN "fecha_registro" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."usuarios" ALTER COLUMN "fecha_registro" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "verification_token_expires" SET DATA TYPE TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE "public"."empleados" (
    "id_empleado" BIGSERIAL NOT NULL,
    "negocio_id" BIGINT NOT NULL,
    "usuario_id" BIGINT NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'activo',
    "fecha_alta" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "empleados_pkey" PRIMARY KEY ("id_empleado")
);

-- CreateTable
CREATE TABLE "public"."pedido" (
    "id_pedido" BIGSERIAL NOT NULL,
    "id_negocio" BIGINT NOT NULL,
    "id_usuario" BIGINT,
    "id_tipo_pago" BIGINT,
    "estado" VARCHAR(30) NOT NULL DEFAULT 'pendiente',
    "fecha_creacion" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_confirmacion" TIMESTAMPTZ(6),
    "fecha_preparacion" TIMESTAMPTZ(6),
    "fecha_listo" TIMESTAMPTZ(6),
    "fecha_entrega" TIMESTAMPTZ(6),
    "total" DECIMAL(14,2) NOT NULL,
    "notas_cliente" TEXT,
    "tiempo_entrega" VARCHAR(50),
    "nombre_cliente" VARCHAR(100),
    "email_cliente" VARCHAR(100),
    "telefono_cliente" VARCHAR(20),
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "pedido_pkey" PRIMARY KEY ("id_pedido")
);

-- CreateTable
CREATE TABLE "public"."detalle_pedido" (
    "id_detalle" BIGSERIAL NOT NULL,
    "id_pedido" BIGINT NOT NULL,
    "id_producto" BIGINT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "notas" TEXT,

    CONSTRAINT "detalle_pedido_pkey" PRIMARY KEY ("id_detalle")
);

-- CreateTable
CREATE TABLE "public"."notificacion" (
    "id_notificacion" BIGSERIAL NOT NULL,
    "id_usuario" BIGINT,
    "id_negocio" BIGINT,
    "id_pedido" BIGINT,
    "tipo" VARCHAR(30) NOT NULL,
    "titulo" VARCHAR(200) NOT NULL,
    "mensaje" TEXT NOT NULL,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "canal" VARCHAR(20),
    "enviada_en" TIMESTAMPTZ(6),
    "leida_en" TIMESTAMPTZ(6),
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacion_pkey" PRIMARY KEY ("id_notificacion")
);

-- CreateIndex
CREATE UNIQUE INDEX "uq_empleados_negocio_usuario" ON "public"."empleados"("negocio_id", "usuario_id");

-- CreateIndex
CREATE INDEX "pedido_id_negocio_estado_idx" ON "public"."pedido"("id_negocio", "estado");

-- CreateIndex
CREATE INDEX "pedido_id_usuario_idx" ON "public"."pedido"("id_usuario");

-- CreateIndex
CREATE INDEX "pedido_fecha_creacion_idx" ON "public"."pedido"("fecha_creacion");

-- CreateIndex
CREATE INDEX "detalle_pedido_id_pedido_idx" ON "public"."detalle_pedido"("id_pedido");

-- CreateIndex
CREATE INDEX "notificacion_id_usuario_leida_idx" ON "public"."notificacion"("id_usuario", "leida");

-- CreateIndex
CREATE INDEX "notificacion_id_negocio_tipo_idx" ON "public"."notificacion"("id_negocio", "tipo");

-- CreateIndex
CREATE INDEX "notificacion_creado_en_idx" ON "public"."notificacion"("creado_en");

-- CreateIndex
CREATE INDEX "idx_categoria_nombre" ON "public"."categoria"("nombre");

-- CreateIndex
CREATE INDEX "idx_detalle_venta_producto" ON "public"."detalle_venta"("id_producto");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_id_comentario_id_usuario_tipo_key" ON "public"."feedback"("id_comentario", "id_usuario", "tipo");

-- CreateIndex
CREATE INDEX "idx_inventario_negocio" ON "public"."inventario"("id_negocio");

-- CreateIndex
CREATE INDEX "idx_inventario_negocio_producto" ON "public"."inventario"("id_negocio", "id_producto");

-- CreateIndex
CREATE INDEX "idx_inventario_producto" ON "public"."inventario"("id_producto");

-- CreateIndex
CREATE UNIQUE INDEX "uq_inventario_negocio_producto" ON "public"."inventario"("id_negocio", "id_producto");

-- CreateIndex
CREATE INDEX "idx_mov_inv_neg_prod_fecha" ON "public"."movimientos_inventario"("id_negocio", "id_producto", "fecha" DESC);

-- CreateIndex
CREATE INDEX "idx_venta_fecha" ON "public"."venta"("fecha_venta");

-- AddForeignKey
ALTER TABLE "public"."comentario" ADD CONSTRAINT "comentario_id_negocio_fkey" FOREIGN KEY ("id_negocio") REFERENCES "public"."negocio"("id_negocio") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."comentario" ADD CONSTRAINT "comentario_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."feedback" ADD CONSTRAINT "feedback_id_comentario_fkey" FOREIGN KEY ("id_comentario") REFERENCES "public"."comentario"("id_comentario") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."feedback" ADD CONSTRAINT "feedback_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_id_detalle_fkey" FOREIGN KEY ("id_detalle") REFERENCES "public"."detalle_venta"("id_detalle") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_id_negocio_fkey" FOREIGN KEY ("id_negocio") REFERENCES "public"."negocio"("id_negocio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "public"."producto"("id_producto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_id_venta_fkey" FOREIGN KEY ("id_venta") REFERENCES "public"."venta"("id_venta") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."negocio" ADD CONSTRAINT "fk_negocio_owner" FOREIGN KEY ("owner_id") REFERENCES "public"."usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."empleados" ADD CONSTRAINT "empleados_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "public"."negocio"("id_negocio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."empleados" ADD CONSTRAINT "empleados_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pedido" ADD CONSTRAINT "pedido_id_negocio_fkey" FOREIGN KEY ("id_negocio") REFERENCES "public"."negocio"("id_negocio") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pedido" ADD CONSTRAINT "pedido_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."pedido" ADD CONSTRAINT "pedido_id_tipo_pago_fkey" FOREIGN KEY ("id_tipo_pago") REFERENCES "public"."tipo_pago"("id_tipo_pago") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."detalle_pedido" ADD CONSTRAINT "detalle_pedido_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "public"."pedido"("id_pedido") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."detalle_pedido" ADD CONSTRAINT "detalle_pedido_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "public"."producto"("id_producto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notificacion" ADD CONSTRAINT "notificacion_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notificacion" ADD CONSTRAINT "notificacion_id_negocio_fkey" FOREIGN KEY ("id_negocio") REFERENCES "public"."negocio"("id_negocio") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notificacion" ADD CONSTRAINT "notificacion_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "public"."pedido"("id_pedido") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."usuarios_negocio" ADD CONSTRAINT "usuarios_negocio_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."usuarios_negocio" ADD CONSTRAINT "usuarios_negocio_id_negocio_fkey" FOREIGN KEY ("id_negocio") REFERENCES "public"."negocio"("id_negocio") ON DELETE CASCADE ON UPDATE CASCADE;
