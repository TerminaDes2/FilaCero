import { 
  Body, 
  Controller, 
  Delete, 
  Get, 
  Param, 
  Patch, 
  Post, 
  Put, 
  UseGuards, 
  Query, 
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException
} from '@nestjs/common';
import type { Express } from 'express';
import { ProductsService } from './index';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductPriceDto } from './dto/update-product-price.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ProductPriceHistoryService } from './product-price-history.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('api/products')
export class ProductsController {
  constructor(
    private readonly service: ProductsService,
    private readonly priceHistoryService: ProductPriceHistoryService,
  ) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'superadmin', 'empleado', 'usuario')
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Body('data') data: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    let dto: CreateProductDto;
    
    try {
      dto = JSON.parse(data) as CreateProductDto;
    } catch (e) {
      throw new BadRequestException('Datos de producto mal formados (JSON inválido).');
    }

    return this.service.create(dto, file);
  }

  @Get()
  list(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('id_negocio') id_negocio?: string,
    @Query('categoria') categoria?: string,
  ) {
    return this.service.findAll({ search, status, id_negocio, categoria });
  }

  @Get('catalog/categories')
  catalogCategories(
    @Query('id_negocio') id_negocio?: string,
  ) {
    return this.service.listCategories({ id_negocio });
  }

  // ===== Endpoints de Historial de Precios (ANTES de :id) =====

  @Get(':id/price-history')
  async getPriceHistory(@Param('id') id: string) {
    const idProducto = BigInt(id);
    return this.priceHistoryService.obtenerHistorial(idProducto);
  }

  @Get(':id/price/current')
  async getCurrentPrice(@Param('id') id: string) {
    const idProducto = BigInt(id);
    const precioActual = await this.priceHistoryService.obtenerPrecioActual(idProducto);
    
    if (!precioActual) {
      return {
        message: 'No hay precio registrado en el historial',
        id_producto: id,
      };
    }

    return precioActual;
  }

  @Get(':id/price/stats')
  async getPriceStats(@Param('id') id: string) {
    const idProducto = BigInt(id);
    return this.priceHistoryService.obtenerEstadisticas(idProducto);
  }

  @Put(':id/price')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'superadmin')
  async updatePrice(
    @Param('id') id: string,
    @Body() dto: UpdateProductPriceDto,
    @Request() req: any,
  ) {
    const idProducto = BigInt(id);
    const idUsuario = BigInt(req.user.id_usuario);
    
    await this.priceHistoryService.actualizarPrecio(
      idProducto,
      dto.precio,
      idUsuario,
      dto.motivo,
    );

    return {
      message: 'Precio actualizado exitosamente',
      id_producto: id,
      nuevo_precio: dto.precio,
      motivo: dto.motivo || null,
    };
  }

  // ===== Endpoints CRUD estándar =====

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'superadmin', 'empleado', 'usuario')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.service.update(id, dto);
  }

  @Post(':id/image')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'superadmin')
  @UseInterceptors(FileInterceptor('file'))
  uploadProductImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.service.uploadProductImage(id, file);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'superadmin', 'empleado', 'usuario')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}