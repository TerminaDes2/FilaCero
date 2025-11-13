-- Idempotent addition of owner_id and foreign key. Prevents P3006 duplicate-column error if prior migration already applied.
DO $$
BEGIN
	-- Add column only if it does not already exist
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns
		WHERE table_schema = 'public'
		  AND table_name = 'negocio'
		  AND column_name = 'owner_id'
	) THEN
		ALTER TABLE "public"."negocio" ADD COLUMN "owner_id" BIGINT;
	END IF;

	-- Add constraint if missing (name must match expected Prisma naming for future diffs)
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint
		WHERE conname = 'fk_negocio_owner'
	) THEN
		ALTER TABLE "public"."negocio"
		ADD CONSTRAINT "fk_negocio_owner" FOREIGN KEY ("owner_id") REFERENCES "public"."usuarios"("id_usuario") ON DELETE RESTRICT ON UPDATE NO ACTION;
	END IF;
END$$;
