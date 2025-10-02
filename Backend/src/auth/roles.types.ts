export type RoleName = 'superadmin' | 'admin' | 'empleado' | 'usuario';

export const ROLE = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  EMPLEADO: 'empleado',
  USUARIO: 'usuario',
} as const;
