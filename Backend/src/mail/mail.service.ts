import { Injectable, InternalServerErrorException, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { MailSendCommand, MailSender } from './mail.types';

interface SenderConfig {
  key: MailSender;
  userEnv: string;
  passEnv: string;
  fromEnv: string;
  fallbackFrom: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporters: Partial<Record<MailSender, Transporter>> = {};
  private readonly fromValues: Partial<Record<MailSender, string>> = {};

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporters();
  }

  async send(command: MailSendCommand) {
    const transporter = this.transporters[command.sender];
    if (!transporter) {
      throw new ServiceUnavailableException(`Mail sender ${command.sender} is not configured.`);
    }

  const explicitFrom = command.from;
  const from = explicitFrom ?? this.fromValues[command.sender];
    if (!from) {
      throw new ServiceUnavailableException(`No default "from" value found for sender ${command.sender}.`);
    }

    const { sender, from: _discardedFrom, ...options } = command;

    try {
      return await transporter.sendMail({ ...options, from });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error sending email with sender ${sender}: ${reason}`, stack);
      throw new InternalServerErrorException('Failed to send email.');
    }
  }

  isSenderConfigured(sender: MailSender) {
    return Boolean(this.transporters[sender]);
  }

  private initializeTransporters() {
    const host = this.configService.get<string>('MAIL_HOST');
    if (!host) {
      this.logger.warn('MAIL_HOST is not defined. Email sending disabled.');
      return;
    }

    const port = this.parsePort(this.configService.get<string>('MAIL_PORT'));
    const secure = this.parseBoolean(this.configService.get<string>('MAIL_SECURE'));

    const senderConfigs: SenderConfig[] = [
      {
        key: 'contact',
        userEnv: 'MAIL_CONTACT_USER',
        passEnv: 'MAIL_CONTACT_PASS',
        fromEnv: 'MAIL_CONTACT_FROM',
        fallbackFrom: 'FilaCero Contacto <contacto@filacero.store>',
      },
      {
        key: 'noreply',
        userEnv: 'MAIL_NOREPLY_USER',
        passEnv: 'MAIL_NOREPLY_PASS',
        fromEnv: 'MAIL_NOREPLY_FROM',
        fallbackFrom: 'FilaCero Notificaciones <no-reply@filacero.store>',
      },
      {
        key: 'privacy',
        userEnv: 'MAIL_PRIVACY_USER',
        passEnv: 'MAIL_PRIVACY_PASS',
        fromEnv: 'MAIL_PRIVACY_FROM',
        fallbackFrom: 'FilaCero Privacidad <privacy@filacero.store>',
      },
    ];

    senderConfigs.forEach((senderConfig) => {
      const user = this.getEnv(senderConfig.userEnv);
      const pass = this.getEnv(senderConfig.passEnv);
      const from = this.getEnv(senderConfig.fromEnv) || senderConfig.fallbackFrom;

      if (!user || !pass) {
        this.logger.warn(`Credentials for sender ${senderConfig.key} are incomplete. Skipping.`);
        return;
      }

      const options: SMTPTransport.Options = {
        host,
        port,
        secure,
        auth: { user, pass },
      };

      this.transporters[senderConfig.key] = createTransport(options);
      this.fromValues[senderConfig.key] = from;
    });
  }

  private getEnv(key: string) {
    const value = this.configService.get<string>(key);
    return typeof value === 'string' ? value.trim() : undefined;
  }

  private parseBoolean(value?: string | boolean | null) {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return normalized === 'true' || normalized === '1';
    }

    return false;
  }

  private parsePort(value?: string | number | null) {
    if (typeof value === 'number') {
      return value;
    }

    const parsed = Number(value);

    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }

    return 587;
  }
}
