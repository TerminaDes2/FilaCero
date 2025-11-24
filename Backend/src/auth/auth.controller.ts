import { 
    Controller, 
    Post, 
    Body, 
    Get, 
    UseGuards, 
    Req,
    HttpException,
    HttpStatus,
    Logger
} from '@nestjs/common';
import { AuthService } from './auth.service'; // Inyectamos el servicio con la lógica
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport'; // Necesario para proteger rutas con JWT
import { VerifyEmailDto } from './dto/verify-email.dto';
import { VerifyRegisterDto } from './dto/verify-register.dto';
import { ResendRegisterDto } from './dto/resend-register.dto';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

// Definimos la ruta base para este controlador siguiendo el patrón /api/<recurso>
@Controller('api/auth') 
export class AuthController {
    private readonly logger = new Logger(AuthController.name);
    
    // Inyección del AuthService en el constructor
    constructor(private readonly authService: AuthService) {}

    // --- (C)reate - REGISTER API ---
    // @route   POST /auth/register
    // La validación y mapeo de errores se hace automáticamente con el DTO
    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        // Toda la lógica (verificar usuario, hashear, crear en DB, generar JWT)
        // se delega al servicio.
        return this.authService.register(registerDto);
    }

    @Post('verify')
    async verify(@Body() verifyDto: VerifyEmailDto) {
        return this.authService.verifyAccount(verifyDto);
    }

    @Post('verify-register')
    async verifyRegister(@Body() dto: VerifyRegisterDto) {
        return await this.authService.verifyRegister(dto);
    }

    @Post('resend-register')
    async resendRegister(@Body() dto: ResendRegisterDto) {
        return await this.authService.resendRegister(dto);
    }

    // --- (R)ead - LOGIN API ---
    // @route   POST /auth/login
    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        this.logger.log(`[CONTROLLER] Recibida petición de login para: ${loginDto.correo_electronico}`);
        try {
            const result = await this.authService.login(loginDto);
            this.logger.log(`[CONTROLLER] Login exitoso para: ${loginDto.correo_electronico}`);
            return result;
        } catch (error) {
            this.logger.error(`[CONTROLLER] Error en login: ${error.message}`, error.stack);
            throw error;
        }
    }

    // --- (R)ead - GET USER INFO API (Requiere Token) ---
    // @route   GET /auth/me
    // Se usa el AuthGuard('jwt') para forzar la validación del token JWT
    @UseGuards(AuthGuard('jwt'))
    @Get('me')
    // El objeto 'req' es inyectado por NestJS
    getMe(@Req() req: Request) {
      console.log('[Auth Controller] getMe() called');
      console.log('[Auth Controller] Headers:', req.headers);
      const user = (req as unknown as { user?: unknown }).user;
      console.log('[Auth Controller] User from request:', user);
      return user;
    }
}

@Controller('api/verificacion_credencial')
export class VerificacionCredencialController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async verificarCredencial(
    @Req() req: Request,
    @Body() body: { imageUrl?: string; expected_student_id?: string; expected_name?: string },
  ) {
    try {
      // Extraer el id del usuario autenticado (proporcionado por JwtStrategy)
      const authUser = (req as unknown as { user?: unknown }).user;
      if (!authUser || typeof authUser !== 'object' || !('id_usuario' in authUser)) {
        throw new HttpException('Usuario no autenticado', HttpStatus.UNAUTHORIZED);
      }
      const rawId = (authUser as Record<string, unknown>)['id_usuario'];
      let idUsuario: bigint;
      if (typeof rawId === 'bigint') {
        idUsuario = rawId;
      } else if (typeof rawId === 'number') {
        idUsuario = BigInt(rawId);
      } else if (typeof rawId === 'string') {
        idUsuario = BigInt(rawId);
      } else {
        throw new HttpException('ID de usuario inválido', HttpStatus.UNAUTHORIZED);
      }

      // Nuevo flujo: siempre delegar al servicio Python de verificación.
      const apiUrl = this.configService.get<string>('VERIFICACION_CREDENCIAL_API_URL');
      if (!apiUrl) {
        throw new HttpException('VERIFICACION_CREDENCIAL_API_URL no configurada', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      // Construir payload para el servicio Python. Se permiten campos opcionales
      // esperados que pueden venir desde el frontend (expected_student_id, expected_name).
      const payload: Record<string, unknown> = { file: body.imageUrl };
      if (body.expected_student_id) payload.expected_student_id = body.expected_student_id;
      if (body.expected_name) payload.expected_name = body.expected_name;

      const response = await axios.post(`${apiUrl}/validate_json`, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 20000,
      });

      // Esperamos que el servicio Python devuelva un JSON con 'ok': boolean
      if (response && response.data && typeof response.data === 'object') {
        const dataObj = response.data as Record<string, unknown>;
        const ok = !!dataObj['ok'];
        if (ok) {
          await this.prisma.usuarios.update({
            where: { id_usuario: idUsuario },
            data: {
              credencial_verificada: true,
              credencial_verificada_en: new Date(),
              credential_url: body.imageUrl,
            },
          });

          return { message: 'Verificación completada y actualizada en la base de datos.' };
        }
        // Si ok === false, devolver información útil al cliente
        return {
          message: 'Favor intente nuevamente con una credencial válida.',
          details: dataObj,
        };
      }

      throw new HttpException('Respuesta inválida del servicio de verificación.', HttpStatus.BAD_REQUEST);
    } catch (error: unknown) {
      let errMsg = 'Error desconocido';
      if (typeof error === 'string') errMsg = error;
      else if (error instanceof Error) errMsg = error.message;
      else {
        try {
          errMsg = JSON.stringify(error);
        } catch {
          errMsg = 'Error desconocido';
        }
      }

      throw new HttpException(
        `Error en verificación de credencial: ${errMsg || 'Error desconocido'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}