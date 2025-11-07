-- Split single verification flag into email, sms, and credential states
ALTER TABLE "public"."usuarios"
  ADD COLUMN "correo_verificado" boolean NOT NULL DEFAULT false,
  ADD COLUMN "correo_verificado_en" timestamptz(6),
  ADD COLUMN "sms_verificado" boolean NOT NULL DEFAULT false,
  ADD COLUMN "sms_verificado_en" timestamptz(6),
  ADD COLUMN "credencial_verificada" boolean NOT NULL DEFAULT false,
  ADD COLUMN "credencial_verificada_en" timestamptz(6);

-- Preserve legacy verification data in the new email columns
UPDATE "public"."usuarios"
SET
  "correo_verificado" = COALESCE("verificado", false),
  "correo_verificado_en" = "fecha_verificacion"
WHERE "verificado" IS NOT NULL OR "fecha_verificacion" IS NOT NULL;

ALTER TABLE "public"."usuarios"
  DROP COLUMN "verificado",
  DROP COLUMN "fecha_verificacion";
