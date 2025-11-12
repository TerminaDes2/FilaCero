import { Body, Controller, Post } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SendSmsDto } from './dto/send-sms.dto';
import { CheckSmsDto } from './dto/check-sms.dto';

@Controller('api/sms')
export class SmsController {
  constructor(private readonly sms: SmsService) {}

  @Post('verify/start')
  start(@Body() dto: SendSmsDto) {
    const canal = dto.canal ?? 'sms';
    return this.sms.startVerification(dto.telefono, canal);
  }

  @Post('verify/check')
  check(@Body() dto: CheckSmsDto) {
    return this.sms.checkVerification(dto.telefono, dto.codigo);
  }
}
