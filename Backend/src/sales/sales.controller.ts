import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { VerifiedGuard } from '../auth/verified.guard';
import { VerifiedOrEmployeeGuard } from '../auth/verified-or-employee.guard';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { FindSalesQueryDto } from './dto/find-sales.query';
import { CloseSaleDto } from './dto/close-sale.dto';
import { CreateCashoutDto } from './dto/create-cashout.dto';
import { CashoutSummaryQueryDto } from './dto/cashout-summary.query';
import { CashoutHistoryQueryDto } from './dto/cashout-history.query';

@Controller('api/sales')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('superadmin', 'admin', 'empleado', 'usuario')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard, VerifiedGuard)
  create(@Req() req: any, @Body() dto: CreateSaleDto) {
    return this.salesService.create(dto, req.user);
  }

  @Get()
  findAll(@Query() query: FindSalesQueryDto) {
    return this.salesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salesService.findOne(id);
  }

  @Patch(':id/close')
  close(@Param('id') id: string, @Body() dto: CloseSaleDto) {
    return this.salesService.close(id, dto);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.salesService.cancel(id);
  }

  @Get('cashout/summary')
  cashoutSummary(@Req() req: any, @Query() query: CashoutSummaryQueryDto) {
    return this.salesService.cashoutSummary(query, req.user);
  }

  @Get('cashout/history')
  cashoutHistory(@Req() req: any, @Query() query: CashoutHistoryQueryDto) {
    return this.salesService.cashoutHistory(query, req.user);
  }

  @Post('cashout')
  @UseGuards(AuthGuard('jwt'), RolesGuard, VerifiedOrEmployeeGuard)
  createCashout(@Req() req: any, @Body() dto: CreateCashoutDto) {
    return this.salesService.createCashout(dto, req.user);
  }
}
