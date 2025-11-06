import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { BusinessRatingsService } from './business-ratings.service';
import { CreateBusinessRatingDto } from './dto/create-business-rating.dto';
import { UpdateBusinessRatingDto } from './dto/update-business-rating.dto';

@Controller('api/businesses/:businessId/ratings')
export class BusinessRatingsController {
  constructor(private readonly service: BusinessRatingsService) {}

  @Get()
  async list(
    @Param('businessId') businessId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.listRatings(businessId, Number(page) || 1, Number(limit) || 10);
  }

  @Get('summary')
  async summary(@Param('businessId') businessId: string) {
    return this.service.getSummary(businessId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post()
  async createOrUpdate(
    @Param('businessId') businessId: string,
    @Req() req: any,
    @Body() dto: CreateBusinessRatingDto,
  ) {
    this.ensureVerified(req);
    return this.service.upsertRating(businessId, this.extractUserId(req), dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Post(':ratingId')
  async update(
    @Param('businessId') businessId: string,
    @Param('ratingId') ratingId: string,
    @Req() req: any,
    @Body() dto: UpdateBusinessRatingDto,
  ) {
    this.ensureVerified(req);
    return this.service.updateRating(
      businessId,
      ratingId,
      this.extractUserId(req),
      dto,
      this.isPrivileged(req),
    );
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Delete(':ratingId')
  async remove(
    @Param('businessId') businessId: string,
    @Param('ratingId') ratingId: string,
    @Req() req: any,
  ) {
    return this.service.removeRating(
      businessId,
      ratingId,
      this.extractUserId(req),
      this.isPrivileged(req),
    );
  }

  private ensureVerified(req: any) {
    const emailVerified = req?.user?.correo_verificado ?? req?.user?.verified ?? req?.user?.verifications?.email ?? false;
    if (!emailVerified) {
      throw new ForbiddenException('La cuenta debe estar verificada para valorar un negocio');
    }
  }

  private extractUserId(req: any): string {
    const value = req?.user?.id_usuario ?? req?.user?.id;
    if (!value) {
      throw new UnauthorizedException('Usuario no autenticado');
    }
    return String(value);
  }

  private isPrivileged(req: any): boolean {
    const role = (req?.user?.role_name ?? '').toLowerCase();
    return role === 'admin' || role === 'superadmin';
  }
}
