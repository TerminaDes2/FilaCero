import { SendMailOptions } from 'nodemailer';

export type MailSender = 'contact' | 'noreply' | 'privacy';

export interface MailSendCommand extends Omit<SendMailOptions, 'from'> {
  sender: MailSender;
  from?: string;
}
