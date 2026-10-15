// ============================================================
// Constantes globales de Stuffa Tickets
// ============================================================

/**
 * Consumo mínimo obligatorio por persona (USD).
 * ⚠️ Debe coincidir con la constante en `create_order` (SQL): MIN_CONSUMPTION = 10
 */
export const MIN_CONSUMPTION_USD_PER_PERSON = 10;

/**
 * Consumo por defecto al abrir el paso de consumo (USD).
 * Coincide con el mínimo.
 */
export const DEFAULT_CONSUMPTION_USD_PER_PERSON = 10;

/**
 * Presets rápidos de consumo (USD) que se muestran como botones.
 */
export const CONSUMPTION_PRESETS_USD = [10, 15, 20, 25, 30] as const;