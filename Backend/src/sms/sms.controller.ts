import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SendSmsDto } from './dto/send-sms.dto';
import { CheckSmsDto } from './dto/check-sms.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Controller('api/sms')
export class SmsController {
  constructor(private readonly sms: SmsService) {}

  @Post('verify/start')
  @UseGuards(AuthGuard('jwt'))
  start(@Body() dto: SendSmsDto, @Req() req: Request) {
    const canal = dto.canal ?? 'sms';
    const to = dto.telefono;
    const r = req as unknown as { user?: { id_usuario?: bigint } };
    const userId: bigint | undefined = r.user?.id_usuario;
    return this.sms.startVerification(to, canal, userId);
  }

  @Post('verify/check')
  @UseGuards(AuthGuard('jwt'))
  check(@Body() dto: CheckSmsDto, @Req() req: Request) {
    const r = req as unknown as { user?: { id_usuario?: bigint } };
    const userId: bigint | undefined = r.user?.id_usuario;
    return this.sms.checkVerification(dto.telefono, dto.codigo, userId);
  }
}
