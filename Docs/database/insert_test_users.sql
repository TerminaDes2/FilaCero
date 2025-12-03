-- Insert two test users (admin and regular) with password "12345678"
-- Idempotent and safe to run multiple times
-- Uses pgcrypto to compute bcrypt hashes inside PostgreSQL

BEGIN;

-- Ensure pgcrypto is available for crypt()/gen_salt()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure baseline roles exist (matches Docker/db/db_filacero.sql)
INSERT INTO roles (nombre_rol) VALUES ('superadmin'),('admin'),('empleado'),('usuario')
ON CONFLICT (nombre_rol) DO NOTHING;

DO $$
DECLARE
  v_admin_role_id   bigint;
  v_user_role_id    bigint;
  v_pwd_hash        text;
BEGIN
  SELECT id_rol INTO v_admin_role_id FROM roles WHERE nombre_rol = 'admin';
  SELECT id_rol INTO v_user_role_id  FROM roles WHERE nombre_rol = 'usuario';

  IF v_admin_role_id IS NULL OR v_user_role_id IS NULL THEN
    RAISE EXCEPTION 'Required roles not found (admin/usuario).';
  END IF;

  -- Bcrypt hash with cost 10 for password "12345678"
  v_pwd_hash := crypt('12345678', gen_salt('bf', 10));

  -- Admin user (verified)
  INSERT INTO usuarios (
    nombre,
    correo_electronico,
    password_hash,
    correo_verificado,
    correo_verificado_en,
    fecha_registro,
    id_rol
  ) VALUES (
    'Admin Demo',
    'admin.demo@filacero.store',
    v_pwd_hash,
    TRUE,
    NOW(),
    NOW(),
    v_admin_role_id
  )
  ON CONFLICT (correo_electronico) DO UPDATE
  SET password_hash = EXCLUDED.password_hash,
      id_rol = EXCLUDED.id_rol,
      correo_verificado = TRUE,
      correo_verificado_en = NOW();

  -- Regular user (verified)
  INSERT INTO usuarios (
    nombre,
    correo_electronico,
    password_hash,
    correo_verificado,
    correo_verificado_en,
    fecha_registro,
    id_rol
  ) VALUES (
    'Usuario Demo',
    'usuario.demo@filacero.store',
    v_pwd_hash,
    TRUE,
    NOW(),
    NOW(),
    v_user_role_id
  )
  ON CONFLICT (correo_electronico) DO UPDATE
  SET password_hash = EXCLUDED.password_hash,
      id_rol = EXCLUDED.id_rol,
      correo_verificado = TRUE,
      correo_verificado_en = NOW();
END
$$;

COMMIT;
