import { sendSecurityAlertEmail } from '@/lib/email2fa'
import { checkRateLimit, getClientIpFromHeaders, sanitizeInput } from '@/lib/security'

const ALERT_RULES = {
  'failed-login': {
    threshold: 5,
    windowMs: 10 * 60 * 1000,
  },
  'failed-mfa': {
    threshold: 5,
    windowMs: 10 * 60 * 1000,
  },
  'password-recovery-abuse': {
    threshold: 3,
    windowMs: 15 * 60 * 1000,
  },
} as const

export type AlertEventType = keyof typeof ALERT_RULES

export interface AdminSecurityEventInput {
  eventType: AlertEventType
  attemptedEmail?: string | null
  reason?: string | null
  requestPath?: string | null
}

export interface AdminSecurityEventResult {
  success: boolean
  notified: boolean
  attempts: number
  cooldown?: boolean
}

export function isAlertEventType(value: unknown): value is AlertEventType {
  return typeof value === 'string' && value in ALERT_RULES
}

export async function reportAdminSecurityEvent(
  headers: Headers,
  input: AdminSecurityEventInput
): Promise<AdminSecurityEventResult> {
  const ip = getClientIpFromHeaders(headers)
  const rule = ALERT_RULES[input.eventType]
  const attemptedEmail = typeof input.attemptedEmail === 'string'
    ? sanitizeInput(input.attemptedEmail).toLowerCase().slice(0, 160)
    : ''
  const reason = typeof input.reason === 'string'
    ? sanitizeInput(input.reason).slice(0, 240)
    : ''
  const requestPath = typeof input.requestPath === 'string'
    ? sanitizeInput(input.requestPath).slice(0, 120)
    : '/autumn/login'

  const thresholdResult = await checkRateLimit(
    `security-alert:${input.eventType}:${ip}:${attemptedEmail || 'unknown'}`,
    rule.threshold,
    rule.windowMs
  )

  const attempts = Math.max(1, thresholdResult.limit - thresholdResult.remaining)
  const thresholdReached = !thresholdResult.allowed || attempts >= rule.threshold

  if (!thresholdReached) {
    return { success: true, notified: false, attempts }
  }

  const notifyCooldown = await checkRateLimit(
    `security-alert:notify:${input.eventType}:${ip}:${attemptedEmail || 'unknown'}`,
    1,
    60 * 60 * 1000
  )

  if (!notifyCooldown.allowed) {
    return { success: true, notified: false, attempts, cooldown: true }
  }

  await sendSecurityAlertEmail({
    eventType: input.eventType,
    attemptedEmail: attemptedEmail || null,
    ip,
    userAgent: headers.get('user-agent') || 'unknown',
    requestPath,
    reason: reason || null,
    attempts,
    windowMinutes: Math.max(1, Math.round(rule.windowMs / 60000)),
    provider: thresholdResult.provider,
  })

  return { success: true, notified: true, attempts }
}