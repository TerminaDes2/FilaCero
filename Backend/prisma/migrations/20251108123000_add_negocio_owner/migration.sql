-- Add owner_id column to negocio and foreign key to usuarios
ALTER TABLE "public"."negocio"
ADD COLUMN "owner_id" BIGINT;

ALTER TABLE "public"."negocio"
ADD CONSTRAINT "fk_negocio_owner" FOREIGN KEY ("owner_id") REFERENCES "public"."usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE NO ACTION;
