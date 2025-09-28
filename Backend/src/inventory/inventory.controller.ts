import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';

@Controller('api/inventory')
export class InventoryController {
  constructor(private readonly service: InventoryService) {}

  @Post()
  create(@Body() dto: CreateInventoryDto) {
    return this.service.create(dto);
  }

  @Get()
  list(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
    @Query('id_producto') id_producto?: string,
    @Query('id_negocio') id_negocio?: string,
  ) {
    return this.service.findAll({ limit, offset, id_producto, id_negocio });
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateInventoryDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
