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
import { MetricsModule } from './metrics/metrics.module'; // <-- 1. Importa el módulo
import { SmsModule } from './sms/sms.module';
import { PaymentsModule } from './payments/payments.module';
import { UploadsModule } from './uploads/uploads.module';
import { TranslationModule } from './translation/translation.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,   // acceso a la DB
    UsersModule,    // módulo de usuarios
    AuthModule,     // módulo de auth (login/signup)
    RolesModule,    // módulo de roles
    ProductsModule, // módulo de productos (Prisma)
    InventoryModule, // módulo de inventario (Prisma)
    CategoriesModule, // módulo de categorías (Prisma)
    SalesModule, // módulo de ventas (Prisma)
    BusinessesModule, // módulo de negocios (Prisma)
    BusinessRatingsModule, // módulo de valoraciones
    EmployeesModule, // módulo de empleados (Prisma)
    EmailModule, // módulo de email (Prisma)
    // Registrar JwtModule localmente para exponer JwtService a RecoverController
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        secret: cfg.get<string>('JWT_SECRET') || 'dev-secret-cambiar-en-produccion',
        signOptions: { expiresIn: cfg.get<string>('JWT_EXPIRES_IN') || '3600s' },
      }),
    }),
    PedidosModule, // módulo de pedidos online
    MetricsModule, // <-- 2. Añádelo a la lista
    SmsModule, // módulo de SMS (Twilio Verify)
    PaymentsModule, // módulo de pagos (Stripe)
    UploadsModule, //Módulo de subida de imagenes
    TranslationModule, // módulo de traducción (Azure Cognitive Services)
  ],
  controllers: [HealthController, RecoverController],
  providers: [],
})
export class AppModule {}