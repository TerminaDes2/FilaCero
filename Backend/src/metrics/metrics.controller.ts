import { Controller, Get, Query, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('api/metrics')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  // Helper para extraer el ID del usuario del token
  private getUserId(req: any): bigint {
    try {
      // Asumo que tu JwtStrategy adjunta el usuario a req.user
      // y que el ID está en id_usuario (como en tus otros controladores)
      const userId = req.user?.id_usuario; 
      return BigInt(userId);
    } catch (e) {
      throw new BadRequestException('Usuario no autenticado');
    }
  }

  @Get()
  @Roles('admin', 'superadmin', 'empleado') // Ajusta los roles que pueden ver métricas
  async getDashboardMetrics(
    @Req() req: any,
    @Query('id_negocio') negocioId: string,
    @Query('periodo') periodo?: '7d' | '14d' | '30d' | 'hoy',
  ) {
    if (!negocioId) {
      throw new BadRequestException('Se requiere un id_negocio');
    }
    
    const userId = this.getUserId(req); // Opcional, si el servicio lo necesita
    
    // Definir el rango de fechas basado en el query param 'periodo'
    const to = new Date();
    const from = new Date();
    
    switch (periodo) {
      case '14d':
        from.setDate(to.getDate() - 14);
        break;
      case '30d':
        from.setDate(to.getDate() - 30);
        break;
      case 'hoy':
        from.setHours(0, 0, 0, 0); // Desde el inicio del día
        break;
      case '7d':
      default:
        from.setDate(to.getDate() - 7); // Default: 7 días
        break;
    }

    return this.metricsService.getDashboardData(negocioId, from, to);
  }
}