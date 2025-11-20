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
} from '@nestjs/common';
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
  create(@Body() createPedidoDto: CreatePedidoDto) {
    return this.pedidosService.create(createPedidoDto);
  }

  @Get()
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
  getPedidosKanban(@Param('id_negocio', ParseIntPipe) id_negocio: number) {
    return this.pedidosService.getPedidosPorEstado(id_negocio);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pedidosService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updatePedidoDto: UpdatePedidoDto,
  ) {
    return this.pedidosService.update(id, updatePedidoDto);
  }

  @Patch(':id/estado')
  updateEstado(
    @Param('id') id: string,
    @Body() updateEstadoDto: UpdateEstadoPedidoDto,
  ) {
    return this.pedidosService.updateEstado(id, updateEstadoDto);
  }
}
