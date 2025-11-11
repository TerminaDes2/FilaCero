import { SendEmailDto, SmtpConfig, MailOptions } from '../common/dto';

// Evita volcar credenciales y limita tamaños en logs
export function maskSmtpConfig(cfg?: SmtpConfig) {
  if (!cfg) return cfg;
  return {
    ...cfg,
    auth: cfg.auth
      ? {
          ...cfg.auth,
          // No exponer contraseñas en logs
          pass: cfg.auth.pass ? '***' : undefined,
        }
      : undefined,
  } as SmtpConfig;
}

export interface MailOptionsSummary {
  from: string;
  to: string;
  subject: string;
  text?: string;
  htmlPreview?: string;
  htmlLength: number;
}

export function summarizeMailOptions(mail?: MailOptions): MailOptionsSummary | undefined {
  if (!mail) return undefined;
  const html = mail.html ?? '';
  const max = 200; // limitar tamaño para logs
  const summary: MailOptionsSummary = {
    from: mail.from,
    to: mail.to,
    subject: mail.subject,
    text: mail.text ? truncate(mail.text, max) : undefined,
    htmlPreview: html ? truncate(stripNewlines(html), max) : undefined,
    htmlLength: html.length || 0,
  };
  return summary;
}

export interface SendEmailDtoMasked {
  smtpConfig?: SmtpConfig;
  mailOptions?: MailOptionsSummary;
}

export function maskSendEmailDto(dto: SendEmailDto): SendEmailDtoMasked {
  return {
    smtpConfig: maskSmtpConfig(dto?.smtpConfig),
    mailOptions: summarizeMailOptions(dto?.mailOptions),
  };
}

function truncate(s: string, max: number) {
  if (s.length <= max) return s;
  return s.slice(0, max) + `...(+${s.length - max} chars)`;
}

function stripNewlines(s: string) {
  return s.replace(/[\r\n\t]+/g, ' ').trim();
}
