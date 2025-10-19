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
  "numero_cuenta" varchar(30) UNIQUE,
  "fecha_nacimiento" date,
  "avatar_url" varchar(512),
  "credential_url" varchar(512),
  "edad" smallint,
  "fecha_registro" timestamptz,
  "fecha_verificacion" timestamptz,
  "verificado" boolean NOT NULL DEFAULT false,
  "verification_token" varchar(128),
  "verification_token_expires" timestamptz,
  "estado" varchar(20)
);

CREATE TABLE "negocio" (
  "id_negocio" bigserial PRIMARY KEY,
  "nombre" varchar(200) NOT NULL,
  "direccion" text,
  "telefono" varchar(30),
  "correo" varchar(254),
  "logo_url" text,
  "hero_image_url" text,
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
  "descripcion_larga" text,
  "codigo_barras" varchar(100) UNIQUE,
  "precio" numeric(12,2) NOT NULL,
  "imagen_url" text,
  "estado" varchar(30)
);

CREATE TABLE "negocio_rating" (
  "id_rating" bigserial PRIMARY KEY,
  "id_negocio" bigint NOT NULL,
  "id_usuario" bigint NOT NULL,
  "estrellas" smallint NOT NULL,
  "comentario" text,
  "creado_en" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "producto_media" (
  "id_media" bigserial PRIMARY KEY,
  "id_producto" bigint NOT NULL,
  "url" varchar(2048) NOT NULL,
  "principal" boolean NOT NULL DEFAULT false,
  "tipo" varchar(30),
  "creado_en" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "producto_metricas_semanales" (
  "id_metricas" bigserial PRIMARY KEY,
  "id_producto" bigint NOT NULL,
  "id_negocio" bigint,
  "anio" int NOT NULL,
  "semana" int NOT NULL,
  "cantidad" int NOT NULL,
  "calculado_en" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
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

CREATE UNIQUE INDEX "categoria_nombre_key" ON "public"."categoria"("nombre" ASC);
CREATE UNIQUE INDEX "producto_codigo_barras_key" ON "public"."producto"("codigo_barras" ASC);
CREATE UNIQUE INDEX "roles_nombre_rol_key" ON "public"."roles"("nombre_rol" ASC);
CREATE UNIQUE INDEX "tipo_pago_tipo_key" ON "public"."tipo_pago"("tipo" ASC);
CREATE UNIQUE INDEX "usuarios_correo_electronico_key" ON "public"."usuarios"("correo_electronico" ASC);
CREATE UNIQUE INDEX IF NOT EXISTS "usuarios_verification_token_key" ON "public"."usuarios"("verification_token" ASC);
CREATE UNIQUE INDEX IF NOT EXISTS "negocio_rating_id_negocio_id_usuario_key" ON "public"."negocio_rating"("id_negocio", "id_usuario");
CREATE UNIQUE INDEX IF NOT EXISTS "producto_metricas_semanales_id_producto_id_negocio_anio_sem_key" ON "public"."producto_metricas_semanales"("id_producto", "id_negocio", "anio", "semana");

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

ALTER TABLE "negocio_rating" ADD FOREIGN KEY ("id_negocio") REFERENCES "negocio" ("id_negocio") ON DELETE CASCADE;

ALTER TABLE "negocio_rating" ADD FOREIGN KEY ("id_usuario") REFERENCES "usuarios" ("id_usuario") ON DELETE CASCADE;

ALTER TABLE "producto_media" ADD FOREIGN KEY ("id_producto") REFERENCES "producto" ("id_producto") ON DELETE CASCADE;

ALTER TABLE "producto_metricas_semanales" ADD FOREIGN KEY ("id_producto") REFERENCES "producto" ("id_producto") ON DELETE CASCADE;

ALTER TABLE "producto_metricas_semanales" ADD FOREIGN KEY ("id_negocio") REFERENCES "negocio" ("id_negocio") ON DELETE CASCADE;

ALTER TABLE "corte_caja" ADD FOREIGN KEY ("id_negocio") REFERENCES "negocio" ("id_negocio");

ALTER TABLE "corte_caja" ADD FOREIGN KEY ("id_usuario") REFERENCES "usuarios" ("id_usuario");

ALTER TABLE "reporte_ventas" ADD FOREIGN KEY ("id_negocio") REFERENCES "negocio" ("id_negocio");

ALTER TABLE "comentario" ADD FOREIGN KEY ("id_usuario") REFERENCES "usuarios" ("id_usuario");

ALTER TABLE "feedback" ADD FOREIGN KEY ("id_usuario") REFERENCES "usuarios" ("id_usuario");

ALTER TABLE "feedback" ADD FOREIGN KEY ("id_comentario") REFERENCES "comentario" ("id_comentario");

-- =============================================================
-- FilaCero DB hardening and business rules (idempotent changes)
-- =============================================================

-- 1) Seed fixed roles (RBAC baseline)
INSERT INTO roles (nombre_rol) VALUES ('superadmin'),('admin'),('empleado'),('usuario')
ON CONFLICT (nombre_rol) DO NOTHING;

-- 2) negocio.owner_id (dueño de tienda)
ALTER TABLE negocio ADD COLUMN IF NOT EXISTS owner_id bigint;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints c
    WHERE c.table_name = 'negocio' AND c.constraint_name = 'fk_negocio_owner'
  ) THEN
    ALTER TABLE negocio ADD CONSTRAINT fk_negocio_owner
      FOREIGN KEY (owner_id) REFERENCES usuarios(id_usuario)
      ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
