import { formatLongDate, formatTime } from './utils';

/**
 * Limpia un número de teléfono y lo formatea para wa.me
 */
export function cleanPhoneForWhatsApp(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');

  if (cleaned.length === 11 && cleaned.startsWith('04')) {
    return '58' + cleaned.slice(1);
  }

  if (cleaned.startsWith('58') && cleaned.length >= 12) {
    return cleaned;
  }

  if (cleaned.length === 10) {
    return '58' + cleaned;
  }

  return cleaned;
}

interface BuildWhatsAppMessageParams {
  customerName: string;
  orderCode: string;
  qrToken: string;
  quantity: number;
  eventName?: string;
  eventDate?: string;
  eventTime?: string;
  siteUrl: string;
}

/**
 * Construye el mensaje que se enviará por WhatsApp con el link al QR
 */
export function buildWhatsAppMessage({
  customerName,
  qrToken,
  eventName,
  eventDate,
  eventTime,
  siteUrl,
}: BuildWhatsAppMessageParams): string {
  const firstName = customerName.split(' ')[0];
  const qrUrl = `${siteUrl}/orden/${qrToken}`;

  const lines: string[] = [`¡Hola ${firstName}!`, ''];

  if (eventName) {
    let eventLine = `Tu pago para *${eventName}*`;
    if (eventDate) {
      eventLine += ` (${formatLongDate(eventDate)}`;
      if (eventTime) eventLine += ` · ${formatTime(eventTime)}`;
      eventLine += ')';
    }
    eventLine += ' fue verificado ';
    lines.push(eventLine);
  } else {
    lines.push('Tu pago fue verificado');
  }

  lines.push(
    '',
    'Aquí tienes tu QR de acceso:',
    qrUrl,
    '',
    'Muéstralo en la puerta al llegar.',
    '',
    '¡Nos vemos!',
    '— Stuffa Disco & Lounge',
  );

  return lines.join('\n');
}

/**
 * Construye la URL de WhatsApp con el mensaje precargado
 */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = cleanPhoneForWhatsApp(phone);
  // encodeURIComponent maneja correctamente los emojis UTF-8
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}