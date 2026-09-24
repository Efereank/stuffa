import { formatLongDate, formatTime } from './utils';

/**
 * Limpia un número de teléfono y lo formatea para wa.me
 * Maneja formatos venezolanos:
 *   - 04125052658 → 584125052658
 *   - +584125052658 → 584125052658
 *   - 4125052658 → 584125052658
 */
export function cleanPhoneForWhatsApp(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');

  // Formato local Venezuela: 04XX-XXXXXXX (11 dígitos)
  if (cleaned.length === 11 && cleaned.startsWith('04')) {
    return '58' + cleaned.slice(1);
  }

  // Ya tiene código de país 58
  if (cleaned.startsWith('58') && cleaned.length >= 12) {
    return cleaned;
  }

  // 10 dígitos sin código país (ej: 4125052658)
  if (cleaned.length === 10) {
    return '58' + cleaned;
  }

  // Formato desconocido: devolver tal cual
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
  orderCode,
  qrToken,
  quantity,
  eventName,
  eventDate,
  eventTime,
  siteUrl,
}: BuildWhatsAppMessageParams): string {
  const firstName = customerName.split(' ')[0];
  const qrUrl = `${siteUrl}/orden/${qrToken}`;

  const lines: string[] = [
    `¡Hola ${firstName}! 🎉`,
    '',
  ];

  if (eventName) {
    let eventLine = `Tu pago para *${eventName}*`;
    if (eventDate) {
      eventLine += ` (${formatLongDate(eventDate)}`;
      if (eventTime) eventLine += ` · ${formatTime(eventTime)}`;
      eventLine += ')';
    }
    eventLine += ' fue verificado ✅';
    lines.push(eventLine);
  } else {
    lines.push('Tu pago fue verificado ✅');
  }

  lines.push(
    '',
    'Aquí tienes tu QR de acceso:',
    qrUrl,
    '',
    'Muéstralo en la puerta al llegar.',
    '',
    '¡Nos vemos! 🍾',
    '— Stuffa Disco & Lounge',
  );

  return lines.join('\n');
}

/**
 * Construye la URL de WhatsApp con el mensaje precargado
 */
export function buildWhatsAppUrl(phone: string, message: string): string {
  const cleanPhone = cleanPhoneForWhatsApp(phone);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}