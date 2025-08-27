import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductModule } from './products/product.module';
import { Product } from './products/product.schema';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
  TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: true, // Nota: Desactiva esto en producción
      }),
    }),
  // Repositorio disponible también en AppService
  TypeOrmModule.forFeature([Product]),
    ProductModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
