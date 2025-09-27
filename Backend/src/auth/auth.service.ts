import { 
    BadRequestException, 
    Injectable, 
    UnauthorizedException,
    ConflictException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service'; // Asegura la ruta correcta
import { RegisterDto } from './dto/register.dto'; // Importación necesaria para el método register
import { LoginDto } from './dto/login.dto'; // Importación necesaria para el método login

// Interfaz para el Payload del JWT
interface JwtPayload {
    id: string; 
    email: string;
}

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService, 
        private jwtService: JwtService,
    ) {}

    // --- (C)reate - REGISTER API ---
    async register(registerDto: RegisterDto) {
        // 1. Verificar si el usuario ya existe
        const existingUser = await this.prisma.usuarios.findUnique({
            where: { correo_electronico: registerDto.email },
        });

        if (existingUser) {
            throw new ConflictException('El usuario ya existe con ese correo.');
        }

        // 2. Hashear la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(registerDto.password, salt);

        // 3. Crear y guardar en la base de datos
        try {
            const user = await this.prisma.usuarios.create({
                data: {
                    nombre: registerDto.name,                  
                    correo_electronico: registerDto.email,     
                    password_hash: hashedPassword,             
                },
            });

            // 4. Generar Token JWT
            const payload: JwtPayload = { 
                id: user.id_usuario.toString(), 
                email: user.correo_electronico 
            };
            
            return this.generateToken(payload);
        } catch (error) {
            console.error(error);
            throw new BadRequestException('Error al crear el usuario. Revise los datos.');
        }
    }

    // --- (R)ead - LOGIN API (Corregido y Actualizado) ---
    async login(loginDto: LoginDto) { 
        
        // 1. Buscar usuario por 'correo_electronico'
        const user = await this.prisma.usuarios.findUnique({ 
            where: { 
                correo_electronico: loginDto.correo_electronico 
            } 
        });
        
        // Si no se encuentra el usuario
        if (!user) {
            // Se usa la excepción importada
            throw new UnauthorizedException('Credenciales inválidas (Correo no encontrado).');
        }

        // 2. Comparar la contraseña ingresada con el hash de la DB
        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password_hash); 
        
        // Si la contraseña no coincide
        if (!isPasswordValid) {
            // Se usa la excepción importada
            throw new UnauthorizedException('Credenciales inválidas (Contraseña incorrecta).');
        }

        // 3. Generar y devolver el Token JWT
        const payload: JwtPayload = { 
            id: user.id_usuario.toString(), 
            email: user.correo_electronico 
        };
        
        return this.generateToken(payload);
    }
    
    // Función auxiliar para generar el token
    private generateToken(payload: JwtPayload) {
        const token = this.jwtService.sign(payload);
        return { 
            token, 
            user: { 
                id: payload.id, 
                email: payload.email 
            } 
        };
    }
}