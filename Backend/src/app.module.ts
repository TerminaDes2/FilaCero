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
import { MailModule } from './mail/mail.module';

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
    SalesModule, // módulo de ventas (Prisma) <-- AQUÍ FALTABA LA COMA
    BusinessesModule, // módulo de negocios (Prisma)
    MailModule, // módulo de correo saliente
  ],
  controllers: [HealthController],
})
export class AppModule {}