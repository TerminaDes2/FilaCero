ALTER TABLE "usuarios"
ADD COLUMN "numero_cuenta" VARCHAR(30),
ADD COLUMN "edad" SMALLINT;

ALTER TABLE "usuarios"
ADD CONSTRAINT "usuarios_numero_cuenta_key" UNIQUE ("numero_cuenta");
