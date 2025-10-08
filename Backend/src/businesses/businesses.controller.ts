import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { BusinessesService } from './businesses.service';
import { CreateBusinessDto } from './dto/create-business.dto';

@Controller('api/businesses')
export class BusinessesController {
  constructor(private readonly service: BusinessesService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Req() req: any, @Body() dto: CreateBusinessDto) {
    const user = req.user; // injected by JwtStrategy
    const userId = String(user?.id_usuario ?? user?.id);
    return this.service.createBusinessAndAssignOwner(userId, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('my')
  async myBusinesses(@Req() req: any) {
    const user = req.user;
    const userId = String(user?.id_usuario ?? user?.id);
    return this.service.listBusinessesForUser(userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.service.getBusinessById(id);
  }
}
