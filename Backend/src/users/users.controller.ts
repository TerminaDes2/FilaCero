import { Controller, Put, Delete, Param, Body, UseGuards, Req, Get, UnauthorizedException, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { VerifyRegisterDto } from '../auth/dto/verify-register.dto';

// Proteger todas las rutas del controlador de usuarios
@UseGuards(AuthGuard('jwt')) 
@Controller('api/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Ruta R: Obtener el perfil del usuario logeado
  @Get('me') 
  async getProfile(@Req() req) {
    const user = req.user;
    const id = user?.id_usuario ?? user?.id;
    if (!id) {
      throw new UnauthorizedException('Token inválido.');
    }
    return this.usersService.findOne(BigInt(id));
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
    
    // 2. Llamada al servicio: crear una sesión que requiere verificación por correo
    return this.usersService.requestProfileUpdate(BigInt(id), updateUserDto);
  }

  // Confirmar la actualización del perfil con código
  @Post('confirm-update')
  async confirmProfileUpdate(@Body() dto: VerifyRegisterDto, @Req() req) {
    const user = req.user;
    const id = user?.id_usuario ?? user?.id;
    if (!id) {
      throw new UnauthorizedException('Token inválido.');
    }
    // La verificación se hace contra la sesión incluida en el body
    return this.usersService.verifyProfileUpdate({ session: dto.session, code: dto.code }, BigInt(id));
  }

  // Upload avatar
  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req,
  ) {
    if (req.user.id_usuario.toString() !== id) {
      throw new UnauthorizedException('No tienes permiso para modificar este perfil.');
    }
    return this.usersService.uploadAvatar(BigInt(id), file);
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