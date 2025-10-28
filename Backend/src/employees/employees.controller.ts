import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Request,
  UseGuards,
} from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Controller('api/employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  /**
   * GET /api/employees/business/:businessId
   * Lista todos los empleados de un negocio
   */
  @Get('business/:businessId')
  async findAllByBusiness(@Param('businessId', ParseIntPipe) businessId: number) {
    return this.employeesService.findAllByBusiness(BigInt(businessId));
  }

  /**
   * GET /api/employees/:id
   * Obtiene un empleado por ID
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.employeesService.findOne(BigInt(id));
  }

  /**
   * POST /api/employees/business/:businessId
   * Crea un nuevo empleado para un negocio
   */
  @Post('business/:businessId')
  async create(
    @Param('businessId', ParseIntPipe) businessId: number,
    @Body() createEmployeeDto: CreateEmployeeDto,
  ) {
    return this.employeesService.create(BigInt(businessId), createEmployeeDto);
  }

  /**
   * PATCH /api/employees/:id
   * Actualiza el estado de un empleado
   */
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
  ) {
    return this.employeesService.update(BigInt(id), updateEmployeeDto);
  }

  /**
   * DELETE /api/employees/:id
   * Desactiva un empleado (soft delete)
   */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.employeesService.remove(BigInt(id));
  }
}
