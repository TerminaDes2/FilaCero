/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

type TwilioConstructor = (...args: [string, string]) => {
  verify?: {
    v2?: {
      services: (
        sid: string,
      ) => {
        verifications: { create: (args: { to: string; channel: 'sms' | 'call' }) => Promise<unknown> };
        verificationChecks: { create: (args: { to: string; code: string }) => Promise<unknown> };
      };
    };
  };
};

function loadTwilio(): TwilioConstructor | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('twilio') as TwilioConstructor;
    return mod;
  } catch (error) {
    return null;
  }
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private client: ReturnType<TwilioConstructor> | null = null;
  private verifyServiceSid: string | null = null;
  private readonly enabled: boolean;
  // Minimal, typed surface of Twilio Verify we actually use (para evitar any/unsafe)
  private get verifyApi() {
    if (!this.client || !this.verifyServiceSid) {
      throw new BadRequestException('Servicio de SMS no disponible en este entorno');
    }
    const verify = this.client.verify?.v2;
    if (!verify) {
      throw new BadRequestException('Cliente de SMS mal inicializado');
    }
    return verify;
  }

  constructor(private readonly config: ConfigService, private readonly prisma: PrismaService) {
    const accountSid = this.normalizeEnv(this.config.get<string>('TWILIO_ACCOUNT_SID'));
    const authToken = this.normalizeEnv(this.config.get<string>('TWILIO_AUTH_TOKEN'));
    const serviceSid = this.normalizeEnv(this.config.get<string>('TWILIO_VERIFY_SERVICE_SID'));

    const twilioFactory = loadTwilio();

    if (!accountSid || !authToken || !serviceSid || !twilioFactory) {
      const missingVars = [] as string[];
      if (!accountSid) missingVars.push('TWILIO_ACCOUNT_SID');
      if (!authToken) missingVars.push('TWILIO_AUTH_TOKEN');
      if (!serviceSid) missingVars.push('TWILIO_VERIFY_SERVICE_SID');
      if (!twilioFactory) missingVars.push('twilio SDK');
      if (missingVars.length) {
        this.logger.warn(`Servicio de SMS deshabilitado. Faltan dependencias/configuración: ${missingVars.join(', ')}`);
      }
      this.enabled = false;
      return;
    }

    // Twilio valida que el SID empiece con AC y el Service SID con VA; normalizamos para evitar comillas/; en .env
    this.client = twilioFactory(accountSid, authToken);
    this.verifyServiceSid = serviceSid;
    this.enabled = true;
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

  async startVerification(to: string, channel: 'sms' | 'call' = 'sms', _userId?: bigint) {
    if (!this.enabled) {
      throw new BadRequestException('Verificación SMS no disponible en el entorno actual');
    }
    // keep signature for future auditing needs
    void _userId;
    try {
      const serviceSid = this.verifyServiceSid!;
      await this.verifyApi.services(serviceSid).verifications.create({ to, channel });

      return { to, channel };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'No se pudo iniciar la verificación';
      this.logger.error(`Error iniciando verificación para ${to}: ${message}`);
      throw new BadRequestException(message);
    }
  }

  async checkVerification(to: string, code: string, userId?: bigint) {
    if (!this.enabled) {
      throw new BadRequestException('Verificación SMS no disponible en el entorno actual');
    }
    try {
      const serviceSid = this.verifyServiceSid!;
      const res: unknown = await this.verifyApi.services(serviceSid).verificationChecks.create({ to, code });

      const hasStatus = (o: unknown): o is { status?: string } => typeof o === 'object' && o !== null && 'status' in o;

      // Si aprobado, actualizar usuario si coincide su numero_telefono
      if (hasStatus(res) && res.status === 'approved') {
        try {
          if (userId != null) {
            await this.prisma.usuarios.update({
              where: { id_usuario: userId },
              data: { numero_telefono: to, sms_verificado: true, sms_verificado_en: new Date() },
            });
          } else {
            await this.prisma.usuarios.updateMany({
              where: { numero_telefono: to },
              data: { sms_verificado: true, sms_verificado_en: new Date() },
            });
          }
        } catch (e) {
          this.logger.warn(`Verificación aprobada pero no se pudo actualizar usuario (${to}): ${(e as Error).message}`);
        }
        return { to, verified: true };
      }
      throw new BadRequestException('Código inválido o expirado');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Código inválido o expirado';
      this.logger.warn(`Código inválido para ${to}: ${message}`);
      throw new BadRequestException('Código inválido o expirado');
    }
  }
}
