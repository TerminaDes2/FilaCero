import { 
  Body, 
  Controller, 
  Delete, 
  Get, 
  Param, 
  Patch, 
  Post, 
  UseGuards, 
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException 
} from '@nestjs/common';
import type { Express } from 'express';
import { ProductsService } from './index';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

// --- 2. IMPORTACIONES PARA SUBIDA LOCAL ---
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname } from 'path';

@Controller('api/products')
export class ProductsController {
  constructor(private readonly service: ProductsService) {}

  // --- 3. RUTA 'CREATE' MODIFICADA ---
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'superadmin', 'empleado', 'usuario')
  @UseInterceptors(FileInterceptor('file', { // 'file' DEBE coincidir con la clave de FormData
    storage: diskStorage({
      destination: (req, file, cb) => {
        const dir = './uploads';
        try {
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
        } catch (e) {
          // Ignorar; si falla se delegará al callback de multer
        }
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const randomName = Array(32)
          .fill(null)
          .map(() => Math.round(Math.random() * 16).toString(16))
          .join('');
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