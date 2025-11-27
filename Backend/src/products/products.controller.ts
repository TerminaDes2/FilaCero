import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UploadedFile, UseGuards, UseInterceptors, Request, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { ProductsService } from './products.service';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductPriceDto } from './dto/update-product-price.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ProductPriceHistoryService } from './product-price-history.service';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname } from 'path';

@Controller('api/products')
export class ProductsController {
  constructor(private readonly service: ProductsService, private readonly priceHistoryService: ProductPriceHistoryService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'superadmin', 'empleado', 'usuario')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const dir = './uploads';
        try { if (!existsSync(dir)) mkdirSync(dir, { recursive: true }); } catch (e) {}
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => Math.round(Math.random() * 16).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
        return cb(new BadRequestException('Solo se permiten archivos de imagen (png, jpg, jpeg)'), false);
      }
      cb(null, true);
    },
  }))
  async create(@Body('data') data: string, @UploadedFile() file: Express.Multer.File) {
    let dto: any;
    try {
      dto = JSON.parse(data);
    } catch (e) {
      throw new BadRequestException('Datos de producto mal formados (JSON inválido).');
    }
    return this.service.create(dto, file);
  }

  @Get()
  list(@Query('search') search?: string, @Query('status') status?: string, @Query('id_negocio') id_negocio?: string, @Query('categoria') categoria?: string) {
    return this.service.findAll({ search, status, id_negocio, categoria });
  }

  @Get('catalog/categories')
  catalogCategories(@Query('id_negocio') id_negocio?: string) {
    return this.service.listCategories({ id_negocio });
  }

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
      return { message: 'No hay precio registrado en el historial', id_producto: id };
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
  async updatePrice(@Param('id') id: string, @Body() dto: UpdateProductPriceDto, @Request() req: any) {
    const idProducto = BigInt(id);
    const idUsuario = BigInt(req.user.id_usuario);
    await this.priceHistoryService.actualizarPrecio(idProducto, dto.precio, idUsuario, dto.motivo);
    return { message: 'Precio actualizado exitosamente', id_producto: id, nuevo_precio: dto.precio, motivo: dto.motivo || null };
  }

  @Get(':id')
  get(@Param('id') id: string | number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'superadmin', 'empleado', 'usuario')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'superadmin', 'empleado', 'usuario')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
