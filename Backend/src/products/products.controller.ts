import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards, Query } from '@nestjs/common'; // <-- 1. Asegúrate de importar Query
import { ProductsService } from './index';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('api/products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'superadmin')
  create(@Body() dto: CreateProductDto) {
    return this.service.create(dto);
  }

  @Get()
  list(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('id_negocio') id_negocio?: string,
  ) {
    // 2. Ahora pasamos un objeto al servicio, como él espera.
    return this.service.findAll({ search, status, id_negocio });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'superadmin')
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'superadmin')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}