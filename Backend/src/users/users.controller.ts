import { Controller, Put, Delete, Param, Body, UseGuards, Req, Get, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { UpdateUserDto } from '../auth/dto/update-user.dto';

// Proteger todas las rutas del controlador de usuarios
@UseGuards(AuthGuard('jwt')) 
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Ruta R: Obtener el perfil del usuario logeado
  @Get('me') 
  getProfile(@Req() req) {
    // req.user ya contiene la data básica del usuario gracias al JwtStrategy
    return req.user; 
  }

  // Ruta U: Actualizar Perfil
  @Put(':id')
  async updateProfile(
    @Param('id') id: string, 
    @Body() updateUserDto: UpdateUserDto,
    @Req() req 
  ) {
    // 1. Verificación de permisos: el ID del token debe coincidir con el ID de la URL
    if (req.user.id_usuario.toString() !== id) {
      throw new UnauthorizedException('No tienes permiso para modificar este perfil.');
    }
    
    // 2. Llamada al servicio
    return this.usersService.update(BigInt(id), updateUserDto);
  }

  // Ruta D: Eliminar Cuenta
  @Delete(':id')
  async deleteAccount(
    @Param('id') id: string, 
    @Req() req
  ) {
    // 1. Verificación de permisos
    if (req.user.id_usuario.toString() !== id) {
      throw new UnauthorizedException('No tienes permiso para eliminar esta cuenta.');
    }

    // 2. Llamada al servicio
    return this.usersService.delete(BigInt(id));
  }
}