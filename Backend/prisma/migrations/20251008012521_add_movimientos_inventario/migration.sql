-- CreateTable
CREATE TABLE "public"."movimientos_inventario" (
    "id_movimiento" BIGSERIAL NOT NULL,
    "id_negocio" BIGINT NOT NULL,
    "id_producto" BIGINT NOT NULL,
    "delta" INTEGER NOT NULL,
    "motivo" VARCHAR(50) NOT NULL,
    "id_venta" BIGINT,
    "id_detalle" BIGINT,
    "id_usuario" BIGINT,
    "fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id_movimiento")
);

-- AddForeignKey
ALTER TABLE "public"."movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_id_negocio_fkey" FOREIGN KEY ("id_negocio") REFERENCES "public"."negocio"("id_negocio") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "public"."producto"("id_producto") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_id_venta_fkey" FOREIGN KEY ("id_venta") REFERENCES "public"."venta"("id_venta") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_id_detalle_fkey" FOREIGN KEY ("id_detalle") REFERENCES "public"."detalle_venta"("id_detalle") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE NO ACTION;

-- CreateIndex
CREATE INDEX "movimientos_inventario_negocio_producto_fecha_idx"
    ON "public"."movimientos_inventario"("id_negocio", "id_producto", "fecha" DESC);
