-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."categoria" (
    "id_categoria" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,

    CONSTRAINT "categoria_pkey" PRIMARY KEY ("id_categoria")
);

-- CreateTable
CREATE TABLE "public"."comentario" (
    "id_comentario" BIGSERIAL NOT NULL,
    "id_usuario" BIGINT,
    "comentario" TEXT,
    "fecha" TIMESTAMPTZ(6),

    CONSTRAINT "comentario_pkey" PRIMARY KEY ("id_comentario")
);

-- CreateTable
CREATE TABLE "public"."corte_caja" (
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
CREATE TABLE "public"."detalle_venta" (
    "id_detalle" BIGSERIAL NOT NULL,
    "id_venta" BIGINT,
    "id_producto" BIGINT,
    "cantidad" INTEGER,
    "precio_unitario" DECIMAL(12,2),

    CONSTRAINT "detalle_venta_pkey" PRIMARY KEY ("id_detalle")
);

-- CreateTable
CREATE TABLE "public"."feedback" (
    "id_feedback" BIGSERIAL NOT NULL,
    "id_usuario" BIGINT,
    "id_comentario" BIGINT,
    "calificacion" SMALLINT,
    "fecha" TIMESTAMPTZ(6),

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id_feedback")
);

-- CreateTable
CREATE TABLE "public"."inventario" (
    "id_inventario" BIGSERIAL NOT NULL,
    "id_negocio" BIGINT,
    "id_producto" BIGINT,
    "stock_minimo" INTEGER,
    "cantidad_actual" INTEGER,
    "fecha_actualizacion" TIMESTAMPTZ(6),

    CONSTRAINT "inventario_pkey" PRIMARY KEY ("id_inventario")
);

-- CreateTable
CREATE TABLE "public"."negocio" (
    "id_negocio" BIGSERIAL NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "direccion" TEXT,
    "telefono" VARCHAR(30),
    "correo" VARCHAR(254),
    "logo" TEXT,
    "fecha_registro" TIMESTAMPTZ(6),

    CONSTRAINT "negocio_pkey" PRIMARY KEY ("id_negocio")
);

-- CreateTable
CREATE TABLE "public"."producto" (
    "id_producto" BIGSERIAL NOT NULL,
    "id_categoria" BIGINT,
    "nombre" VARCHAR(200) NOT NULL,
    "descripcion" TEXT,
    "codigo_barras" VARCHAR(100),
    "precio" DECIMAL(12,2) NOT NULL,
    "imagen" TEXT,
    "estado" VARCHAR(30),

    CONSTRAINT "producto_pkey" PRIMARY KEY ("id_producto")
);

-- CreateTable
CREATE TABLE "public"."reporte_ventas" (
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
CREATE TABLE "public"."roles" (
    "id_rol" BIGSERIAL NOT NULL,
    "nombre_rol" VARCHAR(50) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id_rol")
);

-- CreateTable
CREATE TABLE "public"."tipo_pago" (
    "id_tipo_pago" BIGSERIAL NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "tipo_pago_pkey" PRIMARY KEY ("id_tipo_pago")
);

-- CreateTable
CREATE TABLE "public"."usuarios" (
    "id_usuario" BIGSERIAL NOT NULL,
    "id_rol" BIGINT,
    "nombre" VARCHAR(150) NOT NULL,
    "correo_electronico" VARCHAR(254) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "numero_telefono" VARCHAR(30),
    "fecha_nacimiento" DATE,
    "fecha_registro" TIMESTAMPTZ(6),
    "estado" VARCHAR(20),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "public"."venta" (
    "id_venta" BIGSERIAL NOT NULL,
    "id_negocio" BIGINT,
    "id_usuario" BIGINT,
    "fecha_venta" TIMESTAMPTZ(6),
    "total" DECIMAL(14,2),
    "id_tipo_pago" BIGINT,
    "estado" VARCHAR(30),

    CONSTRAINT "venta_pkey" PRIMARY KEY ("id_venta")
);

-- CreateIndex
CREATE UNIQUE INDEX "categoria_nombre_key" ON "public"."categoria"("nombre" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "producto_codigo_barras_key" ON "public"."producto"("codigo_barras" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_rol_key" ON "public"."roles"("nombre_rol" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "tipo_pago_tipo_key" ON "public"."tipo_pago"("tipo" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_electronico_key" ON "public"."usuarios"("correo_electronico" ASC);

-- AddForeignKey
ALTER TABLE "public"."comentario" ADD CONSTRAINT "comentario_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."corte_caja" ADD CONSTRAINT "corte_caja_id_negocio_fkey" FOREIGN KEY ("id_negocio") REFERENCES "public"."negocio"("id_negocio") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."corte_caja" ADD CONSTRAINT "corte_caja_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."detalle_venta" ADD CONSTRAINT "detalle_venta_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "public"."producto"("id_producto") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."detalle_venta" ADD CONSTRAINT "detalle_venta_id_venta_fkey" FOREIGN KEY ("id_venta") REFERENCES "public"."venta"("id_venta") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."feedback" ADD CONSTRAINT "feedback_id_comentario_fkey" FOREIGN KEY ("id_comentario") REFERENCES "public"."comentario"("id_comentario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."feedback" ADD CONSTRAINT "feedback_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."inventario" ADD CONSTRAINT "inventario_id_negocio_fkey" FOREIGN KEY ("id_negocio") REFERENCES "public"."negocio"("id_negocio") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."inventario" ADD CONSTRAINT "inventario_id_producto_fkey" FOREIGN KEY ("id_producto") REFERENCES "public"."producto"("id_producto") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."producto" ADD CONSTRAINT "producto_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "public"."categoria"("id_categoria") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."reporte_ventas" ADD CONSTRAINT "reporte_ventas_id_negocio_fkey" FOREIGN KEY ("id_negocio") REFERENCES "public"."negocio"("id_negocio") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."usuarios" ADD CONSTRAINT "usuarios_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "public"."roles"("id_rol") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."venta" ADD CONSTRAINT "venta_id_negocio_fkey" FOREIGN KEY ("id_negocio") REFERENCES "public"."negocio"("id_negocio") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."venta" ADD CONSTRAINT "venta_id_tipo_pago_fkey" FOREIGN KEY ("id_tipo_pago") REFERENCES "public"."tipo_pago"("id_tipo_pago") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."venta" ADD CONSTRAINT "venta_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario") ON DELETE NO ACTION ON UPDATE NO ACTION;

