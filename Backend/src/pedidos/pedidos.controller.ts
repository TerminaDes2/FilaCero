import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PedidosService } from './pedidos.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import {
  UpdatePedidoDto,
  UpdateEstadoPedidoDto,
} from './dto/update-pedido.dto';

@Controller('api/pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'empleado', 'usuario')
  create(@Body() createPedidoDto: CreatePedidoDto) {
    return this.pedidosService.create(createPedidoDto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'empleado', 'usuario')
  findAll(
    @Query('id_negocio') id_negocio?: string,
    @Query('id_usuario') id_usuario?: string,
    @Query('estado') estado?: string,
    @Query('fecha_desde') fecha_desde?: string,
    @Query('fecha_hasta') fecha_hasta?: string,
  ) {
    const filters: any = {};

    if (id_negocio) filters.id_negocio = parseInt(id_negocio);
    if (id_usuario) filters.id_usuario = parseInt(id_usuario);
    if (estado) filters.estado = estado;
    if (fecha_desde) filters.fecha_desde = new Date(fecha_desde);
    if (fecha_hasta) filters.fecha_hasta = new Date(fecha_hasta);

    return this.pedidosService.findAll(filters);
  }

  @Get('kanban/:id_negocio')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'empleado')
  getPedidosKanban(@Param('id_negocio', ParseIntPipe) id_negocio: number) {
    return this.pedidosService.getPedidosPorEstado(id_negocio);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'empleado', 'usuario')
  findOne(@Param('id') id: string) {
    return this.pedidosService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'empleado')
  update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updatePedidoDto: UpdatePedidoDto,
  ) {
    return this.pedidosService.update(id, updatePedidoDto);
  }

  @Patch(':id/estado')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'empleado')
  updateEstado(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateEstadoDto: UpdateEstadoPedidoDto,
  ) {
    // Extract user context for ownership validation
    const userContext = this.extractUserContext(req);
    return this.pedidosService.updateEstado(id, updateEstadoDto, userContext);
  }

  /**
   * Extract user context from request for ownership validation
   */
  private extractUserContext(req: any): {
    id_usuario: number;
    id_negocio?: number;
    rol?: string;
  } {
    const user = req?.user;
    if (!user) {
      throw new BadRequestException('Usuario no autenticado');
    }

    const id_usuario = user?.id_usuario ?? user?.id;
    if (id_usuario === undefined || id_usuario === null) {
      throw new BadRequestException('ID de usuario no encontrado');
    }

    return {
      id_usuario: Number(id_usuario),
      id_negocio: user?.id_negocio ? Number(user.id_negocio) : undefined,
      rol: user?.rol,
    };
  }
}
