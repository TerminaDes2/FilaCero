import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';
import { RoomManagerService } from './room-manager.service';
import { NotificationCleanupService } from './notification-cleanup.service';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'dev-secret-cambiar-en-produccion',
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN') || '3600s' },
      }),
    }),
  ],
  providers: [
    NotificationsGateway,
    NotificationsService,
    RoomManagerService,
    NotificationCleanupService,
  ],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