END $$;

-- 3) Tabla empleados (relación empleado <-> negocio)
CREATE TABLE IF NOT EXISTS empleados (
  id_empleado bigserial PRIMARY KEY,
  negocio_id bigint NOT NULL REFERENCES negocio(id_negocio) ON UPDATE CASCADE ON DELETE RESTRICT,
  usuario_id bigint NOT NULL REFERENCES usuarios(id_usuario) ON UPDATE CASCADE ON DELETE RESTRICT,
  estado varchar(20) NOT NULL DEFAULT 'activo',
  fecha_alta timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Unicidad por negocio y usuario
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'empleados' AND constraint_name = 'uq_empleados_negocio_usuario'
  ) THEN
    ALTER TABLE empleados ADD CONSTRAINT uq_empleados_negocio_usuario UNIQUE (negocio_id, usuario_id);
  END IF;
END $$;
-- Estado permitido
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'empleados' AND constraint_name = 'ck_empleados_estado'
  ) THEN
    ALTER TABLE empleados ADD CONSTRAINT ck_empleados_estado CHECK (estado IN ('activo','inactivo'));
  END IF;
END $$;

-- 4) Refuerzos en inventario
-- Un inventario por (negocio, producto)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'inventario' AND constraint_name = 'uq_inventario_negocio_producto'
  ) THEN
    ALTER TABLE inventario ADD CONSTRAINT uq_inventario_negocio_producto UNIQUE (id_negocio, id_producto);
  END IF;
END $$;
-- No negativos y defaults
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'inventario' AND constraint_name = 'ck_inventario_no_negativo'
  ) THEN
    ALTER TABLE inventario ADD CONSTRAINT ck_inventario_no_negativo CHECK (coalesce(cantidad_actual,0) >= 0 AND coalesce(stock_minimo,0) >= 0);
  END IF;
END $$;
ALTER TABLE inventario ALTER COLUMN stock_minimo SET DEFAULT 0;
ALTER TABLE inventario ALTER COLUMN cantidad_actual SET DEFAULT 0;

-- Auto-timestamp en inventario.fecha_actualizacion
CREATE OR REPLACE FUNCTION fn_touch_inventario_fecha()
RETURNS trigger AS $$
BEGIN
  NEW.fecha_actualizacion := CURRENT_TIMESTAMP;
  RETURN NEW;
END$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_touch_inventario_fecha ON inventario;
CREATE TRIGGER trg_touch_inventario_fecha
  BEFORE INSERT OR UPDATE ON inventario
  FOR EACH ROW EXECUTE FUNCTION fn_touch_inventario_fecha();

