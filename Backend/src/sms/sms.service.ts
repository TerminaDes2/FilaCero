import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import twilio, { Twilio } from 'twilio';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private client: Twilio;
  private verifyServiceSid: string;

  constructor(private readonly config: ConfigService, private readonly prisma: PrismaService) {
    const accountSid = this.normalizeEnv(this.config.get<string>('TWILIO_ACCOUNT_SID'));
    const authToken = this.normalizeEnv(this.config.get<string>('TWILIO_AUTH_TOKEN'));
    const serviceSid = this.normalizeEnv(this.config.get<string>('TWILIO_VERIFY_SERVICE_SID'));

    if (!accountSid || !authToken || !serviceSid) {
      this.logger.error('Faltan variables de entorno de Twilio (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID)');
      throw new Error('Configuración Twilio incompleta');
    }

    // Twilio valida que el SID empiece con AC y el Service SID con VA; normalizamos para evitar comillas/; en .env
    this.client = twilio(accountSid, authToken);
    this.verifyServiceSid = serviceSid;
  }

  private normalizeEnv(value?: string): string {
    // Recorta espacios, quita comillas simples/dobles iniciales/finales y un posible ; final
    if (!value) return '';
    let v = value.trim();
    // Elimina ; final si existe
    if (v.endsWith(';')) v = v.slice(0, -1);
    // Quita comillas envolventes si existen
    if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
      v = v.substring(1, v.length - 1);
    }
    return v.trim();
  }

  async startVerification(to: string, channel: 'sms' | 'call' = 'sms') {
    try {
      const res = await this.client.verify.v2
        .services(this.verifyServiceSid)
        .verifications.create({ to, channel });

      return { sid: res.sid, status: res.status, to: res.to, channel: res.channel };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudo iniciar la verificación';
      this.logger.error(`Error iniciando verificación para ${to}: ${message}`);
      throw new BadRequestException(message);
    }
  }

  async checkVerification(to: string, code: string) {
    try {
      const res = await this.client.verify.v2
        .services(this.verifyServiceSid)
        .verificationChecks.create({ to, code });

      // Si aprobado, actualizar usuario si coincide su numero_telefono
      if (res.status === 'approved') {
        try {
          await this.prisma.usuarios.updateMany({
            where: { numero_telefono: to },
            data: { sms_verificado: true, sms_verificado_en: new Date() },
          });
        } catch (e) {
          this.logger.warn(`Verificación aprobada pero no se pudo actualizar usuario (${to}): ${(e as Error).message}`);
        }
      }
      return { sid: res.sid, status: res.status, to: res.to, verified: res.status === 'approved' };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Código inválido o expirado';
      this.logger.warn(`Código inválido para ${to}: ${message}`);
      throw new BadRequestException('Código inválido o expirado');
    }
  }
}
