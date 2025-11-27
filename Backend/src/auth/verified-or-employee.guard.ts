import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class VerifiedOrEmployeeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req?.user;

    if (!user) return false;

    const emailVerified = user.correo_verificado ?? user.verified ?? user.verifications?.email ?? false;
    const backendRole = (user.role?.nombre_rol ?? user.role_name ?? '').toLowerCase();

    if (emailVerified) return true;

    // Allow if the user is an employee
    if (backendRole === 'empleado') return true;

    throw new ForbiddenException('La cuenta debe estar verificada para completar esta acción');
  }
}
