import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { ROLES_KEY } from './roles.decorator';
import { RoleName } from './roles.types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector, private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<RoleName[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true; // no roles required

    const req = context.switchToHttp().getRequest();
    const user = req.user as { id_usuario: bigint; id_rol: bigint | null; role_name?: string } | undefined;
    if (!user) return false;

    // Reusar role_name si viene del JwtStrategy; si no, consulta ligera
    const rawName =
      user.role_name
        ? user.role_name
        : (
            user.id_rol
              ? (await this.prisma.roles.findUnique({ where: { id_rol: user.id_rol }, select: { nombre_rol: true } }))?.nombre_rol
              : 'usuario'
          ) || 'usuario';

    const normalized = rawName.toString().toLowerCase();
    // Normaliza roles provenientes de la DB y considera aliases usados por el frontend
    const resolved =
      normalized === 'owner' || normalized === 'negocio'
        ? 'admin'
        : (normalized as RoleName);

    return required.includes(resolved);
  }
}