-- 5) Estados y validaciones de catálogo
-- producto.estado: activo/inactivo; codigo_barras no vacío si se provee
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'producto' AND constraint_name = 'ck_producto_estado'
  ) THEN
    ALTER TABLE producto ADD CONSTRAINT ck_producto_estado CHECK (estado IS NULL OR estado IN ('activo','inactivo'));
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'producto' AND constraint_name = 'ck_producto_codigobarras_nonempty'
  ) THEN
    ALTER TABLE producto ADD CONSTRAINT ck_producto_codigobarras_nonempty CHECK (codigo_barras IS NULL OR length(trim(codigo_barras)) > 0);
  END IF;
END $$;

-- venta.estado: flujo típico POS
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'venta' AND constraint_name = 'ck_venta_estado'
  ) THEN
    ALTER TABLE venta ADD CONSTRAINT ck_venta_estado CHECK (estado IS NULL OR estado IN ('abierta','pagada','cancelada','devuelta'));
  END IF;
END $$;

-- Defaults de timestamps de registro
ALTER TABLE usuarios ALTER COLUMN fecha_registro SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE negocio ALTER COLUMN fecha_registro SET DEFAULT CURRENT_TIMESTAMP;

-- 6) Índices para rendimiento
CREATE INDEX IF NOT EXISTS idx_inventario_negocio ON inventario(id_negocio);
CREATE INDEX IF NOT EXISTS idx_inventario_producto ON inventario(id_producto);
CREATE INDEX IF NOT EXISTS idx_inventario_negocio_producto ON inventario(id_negocio, id_producto);
CREATE INDEX IF NOT EXISTS idx_venta_fecha ON venta(fecha_venta);
CREATE INDEX IF NOT EXISTS idx_detalle_venta_producto ON detalle_venta(id_producto);
-- Búsqueda por nombre de producto (texto completo simple)
CREATE INDEX IF NOT EXISTS idx_producto_nombre_tsv ON producto USING gin (to_tsvector('spanish', coalesce(nombre,'')));

-- 7) Movimientos de inventario (auditoría)
CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id_movimiento bigserial PRIMARY KEY,
  id_negocio bigint NOT NULL REFERENCES negocio(id_negocio) ON UPDATE CASCADE ON DELETE RESTRICT,
  id_producto bigint NOT NULL REFERENCES producto(id_producto) ON UPDATE CASCADE ON DELETE RESTRICT,
  delta int NOT NULL,
  motivo varchar(50) NOT NULL, -- 'venta','ajuste','devolucion', etc.
  id_venta bigint NULL REFERENCES venta(id_venta) ON UPDATE CASCADE ON DELETE SET NULL,
  id_detalle bigint NULL REFERENCES detalle_venta(id_detalle) ON UPDATE CASCADE ON DELETE SET NULL,
  id_usuario bigint NULL REFERENCES usuarios(id_usuario) ON UPDATE CASCADE ON DELETE SET NULL,
  fecha timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_mov_inv_neg_prod_fecha ON movimientos_inventario(id_negocio, id_producto, fecha DESC);

-- 8) Ajuste de inventario por ventas y recálculo de total
-- Función: aplicar delta de inventario según detalle de venta, y registrar movimiento
CREATE OR REPLACE FUNCTION fn_inventario_aplicar_delta(p_id_venta bigint, p_id_detalle bigint, p_id_producto bigint, p_delta int)
RETURNS void AS $$
DECLARE v_id_negocio bigint; v_new_qty int;
BEGIN
  SELECT id_negocio INTO v_id_negocio FROM venta WHERE id_venta = p_id_venta;
  IF v_id_negocio IS NULL THEN
    RAISE EXCEPTION 'Venta % sin negocio asociado', p_id_venta;
  END IF;

  -- Asegurar existencia de inventario (bloqueo fila)
  PERFORM 1 FROM inventario WHERE id_negocio = v_id_negocio AND id_producto = p_id_producto FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No existe inventario para negocio % y producto %', v_id_negocio, p_id_producto;
  END IF;

  -- Aplicar delta: ventas consumen stock (delta positivo reduce stock)
  UPDATE inventario
     SET cantidad_actual = cantidad_actual - p_delta
   WHERE id_negocio = v_id_negocio AND id_producto = p_id_producto
   RETURNING cantidad_actual INTO v_new_qty;

  IF v_new_qty < 0 THEN
    RAISE EXCEPTION 'Stock insuficiente (negocio %, producto %)', v_id_negocio, p_id_producto;
  END IF;

  -- Registrar movimiento (delta negativo respecto a inventario cuando se vende)
  INSERT INTO movimientos_inventario (id_negocio, id_producto, delta, motivo, id_venta, id_detalle)
  VALUES (v_id_negocio, p_id_producto, -p_delta, 'venta', p_id_venta, p_id_detalle);
