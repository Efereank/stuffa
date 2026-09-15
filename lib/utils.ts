import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================
// FORMATO
// ============================================================

export function formatCurrency(
  value: number,
  currency: 'USD' | 'VES' = 'USD',
) {
  if (currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(value);
  }
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'VES',
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatBs(value: number) {
  return `Bs. ${new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

export function formatTime(value: string) {
  return value.slice(0, 5);
}

export function formatLongDate(value: string) {
  const [y, m, d] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function formatShortDate(value: string) {
  const [y, m, d] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function formatDayName(value: string) {
  const [y, m, d] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function formatMonthYear(value: string) {
  const [y, m] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('es-MX', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, 1)));
}

export function todayISO(timeZone = 'America/Caracas') {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
}

// ============================================================
// HELPERS DE FECHA
// ============================================================

export function toISODate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function firstWeekdayOfMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
}

export function shiftMonth(ym: string, delta: number) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function monthKey(date: string) {
  return date.slice(0, 7);
}

/**
 * Cuenta regresiva hasta una fecha+hora
 */
export function getTimeRemaining(targetISO: string) {
  const target = new Date(targetISO).getTime();
  const now = Date.now();
  const diff = Math.max(0, target - now);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, isPast: diff === 0 };
}

// ============================================================
// ERRORES RPC
// ============================================================

export const RPC_ERRORS: Record<string, string> = {
  INVALID_NAME: 'Ingresa un nombre válido.',
  INVALID_PHONE: 'Ingresa un teléfono válido.',
  INVALID_CEDULA: 'Ingresa una cédula válida.',
  INVALID_QUANTITY: 'La cantidad de entradas no es válida.',
  INVALID_PROOF: 'Debes subir una captura del comprobante.',
  UNDERAGE: 'Debes ser mayor de 18 años.',
  DISTRIBUTION_MISMATCH: 'La distribución de hombres/mujeres no coincide con la cantidad total.',
  EVENT_NOT_FOUND: 'El evento ya no está disponible.',
  EVENT_PAST: 'Este evento ya pasó.',
  TICKET_TYPE_NOT_FOUND: 'El tipo de entrada ya no está disponible.',
  NOT_ENOUGH_TICKETS: 'No hay suficientes entradas disponibles.',
  ORDER_NOT_FOUND: 'No encontramos la orden.',
  ORDER_NOT_PENDING: 'Esta orden ya fue procesada.',
  ORDER_ALREADY_PROCESSED: 'La orden ya fue verificada o rechazada.',
  DUPLICATE_ORDER: 'Ya existe una orden con estos datos.',
  RATE_LIMITED_IP: 'Demasiados intentos desde tu conexión. Espera un momento.',
  RATE_LIMITED_PHONE: 'Este teléfono ya hizo varias compras recientes.',
  NOT_STAFF: 'No tienes permisos para esto.',
};

export function translateRpcError(message: string) {
  const key = Object.keys(RPC_ERRORS).find((k) => message.includes(k));
  return key ? RPC_ERRORS[key] : 'Ocurrió un error. Intenta de nuevo.';
}