-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "public"."roles" (
    "id_rol" BIGSERIAL NOT NULL,
    "nombre_rol" TEXT NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id_rol")
);

-- CreateTable
CREATE TABLE "public"."usuarios" (
    "id_usuario" BIGSERIAL NOT NULL,
    "id_rol" BIGINT,
    "nombre" TEXT NOT NULL,
    "correo_electronico" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "numero_telefono" TEXT,
    "fecha_nacimiento" TIMESTAMP(3),
    "fecha_registro" TIMESTAMP(3),
    "estado" TEXT,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "public"."product" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "stock" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PK_bebc9158e480b949565b4dc7a82" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_rol_key" ON "public"."roles"("nombre_rol");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_electronico_key" ON "public"."usuarios"("correo_electronico");

-- AddForeignKey
ALTER TABLE "public"."usuarios" ADD CONSTRAINT "usuarios_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "public"."roles"("id_rol") ON DELETE SET NULL ON UPDATE CASCADE;

