import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';

/**
 * Exposes friendly aliases so API consumers can POST `/register` (or `/auth/register`)
 * without needing to know about the internal `/api/auth/register` path. The logic
 * remains centralised in `AuthService` to avoid duplication while we preserve the
 * canonical controller under `/api/auth` for backwards compatibility.
 */
@Controller()
export class RegisterAliasController {
  constructor(private readonly authService: AuthService) {}

  private handleRegister(registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  /** Mirrors the canonical registration endpoint but at the SEO friendly root. */
  @Post('register')
  registerAtRoot(@Body() registerDto: RegisterDto) {
    return this.handleRegister(registerDto);
  }

  /** Secondary alias so legacy clients hitting `/auth/register` keep working. */
  @Post('auth/register')
  registerAtAuth(@Body() registerDto: RegisterDto) {
    return this.handleRegister(registerDto);
  }

  /** Optional alias for REST clients that expect the global `/api` prefix only once. */
  @Post('api/register')
  registerAtApi(@Body() registerDto: RegisterDto) {
    return this.handleRegister(registerDto);
  }

  /** Alias específico solicitado para el flujo de alta en español */
  @Post('api/usuarios/register')
  registerAtUsuarios(@Body() registerDto: RegisterDto) {
    return this.handleRegister(registerDto);
  }
}
