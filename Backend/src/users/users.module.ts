import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module'; // Necesario para el servicio
import { EmailModule } from '../email/email.module';
import { EmailVerificationService } from './email-verification/email-verification.service';
import { EmailVerificationController } from './email-verification/email-verification.controller';

@Module({
  imports: [PrismaModule, EmailModule], // Aseguramos que Prisma y el servicio de email estén disponibles
  controllers: [UsersController, EmailVerificationController],
  providers: [UsersService, EmailVerificationService], // 👈 Esto le dice al controlador dónde encontrarlo
  exports: [UsersService, EmailVerificationService], // Opcional, pero útil si otros módulos lo necesitan
})
export class UsersModule {}