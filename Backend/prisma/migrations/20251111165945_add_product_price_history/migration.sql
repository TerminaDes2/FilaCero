/*
  Consolidated migration to ensure price history support is present.
  Existing structures (comentario, empleados, pedido, etc.) were introduced
  in prior migrations, so this script focuses on the precio histórico table.
*/

-- Create product price history table if it does not exist yet
CREATE TABLE IF NOT EXISTS "public"."producto_historial_precio" (
    "id_historial" BIGSERIAL PRIMARY KEY,
    "id_producto" BIGINT NOT NULL,
    "precio" DECIMAL(12,2) NOT NULL,
    "fecha_inicio" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_fin" TIMESTAMPTZ(6),
    "vigente" BOOLEAN NOT NULL DEFAULT TRUE,
    "motivo" VARCHAR(200),
    "id_usuario" BIGINT,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS "producto_historial_precio_id_producto_vigente_idx"
    ON "public"."producto_historial_precio"("id_producto", "vigente");

CREATE INDEX IF NOT EXISTS "producto_historial_precio_id_producto_fecha_inicio_idx"
    ON "public"."producto_historial_precio"("id_producto", "fecha_inicio");

-- Foreign keys added only if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'producto_historial_precio_id_producto_fkey'
    ) THEN
        ALTER TABLE "public"."producto_historial_precio"
        ADD CONSTRAINT "producto_historial_precio_id_producto_fkey"
        FOREIGN KEY ("id_producto") REFERENCES "public"."producto"("id_producto")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'producto_historial_precio_id_usuario_fkey'
    ) THEN
        ALTER TABLE "public"."producto_historial_precio"
        ADD CONSTRAINT "producto_historial_precio_id_usuario_fkey"
        FOREIGN KEY ("id_usuario") REFERENCES "public"."usuarios"("id_usuario")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END$$;
