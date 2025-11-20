/**
 * Configuración de Feature Flags para control de rollout gradual.
 * Permite habilitar/deshabilitar funcionalidades sin redeploy.
 */

export interface FeatureFlags {
  PAYMENTS_ENABLED: boolean;
  SPEI_ENABLED: boolean;
  SAVED_CARDS_ENABLED: boolean;
  REFUNDS_ENABLED: boolean;
}

/**
 * Lee feature flags desde variables de entorno.
 * Por defecto, todas están habilitadas en desarrollo.
 */
export function getFeatureFlags(): FeatureFlags {
  return {
    PAYMENTS_ENABLED: process.env.ENABLE_PAYMENTS === 'true' || process.env.NODE_ENV === 'development',
    SPEI_ENABLED: process.env.ENABLE_SPEI === 'true' || false,
    SAVED_CARDS_ENABLED: process.env.ENABLE_SAVED_CARDS === 'true' || process.env.NODE_ENV === 'development',
    REFUNDS_ENABLED: process.env.ENABLE_REFUNDS === 'true' || false,
  };
}

/**
 * Helper para verificar si una feature está habilitada.
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  const flags = getFeatureFlags();
  return flags[feature];
}
