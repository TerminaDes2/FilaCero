import { 
    Controller, 
    Post, 
    Body, 
    Get, 
    UseGuards, 
    Req 
} from '@nestjs/common';
import { AuthService } from './auth.service'; // Inyectamos el servicio con la lógica
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthGuard } from '@nestjs/passport'; // Necesario para proteger rutas con JWT

// Definimos la ruta base para este controlador siguiendo el patrón /api/<recurso>
@Controller('api/auth') 
export class AuthController {
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

    // --- (R)ead - LOGIN API ---
    // @route   POST /auth/login
    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        // La lógica (buscar usuario, comparar hash, generar JWT)
        // se delega al servicio.
        return this.authService.login(loginDto);
    }

    // --- (R)ead - GET USER INFO API (Requiere Token) ---
    // @route   GET /auth/me
    // Se usa el AuthGuard('jwt') para forzar la validación del token JWT
    @UseGuards(AuthGuard('jwt'))
    @Get('me')
    // El objeto 'req' es inyectado por NestJS
    getMe(@Req() req) {
        // Cuando el AuthGuard es exitoso, inyecta la información decodificada 
        // del token (el payload: {id, email}) en req.user.
        
        // En tu lógica anterior de Express, esto era: 
        // const user = await User.findById(req.user.id).select('-password');
        
        // En NestJS, simplemente devolvemos la información inyectada por el guard,
        // o si es necesario, la usamos para buscar datos más detallados:

        // return req.user; 
        
        // Si necesitas la información completa del usuario (sin password), 
        // puedes crear un método en el AuthService y llamarlo aquí:
        // return this.authService.getProfile(req.user.id);

        // Por simplicidad, asumiremos que el payload del token es suficiente
        // para la información básica de "quién soy".
        return req.user; 
    }
}