import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module'; // Necesario para el servicio
import { EmailModule } from '../email/email.module';
import { EmailVerificationService } from './email-verification/email-verification.service';
import { EmailVerificationController } from './email-verification/email-verification.controller';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>('JWT_SECRET') || 'dev-secret-cambiar-en-produccion',
        signOptions: { expiresIn: cfg.get<string>('JWT_EXPIRES_IN') || '3600s' },
      }),
    }),
  ], // Aseguramos que Prisma y el servicio de email estén disponibles
  controllers: [UsersController, EmailVerificationController],
  providers: [UsersService, EmailVerificationService], // 👈 Esto le dice al controlador dónde encontrarlo
  exports: [UsersService, EmailVerificationService], // Opcional, pero útil si otros módulos lo necesitan
})
export class UsersModule {}