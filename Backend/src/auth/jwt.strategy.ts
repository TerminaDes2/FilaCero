import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

interface JwtPayload {
  id: bigint; 
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
      where: { id_usuario: payload.id },
      select: { id_usuario: true, nombre: true, correo_electronico: true, id_rol: true }, 
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    // 2. Si es válido, 'user' se adjunta a req.user
    return user; 
  }
}