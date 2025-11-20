import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isFeatureEnabled, FeatureFlags } from '../config/features.config';

export const FEATURE_FLAG_KEY = 'featureFlag';

/**
 * Guard que verifica si una feature está habilitada antes de permitir acceso.
 * Uso: @UseGuards(FeatureFlagGuard) + @SetMetadata(FEATURE_FLAG_KEY, 'PAYMENTS_ENABLED')
 */
@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredFeature = this.reflector.get<keyof FeatureFlags>(
      FEATURE_FLAG_KEY,
      context.getHandler(),
    );

    if (!requiredFeature) {
      // Si no hay metadata, permitir acceso (guard no aplica)
      return true;
    }

    const enabled = isFeatureEnabled(requiredFeature);
    if (!enabled) {
      throw new ServiceUnavailableException(
        `La funcionalidad ${requiredFeature} está temporalmente deshabilitada. Intenta más tarde.`,
      );
    }

    return true;
  }
}
