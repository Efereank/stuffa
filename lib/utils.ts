import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatTime(value: string) {
  return value.slice(0, 5);
}

export function formatLongDate(value: string) {
  const [y, m, d] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function formatShortDate(value: string) {
  const [y, m, d] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric', month: 'short', timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function formatDayName(value: string) {
  const [y, m, d] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'long', timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function formatMonthYear(value: string) {
  const [y, m] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('es-MX', {
    month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(Date.UTC(y, m - 1, 1)));
}

export function todayISO(timeZone = 'America/Caracas') {
  return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
}

/** Construye "YYYY-MM-DD" sin problemas de zona horaria */
export function toISODate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** Devuelve el primer día del mes como "YYYY-MM-DD" */
export function firstDayOfMonth(year: number, month: number) {
  return toISODate(year, month, 1);
}

/** Devuelve el último día del mes como "YYYY-MM-DD" */
export function lastDayOfMonth(year: number, month: number) {
  return toISODate(year, month, new Date(Date.UTC(year, month, 0)).getUTCDate());
}

/** Suma meses a "YYYY-MM" (para navegación) */
export function shiftMonth(ym: string, delta: number) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** "YYYY-MM-DD" → "YYYY-MM" */
export function monthKey(date: string) {
  return date.slice(0, 7);
}

/** Número de días del mes */
export function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Día de la semana del primer día del mes (0=dom) */
export function firstWeekdayOfMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
}

// ============================================================
// ERRORES RPC
// ============================================================
export const RPC_ERRORS: Record<string, string> = {
  INVALID_NAME: 'Ingresa un nombre válido (mínimo 3 caracteres).',
  INVALID_PHONE: 'Ingresa un teléfono válido.',
  INVALID_TIME: 'El horario de reserva es de 10:00 PM a 11:00 PM.',
  DATE_IN_PAST: 'La fecha seleccionada ya pasó.',
  CLOSED_DAY: 'Stuffa no abre ese día. Elige una fecha disponible.',
  TABLE_NOT_FOUND: 'La mesa ya no está disponible.',
  PARTY_TOO_LARGE: 'El número de personas excede la capacidad de la mesa.',
  TABLE_ALREADY_RESERVED: 'Alguien acaba de reservar esta mesa. Elige otra.',
  NOT_STAFF: 'No tienes permisos para hacer esto.',

    PRIVACY_NOT_ACCEPTED: 'Debes aceptar el aviso de privacidad.',
  RATE_LIMITED_IP: 'Demasiadas reservas desde tu conexión. Espera una hora.',
  RATE_LIMITED_PHONE: 'Este teléfono ya tiene reservas recientes.',
  RESERVATION_NOT_FOUND: 'No encontramos esa reserva.',
  ALREADY_CANCELLED: 'Esta reserva ya fue cancelada.',
  ALREADY_CHECKED_IN: 'No se puede cancelar: ya se hizo check-in.',


  TOO_FAST: 'Espera un momento antes de confirmar.',
  EXPIRED_FORM: 'El formulario tardó demasiado. Recarga la página e intenta de nuevo.',
  MISSING_FIELDS: 'Faltan datos por completar.',
  INVALID_BODY: 'Solicitud inválida.',

    PHONE_ALREADY_HAS_ACTIVE: 'Ya tienes una reserva activa con este teléfono. Cancélala primero para hacer otra.',  // 👈 NUEVA
};

export function translateRpcError(message: string) {
  const key = Object.keys(RPC_ERRORS).find((k) => message.includes(k));
  return key ? RPC_ERRORS[key] : 'Ocurrió un error al procesar la reserva. Intenta de nuevo.';
}

