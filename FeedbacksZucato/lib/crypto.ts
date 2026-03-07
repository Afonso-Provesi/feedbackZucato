import { createHash } from 'crypto'

/**
 * Criptografa email com SHA-256 (irreversível)
 * Melhor segurança que AES-GCM para autenticação
 */
export function hashEmail(email: string): string {
  return createHash('sha256').update(email.toLowerCase()).digest('hex')
}

/**
 * Gera fingerprint do dispositivo para evitar múltiplos feedbacks
 */
export function generateDeviceFingerprint(userAgent: string, ip: string): string {
  const combined = `${userAgent}|${ip}`
  return createHash('sha256').update(combined).digest('hex')
}
