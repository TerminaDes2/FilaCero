import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

interface JwtPayload {
  id: string; 
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), 
      ignoreExpiration: false, 
      secretOrKey: process.env.JWT_SECRET || 'dev-secret-cambiar-en-produccion',
    });
  }

  // Se ejecuta al validar un token en una ruta protegida
  async validate(payload: JwtPayload) {
    // 1. Busca el usuario para confirmar que sigue activo
    const user = await this.prisma.usuarios.findUnique({
      where: { id_usuario: BigInt(payload.id) },
      select: { id_usuario: true, nombre: true, correo_electronico: true, id_rol: true, role: { select: { nombre_rol: true } } },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    // 2. Si es válido, 'user' se adjunta a req.user
    // Adjuntamos también el nombre del rol (si existe) para evitar otra consulta en Guards
    return { ...user, role_name: user.role?.nombre_rol ?? 'usuario' } as any;
  }
}