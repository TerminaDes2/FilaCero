import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService, private jwtService: JwtService) {}

  async validateUser(correo_electronico: string, password: string) {
    const user = await this.usersService.findByEmail(correo_electronico);
    if (!user) return null;
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return null;
    return user;
  }

  async login(user: any) {
    // Asegúrate de convertir id a number si es BigInt
    const userId = typeof user.id_usuario === 'bigint' ? Number(user.id_usuario) : Number(user.id_usuario);
    const payload = { sub: userId, email: user.correo_electronico, roleId: user.id_rol ? Number(user.id_rol) : null };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
