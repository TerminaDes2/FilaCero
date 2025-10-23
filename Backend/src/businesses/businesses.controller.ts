import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { BusinessesService } from './businesses.service';
import { CreateBusinessDto } from './dto/create-business.dto';

@Controller('api/businesses')
export class BusinessesController {
  constructor(private readonly service: BusinessesService) {}

  @Get()
  async listPublic(@Query('search') search?: string, @Query('limit') limit?: string) {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : undefined;
    return this.service.listPublicBusinesses({ search, limit: parsedLimit });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'superadmin', 'empleado', 'usuario')
  create(@Req() req: any, @Body() dto: CreateBusinessDto) {
    const userId = this.extractUserId(req);
    return this.service.createBusinessAndAssignOwner(userId, dto);
  }

  @Get('my')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'superadmin', 'empleado', 'usuario')
  myBusinesses(@Req() req: any) {
    const userId = this.extractUserId(req);
    return this.service.listBusinessesForUser(userId);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'superadmin', 'empleado', 'usuario')
  getById(@Req() req: any, @Param('id') id: string) {
    const userId = this.extractUserId(req);
    return this.service.getBusinessById(id);
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