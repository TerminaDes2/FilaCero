import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PedidosModule } from '../pedidos/pedidos.module';
import { BusinessesModule } from '../businesses/businesses.module';
import { ProductsService } from './index';
import { ProductsController } from './index';
import { ProductImagesController } from './products.images.controller';
import { ProductPriceHistoryService } from './product-price-history.service';

@Module({
  imports: [PrismaModule, PedidosModule, BusinessesModule],
  controllers: [ProductsController, ProductImagesController],
  providers: [ProductsService, ProductPriceHistoryService],
  exports: [ProductsService, ProductPriceHistoryService],
})
export class ProductsModule {}
