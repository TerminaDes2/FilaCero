import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class VerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req?.user;

    if (!user) {
      return false;
    }

    const emailVerified = user.correo_verificado ?? user.verified ?? user.verifications?.email ?? false;

    if (emailVerified) {
      return true;
    }

    throw new ForbiddenException('La cuenta debe estar verificada para completar esta acción');
  }
}
