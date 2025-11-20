// Backend/src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { HealthController } from './health.controller';
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
    PedidosModule, // módulo de pedidos online
    MetricsModule, // <-- 2. Añádelo a la lista
    SmsModule, // módulo de SMS (Twilio Verify)
    PaymentsModule, // módulo de pagos (Stripe)
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}