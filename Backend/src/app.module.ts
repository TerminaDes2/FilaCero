// Backend/src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { HealthController } from './health.controller';
import { RecoverController } from './auth/recover.controller';
import { ProductsModule } from './products/products.module';
import { InventoryModule } from './inventory/inventory.module';
import { CategoriesModule } from './categories/categories.module';
import { SalesModule } from './sales/sales.module';
import { BusinessesModule } from './businesses/businesses.module';
import { BusinessRatingsModule } from './business-ratings/business-ratings.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { EmployeesModule } from './employees/employees.module';
import { EmailModule } from './email/email.module';
import { MetricsModule } from './metrics/metrics.module';
import { SmsModule } from './sms/sms.module';
import { PaymentsModule } from './payments/payments.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    RolesModule,
    ProductsModule,
    InventoryModule,
    CategoriesModule,
    SalesModule,
    BusinessesModule,
    BusinessRatingsModule,
    EmployeesModule,
    EmailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>('JWT_SECRET') || 'dev-secret-cambiar-en-produccion',
        signOptions: { expiresIn: cfg.get<string>('JWT_EXPIRES_IN') || '3600s' },
      }),
    }),
    PedidosModule,
    MetricsModule,
    SmsModule,
    PaymentsModule,
    NotificationsModule, // módulo de notificaciones WebSocket y email
    ScheduleModule.forRoot(), // para cron jobs de limpieza
  ],
  controllers: [HealthController, RecoverController],
  providers: [],
})
export class AppModule {}