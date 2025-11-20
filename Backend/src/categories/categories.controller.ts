import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards, BadRequestException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('api/categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin','superadmin','empleado','usuario')
  findAll(@Req() req: any, @Query('id_negocio') idNegocio?: string) {
    const userId = this.extractUserId(req);
    return this.service.findAll(userId, idNegocio);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin','superadmin','empleado','usuario')
  findOne(@Req() req: any, @Param('id') id: string) {
    const userId = this.extractUserId(req);
    return this.service.findOne(userId, id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin','superadmin','empleado','usuario')
  create(@Req() req: any, @Body() dto: CreateCategoryDto) {
    const userId = this.extractUserId(req);
    try {
      console.log('🔔 POST /api/categories body:', dto, 'userId:', userId);
    } catch {}
    return this.service.create(userId, dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin','superadmin','empleado','usuario')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    const userId = this.extractUserId(req);
    return this.service.update(userId, id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin','superadmin','empleado','usuario')
  remove(@Req() req: any, @Param('id') id: string) {
    const userId = this.extractUserId(req);
    return this.service.remove(userId, id);
  }

  private extractUserId(req: any): string {
    const user = req?.user;
    const value = user?.id_usuario ?? user?.id;
    if (value === undefined || value === null) {
      throw new BadRequestException('Usuario no autenticado');
    }
    return String(value);
  }
}
