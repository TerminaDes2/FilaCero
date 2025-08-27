import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.schema';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  providers: [ProductService],
  controllers: [ProductController],
  exports: [ProductService],
})
export class ProductModule {}