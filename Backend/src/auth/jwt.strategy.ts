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
      select: {
        id_usuario: true,
        nombre: true,
        correo_electronico: true,
        id_rol: true,
        avatar_url: true,
        credential_url: true,
        correo_verificado: true,
        correo_verificado_en: true,
        sms_verificado: true,
        sms_verificado_en: true,
        credencial_verificada: true,
        credencial_verificada_en: true,
        numero_cuenta: true,
        edad: true,
        role: { select: { nombre_rol: true } },
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    const emailVerified = user.correo_verificado ?? false;
    const smsVerified = user.sms_verificado ?? false;
    const credentialVerified = user.credencial_verificada ?? false;

    return {
      ...user,
      verificado: emailVerified,
      verified: emailVerified,
      verifications: {
        email: emailVerified,
        sms: smsVerified,
        credential: credentialVerified,
      },
      verificationTimestamps: {
        email: user.correo_verificado_en ? user.correo_verificado_en.toISOString() : null,
        sms: user.sms_verificado_en ? user.sms_verificado_en.toISOString() : null,
        credential: user.credencial_verificada_en ? user.credencial_verificada_en.toISOString() : null,
      },
      role_name: user.role?.nombre_rol ?? 'usuario',
    };
  }
}