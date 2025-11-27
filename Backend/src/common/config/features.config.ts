import { Logger } from '@nestjs/common';

/**
 * Tipo que representa las banderas de funcionalidades disponibles.
 * Agrega nuevas claves según sea necesario.
 */
export interface FeatureFlags {
  PAYMENTS_ENABLED: boolean;
  KITCHEN_BOARD_ENABLED: boolean;
  AUTH_ENABLED: boolean;
  SAVED_CARDS_ENABLED: boolean;
}

const logger = new Logger('FeatureFlags');

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined || value === null) return fallback;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on', 'enabled'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off', 'disabled'].includes(normalized)) return false;
  logger.verbose(`Valor inesperado para feature flag: "${value}". Usando fallback ${fallback}`);
  return fallback;
}

const defaults: FeatureFlags = {
  PAYMENTS_ENABLED: true,
  KITCHEN_BOARD_ENABLED: true,
  AUTH_ENABLED: true,
  SAVED_CARDS_ENABLED: true,
};

/**
 * Cache inmutable de banderas evaluadas al cargar el módulo.
 * Se basa en variables de entorno con prefijo FEATURE_.
 */
const featureCache: FeatureFlags = {
  PAYMENTS_ENABLED: parseBoolean(process.env.FEATURE_PAYMENTS_ENABLED, defaults.PAYMENTS_ENABLED),
  KITCHEN_BOARD_ENABLED: parseBoolean(process.env.FEATURE_KITCHEN_BOARD_ENABLED, defaults.KITCHEN_BOARD_ENABLED),
  AUTH_ENABLED: parseBoolean(process.env.FEATURE_AUTH_ENABLED, defaults.AUTH_ENABLED),
};

export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return featureCache[feature] ?? false;
}

export function getFeatureFlags(): FeatureFlags {
  return { ...featureCache };
}