END$$ LANGUAGE plpgsql;

-- Función: recalcular total de una venta
CREATE OR REPLACE FUNCTION fn_recalcular_total_venta(p_id_venta bigint)
RETURNS void AS $$
BEGIN
  UPDATE venta v
     SET total = COALESCE((SELECT SUM(d.cantidad * d.precio_unitario) FROM detalle_venta d WHERE d.id_venta = v.id_venta), 0)
   WHERE v.id_venta = p_id_venta;
END$$ LANGUAGE plpgsql;

-- Trigger en detalle_venta: ajustar inventario y total
CREATE OR REPLACE FUNCTION fn_trg_detalle_venta_inventario()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM fn_inventario_aplicar_delta(NEW.id_venta, NEW.id_detalle, NEW.id_producto, NEW.cantidad);
  ELSIF TG_OP = 'UPDATE' THEN
    -- Aplicar diferencia de cantidades (puede ser positiva o negativa)
    PERFORM fn_inventario_aplicar_delta(NEW.id_venta, NEW.id_detalle, NEW.id_producto, NEW.cantidad - COALESCE(OLD.cantidad,0));
  ELSIF TG_OP = 'DELETE' THEN
    -- Devolver stock eliminado
    PERFORM fn_inventario_aplicar_delta(OLD.id_venta, OLD.id_detalle, OLD.id_producto, -OLD.cantidad);
  END IF;
  RETURN NEW;
END$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_detalle_venta_inventario ON detalle_venta;
CREATE TRIGGER trg_detalle_venta_inventario
  AFTER INSERT OR UPDATE OF cantidad, id_producto ON detalle_venta
  FOR EACH ROW EXECUTE FUNCTION fn_trg_detalle_venta_inventario();

CREATE OR REPLACE FUNCTION fn_trg_detalle_venta_total()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM fn_recalcular_total_venta(NEW.id_venta);
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM fn_recalcular_total_venta(NEW.id_venta);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM fn_recalcular_total_venta(OLD.id_venta);
  END IF;
  RETURN NEW;
END$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_detalle_venta_total ON detalle_venta;
CREATE TRIGGER trg_detalle_venta_total
  AFTER INSERT OR UPDATE OF cantidad, precio_unitario ON detalle_venta
  FOR EACH ROW EXECUTE FUNCTION fn_trg_detalle_venta_total();

DROP TRIGGER IF EXISTS trg_detalle_venta_total_del ON detalle_venta;
CREATE TRIGGER trg_detalle_venta_total_del
  AFTER DELETE ON detalle_venta
  FOR EACH ROW EXECUTE FUNCTION fn_trg_detalle_venta_total();

-- 9) Políticas de borrado prudentes (refuerzo)
-- Evitar borrar productos referenciados por ventas o inventario
-- (ya restringido por FKs sin CASCADE)

-- 10) Tipo de pago: semilla opcional
INSERT INTO tipo_pago (tipo, descripcion) VALUES
 ('efectivo','Pago en efectivo'),
 ('tarjeta','Pago con tarjeta'),
 ('transferencia','Pago por transferencia')
ON CONFLICT (tipo) DO NOTHING;

-- Fin de bloque de hardening

-- =============================================================
-- Semillas iniciales de catálogo (categorías)
-- =============================================================
INSERT INTO categoria (nombre) VALUES
  ('Bebidas'),
  ('Alimentos'),
  ('Postres'),
  ('Snacks'),
  ('Otros')
ON CONFLICT (nombre) DO NOTHING;

-- Índice simple por nombre (búsqueda)
CREATE INDEX IF NOT EXISTS idx_categoria_nombre ON categoria (nombre);

