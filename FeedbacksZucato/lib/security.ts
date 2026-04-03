import { hash, compare } from 'bcryptjs'
import { sanitizeTextField } from '@/lib/inputProtection'

const SALT_ROUNDS = 10

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword)
}

export function sanitizeInput(input: string): string {
  return sanitizeTextField(input, {
    maxLength: 5000,
    preserveNewlines: true,
  }).replace(/[<>]/g, '')
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

export function validate2FACode(code: string): boolean {
  return /^\d{6}$/.test(code)
}

export function validateRating(rating: unknown): boolean {
  const num = Number(rating)
  return !isNaN(num) && num >= 1 && num <= 10
}

export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^[\d\s()+-]+$/
  return phoneRegex.test(phone)
}

export function getRateLimitKey(identifier: string, maxRequests: number, windowMs: number): string {
  return `ratelimit:${maxRequests}:${windowMs}:${identifier}`
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
let hasLoggedDistributedRateLimitFallback = false

interface UpstashPipelineResult {
  result?: unknown
  error?: string
}

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetTime: number
  provider: 'memory' | 'upstash'
}

function getUpstashCredentials() {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()

  if (!url || !token) {
    return null
  }

  return {
    url: url.replace(/\/$/, ''),
    token,
  }
}

function logDistributedRateLimitFallback(reason: string) {
  if (hasLoggedDistributedRateLimitFallback) {
    return
  }

  hasLoggedDistributedRateLimitFallback = true
  console.warn(`[rate-limit] fallback para memória: ${reason}`)
}

async function runUpstashPipeline(commands: Array<Array<string | number>>): Promise<UpstashPipelineResult[]> {
  const credentials = getUpstashCredentials()

  if (!credentials) {
    return []
  }

  const response = await fetch(`${credentials.url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${credentials.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(commands),
  })

  if (!response.ok) {
    throw new Error(`Upstash respondeu com status ${response.status}`)
  }

  const data = await response.json()
  return Array.isArray(data) ? data : []
}

async function runUpstashCommand(command: Array<string | number>): Promise<unknown> {
  const [result] = await runUpstashPipeline([command])

  if (!result) {
    return null
  }

  if (result.error) {
    throw new Error(result.error)
  }

  return result.result ?? null
}

function cleanupExpiredRateLimits(now: number) {
  if (rateLimitStore.size < 500) {
    return
  }

  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

function checkRateLimitInMemory(identifier: string, maxRequests: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  cleanupExpiredRateLimits(now)
  const key = getRateLimitKey(identifier, maxRequests, windowMs)
  const current = rateLimitStore.get(key)

  if (!current || now > current.resetTime) {
    const resetTime = now + windowMs
    rateLimitStore.set(key, { count: 1, resetTime })
    return {
      allowed: true,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - 1),
      resetTime,
      provider: 'memory',
    }
  }

  if (current.count >= maxRequests) {
    return {
      allowed: false,
      limit: maxRequests,
      remaining: 0,
      resetTime: current.resetTime,
      provider: 'memory',
    }
  }

  current.count++
  return {
    allowed: true,
    limit: maxRequests,
    remaining: Math.max(0, maxRequests - current.count),
    resetTime: current.resetTime,
    provider: 'memory',
  }
}

async function checkRateLimitDistributed(
  identifier: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult | null> {
  if (!getUpstashCredentials()) {
    return null
  }

  const now = Date.now()
  const key = getRateLimitKey(identifier, maxRequests, windowMs)

  try {
    const results = await runUpstashPipeline([
      ['INCR', key],
      ['PTTL', key],
    ])

    const incrementResult = results[0]
    const ttlResult = results[1]

    if (incrementResult?.error) {
      throw new Error(incrementResult.error)
    }

    if (ttlResult?.error) {
      throw new Error(ttlResult.error)
    }

    const count = Number(incrementResult?.result || 0)
    let ttl = Number(ttlResult?.result || -1)

    if (count <= 1 || ttl < 0) {
      await runUpstashCommand(['PEXPIRE', key, windowMs])
      ttl = windowMs
    }

    return {
      allowed: count <= maxRequests,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - count),
      resetTime: now + Math.max(ttl, 0),
      provider: 'upstash',
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'falha desconhecida'
    logDistributedRateLimitFallback(message)
    return null
  }
}

export async function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): Promise<RateLimitResult> {
  const distributedResult = await checkRateLimitDistributed(identifier, maxRequests, windowMs)

  if (distributedResult) {
    return distributedResult
  }

  return checkRateLimitInMemory(identifier, maxRequests, windowMs)
}

export function getClientIpFromHeaders(headers: Headers): string {
  const cloudflareIp = headers.get('cf-connecting-ip')
  if (cloudflareIp) {
    return cloudflareIp.trim()
  }

  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }

  return '127.0.0.1'
}
