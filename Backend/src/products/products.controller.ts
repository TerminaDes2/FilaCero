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
import { ProductsService } from './index';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductPriceDto } from './dto/update-product-price.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ProductPriceHistoryService } from './product-price-history.service';
import type { Express } from 'express';

// --- 2. IMPORTACIONES PARA SUBIDA LOCAL ---
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('api/products')
export class ProductsController {
  constructor(
    private readonly service: ProductsService,
    private readonly priceHistoryService: ProductPriceHistoryService,
  ) {}

  // --- 3. RUTA 'CREATE' MODIFICADA ---
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'superadmin', 'empleado', 'usuario')
  @UseInterceptors(FileInterceptor('file', { // 'file' DEBE coincidir con la clave de FormData
    storage: diskStorage({
      destination: './uploads', // Guarda los archivos en /app/uploads (dentro del contenedor)
      filename: (req, file, cb) => {
        // Genera un nombre de archivo único
        const randomName = Array(32)
          .fill(null)
          .map(() => Math.round(Math.random() * 16).toString(16))
          .join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      // Valida que solo sean imágenes
      if (!file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
        return cb(
          new BadRequestException('Solo se permiten archivos de imagen (png, jpg, jpeg)'),
          false,
        );
      }
      cb(null, true);
    },
  }))
  create(
    @Body('data') data: string, // <-- 4. Recibe el JSON como un string
    @UploadedFile() file: Express.Multer.File, // <-- 5. Recibe el archivo
  ) {
    let dto: CreateProductDto;
    
    try {
      // 6. Parseamos el string 'data' de vuelta a un objeto DTO
      dto = JSON.parse(data) as CreateProductDto;
    } catch (e) {
      throw new BadRequestException('Datos de producto mal formados (JSON inválido).');
    }

    // 7. Pasamos el DTO y el archivo al servicio (lo modificaremos en el siguiente paso)
    return this.service.create(dto, file);
  }
  // --- FIN DE LA MODIFICACIÓN ---

  @Get()
  list(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('id_negocio') id_negocio?: string,
  ) {
    return this.service.findAll({ search, status, id_negocio });
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
    // Nota: 'update' sigue esperando JSON. No subirá imágenes aún.
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'superadmin', 'empleado', 'usuario')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}