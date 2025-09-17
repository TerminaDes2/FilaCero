CREATE TABLE "roles" (
  "id_rol" bigserial PRIMARY KEY,
  "nombre_rol" varchar(50) UNIQUE NOT NULL
);

CREATE TABLE "usuarios" (
  "id_usuario" bigserial PRIMARY KEY,
  "id_rol" bigint,
  "nombre" varchar(150) NOT NULL,
  "correo_electronico" varchar(254) UNIQUE NOT NULL,
  "password_hash" varchar(255) NOT NULL,
  "numero_telefono" varchar(30),
  "fecha_nacimiento" date,
  "fecha_registro" timestamptz,
  "estado" varchar(20)
);

CREATE TABLE "negocio" (
  "id_negocio" bigserial PRIMARY KEY,
  "nombre" varchar(200) NOT NULL,
  "direccion" text,
  "telefono" varchar(30),
  "correo" varchar(254),
  "logo" text,
  "fecha_registro" timestamptz
);

CREATE TABLE "categoria" (
  "id_categoria" bigserial PRIMARY KEY,
  "nombre" varchar(120) UNIQUE NOT NULL
);

CREATE TABLE "producto" (
  "id_producto" bigserial PRIMARY KEY,
  "id_categoria" bigint,
  "nombre" varchar(200) NOT NULL,
  "descripcion" text,
  "codigo_barras" varchar(100) UNIQUE,
  "precio" numeric(12,2) NOT NULL,
  "imagen" text,
  "estado" varchar(30)
);

CREATE TABLE "inventario" (
  "id_inventario" bigserial PRIMARY KEY,
  "id_negocio" bigint,
  "id_producto" bigint,
  "stock_minimo" int,
  "cantidad_actual" int,
  "fecha_actualizacion" timestamptz
);

CREATE TABLE "tipo_pago" (
  "id_tipo_pago" bigserial PRIMARY KEY,
  "tipo" varchar(50) UNIQUE NOT NULL,
  "descripcion" text
);

CREATE TABLE "venta" (
  "id_venta" bigserial PRIMARY KEY,
  "id_negocio" bigint,
  "id_usuario" bigint,
  "fecha_venta" timestamptz,
  "total" numeric(14,2),
  "id_tipo_pago" bigint,
  "estado" varchar(30)
);

CREATE TABLE "detalle_venta" (
  "id_detalle" bigserial PRIMARY KEY,
  "id_venta" bigint,
  "id_producto" bigint,
  "cantidad" int,
  "precio_unitario" numeric(12,2)
);

CREATE TABLE "corte_caja" (
  "id_corte" bigserial PRIMARY KEY,
  "id_negocio" bigint,
  "id_usuario" bigint,
  "fecha_inicio" timestamptz,
  "fecha_fin" timestamptz,
  "monto_inicial" numeric(14,2),
  "monto_final" numeric(14,2),
  "ventas_totales" int
);

CREATE TABLE "reporte_ventas" (
  "id_reporte" bigserial PRIMARY KEY,
  "id_negocio" bigint,
  "fecha" date,
  "total_ventas" numeric(14,2),
  "total_productos" int,
  "total_efectivo" numeric(14,2),
  "total_tarjeta" numeric(14,2),
  "total_transferencia" numeric(14,2)
);

CREATE TABLE "comentario" (
  "id_comentario" bigserial PRIMARY KEY,
  "id_usuario" bigint,
  "comentario" text,
  "fecha" timestamptz
);

CREATE TABLE "feedback" (
  "id_feedback" bigserial PRIMARY KEY,
  "id_usuario" bigint,
  "id_comentario" bigint,
  "calificacion" smallint,
  "fecha" timestamptz
);

ALTER TABLE "usuarios" ADD FOREIGN KEY ("id_rol") REFERENCES "roles" ("id_rol");

ALTER TABLE "producto" ADD FOREIGN KEY ("id_categoria") REFERENCES "categoria" ("id_categoria");

ALTER TABLE "inventario" ADD FOREIGN KEY ("id_negocio") REFERENCES "negocio" ("id_negocio");

ALTER TABLE "inventario" ADD FOREIGN KEY ("id_producto") REFERENCES "producto" ("id_producto");

ALTER TABLE "venta" ADD FOREIGN KEY ("id_negocio") REFERENCES "negocio" ("id_negocio");

ALTER TABLE "venta" ADD FOREIGN KEY ("id_usuario") REFERENCES "usuarios" ("id_usuario");

ALTER TABLE "venta" ADD FOREIGN KEY ("id_tipo_pago") REFERENCES "tipo_pago" ("id_tipo_pago");

ALTER TABLE "detalle_venta" ADD FOREIGN KEY ("id_venta") REFERENCES "venta" ("id_venta");

ALTER TABLE "detalle_venta" ADD FOREIGN KEY ("id_producto") REFERENCES "producto" ("id_producto");

ALTER TABLE "corte_caja" ADD FOREIGN KEY ("id_negocio") REFERENCES "negocio" ("id_negocio");

ALTER TABLE "corte_caja" ADD FOREIGN KEY ("id_usuario") REFERENCES "usuarios" ("id_usuario");

ALTER TABLE "reporte_ventas" ADD FOREIGN KEY ("id_negocio") REFERENCES "negocio" ("id_negocio");

ALTER TABLE "comentario" ADD FOREIGN KEY ("id_usuario") REFERENCES "usuarios" ("id_usuario");

ALTER TABLE "feedback" ADD FOREIGN KEY ("id_usuario") REFERENCES "usuarios" ("id_usuario");

ALTER TABLE "feedback" ADD FOREIGN KEY ("id_comentario") REFERENCES "comentario" ("id_comentario");
