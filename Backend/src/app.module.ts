import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductModule } from './products/product.module';
import { Product, ProductSchema } from './products/product.schema';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Connection string desde MONGO_URI o por defecto a mongodb://mongo:27017/filacero
  MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://mongo:27017/filacero'),
  // Registrar también el modelo Product aquí para que AppService pueda inyectarlo
  MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
  ProductModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
