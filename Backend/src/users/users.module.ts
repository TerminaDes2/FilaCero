import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '../prisma/prisma.module'; // Necesario para el servicio

@Module({
  imports: [PrismaModule], // Aseguramos que Prisma esté disponible
  controllers: [UsersController],
  providers: [UsersService], // 👈 Esto le dice al controlador dónde encontrarlo
  exports: [UsersService], // Opcional, pero útil si otros módulos lo necesitan
})
export class UsersModule {}