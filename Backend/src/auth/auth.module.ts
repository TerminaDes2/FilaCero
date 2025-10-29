import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { VerifiedGuard } from './verified.guard';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../prisma/prisma.module'; // 👈 ¡Importación crucial para el AuthService!

@Module({
  imports: [
    // Módulos esenciales
    ConfigModule,
    PassportModule,
    UsersModule, // Necesario para acceder potencialmente a UsersService si lo usas en el futuro
    PrismaModule, // 👈 Se importa para que AuthService pueda usar PrismaService
    
    // Configuración Asíncrona de JWT
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        // Obtiene el secreto de las variables de entorno o usa un valor seguro por defecto
        secret: cfg.get<string>('JWT_SECRET') || 'dev-secret-cambiar-en-produccion',
        // Obtiene el tiempo de expiración o usa un valor por defecto
        signOptions: { expiresIn: cfg.get<string>('JWT_EXPIRES_IN') || '3600s' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy, // 👈 La estrategia es esencial para validar el token JWT
    VerifiedGuard,
  ],
  exports: [
    AuthService, // Exporta el servicio principal de Auth
    JwtModule,      // Permite que otros módulos usen el JwtModule (p. ej., para firmar tokens)
    PassportModule, // Permite que otros módulos usen los Guards de Passport (p. ej., AuthGuard)
    VerifiedGuard,
  ],
})
export class AuthModule {}