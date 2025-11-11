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
CREATE UNIQUE INDEX "usuarios_negocio_id_usuario_id_negocio_key" ON "public"."usuarios_negocio"("id_usuario", "id_negocio");

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
