-- DropIndex
DROP INDEX "public"."movimientos_inventario_negocio_producto_fecha_idx";

-- CreateTable
CREATE TABLE "public"."usuarios_negocio" (
    "id_asignacion" BIGSERIAL NOT NULL,
    "id_usuario" BIGINT NOT NULL,
    "id_negocio" BIGINT NOT NULL,
    "rol" VARCHAR(30) NOT NULL,
    "fecha_asignacion" TIMESTAMPTZ(6),

    CONSTRAINT "usuarios_negocio_pkey" PRIMARY KEY ("id_asignacion")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_negocio_id_usuario_id_negocio_key" ON "public"."usuarios_negocio"("id_usuario", "id_negocio");

-- AddForeignKey
ALTER TABLE "public"."usuarios_negocio" ADD CONSTRAINT "usuarios_negocio_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."usuarios_negocio" ADD CONSTRAINT "usuarios_negocio_id_negocio_fkey" FOREIGN KEY ("id_negocio") REFERENCES "public"."negocio"("id_negocio") ON DELETE CASCADE ON UPDATE NO ACTION;
