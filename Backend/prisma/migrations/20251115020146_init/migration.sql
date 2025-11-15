-- CreateTable
CREATE TABLE "roles" (
    "id_rol" BIGSERIAL NOT NULL,
    "nombre_rol" VARCHAR(50) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id_rol")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id_usuario" BIGSERIAL NOT NULL,
    "id_rol" BIGINT,
    "nombre" VARCHAR(150) NOT NULL,
    "correo_electronico" VARCHAR(254) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "numero_telefono" VARCHAR(30),
    "numero_cuenta" VARCHAR(30),
    "fecha_nacimiento" DATE,
    "fecha_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "correo_verificado" BOOLEAN NOT NULL DEFAULT false,
    "correo_verificado_en" TIMESTAMPTZ(6),
    "sms_verificado" BOOLEAN NOT NULL DEFAULT false,
    "sms_verificado_en" TIMESTAMPTZ(6),
    "credencial_verificada" BOOLEAN NOT NULL DEFAULT false,
    "credencial_verificada_en" TIMESTAMPTZ(6),
    "verification_token" VARCHAR(128),
    "verification_token_expires" TIMESTAMPTZ(6),
    "avatar_url" VARCHAR(512),
    "credential_url" VARCHAR(512),
    "edad" SMALLINT,
    "estado" VARCHAR(20),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "categoria" (
    "id_categoria" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,

    CONSTRAINT "categoria_pkey" PRIMARY KEY ("id_categoria")
);

-- CreateTable
CREATE TABLE "comentario" (
    "id_comentario" BIGSERIAL NOT NULL,
    "id_negocio" BIGINT NOT NULL,
    "id_usuario" BIGINT NOT NULL,
    "titulo" VARCHAR(150),
    "comentario" TEXT NOT NULL,
    "fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(6),
    "estado" VARCHAR(20) NOT NULL DEFAULT 'visible',

    CONSTRAINT "comentario_pkey" PRIMARY KEY ("id_comentario")
);

-- CreateTable
CREATE TABLE "corte_caja" (
    "id_corte" BIGSERIAL NOT NULL,
    "id_negocio" BIGINT,
    "id_usuario" BIGINT,
    "fecha_inicio" TIMESTAMPTZ(6),
    "fecha_fin" TIMESTAMPTZ(6),
    "monto_inicial" DECIMAL(14,2),
    "monto_final" DECIMAL(14,2),
    "ventas_totales" INTEGER,

    CONSTRAINT "corte_caja_pkey" PRIMARY KEY ("id_corte")
);

-- CreateTable
CREATE TABLE "detalle_venta" (
    "id_detalle" BIGSERIAL NOT NULL,
    "id_venta" BIGINT,
    "id_producto" BIGINT,
    "cantidad" INTEGER,
    "precio_unitario" DECIMAL(12,2),

    CONSTRAINT "detalle_venta_pkey" PRIMARY KEY ("id_detalle")
);

-- CreateTable
CREATE TABLE "feedback" (
    "id_feedback" BIGSERIAL NOT NULL,
    "id_comentario" BIGINT NOT NULL,
    "id_usuario" BIGINT NOT NULL,
    "tipo" VARCHAR(20) NOT NULL DEFAULT 'like',
    "mensaje" TEXT,
    "calificacion" SMALLINT,
    "fecha" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id_feedback")
);

-- CreateTable
CREATE TABLE "inventario" (
    "id_inventario" BIGSERIAL NOT NULL,
    "id_negocio" BIGINT,
    "id_producto" BIGINT,
    "stock_minimo" INTEGER DEFAULT 0,
    "cantidad_actual" INTEGER DEFAULT 0,
    "fecha_actualizacion" TIMESTAMPTZ(6),

    CONSTRAINT "inventario_pkey" PRIMARY KEY ("id_inventario")
);

-- CreateTable
CREATE TABLE "movimientos_inventario" (
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

-- CreateTable
CREATE TABLE "negocio" (
    "id_negocio" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "direccion" TEXT,
    "telefono" VARCHAR(30),
    "correo" VARCHAR(254),
    "logo_url" TEXT,
    "hero_image_url" TEXT,
    "fecha_registro" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "owner_id" BIGINT,

    CONSTRAINT "negocio_pkey" PRIMARY KEY ("id_negocio")
);

-- CreateTable
CREATE TABLE "producto" (
    "id_producto" BIGSERIAL NOT NULL,
    "id_categoria" BIGINT,
    "nombre" VARCHAR(200) NOT NULL,
    "descripcion" TEXT,
    "descripcion_larga" TEXT,
    "codigo_barras" VARCHAR(100),
    "precio" DECIMAL(12,2) NOT NULL,
    "imagen_url" TEXT,
    "estado" VARCHAR(30),

    CONSTRAINT "producto_pkey" PRIMARY KEY ("id_producto")
);

-- CreateTable
CREATE TABLE "producto_historial_precio" (
    "id_historial" BIGSERIAL NOT NULL,
    "id_producto" BIGINT NOT NULL,
    "precio" DECIMAL(12,2) NOT NULL,
    "fecha_inicio" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_fin" TIMESTAMPTZ(6),
    "vigente" BOOLEAN NOT NULL DEFAULT true,
    "motivo" VARCHAR(200),
    "id_usuario" BIGINT,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "producto_historial_precio_pkey" PRIMARY KEY ("id_historial")
);

-- CreateTable
CREATE TABLE "reporte_ventas" (
    "id_reporte" BIGSERIAL NOT NULL,
    "id_negocio" BIGINT,
    "fecha" DATE,
    "total_ventas" DECIMAL(14,2),
    "total_productos" INTEGER,
    "total_efectivo" DECIMAL(14,2),
    "total_tarjeta" DECIMAL(14,2),
    "total_transferencia" DECIMAL(14,2),

    CONSTRAINT "reporte_ventas_pkey" PRIMARY KEY ("id_reporte")
);

-- CreateTable
CREATE TABLE "tipo_pago" (
    "id_tipo_pago" BIGSERIAL NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "tipo_pago_pkey" PRIMARY KEY ("id_tipo_pago")
);

-- CreateTable
CREATE TABLE "venta" (
    "id_venta" BIGSERIAL NOT NULL,
    "id_negocio" BIGINT,
    "id_usuario" BIGINT,
    "fecha_venta" TIMESTAMPTZ(6),
    "total" DECIMAL(14,2),
    "id_tipo_pago" BIGINT,
    "estado" VARCHAR(30),

    CONSTRAINT "venta_pkey" PRIMARY KEY ("id_venta")
);

-- CreateTable
CREATE TABLE "empleados" (
    "id_empleado" BIGSERIAL NOT NULL,
    "negocio_id" BIGINT NOT NULL,
    "usuario_id" BIGINT NOT NULL,
    "estado" VARCHAR(20) NOT NULL DEFAULT 'activo',
    "fecha_alta" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "empleados_pkey" PRIMARY KEY ("id_empleado")
);

-- CreateTable
CREATE TABLE "negocio_rating" (
    "id_rating" BIGSERIAL NOT NULL,
    "id_negocio" BIGINT NOT NULL,
    "id_usuario" BIGINT NOT NULL,
    "estrellas" SMALLINT NOT NULL,
    "comentario" TEXT,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "negocio_rating_pkey" PRIMARY KEY ("id_rating")
);

-- CreateTable
CREATE TABLE "producto_media" (
    "id_media" BIGSERIAL NOT NULL,
    "id_producto" BIGINT NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "tipo" VARCHAR(30),
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "producto_media_pkey" PRIMARY KEY ("id_media")
);

-- CreateTable
CREATE TABLE "producto_metricas_semanales" (
    "id_metricas" BIGSERIAL NOT NULL,
    "id_producto" BIGINT NOT NULL,
    "id_negocio" BIGINT,
    "anio" INTEGER NOT NULL,
    "semana" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "calculado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "producto_metricas_semanales_pkey" PRIMARY KEY ("id_metricas")
);

-- CreateTable
CREATE TABLE "pedido" (
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
CREATE TABLE "detalle_pedido" (
    "id_detalle" BIGSERIAL NOT NULL,
    "id_pedido" BIGINT NOT NULL,
    "id_producto" BIGINT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(10,2) NOT NULL,
    "notas" TEXT,

    CONSTRAINT "detalle_pedido_pkey" PRIMARY KEY ("id_detalle")
);

-- CreateTable
CREATE TABLE "notificacion" (
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
CREATE TABLE "usuarios_negocio" (
    "id_asignacion" BIGSERIAL NOT NULL,
    "id_usuario" BIGINT NOT NULL,
    "id_negocio" BIGINT NOT NULL,
    "rol" VARCHAR(30) NOT NULL,
    "fecha_asignacion" TIMESTAMPTZ(6),

    CONSTRAINT "usuarios_negocio_pkey" PRIMARY KEY ("id_asignacion")
);

-- CreateTable
CREATE TABLE "negocio_categoria" (
    "id_asignacion" BIGSERIAL NOT NULL,
    "id_negocio" BIGINT NOT NULL,
    "id_categoria" BIGINT NOT NULL,

    CONSTRAINT "negocio_categoria_pkey" PRIMARY KEY ("id_asignacion")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_rol_key" ON "roles"("nombre_rol");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_electronico_key" ON "usuarios"("correo_electronico");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_numero_cuenta_key" ON "usuarios"("numero_cuenta");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_verification_token_key" ON "usuarios"("verification_token");

-- CreateIndex
CREATE INDEX "usuarios_id_rol_idx" ON "usuarios"("id_rol");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_nombre_key" ON "categoria"("nombre");

-- CreateIndex
CREATE INDEX "idx_categoria_nombre" ON "categoria"("nombre");

-- CreateIndex
CREATE INDEX "comentario_id_negocio_idx" ON "comentario"("id_negocio");

-- CreateIndex
CREATE INDEX "comentario_id_usuario_idx" ON "comentario"("id_usuario");

-- CreateIndex
CREATE INDEX "corte_caja_id_negocio_idx" ON "corte_caja"("id_negocio");

-- CreateIndex
CREATE INDEX "corte_caja_id_usuario_idx" ON "corte_caja"("id_usuario");

-- CreateIndex
CREATE INDEX "idx_detalle_venta_producto" ON "detalle_venta"("id_producto");

-- CreateIndex
CREATE INDEX "detalle_venta_id_venta_idx" ON "detalle_venta"("id_venta");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_id_comentario_id_usuario_tipo_key" ON "feedback"("id_comentario", "id_usuario", "tipo");

-- CreateIndex
CREATE INDEX "idx_inventario_negocio" ON "inventario"("id_negocio");

-- CreateIndex
CREATE INDEX "idx_inventario_negocio_producto" ON "inventario"("id_negocio", "id_producto");

-- CreateIndex
CREATE INDEX "idx_inventario_producto" ON "inventario"("id_producto");

-- CreateIndex
CREATE UNIQUE INDEX "uq_inventario_negocio_producto" ON "inventario"("id_negocio", "id_producto");

-- CreateIndex
CREATE INDEX "idx_mov_inv_neg_prod_fecha" ON "movimientos_inventario"("id_negocio", "id_producto", "fecha" DESC);

-- CreateIndex
CREATE INDEX "movimientos_inventario_id_venta_idx" ON "movimientos_inventario"("id_venta");

-- CreateIndex
CREATE INDEX "movimientos_inventario_id_detalle_idx" ON "movimientos_inventario"("id_detalle");

-- CreateIndex
CREATE INDEX "movimientos_inventario_id_usuario_idx" ON "movimientos_inventario"("id_usuario");

-- CreateIndex
CREATE INDEX "negocio_owner_id_idx" ON "negocio"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "producto_codigo_barras_key" ON "producto"("codigo_barras");

-- CreateIndex
CREATE INDEX "producto_id_categoria_idx" ON "producto"("id_categoria");

-- CreateIndex
CREATE INDEX "producto_historial_precio_id_producto_vigente_idx" ON "producto_historial_precio"("id_producto", "vigente");

-- CreateIndex
CREATE INDEX "producto_historial_precio_id_producto_fecha_inicio_idx" ON "producto_historial_precio"("id_producto", "fecha_inicio");

-- CreateIndex
CREATE INDEX "producto_historial_precio_id_usuario_idx" ON "producto_historial_precio"("id_usuario");

-- CreateIndex
CREATE INDEX "reporte_ventas_id_negocio_idx" ON "reporte_ventas"("id_negocio");

-- CreateIndex
CREATE UNIQUE INDEX "tipo_pago_tipo_key" ON "tipo_pago"("tipo");

-- CreateIndex
CREATE INDEX "idx_venta_fecha" ON "venta"("fecha_venta");

-- CreateIndex
CREATE INDEX "venta_id_negocio_idx" ON "venta"("id_negocio");

-- CreateIndex
CREATE INDEX "venta_id_usuario_idx" ON "venta"("id_usuario");

-- CreateIndex
CREATE INDEX "venta_id_tipo_pago_idx" ON "venta"("id_tipo_pago");

-- CreateIndex
CREATE INDEX "venta_id_negocio_estado_fecha_venta_idx" ON "venta"("id_negocio", "estado", "fecha_venta");

-- CreateIndex
CREATE UNIQUE INDEX "uq_empleados_negocio_usuario" ON "empleados"("negocio_id", "usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "negocio_rating_id_negocio_id_usuario_key" ON "negocio_rating"("id_negocio", "id_usuario");

-- CreateIndex
CREATE INDEX "producto_media_id_producto_idx" ON "producto_media"("id_producto");

-- CreateIndex
CREATE UNIQUE INDEX "producto_metricas_semanales_id_producto_id_negocio_anio_sem_key" ON "producto_metricas_semanales"("id_producto", "id_negocio", "anio", "semana");

-- CreateIndex
CREATE INDEX "pedido_id_negocio_estado_idx" ON "pedido"("id_negocio", "estado");

-- CreateIndex
CREATE INDEX "pedido_id_usuario_idx" ON "pedido"("id_usuario");

-- CreateIndex
CREATE INDEX "pedido_fecha_creacion_idx" ON "pedido"("fecha_creacion");

-- CreateIndex
CREATE INDEX "pedido_id_tipo_pago_idx" ON "pedido"("id_tipo_pago");

-- CreateIndex
CREATE INDEX "detalle_pedido_id_pedido_idx" ON "detalle_pedido"("id_pedido");

-- CreateIndex
CREATE INDEX "detalle_pedido_id_producto_idx" ON "detalle_pedido"("id_producto");

-- CreateIndex
CREATE INDEX "notificacion_id_usuario_leida_idx" ON "notificacion"("id_usuario", "leida");

-- CreateIndex
CREATE INDEX "notificacion_id_negocio_tipo_idx" ON "notificacion"("id_negocio", "tipo");

-- CreateIndex
CREATE INDEX "notificacion_creado_en_idx" ON "notificacion"("creado_en");

-- CreateIndex
CREATE INDEX "notificacion_id_pedido_idx" ON "notificacion"("id_pedido");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_negocio_id_usuario_id_negocio_key" ON "usuarios_negocio"("id_usuario", "id_negocio");

-- CreateIndex
CREATE UNIQUE INDEX "negocio_categoria_id_negocio_id_categoria_key" ON "negocio_categoria"("id_negocio", "id_categoria");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "roles"("id_rol") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "comentario" ADD CONSTRAINT "comentario_id_negocio_fkey" FOREIGN KEY ("id_negocio") REFERENCES "negocio"("id_negocio") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "comentario" ADD CONSTRAINT "comentario_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "corte_caja" ADD CONSTRAINT "corte_caja_id_negocio_fkey" FOREIGN KEY ("id_negocio") REFERENCES "negocio"("id_negocio") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "corte_caja" ADD CONSTRAINT "corte_caja_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detalle_venta" ADD CONSTRAINT "detalle_venta_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "producto"("id_producto") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "detalle_venta" ADD CONSTRAINT "detalle_venta_id_venta_fkey" FOREIGN KEY ("id_venta") REFERENCES "venta"("id_venta") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_id_comentario_fkey" FOREIGN KEY ("id_comentario") REFERENCES "comentario"("id_comentario") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventario" ADD CONSTRAINT "inventario_id_negocio_fkey" FOREIGN KEY ("id_negocio") REFERENCES "negocio"("id_negocio") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "inventario" ADD CONSTRAINT "inventario_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "producto"("id_producto") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_id_detalle_fkey" FOREIGN KEY ("id_detalle") REFERENCES "detalle_venta"("id_detalle") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_id_negocio_fkey" FOREIGN KEY ("id_negocio") REFERENCES "negocio"("id_negocio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "producto"("id_producto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_id_venta_fkey" FOREIGN KEY ("id_venta") REFERENCES "venta"("id_venta") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negocio" ADD CONSTRAINT "fk_negocio_owner" FOREIGN KEY ("owner_id") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto" ADD CONSTRAINT "producto_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "categoria"("id_categoria") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "producto_historial_precio" ADD CONSTRAINT "producto_historial_precio_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "producto"("id_producto") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_historial_precio" ADD CONSTRAINT "producto_historial_precio_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reporte_ventas" ADD CONSTRAINT "reporte_ventas_id_negocio_fkey" FOREIGN KEY ("id_negocio") REFERENCES "negocio"("id_negocio") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "venta" ADD CONSTRAINT "venta_id_negocio_fkey" FOREIGN KEY ("id_negocio") REFERENCES "negocio"("id_negocio") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "venta" ADD CONSTRAINT "venta_id_tipo_pago_fkey" FOREIGN KEY ("id_tipo_pago") REFERENCES "tipo_pago"("id_tipo_pago") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "venta" ADD CONSTRAINT "venta_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_negocio_id_fkey" FOREIGN KEY ("negocio_id") REFERENCES "negocio"("id_negocio") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negocio_rating" ADD CONSTRAINT "negocio_rating_id_negocio_fkey" FOREIGN KEY ("id_negocio") REFERENCES "negocio"("id_negocio") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "negocio_rating" ADD CONSTRAINT "negocio_rating_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "producto_media" ADD CONSTRAINT "producto_media_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "producto"("id_producto") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "producto_metricas_semanales" ADD CONSTRAINT "producto_metricas_semanales_id_negocio_fkey" FOREIGN KEY ("id_negocio") REFERENCES "negocio"("id_negocio") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "producto_metricas_semanales" ADD CONSTRAINT "producto_metricas_semanales_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "producto"("id_producto") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pedido" ADD CONSTRAINT "pedido_id_negocio_fkey" FOREIGN KEY ("id_negocio") REFERENCES "negocio"("id_negocio") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido" ADD CONSTRAINT "pedido_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedido" ADD CONSTRAINT "pedido_id_tipo_pago_fkey" FOREIGN KEY ("id_tipo_pago") REFERENCES "tipo_pago"("id_tipo_pago") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_pedido" ADD CONSTRAINT "detalle_pedido_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "pedido"("id_pedido") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalle_pedido" ADD CONSTRAINT "detalle_pedido_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "producto"("id_producto") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacion" ADD CONSTRAINT "notificacion_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacion" ADD CONSTRAINT "notificacion_id_negocio_fkey" FOREIGN KEY ("id_negocio") REFERENCES "negocio"("id_negocio") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacion" ADD CONSTRAINT "notificacion_id_pedido_fkey" FOREIGN KEY ("id_pedido") REFERENCES "pedido"("id_pedido") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_negocio" ADD CONSTRAINT "usuarios_negocio_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "usuarios"("id_usuario") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_negocio" ADD CONSTRAINT "usuarios_negocio_id_negocio_fkey" FOREIGN KEY ("id_negocio") REFERENCES "negocio"("id_negocio") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negocio_categoria" ADD CONSTRAINT "negocio_categoria_id_negocio_fkey" FOREIGN KEY ("id_negocio") REFERENCES "negocio"("id_negocio") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negocio_categoria" ADD CONSTRAINT "negocio_categoria_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "categoria"("id_categoria") ON DELETE CASCADE ON UPDATE CASCADE;
