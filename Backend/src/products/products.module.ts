import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ProductsService } from './index';
import { ProductsController } from './index';
import { ProductPriceHistoryService } from './product-price-history.service';

@Module({
  imports: [PrismaModule],
  controllers: [ProductsController],
  providers: [ProductsService, ProductPriceHistoryService],
  exports: [ProductsService, ProductPriceHistoryService],
})
export class ProductsModule {}
