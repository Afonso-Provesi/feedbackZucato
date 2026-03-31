import { hash, compare } from 'bcryptjs'

const SALT_ROUNDS = 10

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword)
}

export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .substring(0, 5000)
}

export function sanitizeHTML(html: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return html.replace(/[&<>"']/g, (char) => map[char])
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateRating(rating: unknown): boolean {
  const num = Number(rating)
  return !isNaN(num) && num >= 1 && num <= 10
}

export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^[\d\s()+-]+$/
  return phoneRegex.test(phone)
}

export function getRateLimitKey(ip: string): string {
  return `ratelimit:${ip}`
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function checkRateLimit(ip: string, maxRequests: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now()
  const key = getRateLimitKey(ip)
  const current = rateLimitStore.get(key)

  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (current.count >= maxRequests) {
    return false
  }

  current.count++
  return true
}
