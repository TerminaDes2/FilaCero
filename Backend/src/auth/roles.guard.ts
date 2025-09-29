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
    const user = req.user as { id_usuario: bigint; id_rol: bigint | null } | undefined;
    if (!user) return false;

    // Obtener el nombre del rol del usuario (una consulta ligera)
    const role = user.id_rol
      ? await this.prisma.roles.findUnique({ where: { id_rol: user.id_rol }, select: { nombre_rol: true } })
      : null;
    const name = (role?.nombre_rol || 'usuario') as RoleName;
    return required.includes(name);
  }
}
