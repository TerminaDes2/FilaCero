import { SetMetadata } from '@nestjs/common';
import { FeatureFlags } from '../config/features.config';
import { FEATURE_FLAG_KEY } from '../guards/feature-flag.guard';

/**
 * Decorador para requerir que una feature esté habilitada.
 * Uso: @RequireFeature('PAYMENTS_ENABLED')
 */
export const RequireFeature = (feature: keyof FeatureFlags) =>
  SetMetadata(FEATURE_FLAG_KEY, feature);
