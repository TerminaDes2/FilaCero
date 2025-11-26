import { Controller, Post, Body, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailVerificationService } from '../users/email-verification/email-verification.service';
import { SmsService } from '../sms/sms.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RecoverRequestDto } from './dto/recover-request.dto';
import { RecoverVerifyDto } from './dto/recover-verify.dto';
import { RecoverResetDto } from './dto/recover-reset.dto';

const RECOVER_TTL_MINUTES = 15;
const TOKEN_LENGTH = 6;

@Controller('api/auth')
export class RecoverController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly smsService: SmsService,
    private readonly jwtService: JwtService,
  ) {}

  private generateNumericToken(): string {
    const random = Math.floor(Math.random() * Math.pow(10, TOKEN_LENGTH));
    return random.toString().padStart(TOKEN_LENGTH, '0');
  }

  // POST /api/auth/recover
  // body: { identifier }
  @Post('recover')
  async recoverRequest(@Body() dto: RecoverRequestDto) {
    const id = dto.identifier?.trim();
    if (!id) throw new BadRequestException('Identificador inválido');

    // Determinar si es correo o teléfono simple: contiene @ => email
    const isEmail = id.includes('@');

    let user;
    if (isEmail) {
      const email = id.toLowerCase();
      user = await this.prisma.usuarios.findUnique({ where: { correo_electronico: email } });
      if (!user) throw new NotFoundException('No se encontró usuario con ese correo.');

      const code = this.generateNumericToken();
      const expiresAt = new Date(Date.now() + RECOVER_TTL_MINUTES * 60 * 1000);

      // Usar servicio de email para enviar código (sin persistir en DB)
      await this.emailVerificationService.sendVerificationCodeEmail({
        to: email,
        name: user.nombre,
        code,
        expiresAt,
      });

      // Crear sesión JWT que contendrá el código (pre-reset)
      const payload = {
        kind: 'pwdRecover',
        userId: user.id_usuario.toString(),
        via: 'email',
        to: email,
        code,
        expAt: expiresAt.getTime(),
      } as const;

      const session = this.jwtService.sign(payload, { expiresIn: `${RECOVER_TTL_MINUTES}m` });

      return { delivery: 'email', expiresAt: expiresAt.toISOString(), session };
    } else {
      // teléfono — esperar formato E.164 (o similar)
      const phone = id;
      user = await this.prisma.usuarios.findFirst({ where: { numero_telefono: phone } });
      if (!user) throw new NotFoundException('No se encontró usuario con ese número de teléfono.');

      // Iniciar verificación Twilio Verify
      await this.smsService.startVerification(phone, 'sms', user.id_usuario);

      const expiresAt = new Date(Date.now() + RECOVER_TTL_MINUTES * 60 * 1000);
      const payload = {
        kind: 'pwdRecover',
        userId: user.id_usuario.toString(),
        via: 'sms',
        to: phone,
        expAt: expiresAt.getTime(),
      } as const;
      const session = this.jwtService.sign(payload, { expiresIn: `${RECOVER_TTL_MINUTES}m` });
      return { delivery: 'sms', expiresAt: expiresAt.toISOString(), session };
    }
  }

  // POST /api/auth/recover/verify
  // body: { session, code }
  @Post('recover/verify')
  async recoverVerify(@Body() dto: RecoverVerifyDto) {
    const session = dto.session?.trim();
    const code = dto.code?.trim();
    if (!session || !code) throw new BadRequestException('Parámetros inválidos');

    let payload: any;
    try {
      payload = this.jwtService.verify(session);
    } catch (e) {
      throw new BadRequestException('Sesión inválida o expiró');
    }

    if (payload?.kind !== 'pwdRecover') throw new BadRequestException('Sesión no válida para recuperación de contraseña');
    if (typeof payload.expAt === 'number' && Date.now() > payload.expAt) throw new BadRequestException('La sesión expiró');

    if (payload.via === 'email') {
      if (!payload.code) throw new BadRequestException('Código no presente en la sesión');
      if (payload.code !== code) throw new BadRequestException('Código incorrecto');
      // Generar sesión de reset
      const resetPayload = { kind: 'pwdReset', userId: payload.userId, expAt: Date.now() + 15 * 60 * 1000 } as const;
      const resetSession = this.jwtService.sign(resetPayload, { expiresIn: '15m' });
      return { verified: true, resetSession };
    }

    if (payload.via === 'sms') {
      // Verificar con Twilio
      try {
        await this.smsService.checkVerification(payload.to, code, BigInt(payload.userId));
      } catch (e) {
        throw new BadRequestException('Código SMS inválido o expirado');
      }
      const resetPayload = { kind: 'pwdReset', userId: payload.userId, expAt: Date.now() + 15 * 60 * 1000 } as const;
      const resetSession = this.jwtService.sign(resetPayload, { expiresIn: '15m' });
      return { verified: true, resetSession };
    }

    throw new BadRequestException('Método de entrega desconocido');
  }

  // POST /api/auth/recover/reset
  // body: { session, password, passwordConfirm }
  @Post('recover/reset')
  async recoverReset(@Body() dto: RecoverResetDto) {
    const session = dto.session?.trim();
    const password = dto.password;
    const passwordConfirm = dto.passwordConfirm;
    if (!session || !password || !passwordConfirm) throw new BadRequestException('Parámetros inválidos');
    if (password !== passwordConfirm) throw new BadRequestException('Las contraseñas no coinciden');
    if (password.length < 8) throw new BadRequestException('La contraseña debe tener al menos 8 caracteres');

    let payload: any;
    try {
      payload = this.jwtService.verify(session);
    } catch (e) {
      throw new BadRequestException('Sesión inválida o expiró');
    }

    if (payload?.kind !== 'pwdReset') throw new BadRequestException('Sesión no válida para reset de contraseña');
    if (typeof payload.expAt === 'number' && Date.now() > payload.expAt) throw new BadRequestException('La sesión de reset expiró');

    const userId = BigInt(payload.userId);
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    await this.prisma.usuarios.update({ where: { id_usuario: userId }, data: { password_hash: hashed } });

    return { message: 'Contraseña actualizada correctamente' };
  }
}
