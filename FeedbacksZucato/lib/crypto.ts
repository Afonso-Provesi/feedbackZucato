import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto'

// Use uma chave fixa de 32 bytes (256 bits) armazenada em env
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-insecure-key-change-in-prodxxxxxxxxxxxxx'

function getKeyBuffer(): Buffer {
  // Se a chave do env não tiver 32 bytes, fazer hash para virar 32
  if (ENCRYPTION_KEY.length >= 32) {
    return Buffer.from(ENCRYPTION_KEY.slice(0, 32))
  }
  // Hash SHA-256 para garantir 32 bytes
  return createHash('sha256').update(ENCRYPTION_KEY).digest()
}

export function encryptEmail(email: string): string {
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-gcm', getKeyBuffer(), iv)
  let encrypted = cipher.update(email, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  const authTag = cipher.getAuthTag()
  // Formato: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
}

export function decryptEmail(encrypted: string): string {
  try {
    const [ivHex, authTagHex, encryptedData] = encrypted.split(':')
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const decipher = createDecipheriv('aes-256-gcm', getKeyBuffer(), iv)
    decipher.setAuthTag(authTag)
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error) {
    console.error('Erro ao descriptografar email:', error)
    throw new Error('Falha ao descriptografar email')
  }
}

export function generateDeviceFingerprint(userAgent: string, ip: string): string {
  const combined = `${userAgent}|${ip}`
  return createHash('sha256').update(combined).digest('hex')
}
