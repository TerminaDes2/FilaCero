-- Ensure stripe_customer_id column and unique constraint exist on usuarios
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'usuarios'
          AND column_name = 'stripe_customer_id'
    ) THEN
        ALTER TABLE "public"."usuarios"
        ADD COLUMN "stripe_customer_id" VARCHAR(255);
    END IF;
END$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'usuarios_stripe_customer_id_key'
    ) THEN
        ALTER TABLE "public"."usuarios"
        ADD CONSTRAINT "usuarios_stripe_customer_id_key" UNIQUE ("stripe_customer_id");
    END IF;
END$$;
